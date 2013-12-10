var db = require('../lib/db');
var config = require('../lib/config.js');
var util = require('../lib/util.js');
var async = require('async');

var DEFAULT_TRIP_DURATION = 6 * 60 * 60 * 1000;

var getTrackerCollection = function () {
    return db.getDb().collection('trackers');
};

var getTripCollection = function () {
    return db.getDb().collection('trips');
};

var updateTracker = function (serial, message, callback) {
    var query = { serial: serial};
    var data = { $set: message };
    getTrackerCollection().findAndModify(query, null, data, { new:true /*fields:{ id_:1}*/ }, callback);
};


var addMessageToTrip = function(user, trackerId, tripDuration, message, callback) {

    if (!tripDuration) {
        tripDuration = DEFAULT_TRIP_DURATION;
    }

    var timestampNow = util.currentTimeMillis();
    var timeNow = new Date(timestampNow);
    var endTime = new Date(timestampNow + tripDuration);

    var data = { $push: { messages: message },
                 $setOnInsert: {startTime: timeNow, endTime: endTime, trackerId: trackerId, user: user},
                 $set: { lastUpdate: timeNow }
               };
    var query = {
        endTime:{ $gt: timeNow },
        trackerId: trackerId
    };
    getTripCollection().findAndModify(query, null, data, { new:true, upsert: true /*fields:{ id_:1}*/ }, function(err, doc) {
        callback(err);
    });

};

var handleIdChanged = function(doc) {
    var obj = outstandingRequests[doc._id];
    if (obj &&  obj.user.equals(doc.user)) {
        obj.res.json(doc);

        // remove all keys from outstandingRequests that point to obj
        for(var key in outstandingRequests){
            request = outstandingRequests[key];
            if (request === obj) {
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

var createRequest =  function(req, res, user) {
    var request = {
        req: req,
        res: res,
        user: user,
        timestamp: util.currentTimeMillis()
    };
    return request;
};

module.exports =
{
    message: {
        ":id": {
            post: function (req, res) {
                var message = req.body;
                async.waterfall([function(callback) {
                    updateTracker(req.params.id, message, callback);
                }, function(trackerDoc, stats, callback) {
                    handleIdChanged(trackerDoc);
                    addMessageToTrip(trackerDoc.user, trackerDoc._id, trackerDoc.tripDuration, message, callback);
                }], function(err, results, other) {
                    if (err) {
                        res.json(500, {});
                    } else {
                        res.json(200, {});
                    }
                });

            }
        },
        notify: {
            use: function (req, res, next) {
                if (req.isAuthenticated()) {
                    next();
                } else {
                    res.json(401, {message: 'not logged in'});
                }
            },
            ":id": {
                get: function (req, res) {
                    addRequest(req.params.id, createRequest(req, res, req.user._id));
                }
            },
            get: function (req, res) {
                var query = { user: req.user._id };
                var request = createRequest(req, res, req.user._id);
                findObjects(query, function(err, objects) {
                    for (var i = 0; i < objects.length; i++) {
                        addRequest(objects[i]._id, request);
                    }
                });
            }
        }
    }
};