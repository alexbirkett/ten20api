var collectionApi = require('../lib/collection-api');
var databaseUtils = require('../lib/database-utils');

var indexes = ['user'];
module.exports = function(callback) {
    var trackerRoute = {
        trackers: collectionApi('tracker')
    };

    databaseUtils.addIndexs('tracker', indexes, function(err) {
        callback(null, trackerRoute);
    });
};
