var async = require('async');
var user = require('../../routes/user');
var requestApi = require('request');
var request = requestApi.defaults({followRedirect: false, jar: requestApi.jar()});
var server = require('../../server');
var assert = require('assert');
var dropDatabase = require('../../lib/drop-database');
var configRoute = require('../../lib/route-config');

var util = require('../../lib/util');

var callCount = 0;

var ONE_MINUTE = 60 * 1000;
var SIX_HOURS = 1000 * 60 * 60 * 6;
var THREE_HOURS = 1000 * 60 * 60 * 3;
var time = +new Date('Tue Sep 05 1978 10:00:00 GMT');



var port = 3013;

var url = 'http://localhost:' + port;
var auth = require('./../helper/auth')(url, request);

var dbUrl = 'mongodb://localhost/testTrips2';

var credential = {
    email: 'test@ten20.com',
    password: 'passwordone'
};

var tracker1 = {
    serial: "24234234235"
};

var tracker2 = {
    serial: "24234234236",
    tripDuration: 3 * 60 * 60 * 1000
};

var locationIndex = 0;

var currentTimeMillis;

describe('test trips', function () {


    before(function (done) {
        async.series([function (callback) {
            dropDatabase(dbUrl, callback);
        }, function (callback) {
            server.startServer(port, dbUrl, configRoute, callback);
        },function (callback) {
            auth.signUp(credential, callback);
        },function (callback) {
            auth.signIn(credential, callback);
            currentTimeMillis = util.currentTimeMillis;
            util.currentTimeMillis = function() {
                var currentTime = time;
                time += ONE_MINUTE;
                return currentTime;
            };

        }], done);
    });

    after(function (done) {
        async.series([function (callback) {
            auth.signOut(callback);
        }, function (callback) {
            ///server.close(callback);
            util.currentTimeMillis = currentTimeMillis;
            callback();
        }], done);

    });

    it('should be possible to add a tracker with no tripDuration', function (done) {
        request.put({url: url + '/trackers/528538f0d8d584853c000002', json: tracker1 }, function (error, response, body) {
            assert.equal(200, response.statusCode);
            done();
        });
    });

    it('should be possible to add a tracker2 with trip duration ', function (done) {
        request.put({url: url + '/trackers/528538f0d8d584853c000003', json: tracker2 }, function (error, response, body) {
            assert.equal(200, response.statusCode);
            done();
        });
    });

    var sendLocationUpdate = function (count, serial, callback) {
        var index = 0;
        async.whilst(
            function () {
                return index < count;
            },
            function (callback) {
                var message = {
                    index: locationIndex++
                };
                console.log('post ' + index);
                request.post({url: url + '/message/' + serial, json: message }, function (error, response, body) {
                    assert.equal(200, response.statusCode);
                    index++;
                    callback();
                });
            },
            function (err) {
                callback(err);
            });
    };

    it('with no trip duration set on the tracker trips should roll over every 6 hours', function (done) {

        async.waterfall([
        function(callback) {
            sendLocationUpdate(6, tracker1.serial, callback);
        }, function(callback) {
            time += SIX_HOURS;
            sendLocationUpdate(6, tracker1.serial, callback);
        }, function(callback) {
            time += SIX_HOURS;
            sendLocationUpdate(1, tracker1.serial,  callback);
        }, function(callback) {
             setTimeout(callback, 500);
        }, function(callback) {
            request.get({url: url + '/trips?trackerId=528538f0d8d584853c000002', json: true }, callback);
        }, function(response, body, callback) {
            assert.equal(200, response.statusCode);
            assert.equal(body.items[0].messages[0].message.index, 0);
            assert.equal(body.items[0].messages[1].message.index, 1);
            assert.equal(body.items[0].messages[2].message.index, 2);
            assert.equal(body.items[0].messages[3].message.index, 3);
            assert.equal(body.items[0].messages[4].message.index, 4);
            assert.equal(body.items[0].messages[5].message.index, 5);
            assert.equal(body.items[1].messages[0].message.index, 6);
            assert.equal(body.items[1].messages[1].message.index, 7);
            assert.equal(body.items[1].messages[2].message.index, 8);
            assert.equal(body.items[1].messages[3].message.index, 9);
            assert.equal(body.items[1].messages[4].message.index, 10);
            assert.equal(body.items[1].messages[5].message.index, 11);
            request.get({url: url + '/recent_messages?trackerId=528538f0d8d584853c000002', json: true }, callback);
        }, function(response, body, callback) {
            assert.equal(200, response.statusCode);
            assert.equal(body.items[0].message.index, 12);
            callback(null);
        }], function(err) {
            assert.ifError(err);
            done();
        });
    });


    it('with a 3hr trip duration, trips should roll over every 3 hours', function (done) {


        async.waterfall([
            function(callback) {
                locationIndex = 0;
                sendLocationUpdate(3, tracker2.serial, callback);
            }, function(callback) {
                time += THREE_HOURS;
                sendLocationUpdate(3, tracker2.serial, callback);
            }, function(callback) {
                time += THREE_HOURS;
                sendLocationUpdate(3, tracker2.serial, callback);
            }, function(callback) {
                time += THREE_HOURS;
                sendLocationUpdate(3, tracker2.serial, callback);
            }, function(callback) {
                time += THREE_HOURS;
                sendLocationUpdate(1, tracker2.serial, callback);
            }, function(callback) {
                setTimeout(callback, 500);
            }, function(callback) {
                request.get({url: url + '/trips?trackerId=528538f0d8d584853c000003', json: true }, callback);
            }, function(response, body, callback) {
                assert.equal(200, response.statusCode);
                console.log(JSON.stringify(body, null, 4));
                assert.equal(body.items[0].messages[0].message.index, 0);
                assert.equal(body.items[0].messages[1].message.index, 1);
                assert.equal(body.items[0].messages[2].message.index, 2);

                assert.equal(body.items[1].messages[0].message.index, 3);
                assert.equal(body.items[1].messages[1].message.index, 4);
                assert.equal(body.items[1].messages[2].message.index, 5);

                assert.equal(body.items[2].messages[0].message.index, 6);
                assert.equal(body.items[2].messages[1].message.index, 7);
                assert.equal(body.items[2].messages[2].message.index, 8);

                assert.equal(body.items[3].messages[0].message.index, 9);
                assert.equal(body.items[3].messages[1].message.index, 10);
                assert.equal(body.items[3].messages[2].message.index, 11);

                request.get({url: url + '/recent_messages?trackerId=528538f0d8d584853c000003', json: true }, callback);
            }, function(response, body, callback) {
                assert.equal(200, response.statusCode);
                assert.equal(body.items[0].message.index, 12);
                callback(null);
            }], function(err) {
            assert.ifError(err);
            done();
        });
    });

});
