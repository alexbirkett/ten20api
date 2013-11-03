var db = require('../db.js');
var async = require('async');
var ObjectID = require('mongodb').ObjectID;

var getTrackerCollection = function() {
   return db.getDb().collection('tracker');
};

var insertTracker = function(tracker, userId, callback) {
    tracker.owner = userId;
    getTrackerCollection().insert(tracker, callback);
};

var updateTracker = function(trackerId, tracker, userId, callback) {
    tracker.owner = userId;
    getTrackerCollection().update({_id: trackerId}, { $set: tracker }, { upsert : true}, callback);
}

var isTrackerOwnedByUser = function(trackerId, userId, callback) {
    var cursor = getTrackerCollection().find({_id: trackerId, owner:userId});
    cursor.count(function(err, count) {
       callback(err, count > 0);
    });
}

var findTrackersByOwner = function(owner, callback) {
    var cursor = getTrackerCollection().find({owner: owner});
    cursor.sort(['name']).toArray(function(err, docs) {
        callback(err, docs);
    });
};

var findTrackersById = function(id, callback) {
    var cursor = getTrackerCollection().find({_id: id});
    cursor.nextObject(function(err, object) {
        callback(err, object);
    });
};

var deleteTrackersById = function(id, callback) {
    getTrackerCollection().remove({_id: id}, function(err, count) {
        callback(err, count);
    });
};

var deleteTrackersByOwner = function(owner, callback) {
    getTrackerCollection().remove({owner: owner}, function(err, count) {
        callback(err, count);
    });
};

module.exports = {
  trackers: {
    use: function (req, res, next) {
        if (req.isAuthenticated()) {
            next();
        } else {
            res.json(401, {message: 'not logged in'});
        }
    },
    get: function (req, res) {
        // delete entire collection associated with user

        findTrackersByOwner(req.user._id, function(err, trackers) {
            if (err) {
                res.json(500, "error: database error");
            } else {
                res.json(trackers);
            }
        });
    },
    put: function (req, res) {
        // replace entire collection of trackers associated with user

        async.series([
           function(callback) {
               deleteTrackersByOwner(req.user._id, callback);
        }, function(callback) {
            async.each(req.body, function(item, callback) {
                insertTracker(item, req.user._id, callback);
            }, function(err) {
                callback(err);
            });
        }], function(err) {
            if (err) {
                res.json(500, {message: "could not store trackers"})
            } else {
                res.json({});
            }
        });


    },
    post: function (req, res) {
        // create a new tracker and associated it with user
        insertTracker(req.body, req.user._id, function(err, tracker) {
            if (err) {
                res.json(500, {message: "could not store tracker"});
            } else {
                res.json(200, tracker);
            }
        });
    },
    delete : function (req, res) {
        // delete entire collection associated with user
        deleteTrackersByOwner(req.user._id, function(err, trackers) {
            if (err) {
                res.json(500, "error: database error");
            } else {
                res.json({});
            }
        });
    },
    ":id": {
      get: function (req, res) {
          findTrackersById(req.params.id, function(err, tracker) {
            if (err) {
                 res.json(500, {message: "could not get tracker"});
             } else {
                 if (tracker == null) {
                     res.json(404, { message: "tracker not found"});
                 } else {
                     if (req.user._id.equals(tracker.owner)) {
                         res.json(tracker);
                     } else {
                         res.json(401, { message: "permission denied"});
                     }
                 }
             }
          });
      },
      put: function (req, res) {
          // Replace " + req.params.id + ", or if it doesn't exist, create it.
          findTrackersById(req.params.id, function(err, tracker) {
              if (err) {
                  res.json(500, {message: "could not get tracker"});
              } else {
                  if (tracker === null || req.user._id.equals(tracker.owner)) {
                      updateTracker(req.params.id, req.body, req.user._id, function(err) {
                          if (err) {
                              res.json(500, {message: "could not update tracker"});
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
            findTrackersById(req.params.id, function(err, tracker) {
                if (err) {
                    res.json(500, { message: "could not get tracker"} );
                } else {
                    if (tracker === null) {
                        res.json(404, { message: "tracker not found"});
                    } else if (req.user._id.equals(tracker.owner)) {
                        deleteTrackersById(tracker._id, function(err) {
                           if (err) {
                               res.json(500, { message: "could not delete tracker"} );
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
