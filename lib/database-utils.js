var async = require('async');
var db = require('./db');


module.exports.addIndexs = function (collection, indexes, callback) {

    var collection = db.getDb().collection(collection);
    async.forEachSeries(indexes, function (index, callback) {
        collection.ensureIndex(index, callback);
    }, function (err) {
        callback(err);
    });

};