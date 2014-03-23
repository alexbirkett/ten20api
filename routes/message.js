var db = require('../lib/db');
var config = require('../lib/config.js');
var util = require('../lib/util.js');
var async = require('async');
var tripBuilder = require('../lib/trip-builder');
var authenticationMiddleware = require('../lib/authentication-middleware.js');
var ObjectID = require('mongodb').ObjectID;

var DEFAULT_TRIP_DURATION = 6 * 60 * 60 * 1000;

var getTrackerCollection = function () {
    return db.getDb().collection('trackers');
};

var getMessageCollection = function () {
    return db.getDb().collection('messages');
};

var isValidLocation = function(location) {
    return (location.latitude && location.longitude);
}

var setTrackerDefaultValuesIfRequired = function(trackerDoc, timestampNow, callback) {

    var update = false;
    var data = {
        $set: {
        }
    };

    if (!trackerDoc.tripDuration) {
        update = true;
        data.$set.tripDuration = DEFAULT_TRIP_DURATION;
    }

    if (!trackerDoc.tripEndTimestamp) {
        var tripDuration = trackerDoc.tripDuration;
        if (!tripDuration) {
            tripDuration = DEFAULT_TRIP_DURATION;
        }
        update = true;
        data.$set.tripEndTimestamp = new Date(timestampNow + tripDuration);
    }

    if (!trackerDoc.tripStartTimestamp) {
        update = true;
        data.$set.tripStartTimestamp = new Date(timestampNow);
    }

    if (update) {
        var query = { _id: trackerDoc._id};
        getTrackerCollection().findAndModify(query, null, data, { new:true /*fields:{ id_:1}*/ }, function(err, doc) {
            // if the query does not find any documents, findAndModify can call back with no error and a null document
            if (!doc) {
                err = 'not found';
            }
            callback(err, doc);
        });
    } else {
        callback(null, trackerDoc);
    }
};

var updateTracker = function (serial, message, timestampNow, callback) {
    var query = { serial: serial};
    var data = {
        $set: {
            lastMessage: message,
            lastUpdate: timestampNow
        } };

    if (message.location && isValidLocation(message.location)) {
        data.$set.location = message.location;
    }
    var timeBefore = new Date().getTime();
    getTrackerCollection().findAndModify(query, null, data, { new:true /*fields:{ id_:1}*/ }, function(err, doc) {
        // if the query does not find any documents, findAndModify can call back with no error and a null document
        if (!doc) {
            err = 'not found';
        }
        callback(err, doc);
    });
};

var addMessage = function(userId, trackerId, message, timestampNow, callback) {
    var object = {
        receivedTime: new Date(timestampNow),
        message: message,
        trackerId: trackerId,
        userId: userId
    };
    getMessageCollection().insert(object, function(err) {
        callback(err);
    });
};

var addTripBuilderJob = function(trackerDoc, callback) {
    var data = {
        tripStartTimestamp: trackerDoc.tripStartTimestamp,
        tripEndTimestamp: trackerDoc.tripEndTimestamp,
        trackerId: trackerDoc._id
    }
    tripBuilder.addJob(data, function(err) {

        tripBuilder.tickle(function(err) {
            console.log('tickle complete ' + err);
        });
        callback(err);
    });

};

var updateTripStartEndTime = function(trackerDoc, timestampNow, callback) {
    var query = { _id: trackerDoc._id};
    var data = {
        $set: {
            tripStartTimestamp: new Date(timestampNow),
            tripEndTimestamp: new Date(timestampNow + trackerDoc.tripDuration)
        }
    };
    getTrackerCollection().findAndModify(query, null, data, { new:true /*fields:{ id_:1}*/ }, function(err, doc) {
        // if the query does not find any documents, findAndModify can call back with no error and a null document
        if (!doc) {
            err = 'not found';
        }
        callback(err, doc);
    });
};

var rollOverTripIfRequired = function(trackerDoc, timestampNow, callback) {
    if (trackerDoc.tripEndTimestamp < timestampNow) {
        console.log('rolling over trip');
        async.parallel([function(callback) {
            addTripBuilderJob(trackerDoc, callback);
        }, function(callback) {
            updateTripStartEndTime(trackerDoc, timestampNow, callback);
        }], function(err) {
            callback(err);
        });
    } else {
        callback(null);
    }
};

var handleIdChanged = function(doc) {
    var oustandingRequest = outstandingRequests[doc._id];
    if (oustandingRequest &&  oustandingRequest.userId.equals(doc.userId)) {
        oustandingRequest.res.json(doc);

        // remove all keys from outstandingRequests that point to obj
        for(var key in outstandingRequests){
            request = outstandingRequests[key];
            if (request === oustandingRequest) {
                delete outstandingRequests[key];
            }
        }
    }
};

var configureCleanup = function() {
    var cleanupInterval = config.getLongPollCleanupInterval();
    setTimeout(function() {
        var timeNow = util.currentTimeMillis();
        for(var key in outstandingRequests){
            request = outstandingRequests[key];
            if (request.timestamp + config.getLongPollTimeOut() < timeNow) {
                request.res.json(408, {});
                delete outstandingRequests[key];
            }
        }
        configureCleanup();
    },cleanupInterval);

};
configureCleanup();

var outstandingRequests = {};


var findObjects = function(query, callback) {
    var cursor = getTrackerCollection().find(query, {});
    cursor.toArray(function(err, docs) {
        callback(err, docs);
    });
};

var addRequest = function(id, request) {
    outstandingRequests[id] = request;
};

var createRequest =  function(req, res, userId) {
    var request = {
        req: req,
        res: res,
        userId: userId,
        timestamp: util.currentTimeMillis()
    };
    return request;
};

module.exports =
{
    message: {
        ":id": {
            post: function (req, res) {
                var timestampNow = util.currentTimeMillis();
                var message = req.body;
                var trackerDoc;
                async.waterfall([function(callback) {
                    updateTracker(req.params.id, message, timestampNow, callback);
                }, function(trackerDoc, callback) {
                    setTrackerDefaultValuesIfRequired(trackerDoc, timestampNow, callback)
                }, function(pTrackerDoc, callback) {
                    trackerDoc = pTrackerDoc;
                    addMessage(trackerDoc.userId, trackerDoc._id, message, timestampNow, callback);
                }, function(callback) {
                    rollOverTripIfRequired(trackerDoc, timestampNow, callback);
                    handleIdChanged(trackerDoc);
                }], function(err) {
                    if (err) {
                        if (err === 'not found') {
                            res.json(404, {});
                        } else {
                            res.json(500, {});
                        }
                    } else {
                        res.json(200, {});
                    }
                });
            }
        },
        notify: {
            use: authenticationMiddleware.middlewareFunction,
            ":id": {
                get: function (req, res) {
                    var userId = new ObjectID(req.user._id);
                    addRequest(req.params.id, createRequest(req, res, userId));
                }
            },
            get: function (req, res) {
                var userId = new ObjectID(req.user._id);
                var query = { userId: userId };
                var request = createRequest(req, res, userId);
                findObjects(query, function(err, objects) {
                    for (var i = 0; i < objects.length; i++) {
                        addRequest(objects[i]._id, request);
                    }
                });
            }
        }
    }
};

