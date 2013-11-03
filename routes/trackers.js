var db = require('../db.js');
var async = require('async');
var ObjectID = require('mongodb').ObjectID;

var getTrackerCollection = function() {
   return db.getDb().collection('tracker');
};

var insertTracker = function(tracker, userId, callback) {
    tracker.user = userId;
    getTrackerCollection().insert(tracker, callback);
};

var updateTracker = function(trackerId, tracker, userId, callback) {
    tracker.user = userId;
    getTrackerCollection().update({_id: trackerId}, { $set: tracker }, { upsert : true}, callback);
}

var isTrackerOwnedByUser = function(trackerId, userId, callback) {
    var cursor = getTrackerCollection().find({_id: trackerId, user:userId});
    cursor.count(function(err, count) {
       callback(err, count > 0);
    });
}

var findTrackersByUser = function(user, callback) {
    var cursor = getTrackerCollection().find({user: user});
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

var deleteTrackersByUser = function(user, callback) {
    getTrackerCollection().remove({user: user}, function(err, count) {
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

        findTrackersByUser(req.user._id, function(err, trackers) {
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
               deleteTrackersByUser(req.user._id, callback);
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
        deleteTrackersByUser(req.user._id, function(err, trackers) {
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
                     if (req.user._id.equals(tracker.user)) {
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
                  if (tracker === null || req.user._id.equals(tracker.user)) {
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
                    } else if (req.user._id.equals(tracker.user)) {
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
