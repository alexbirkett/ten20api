var collectionApi = require('../lib/collection-api');

module.exports = function(callback) {
    var trackerRoute = {
        trackers: collectionApi('tracker')
    };
    callback(null, trackerRoute);
};
