var async = require('async');
var configureDryRoutes = require('express-dry-router');
var user = require('./../routes/user');
var collectionApi = require('./collection-api');
var databaseUtils = require('./database-utils');
var message = require('../routes/message');
var passwordReset = require('../routes/password-reset');
var collectionAdmin = require('../routes/collection-admin');

var getCollectionRoute = function(collection, indexes, callback) {
    var route = {};
    route[collection] =  collectionApi(collection);
    databaseUtils.addIndexs(collection, indexes, function(err) {
        callback(null, route);
    });
};

var getTrackerRoute = function(callback) {
    getCollectionRoute('trackers', [{'user': 1}, {'serial':1 }], callback);
};

var getTripsRoute = function(callback) {
    getCollectionRoute('trips', [{'user': 1}, {'trackerId': 1}, {endTime: -1, trackerId: 1}], callback);
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
        configureDryRoutes(message, app, undefined, ['use']);
        configureDryRoutes(passwordReset, app, undefined, ['use']);
        configureDryRoutes(collectionAdmin, app, undefined, ['use']);

        routes.forEach(function(route) {
            configureDryRoutes(route, app, undefined, ['use']);
        });

        configureDryRoutes(user, app);
        configureDryRoutes(message, app);
        configureDryRoutes(passwordReset, app);
        configureDryRoutes(collectionAdmin, app);
        routes.forEach(function(route) {
            configureDryRoutes(route, app);
        });

        callback(err);
    });

};