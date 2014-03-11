var db = require('./db');
var PersistedWorkQueue = require('./persisted-work-queue');
var persistedWorkQueue = new PersistedWorkQueue().setCollectionName('trip-jobs');
var async = require('async');

var getTripCollection = function () {
    return db.getDb().collection('trips');
};

var getMessageCollection = function () {
    return db.getDb().collection('messages');
};

persistedWorkQueue.setWorkFunction(function(work, callback) {

    var job = work.job;
    console.log(job);
    var tripEndedTimestamp;
    var messageQuery = {
        trackerId: job.trackerId,
        receivedTime: { $gte: job.tripStartTimestamp, $lte: job.tripEndTimestamp }
    };
    async.waterfall([function(callback) {
        var sort = {
            "sort": [['_id','asc']]
        };
        var cursor = getMessageCollection().find(messageQuery, undefined, sort);
        cursor.toArray(callback);
    }, function(docs, callback) {
        if (docs.length > 0) {
            var data = {
                messages: docs,
                startTime: docs[0].receivedTime,
                endTime: docs[docs.length - 1].receivedTime,
                userId: docs[0].userId,
                trackerId: job.trackerId
            };
            tripEndedTimestamp = data.endTime;
            getTripCollection().insert(data, callback);
        } else {
            callback(null, null);
        }
    }, function(result, callback) {
        getMessageCollection().remove(messageQuery, callback);
    }], function(err) {
        callback(err);
    });
});

exports.addJob = persistedWorkQueue.addJob.bind(persistedWorkQueue);
exports.tickle = persistedWorkQueue.tickle.bind(persistedWorkQueue);


