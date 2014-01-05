var DEFAULT_LIMIT = 2500;

module.exports = function(collectionName){

    var db = require('./db.js');
    var async = require('async');
    var ObjectID = require('mongodb').ObjectID;

    var getObjectCollection = function() {
        return db.getDb().collection(collectionName);
    };

    var insertObjects = function(objects, userId, callback) {

        if (objects instanceof Array) {
            objects.forEach(function(object) {
                object.userId = userId;
            });
        } else {
            objects.userId = userId;
        }

        getObjectCollection().insert(objects, callback);
    };

    var updateObject = function(objectIdString, object, userId, callback) {
        var objectId =  new ObjectID(objectIdString);
        object.userId = userId;
        object._id = objectId;
        getObjectCollection().update({_id: objectId}, object, { upsert : true }, callback);
    };

    var patchObject = function(objectId, object, userId, callback) {
        object.userId = userId;
        getObjectCollection().update({_id: new ObjectID(objectId)}, { $set: object }, { upsert : true}, callback);
    };

    var isObjectOwnedByUser = function(objectId, userId, callback) {
        var cursor = getObjectCollection().find({_id: objectId, user:userId});
        cursor.count(function(err, count) {
            callback(err, count > 0);
        });
    };

    var findObjects = function(query, callback) {
        var cursor = getObjectCollection().find(query, { limit: DEFAULT_LIMIT});
        cursor.toArray(function(err, docs) {
            callback(err, docs);
        });
    };

    var getObjectById = function(id, callback) {
        var cursor = getObjectCollection().find({_id: new ObjectID(id) });
        cursor.nextObject(function(err, object) {
            callback(err, object);
        });
    };

    var deleteObjects = function(query, callback) {
        getObjectCollection().remove(query, function(err, count) {
            callback(err, count);
        });
    };

    var parseFloatStrict = function (value) {
        if(/^\-?([0-9]+(\.[0-9]+)?|Infinity)$/.test(value)) {
            return Number(value);
        } else {
            throw "could not parse number";
        }
    }

    var parseObjectId = function(value) {
        if (/^[0-9a-fA-F]{24}$/.test(value)) {
            return new ObjectID(value);
        } else {
            throw "could not parse object id";
        }
    }


    var parseValue = function(value) {
        if (value === 'true') {
            value = true;
        } else if (value === 'false') {
            value = false;
        } else {
            try {
                value = parseFloatStrict(value);
            } catch(e) {
                try  {
                    value = parseObjectId(value);
                } catch(e) {
                    // ignore
                }
            }
        }
        return value;
    }

    var isValidOperator = function(operator) {
        var validOperator = false;
        if (operator === '$gt') {
            validOperator = true;
        } else if (operator === '$gte') {
            validOperator = true;
        } else if (operator === '$lt') {
            validOperator = true;
        } else if (operator === '$lte') {
            validOperator = true;
        }
        return validOperator;
    };

    var buildQuery = function(param) {
        var query = {};

        for (key in param) {
            var value = param[key];

            var index = value.indexOf('$')
            if (index === -1) {
                query[key] =  parseValue(value);
            } else {
                var operator = '$' + value.substring(0, index);
                var value = value.substring(index + 1);

                if (isValidOperator(operator)) {
                    query[key] = {};
                    query[key][operator] = parseValue(value);
                }
            }
        }
        return query;
    };

    return {
        use: function (req, res, next) {
            if (req.isAuthenticated()) {
                next();
            } else {
                res.json(401, {message: 'not logged in'});
            }
        },
        get: function (req, res) {
            // respond with entire collection associated with user

            var query = buildQuery(req.query);

            query.userId = req.user._id;

            findObjects(query, function(err, objects) {

                if (err) {
                    res.json(500, "error: database error");
                } else {

                    var jsonObject = {
                        items: objects
                    };

                    jsonObject.items = objects;
                    res.json(jsonObject);
                }
            });
        },
        put: function (req, res) {
            // replace entire collection of objects associated with user
            async.series([
                function(callback) {
                    var query = {userId: req.user._id};
                    deleteObjects(query, callback);
                }, function(callback) {
                    insertObjects(req.body, req.user._id, callback);
                }], function(err) {
                if (err) {
                    res.json(500, {message: "could not store objects"})
                } else {
                    res.json({});
                }
            });


        },
        post: function (req, res) {
            // create a new object and associated it with user
            insertObjects(req.body, req.user._id, function(err, object) {
                if (err) {
                    res.json(500, {message: "could not store object"});
                } else {
                    res.json(200, object);
                }
            });
        },
        delete : function (req, res) {
            // delete entire collection associated with user
            var query = {userId: req.user._id};
            deleteObjects(query, function(err, objects) {
                if (err) {
                    res.json(500, "error: database error");
                } else {
                    res.json({});
                }
            });
        },
        ":id": {
            get: function (req, res) {
                getObjectById(req.params.id, function(err, object) {
                    if (err) {
                        res.json(500, {message: "could not get object"});
                    } else {
                        if (object == null) {
                            res.json(404, { message: "object not found"});
                        } else {
                            if (req.user._id.equals(object.userId)) {
                                res.json(object);
                            } else {
                                res.json(401, { message: "permission denied"});
                            }
                        }
                    }
                });
            },
            put: function (req, res) {
                // Replace " + req.params.id + ", or if it doesn't exist, create it.
                getObjectById(req.params.id, function(err, object) {
                    if (err) {
                        res.json(500, {message: "could not get object"});
                    } else {
                        if (object === null || req.user._id.equals(object.userId)) {
                            updateObject(req.params.id, req.body, req.user._id, function(err) {
                                if (err) {
                                    res.json(500, {message: "could not update object"});
                                } else {
                                    res.json({});
                                }
                            });
                        } else {
                            res.json(401, { message: "permission denied"});
                        }
                    }
                });

            },
            patch: function (req, res) {
                // Replace " + req.params.id + ", or if it doesn't exist, create it.
                getObjectById(req.params.id, function(err, object) {
                    if (err) {
                        res.json(500, {message: "could not get object"});
                    } else {
                        if (object === null || req.user._id.equals(object.userId)) {
                            patchObject(req.params.id, req.body, req.user._id, function(err) {
                                if (err) {
                                    res.json(500, {message: "could not patch object"});
                                } else {
                                    res.json({});
                                }
                            });
                        } else {
                            res.json(401, { message: "permission denied"});
                        }
                    }
                });
            },
            delete: {
                handler: function (req, res) {
                    // Delete " + req.params.id
                    getObjectById(req.params.id, function(err, object) {
                        if (err) {
                            res.json(500, { message: "could not get object"} );
                        } else {
                            if (object === null) {
                                res.json(404, { message: "object not found"});
                            } else if (req.user._id.equals(object.userId)) {
                                var query = {_id: object._id};
                                deleteObjects(query, function(err) {
                                    if (err) {
                                        res.json(500, { message: "could not delete object"} );
                                    } else {
                                        res.json({});
                                    }
                                });
                            } else {
                                res.json(401, { message: "permission denied"});
                            }
                        }
                    });
                }
            }
        }
    }

};
