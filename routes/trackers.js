var promise = require('../promiseDb');

module.exports = {
  trackers: {
    get: {
      handler: function (req, res) {
        var mail = req.param('email');
        promise.getUserTrackers({email: mail}).then(function(trackers) {
          res.json(trackers);
        });
      }
    },
    put: {
      handler: function (req, res) {
        var trackers = req.param('trackers');
        var mail = req.param('email');
        promise.putUserTrackers(trackers, {email: mail}).then(function() {
          res.json({message: ''});
        }, function() {
          res.json({message: 'error'});
        });
      }
    },
    post:{
      handler: function (req, res) {
        var newTracker = req.param('tracker');
        var mail = req.param('email');
        promise.addUserTrackers(newTracker, {email: mail}).then(function() {
          res.json({message: ''});
        },
        function(error) {
          res.json({message: 'error'});
        });
      }
    },
    delete: {
      handler: function (req, res) {
        var mail = req.param('email');
        promise.removeUserTrackers({email: mail}).then(function() {
          res.json({message: ''});
        },
        function(error) {
          res.json({message: 'error'});
        });
      }
    },
    ":id": {
      get: {
        handler: function (req, res) {
          var trackerId = req.param('id');
          promise.getTracker({id: trackerId}).then(function(tracker) {
            res.json(tracker);
          },
          function (error) {
            res.json({});
          });
        }
      },
      put: {
        handler: function (req, res) {
          var trackerId = req.param('id');
          var tracker = req.param('tracker');
          promise.putTracker({id: trackerId}, tracker).then(function(tracker) {
            res.json({message: ''});
          },
          function (error) {
            res.json({message: error});
          });
        }
      },
      delete: {
        handler: function (req, res) {
          var trackerId = req.param('id');
          promise.removeTracker({id: trackerId}).then(function(tracker) {
            res.json({message: ''});
          },
          function (error) {
            res.json({message: error});
          });
        }
      }
    }
  }

};
