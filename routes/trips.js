var collectionApi = require('../lib/collection-api');
var databaseUtils = require('../lib/database-utils');

var indexes = ['user', 'tracker'];
var collectionName = 'trips';
module.exports = function(callback) {
    var tripsRoutes = {
        trips: collectionApi(collectionName)
    };

    databaseUtils.addIndexs(collectionName, indexes, function(err) {
        callback(null, tripsRoutes);
    });

};
