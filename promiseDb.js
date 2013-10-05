var Q = require('q');
var dbs  = require('./db')();

function findUser(option) {
  var defer = Q.defer();

  dbs.user.findOne(option, function(error, user) {
    if (error) {
      defer.reject(error);
    } else {
      defer.resolve(user);
    }
  });

  return defer.promise;
}

function updateUser(query, op) {
  var defer = Q.defer();

  dbs.user.update(query, op, function(error, user) {
    if (error) {
      defer.reject(error);
    } else {
      defer.resolve(user);
    }
  });

  return defer.promise;
}

function findTracker(option) {
  var defer = Q.defer();

  dbs.tracker.findOne(option, function(error, tracker) {
    if (error) {
      defer.reject(error);
    } else {
      defer.resolve(tracker);
    }
  });

  return defer.promise;
}

function updateTracker(option, params) {
  var defer = Q.defer();

  dbs.tracker.update(option, {$set: params}, {upsert : true},
    function(error, tracker) {
      if (error) {
        defer.reject(error);
      } else {
        defer.resolve(tracker);
      }
  });

  return defer.promise;
}

function findHistory(option) {
  var defer = Q.defer();

  dbs.history.findOne(option, function(error, data) {
    if (error) {
      defer.reject(error);
    } else {
      defer.resolve(data);
    }
  });

  return defer.promise;
}

function deleteTracker(option) {
  var defer = Q.defer();

  dbs.tracker.findAndRemove(option, function(error, tracker) {
    if (error) {
      defer.reject(error);
    } else {
      defer.resolve(tracker);
    }
  });

  return defer.promise;
}

function deleteUserTrackers(query) {
  var promises = [];

  return findUser(query).then(function(user) {
    for (var i = 0; i < user.trackers.length; i++) {
      promises.push(deleteTracker({id: user.trackers[i]}));
    };
    promises.push(updateUser(query, {$set: {trackers: []}}));
    return Q.all(promises)
  }, function(error) {
    return error;
  });

}

module.exports = {
  getUserTrackers: function(query) {
    var promises = [];

    return findUser(query).then(function(user) {
      for (var i = 0; i < user.trackers.length; i++) {
        promises.push(findTracker({id: user.trackers[i]}));
      };
      return Q.all(promises);
    }).fail(function(error) {
      return error;
    });

  },

  putUserTrackers: function(trackers, userQuery) {
    var promises = [];

    return deleteTracker(userQuery).then(function() {
      var ids = [];
      for (var i = 0; i < trackers.length; i++) {
        ids.push(trackers[i].id);
        promises.push(updateTracker({id: trackers[i]}, trackers[i]));
      };

      promises.push(updateUser(userQuery, {$addToSet: {trackers: { $each: ids}}}));
      return Q.all(promises);

    }, function(error) {
      return error;
    });

  },

  addUserTrackers: function(tracker, userQuery) {
    return updateTracker({id: tracker.id}, tracker).then(function() {
      return updateUser(userQuery, {$addToSet: {trackers: tracker.id}});
    });
  },

  removeUserTrackers: deleteUserTrackers,

  getTracker: findTracker,

  putTracker: updateTracker,

  removeTracker: deleteTracker,

  getTrackers: function(serials) {
    var promises = [];

    for (var i = 0; i < serials.length; i++) {
      promises.push(findTracker({serialNumber: serials[i]}));
    };

    return Q.all(promises);
  },

  getHistory: findHistory
}
