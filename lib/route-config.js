var async = require('async');
var configureDryRoutes = require('express-dry-router');
var user = require('./../routes/user');
var collectionApi = require('./collection-api');
var databaseUtils = require('./database-utils');

var getCollectionRoute = function(collection, indexes, callback) {
    var route = {};
    route[collection] =  collectionApi(collection);
    databaseUtils.addIndexs(collection, indexes, function(err) {
        callback(null, route);
    });
};

var getTrackerRoute = function(callback) {
    getCollectionRoute('trackers', ['user'], callback);
};

var getTripsRoute = function(callback) {
    getCollectionRoute('trips', ['user', 'tracker'], callback);
};

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