require('./../helper/collection')('recent-messages', 3014);
var assert = require('assert');
var MongoClient = require('mongodb').MongoClient

var db;

describe('test tracker indexes', function () {

    before(function (done) {
        MongoClient.connect('mongodb://localhost/testCollectionrecent-messages', function(err, adb) {
            db = adb;
            done(err);
        });
    });

    after(function (done) {
        if (db) {
            db.close();
        }
        done();
    });

    it('should have user index on messages collection', function (done) {
        db.collection('messages').indexes(function(err, indexes) {
            assert.equal(indexes[1].key['user'], 1);
            done();
        });
    });

    it('should have trackerId index on trackers collection', function (done) {
        db.collection('messages').indexes(function(err, indexes) {
            assert.equal(indexes[2].key['trackerId'], 1);
            done();
        });
    });
});