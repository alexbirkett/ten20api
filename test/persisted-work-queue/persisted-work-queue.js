/**
 * Created by alex on 02/03/14.
 */
var PersistedWorkQueue = require('../../lib/persisted-work-queue');
var MongoClient = require('mongodb').MongoClient;
var db = require('../../lib/db');
var assert = require('assert');
var dropDatabase = require('../../lib/drop-database');
var dbUrl = 'mongodb://localhost/testPersistedWorkQueue';
var async = require('async');
var persistedWorkQueue = new PersistedWorkQueue().setCollectionName("work");
var util = require('../../lib/util');

var callCount = 0;

var ONE_MINUTE = 60 * 1000;
var time = +new Date('Tue Sep 05 1978 10:00:00 GMT');

var currentTimeMillis;

describe('persisted work queue', function () {

    before(function (done) {
        async.waterfall([
            function (callback) {
            dropDatabase(dbUrl, callback);
        }, function (callback) {
            MongoClient.connect(dbUrl, callback);
        }, function (adb, callback) {
            db.setDb(adb);
            currentTimeMillis =  util.currentTimeMillis;

            util.currentTimeMillis = function() {
                var currentTime = time;
                time += ONE_MINUTE;
                return currentTime;
            };

            callback();
        }], done);

    });

    after(function (done) {

        util.currentTimeMillis = currentTimeMillis;
        if (db.getDb()) {
            db.getDb().close();
        }
        done();
    });




   it('should work on one job after one job added', function (done) {
        var work = { one: "work"};
        var workArray = [];
        persistedWorkQueue.setWorkFunction(function(work, callback) {
            workArray.push(work);
            callback();
        });

        async.series([function(callback) {
            persistedWorkQueue.addJob(work, callback);
        }, function(callback) {
            persistedWorkQueue.tickle(function(err) {
                assert.equal(+workArray[0].addedTimestamp, +new Date('Tue Sep 05 1978 10:00:00 GMT'));
                assert.equal(+workArray[0].startedTimestamp, +new Date('Tue Sep 05 1978 10:01:00 GMT'));
                assert.deepEqual(workArray[0].job, work);

                var cursor =  db.getDb().collection('work').find({});
                cursor.toArray(function(err, docs) {
                    assert.ifError(err);
                    assert.equal(+docs[0].addedTimestamp, +new Date('Tue Sep 05 1978 10:00:00 GMT'));
                    assert.equal(+docs[0].startedTimestamp, +new Date('Tue Sep 05 1978 10:01:00 GMT'));
                    assert.equal(+docs[0].completedTimestamp, +new Date('Tue Sep 05 1978 10:02:00 GMT'));
                    assert.deepEqual(docs[0].job, work);
                    callback();
                });
            });
        }], function(err) {
            assert.ifError(err);
            done();
        });

    });

    it('should work on two jobs after two jobs added', function (done) {

        var work = { two: "work"};
        var moreWork = { two: "more work"};
        var workArray = [];
        persistedWorkQueue.setWorkFunction(function(work, callback) {
            workArray.push(work);
            callback();
        });

        async.series([function(callback) {
            persistedWorkQueue.addJob(work, callback);
        }, function(callback) {
            persistedWorkQueue.addJob(moreWork, callback);
        }, function(callback) {
            persistedWorkQueue.tickle(function(err) {
                assert.deepEqual(workArray[0].job, work);
                assert.deepEqual(workArray[1].job, moreWork);
                var cursor =  db.getDb().collection('work').find({});
                cursor.toArray(function(err, docs) {
                    assert.ifError(err);
                    assert.deepEqual(docs[1].job, work);
                    assert.deepEqual(docs[2].job, moreWork);
                    callback();
                });
            });
        }], function(err) {
            assert.ifError(err);
            done();
        });
    });

    it('should clean up old jobs after 24 hours', function (done) {
        // 25 hours after first test completed
        time = + new Date('Tue Sep 06 1978 11:00:00 GMT');

        var work = { one: "work"};
        var workArray = [];
        persistedWorkQueue.setWorkFunction(function(work, callback) {
            workArray.push(work);
            callback();
        });

        async.series([function(callback) {
            persistedWorkQueue.addJob(work, callback);
        }, function(callback) {
            persistedWorkQueue.tickle(function(err) {
                assert.equal(+workArray[0].addedTimestamp, +new Date('Tue Sep 06 1978 11:00:00 GMT'));
                assert.equal(+workArray[0].startedTimestamp, +new Date('Tue Sep 06 1978 11:01:00 GMT'));
                assert.deepEqual(workArray[0].job, work);

                var cursor =  db.getDb().collection('work').find({});
                cursor.toArray(function(err, docs) {
                    assert.ifError(err);
                    assert.equal(+docs[0].addedTimestamp, +new Date('Tue Sep 06 1978 11:00:00 GMT'));
                    assert.equal(+docs[0].startedTimestamp, +new Date('Tue Sep 06 1978 11:01:00 GMT'));
                    assert.equal(+docs[0].completedTimestamp, +new Date('Tue Sep 06 1978 11:02:00 GMT'));
                    assert.deepEqual(docs[0].job, work);
                    callback();
                });
            });
        }], function(err) {
            assert.ifError(err);
            done();
        });
    });
});