var async = require('async');
var configureDryRoutes = require('express-dry-router');
var user = require('./../routes/user');

var getTrackerRoute = require('../routes/tracker');
var getTripsRoute = require('../routes/trips');

module.exports = function(app, callback) {

    async.series([
          function(callback) {
              getTrackerRoute(callback);
          },
          function(callback)  {
              getTripsRoute(callback);
          }
    ], function(err, routes) {
        configureDryRoutes(user, app, undefined, ['use']);

        routes.forEach(function(route) {
            configureDryRoutes(route, app, undefined, ['use']);
        });

        configureDryRoutes(user, app);

        routes.forEach(function(route) {
            configureDryRoutes(route, app);
        });

        callback(err);
    });

};