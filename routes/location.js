var db = require('../lib/db');
var config = require('../lib/config.js');
var util = require('../lib/util.js');
var getObjectCollection = function () {
    return db.getDb().collection('trackers');
};

var updateTracker = function (serial, location, callback) {
    var query = { serial: serial};
    var data = { $set: location };
    getObjectCollection().findAndModify(query, null, data, { new:true /*fields:{ id_:1}*/ }, callback);
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
    var cursor = getObjectCollection().find(query, {});
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
    location: {
        update_by_serial: {
            ":id": {
                post: function (req, res) {

                    updateTracker(req.params.id, req.body, function (err, doc) {
                        if (err) {
                            res.json(500, {});
                        } else {
                            res.json({});
                            handleIdChanged(doc);
                        }

                    });
                }
            }
        },
        notify_changed: {
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