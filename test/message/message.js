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

var dbUrl = 'mongodb://localhost/testLocation';

var credential1 = {
    email: 'test@ten20.com',
    username: 'username1',
    password: 'passwordone'
};

var credential2 = {
    email: 'test2@ten20.com',
    username: 'username2',
    password: 'passwordtwo'
};

var tracker1 = {
    serial: "24234234235"
};

var tracker2 = {
    serial: "24234234236"
};

var tracker3 = {
    serial: "24234234237"
};

var messageUpdate1 = {
    location : {
        timestamp: new Date(1385473735306),
        latitude: 52.710074934026935,
        longitude: -1.8910935332479069
    }
};

var messageUpdate2 = {
    location : {
        timestamp: new Date(1385473735307),
        latitude: 53.710074934026936,
        longitude: -1.8910935332479069
    }
};

var handleComplete = function(complete, callback) {
    var isComplete = true;
    for(var key in complete){
        if (!complete[key]) {
            isComplete = false;
        }
    };
    if (isComplete) {
        callback();
    }
};

describe('test message endpoint', function () {


    before(function (done) {
        async.series([function (callback) {
            dropDatabase(dbUrl, callback);
        }, function (callback) {
            server.startServer(port, dbUrl, "secret", configRoute, callback);
        },function (callback) {
            auth.signUp(credential1, callback);
        },function (callback) {
            auth.signUp(credential2, callback);
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

    it('should not be possible to call notify_changed when not logged in', function (done) {
        request.get({url: url + '/message/notify', json:true}, function (error, response, body) {
            assert.equal(401, response.statusCode);
            done();
        });
    });

    var credential1request;
    it('setup: authenticate with credential1', function (done) {
        auth.authenticate(credential1, function(err, request) {
            assert.ifError(err);
            credential1request = request;
            done();
        });
    });

    var credential2request;
    it('setup: authenticate with credential2', function (done) {
        auth.authenticate(credential2, function(err, request) {
            assert.ifError(err);
            credential2request = request;
            done();
        });
    });


    it('should be possible to add a tracker', function (done) {
        credential1request.put({url: url + '/trackers/528538f0d8d584853c000002', json: tracker1 }, function (error, response, body) {
            assert.equal(200, response.statusCode);
            done();
        });
    });


    it('should be possible to add a tracker', function (done) {
        credential1request.put({url: url + '/trackers/528538f0d8d584853c000003', json: tracker2 }, function (error, response, body) {
            assert.equal(200, response.statusCode);
            done();
        });
    });

    it('should be possible to add a tracker', function (done) {
        credential2request.put({url: url + '/trackers/528538f0d8d584853c000004', json: tracker3 }, function (error, response, body) {
            assert.equal(200, response.statusCode);
            done();
        });
    });

    it('should be possible to update the tracker', function (done) {
        credential1request.post({url: url + '/message/' + tracker1.serial, json: messageUpdate1 }, function (error, response, body) {
            assert.equal(200, response.statusCode);
            credential1request.get({url: url + '/trackers/528538f0d8d584853c000002', json: true }, function (error, response, body) {
                assert.equal(response.statusCode, 200);
                assert.equal(body.location.timestamp, '2013-11-26T13:48:55.306Z');
                assert.equal(body.location.latitude, 52.710074934026935);
                assert.equal(body.location.longitude, -1.8910935332479069);
                assert.equal(body.lastMessage.location.latitude, 52.710074934026935);
                assert.equal(body.lastMessage.location.longitude, -1.8910935332479069);
                done();
            });
        });
    });


    it('should not update location if latitude not set', function (done) {

        var update = {
            timestamp: new Date(1385473735308),
            location : {
                longitude: -2.8910935332479069
            }
        };

        credential1request.post({url: url + '/message/' + tracker1.serial, json: update }, function (error, response, body) {
            assert.equal(200, response.statusCode);
            credential1request.get({url: url + '/trackers/528538f0d8d584853c000002', json: true }, function (error, response, body) {
                assert.equal(response.statusCode, 200);

                assert.equal(body.location.latitude, 52.710074934026935);
                assert.equal(body.location.longitude, -1.8910935332479069);
                assert.equal(body.lastMessage.location.latitude, undefined);
                assert.equal(body.lastMessage.location.longitude, -2.8910935332479069);

                done();
            });
        });
    });

    it('should not update location if longitude not set', function (done) {

        var update = {
            timestamp: new Date(1385473735308),
            location : {
                latitude: -2.8910935332479069
            }
        };

        credential1request.post({url: url + '/message/' + tracker1.serial, json: update }, function (error, response, body) {
            assert.equal(200, response.statusCode);
            credential1request.get({url: url + '/trackers/528538f0d8d584853c000002', json: true }, function (error, response, body) {
                assert.equal(response.statusCode, 200);

                assert.equal(body.location.latitude, 52.710074934026935);
                assert.equal(body.location.longitude, -1.8910935332479069);
                assert.equal(body.lastMessage.location.longitude, undefined);
                assert.equal(body.lastMessage.location.latitude, -2.8910935332479069);

                done();
            });
        });
    });


    it('updating location by serial should trigger notify_changed on specified tracker owned by user', function (done) {

        var complete = {
            notify_changed: false,
            update_by_serial: false,
            update_by_serial_started: false
        };

        credential1request.get({url: url + '/message/notify/528538f0d8d584853c000002', json:true}, function (error, response, body) {
            complete.notify_changed = true;
            assert(complete.update_by_serial_started);
            assert.equal(200, response.statusCode);
            assert.equal(52.710074934026935, body.lastMessage.location.latitude)
            handleComplete(complete, done);
        });

        setTimeout(function() {
            complete.update_by_serial_started = true;
            credential1request.post({url: url + '/message/' + tracker1.serial, json: messageUpdate1 }, function (error, response, body) {
                complete.update_by_serial = true;
                assert.equal(200, response.statusCode);
                handleComplete(complete, done);
            });
        }, 100);

    });


    it('updating message by serial should trigger notify_changed on tracker1 owned by user', function (done) {

        var complete = {
            notify_changed: false,
            update_by_serial: false,
            update_by_serial_started: false
        };

        credential1request.get({url: url + '/message/notify', json:true}, function (error, response, body) {
            complete.notify_changed = true;
            assert(complete.update_by_serial_started);
            assert.equal(200, response.statusCode);
            assert.equal(52.710074934026935, body.lastMessage.location.latitude)
            handleComplete(complete, done);
        });

        setTimeout(function() {
            complete.update_by_serial_started = true;
            credential1request.post({url: url + '/message/' + tracker1.serial, json: messageUpdate1 }, function (error, response, body) {
                complete.update_by_serial = true;
                assert.equal(200, response.statusCode);
                handleComplete(complete, done);
            });
        }, 100);

    });


    it('updating message by serial should trigger notify_changed on tracker2 owned by user', function (done) {

        var complete = {
            notify_changed: false,
            update_by_serial: false,
            update_by_serial_started: false
        };

        credential1request.get({url: url + '/message/notify', json:true}, function (error, response, body) {
            complete.notify_changed = true;
            assert(complete.update_by_serial_started);
            assert.equal(200, response.statusCode);
            assert.equal(52.710074934026935, body.lastMessage.location.latitude)
            handleComplete(complete, done);
        });

        setTimeout(function() {
            complete.update_by_serial_started = true;
            credential1request.post({url: url + '/message/' + tracker2.serial, json: messageUpdate1 }, function (error, response, body) {
                complete.update_by_serial = true;
                assert.equal(200, response.statusCode);
                handleComplete(complete, done);
            });
        }, 100);

    });

    it('should be possible for more than one user to listen for changes simultaneously', function (done) {

        var complete = {
            notify_changed1: false,
            update_by_serial1: false,
            update_by_serial1_started: false,
            notify_changed2: false,
            update_by_serial2: false,
            update_by_serial2_started: false
        };

        credential1request.get({url: url + '/message/notify/528538f0d8d584853c000002', json:true}, function (error, response, body) {
            console.log('notify1');
            complete.notify_changed1 = true;
            assert(complete.update_by_serial1_started);
            assert(complete.update_by_serial2_started);
            assert(complete.notify_changed2);
            assert.equal(200, response.statusCode);
            assert.equal(52.710074934026935, body.lastMessage.location.latitude);
            handleComplete(complete, done);
        });

        credential2request.get({url: url + '/message/notify/528538f0d8d584853c000004', json:true}, function (error, response, body) {
            console.log('notify2');
            complete.notify_changed2 = true;
            assert(complete.update_by_serial1_started);
            assert(!complete.update_by_serial2_started);
            assert(!complete.notify_changed1);
            assert.equal(200, response.statusCode);
            assert.equal(53.710074934026935, body.lastMessage.location.latitude);
            handleComplete(complete, done);
        });


        setTimeout(function() {
            complete.update_by_serial1_started = true;
            request.post({url: url + '/message/' + tracker3.serial, json: messageUpdate2 }, function (error, response, body) {
                complete.update_by_serial1 = true;
                assert.equal(200, response.statusCode);
                handleComplete(complete, done);
            });

            setTimeout(function() {
                complete.update_by_serial2_started = true;
                request.post({url: url + '/message/' + tracker1.serial, json: messageUpdate1 }, function (error, response, body) {
                    complete.update_by_serial2 = true;
                    assert.equal(200, response.statusCode);
                    handleComplete(complete, done);
                });
            },100);
        }, 100);
    });


    it('server should ignore updates with uknown serials', function (done) {
        credential1request.post({url: url + '/message/234234234234234234', json: messageUpdate1 }, function (error, response, body) {

            assert.equal(404, response.statusCode);
            done();
        });
    });
});
