var async = require('async');
var configureDryRoutes = require('express-dry-router');
var getUserRoute = require('./../routes/user');
var collectionApi = require('./collection-api');
var databaseUtils = require('./database-utils');
var message = require('../routes/message');
var passwordReset = require('../routes/password-reset');
var collectionAdmin = require('../routes/collection-admin');
var protocols = require('../routes/protocols');

var getCollectionRoute = function(collection, endPoint, indexes, callback) {
    endPoint = endPoint || collection;

    var route = {};
    route[endPoint] =  collectionApi(collection);
    databaseUtils.addIndexs(collection, indexes, function(err) {
        callback(null, route);
    });
};

var getTrackerRoute = function(callback) {
    getCollectionRoute('trackers',null, [{'user': 1}, {'serial':1 }], callback);
};

var getTripsRoute = function(callback) {
    getCollectionRoute('trips', null,[{'user': 1}, {'trackerId': 1}, {endTime: -1, trackerId: 1}], callback);
};

var getRecentMessageRoute = function(callback) {
    getCollectionRoute('messages', 'recent_messages', [{'user': 1}, {'trackerId': 1}], callback);
};



module.exports = function(app, callback) {

    async.series([
          function(callback) {
              getTrackerRoute(callback);
          },
          function(callback)  {
              getTripsRoute(callback);
          },
          function(callback)  {
              getRecentMessageRoute(callback);
          },
          function(callback) {
              getUserRoute(callback);
          }
    ], function(err, routes) {
        configureDryRoutes(message(), app, undefined, ['use']);
        configureDryRoutes(passwordReset(), app, undefined, ['use']);
        configureDryRoutes(collectionAdmin(), app, undefined, ['use']);
        configureDryRoutes(protocols(), app, undefined, ['use']);

        routes.forEach(function(route) {
            configureDryRoutes(route, app, undefined, ['use']);
        });

        configureDryRoutes(message(), app);
        configureDryRoutes(passwordReset(), app);
        configureDryRoutes(collectionAdmin(), app);
        configureDryRoutes(protocols(), app);
        routes.forEach(function(route) {
            configureDryRoutes(route, app);
        });

        callback(err);
    });

};