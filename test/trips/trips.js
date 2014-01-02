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

var ONE_HOUR = 60 * 60 * 1000;

util.currentTimeMillis = function() {
    var time = 273837600000 + (callCount * ONE_HOUR);
    ++callCount;
    return time;
};

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


var locationUpdate = {
    timestamp: 1385473735305,
    latitude: 52.710074934026935,
    longitude: -1.8910935332479069
};

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
        }], done);
    });

    after(function (done) {
        async.series([function (callback) {
            auth.signOut(callback);
        }, function (callback) {
            ///server.close(callback);
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


    it('with no trip duration set on the tracker, 12 updates 1 hour apart should result in two trip documents each containing 6 updates', function (done) {

        var count = 0;
        async.whilst(
            function () { return count < 13; },
            function (callback) {
                locationUpdate.index = count;
                count++;
                request.post({url: url + '/message/' + tracker1.serial, json: locationUpdate }, function (error, response, body) {
                    assert.equal(200, response.statusCode);
                    callback();
                });

            },
            function (err) {
                assert(!err);
                request.get({url: url + '/trips?trackerId=528538f0d8d584853c000002', json: true }, function (error, response, body) {
                    assert.equal(200, response.statusCode);
                    assert.equal(body.items[0].messages[0].index, 0);
                    assert.equal(body.items[0].messages[1].index, 1);
                    assert.equal(body.items[0].messages[2].index, 2);
                    assert.equal(body.items[0].messages[3].index, 3);
                    assert.equal(body.items[0].messages[4].index, 4);
                    assert.equal(body.items[0].messages[5].index, 5);

                    assert.equal(body.items[1].messages[0].index, 6);
                    assert.equal(body.items[1].messages[1].index, 7);
                    assert.equal(body.items[1].messages[2].index, 8);
                    assert.equal(body.items[1].messages[3].index, 9);
                    assert.equal(body.items[1].messages[4].index, 10);
                    assert.equal(body.items[1].messages[5].index, 11);


                    request.get({url: url + '/recent_messages?trackerId=528538f0d8d584853c000002', json: true }, function (error, response, body) {
                        assert.equal(200, response.statusCode);
                        assert.equal(body.items[0].message.index, 12);
                        done();
                    });

                });
            }
        );
    });


    it('with a 3hr trip duraiton on the tracker, 12 updates 1 hour apart should result in 4 trip documents each containing 6 updates', function (done) {

        var count = 0;
        async.whilst(
            function () { return count < 13; },
            function (callback) {
                locationUpdate.index = count;
                count++;
                request.post({url: url + '/message/' + tracker2.serial, json: locationUpdate }, function (error, response, body) {
                    assert.equal(200, response.statusCode);
                    callback();
                });

            },
            function (err) {
                assert(!err);
                request.get({url: url + '/trips?trackerId=528538f0d8d584853c000003', json: true }, function (error, response, body) {
                    assert.equal(200, response.statusCode);
                    assert.equal(body.items[0].messages[0].index, 0);
                    assert.equal(body.items[0].messages[1].index, 1);
                    assert.equal(body.items[0].messages[2].index, 2);

                    assert.equal(body.items[1].messages[0].index, 3);
                    assert.equal(body.items[1].messages[1].index, 4);
                    assert.equal(body.items[1].messages[2].index, 5);

                    assert.equal(body.items[2].messages[0].index, 6);
                    assert.equal(body.items[2].messages[1].index, 7);
                    assert.equal(body.items[2].messages[2].index, 8);

                    assert.equal(body.items[3].messages[0].index, 9);
                    assert.equal(body.items[3].messages[1].index, 10);
                    assert.equal(body.items[3].messages[2].index, 11);

                    request.get({url: url + '/recent_messages?trackerId=528538f0d8d584853c000003', json: true }, function (error, response, body) {
                        assert.equal(200, response.statusCode);
                        assert.equal(body.items[0].message.index, 12);
                        done();
                    });
                });
            }
        );
    });

});
