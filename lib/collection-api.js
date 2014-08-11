var parseTimeStamps = require('./timestamp-parser');
var authenticationMiddleware = require('../lib/authentication-middleware');

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

        parseTimeStamps(objects);
        getObjectCollection().insert(objects, callback);
    };

    var updateObject = function(objectIdString, object, userId, callback) {
        var objectId =  new ObjectID(objectIdString);
        object.userId = userId;
        object._id = objectId;
        parseTimeStamps(object);
        getObjectCollection().update({_id: objectId}, object, { upsert : true }, callback);
    };

    var patchObject = function(objectId, object, userId, callback) {
        object.userId = userId;
        parseTimeStamps(object);
        getObjectCollection().update({_id: new ObjectID(objectId)}, { $set: object }, { upsert : true}, callback);
    };

    var isObjectOwnedByUser = function(objectId, userId, callback) {
        var cursor = getObjectCollection().find({_id: objectId, user:userId});
        cursor.count(function(err, count) {
            callback(err, count > 0);
        });
    };

    var findObjects = function(query, limit, sort, callback) {

        var options = {
            limit: DEFAULT_LIMIT
        };

        if (limit) {
            options.limit = limit;
        }

        var cursor = getObjectCollection().find(query, null, options).sort(sort);
        cursor.toArray(function(err, docs) {
            callback(err, docs);
        });
    };

    var countObjects = function(query, callback) {
        getObjectCollection().count(query, callback);
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
        } else if (value && value.indexOf('date:') === 0) {
            var dateValue = value.substring(5, value.length);
            value = new Date(dateValue);
        } else if (value && value.indexOf('timestamp:') === 0) {
            var timestampValue = parseInt(value.substring(10, value.length), 10);
            value = new Date(timestampValue);
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

    var resolveOperatorAlias = function(alias) {
        if (alias === '$after') {
            return '$gt';
        } else if (alias === '$before') {
            return '$lt';
        }
        return alias;
    };


    var parseDollarPairKey = function(dollarPair) {
        var index = dollarPair.indexOf('$')
        return substring(0, index);
    };

    var buildQuery = function(param, userId) {

        var mongoDbQuery = {
        };
        var sort = {};

        var query = {
            mongoDbQuery: mongoDbQuery,
            sort: sort
        };


        for (key in param) {
            var value = param[key];
            var index = value.indexOf('$')

            if (key === 'sortBy') {
                if (index > 0) {
                    var field = value.substring(0, index);
                    var order = value.substring(index + 1);
                    sort[field] = order === 'desc' ? -1 : 1;
                }
            } else if (key === 'limit') {
                query.limit = value;
            } else {

                if (index === -1) {
                    mongoDbQuery[key] =  parseValue(value);
                } else {
                    var operator = '$' + value.substring(0, index);

                    operator = resolveOperatorAlias(operator);

                    var value = value.substring(index + 1);

                    if (isValidOperator(operator)) {
                        mongoDbQuery[key] = {};
                        mongoDbQuery[key][operator] = parseValue(value);
                    }
                }
            }
        }
        mongoDbQuery.userId = userId;


        return query;
    };

    return {
        use: authenticationMiddleware.getMiddleware(),
        get: function (req, res) {
            // respond with entire collection associated with user
            console.log('get');
            var userId = new ObjectID(req.user._id);
            var query = buildQuery(req.query, userId);

            findObjects(query.mongoDbQuery, query.limit, query.sort, function(err, objects) {

                if (err) {
                    res.json(500, "error: database error");
                } else {

                    var jsonObject = {
                        items: objects
                    };

                    jsonObject.items = objects;

                    if (objects.length > 0) {
                        res.json(jsonObject);
                    } else {
                        res.json(404, jsonObject);
                    }

                }
            });
        },
        head: function (req, res) {
            // respond with entire collection associated with user
            var userId = new ObjectID(req.user._id);
            var query = buildQuery(req.query, userId);

            countObjects(query.mongoDbQuery, function(err, objects) {
                console.log(objects);
                if (err) {
                    res.json(500);
                } else {
                    if (objects && objects > 0) {
                        res.send(200);
                    } else {
                        res.send(404);
                    }
                }
            });
        },
        put: function (req, res) {
            // replace entire collection of objects associated with user
            var userId = new ObjectID(req.user._id);
            async.series([
                function(callback) {
                    var query = {userId: userId};
                    deleteObjects(query, callback);
                }, function(callback) {
                    insertObjects(req.body, userId, callback);
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
            var userId = new ObjectID(req.user._id);
            insertObjects(req.body, userId, function(err, object) {
                if (err) {
                    res.json(500, {message: "could not store object"});
                } else {
                    res.json(200, {});
                }
            });
        },
        delete : function (req, res) {
            // delete entire collection associated with user
            var userId = new ObjectID(req.user._id);
            var query = {userId: userId};
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
                var userId = new ObjectID(req.user._id);
                getObjectById(req.params.id, function(err, object) {
                    if (err) {
                        res.json(500, {message: "could not get object"});
                    } else {
                        if (object == null) {
                            res.json(404, { message: "object not found"});
                        } else {
                            if (userId.equals(object.userId)) {
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
                var userId = new ObjectID(req.user._id);
                getObjectById(req.params.id, function(err, object) {
                    if (err) {
                        res.json(500, {message: "could not get object"});
                    } else {
                        if (object === null || userId.equals(object.userId)) {
                            updateObject(req.params.id, req.body, userId, function(err) {
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
                var userId = new ObjectID(req.user._id);
                getObjectById(req.params.id, function(err, object) {
                    if (err) {
                        res.json(500, {message: "could not get object"});
                    } else {
                        if (object === null || userId.equals(object.userId)) {
                            patchObject(req.params.id, req.body, userId, function(err) {
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
                    var userId = new ObjectID(req.user._id);
                    getObjectById(req.params.id, function(err, object) {
                        if (err) {
                            res.json(500, { message: "could not get object"} );
                        } else {
                            if (object === null) {
                                res.json(404, { message: "object not found"});
                            } else if (userId.equals(object.userId)) {
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
