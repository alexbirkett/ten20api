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
   if (obj &&  obj.req.user._id.equals(doc.user)) {
       obj.res.json(doc);
       delete outstandingRequests[doc.id];
   }
};

var configureCleanup = function() {
    var cleanupInterval = config.getLongPollCleanupInterval();
    setTimeout(function() {
        var timeNow = util.currentTimeMillis();
        //console.log('timeNow ' + timeNow);
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


var addRequest = function(id, req, res) {
    var obj = {
        req: req,
        res: res,
        timestamp: util.currentTimeMillis()
    };
    outstandingRequests[id] = obj;
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
                    addRequest(req.params.id, req, res);
                }
            }
        }
    }
};