var config = require('../../lib/config');
config.setLongPollTimeOut(500);
config.setLongPollCleanupInterval(40);


var async = require('async');
var user = require('../../routes/user');
var requestApi = require('request');
var request = requestApi.defaults({followRedirect: false});
var server = require('../../server');
var assert = require('assert');
var dropDatabase = require('../../lib/drop-database');
var configRoute = require('../../lib/route-config');

var getUnusedPort = require('../helper/port-helper');
var port = getUnusedPort();

var url = 'http://localhost:' + port;
var auth = require('./../helper/auth')(url, request);

var dbUrl = 'mongodb://localhost/messageArrays';

var credential1 = {
    email: 'test@ten20.com',
    username: 'username1',
    password: 'passwordone'
};

var tracker1 = {
    serial: "24234234235"
};

describe('message array', function () {

    before(function (done) {
        async.series([function (callback) {
            dropDatabase(dbUrl, callback);
        }, function (callback) {
            server.startServer(port, dbUrl, "secret", configRoute, callback);
        }, function (callback) {
            auth.signUp(credential1, callback);
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


    var credential1request;
    it('setup: authenticate with credential1', function (done) {
        auth.authenticate(credential1, function (err, request) {
            assert.ifError(err);
            credential1request = request;
            done();
        });
    });


    it('should be possible to add a tracker', function (done) {
        credential1request.put({url: url + '/trackers/528538f0d8d584853c000002', json: tracker1 }, function (error, response, body) {
            assert.equal(200, response.statusCode);
            done();
        });
    });


    it('should be possible to send 3 messages in an array', function (done) {

        var updates = [
            {
                timestamp: new Date(1385473735306),
                index: 0,
                location: {
                    index: 0,
                    latitude: 52.710074934026935,
                    longitude: -1.8910935332479069
                }
            },
            {
                timestamp: new Date(1385473735306),
                index: 1,
                location: {
                    index: 1,
                    latitude: 52.710074934026935,
                    longitude: -1.8910935332479069
                }
            },
            {
                timestamp: new Date(1385473735306),
                index: 2,
                location: {
                    index: 2,
                    latitude: 52.710074934026935,
                    longitude: -1.8910935332479069
                }
            }
        ];

        credential1request.post({url: url + '/message/by-id/528538f0d8d584853c000002', json: updates }, function (error, response, body) {
            assert.equal(200, response.statusCode);
            credential1request.get({url: url + '/trackers/528538f0d8d584853c000002', json: true }, function (error, response, body) {
                assert.equal(response.statusCode, 200);

                assert.equal(body.location.latitude, 52.710074934026935);
                assert.equal(body.location.longitude, -1.8910935332479069);
                assert.equal(body.lastMessage.location.latitude, 52.710074934026935);
                assert.equal(body.lastMessage.location.longitude, -1.8910935332479069);
                assert.equal(body.lastMessage.index, 2);
                assert.equal(body.location.index, 2);

                credential1request.get({url: url + '/recent_messages?trackerId=528538f0d8d584853c000002', json: true }, function (error, response, body) {

                    assert.equal(response.statusCode, 200);

                    assert.equal(body.items[0].message.index, 0);
                    assert.equal(body.items[1].message.index, 1);
                    assert.equal(body.items[2].message.index, 2);
                    console.log(body);
                    done();

                });
            });

        });
    });

    it('should not set location object unless both latitude and longitude are set', function (done) {

        var updates = [
            {
                timestamp: new Date(1385473735306),
                index: 0,
                location: {
                    index: 0,
                    latitude: 52.710074934026935,
                    longitude: -1.8910935332479069
                }
            },
            {
                timestamp: new Date(1385473735306),
                index: 1,
                location: {
                    index: 1,
                    latitude: 52.710074934026935,
                }
            },
            {
                timestamp: new Date(1385473735306),
                index: 2,
                location: {
                    index: 2,
                    longitude: -1.8910935332479069
                }
            }
        ];

        credential1request.post({url: url + '/message/by-id/528538f0d8d584853c000002', json: updates }, function (error, response, body) {
            assert.equal(200, response.statusCode);
            credential1request.get({url: url + '/trackers/528538f0d8d584853c000002', json: true }, function (error, response, body) {
                assert.equal(response.statusCode, 200);

                assert.equal(body.lastMessage.index, 2);
                assert.equal(body.location.index, 0);
                done();
            });
        });
    });

});
