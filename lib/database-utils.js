var async = require('async');
var db = require('./db');


module.exports.addIndexs = function (collection, indexes, callback) {

    var collection = db.getDb().collection(collection);
    async.forEachSeries(indexes, function (index, callback) {
        var obj = {};
        obj[index] = 1;
        collection.ensureIndex(obj, callback);
    }, function (err) {
        callback(err);
    });

};