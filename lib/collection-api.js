module.exports = function(collectionName){

    var db = require('./db.js');
    var async = require('async');
    var ObjectID = require('mongodb').ObjectID;

    var getObjectCollection = function() {
        return db.getDb().collection(collectionName);
    };

    var insertObject = function(object, userId, callback) {
        object.user = userId;
        getObjectCollection().insert(object, callback);
    };

    var updateObject = function(objectId, object, userId, callback) {
        object.user = userId;
        getObjectCollection().update({_id: objectId}, { $set: object }, { upsert : true}, callback);
    }

    var isObjectOwnedByUser = function(objectId, userId, callback) {
        var cursor = getObjectCollection().find({_id: objectId, user:userId});
        cursor.count(function(err, count) {
            callback(err, count > 0);
        });
    }

    var findObjectsByUser = function(user, callback) {
        var cursor = getObjectCollection().find({user: user});
        cursor.sort(['name']).toArray(function(err, docs) {
            callback(err, docs);
        });
    };

    var findObjectsById = function(id, callback) {
        var cursor = getObjectCollection().find({_id: id});
        cursor.nextObject(function(err, object) {
            callback(err, object);
        });
    };

    var deleteObjectsById = function(id, callback) {
        getObjectCollection().remove({_id: id}, function(err, count) {
            callback(err, count);
        });
    };

    var deleteObjectsByUser = function(user, callback) {
        getObjectCollection().remove({user: user}, function(err, count) {
            callback(err, count);
        });
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
            // delete entire collection associated with user

            findObjectsByUser(req.user._id, function(err, objects) {
                if (err) {
                    res.json(500, "error: database error");
                } else {
                    res.json(objects);
                }
            });
        },
        put: function (req, res) {
            // replace entire collection of objects associated with user

            async.series([
                function(callback) {
                    deleteObjectsByUser(req.user._id, callback);
                }, function(callback) {
                    async.each(req.body, function(item, callback) {
                        insertObject(item, req.user._id, callback);
                    }, function(err) {
                        callback(err);
                    });
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
            insertObject(req.body, req.user._id, function(err, object) {
                if (err) {
                    res.json(500, {message: "could not store object"});
                } else {
                    res.json(200, object);
                }
            });
        },
        delete : function (req, res) {
            // delete entire collection associated with user
            deleteObjectsByUser(req.user._id, function(err, objects) {
                if (err) {
                    res.json(500, "error: database error");
                } else {
                    res.json({});
                }
            });
        },
        ":id": {
            get: function (req, res) {
                findObjectsById(req.params.id, function(err, object) {
                    if (err) {
                        res.json(500, {message: "could not get object"});
                    } else {
                        if (object == null) {
                            res.json(404, { message: "object not found"});
                        } else {
                            if (req.user._id.equals(object.user)) {
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
                findObjectsById(req.params.id, function(err, object) {
                    if (err) {
                        res.json(500, {message: "could not get object"});
                    } else {
                        if (object === null || req.user._id.equals(object.user)) {
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
            delete: {
                handler: function (req, res) {
                    // Delete " + req.params.id
                    findObjectsById(req.params.id, function(err, object) {
                        if (err) {
                            res.json(500, { message: "could not get object"} );
                        } else {
                            if (object === null) {
                                res.json(404, { message: "object not found"});
                            } else if (req.user._id.equals(object.user)) {
                                deleteObjectsById(object._id, function(err) {
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
