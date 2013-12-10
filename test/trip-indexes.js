require('./helper/collection')('trips', 5056);

var assert = require('assert');
var MongoClient = require('mongodb').MongoClient

var db;

describe('test trip indexes', function () {


    before(function (done) {
        MongoClient.connect('mongodb://localhost/testCollectiontrips', function(err, adb) {
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

    it('should have user index on trips collection', function (done) {
        db.collection('trips').indexes(function(err, indexes) {
            assert.equal(indexes[1].key['user'], 1);
            done();
        });
    });

    it('should have tracker index on trips collection', function (done) {
        db.collection('trips').indexes(function(err, indexes) {
            assert.equal(indexes[2].key['trackerId'], 1);
            done();
        });
    });

    it('should have tracker end time compound index on trips collection', function (done) {
        db.collection('trips').indexes(function(err, indexes) {
            assert.equal(indexes[3].key['endTime'], -1);
            assert.equal(indexes[3].key['trackerId'], 1);
            done();
        });
    });
});