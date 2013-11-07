var collectionApi = require('./lib/collection-api');
var configureDryRoutes = require('express-dry-router');
var user = require('./routes/user');

module.exports = function(app, callback) {


    var trackerRoute = collectionApi('tracker');
    var tripsRoute =  collectionApi('trip');

    configureDryRoutes(user, app, undefined, ['use']);
    configureDryRoutes(trackerRoute, app, '/trackers', ['use']);
    configureDryRoutes(tripsRoute, app, '/trips', ['use']);

    configureDryRoutes(trackerRoute, app, '/trackers');
    configureDryRoutes(tripsRoute, app, '/trips');
    configureDryRoutes(user, app);

    callback(null);
};