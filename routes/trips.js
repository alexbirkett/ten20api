var collectionApi = require('../lib/collection-api');

module.exports = function(callback) {
    var tripsRoutes = {
        trips: collectionApi('trips')
    };
    callback(null, tripsRoutes);
};
