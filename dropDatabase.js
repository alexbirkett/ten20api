var MongoClient = require('mongodb').MongoClient;
var async = require('async');

var db;
module.exports = function(dbUrl, callback) {
    async.waterfall([
        function (callback) {
            MongoClient.connect(dbUrl, callback);
        },
        function (adb, callback) {
            db = adb;
            console.log('dropping database');
            db.dropDatabase(callback);
        }],
        function(err) {
            if (db) {
                db.close();
            }
            callback(err);
        });
}