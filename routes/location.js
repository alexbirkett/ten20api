var db = require('../lib/db');

var getObjectCollection = function () {
    return db.getDb().collection('trackers');
};

var updateTracker = function (serial, location, callback) {
    var query = { serial: serial};
    var data = { $set: location };
    getObjectCollection().findAndModify(query, null, data, { /*fields:{ id_:1}*/ }, callback);
};

var handleIdChanged = function(doc) {
   var res = outstandingRequests[doc._id];
   if (res) {
       res.json(doc);
   }
   outstandingRequests[doc.id] = undefined;
};

var outstandingRequests = {};

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
                    outstandingRequests[req.params.id] = res;
                }
            }
        }
    }
};