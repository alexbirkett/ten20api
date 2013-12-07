var config = require('../../lib/config');
config.setLongPollTimeOut(500);
config.setLongPollCleanupInterval(40);


var async = require('async');
var user = require('../../routes/user');
var requestApi = require('request');
var request = requestApi.defaults({followRedirect: false, jar: requestApi.jar()});
var request2 = requestApi.defaults({followRedirect: false, jar: requestApi.jar()});
var server = require('../../server');
var assert = require('assert');
var dropDatabase = require('../../lib/drop-database');
var configRoute = require('../../lib/route-config');



var port = 3008;

var url = 'http://localhost:' + port;
var auth = require('./../helper/auth')(url, request);
var auth2 = require('./../helper/auth')(url, request2);

var dbUrl = 'mongodb://localhost/testLocation';

var credential1 = {
    email: 'test@ten20.com',
    password: 'passwordone'
};

var credential2 = {
    email: 'test2@ten20.com',
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

var locationUpdate1 = {
    timestamp: 1385473735305,
    latitude: 52.710074934026935,
    longitude: -1.8910935332479069
};

var locationUpdate2 = {
    timestamp: 1385473735305,
    latitude: 53.710074934026935,
    longitude: -1.8910935332479069
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

describe('test location endpoint', function () {


    before(function (done) {
        async.series([function (callback) {
            dropDatabase(dbUrl, callback);
        }, function (callback) {
            server.startServer(port, dbUrl, configRoute, callback);
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
        request.get({url: url + '/location/notify_changed', json:true}, function (error, response, body) {
            assert.equal(401, response.statusCode);
            done();
        });
    });


    it('admin sign in', function (done) {
        async.series([function (callback) {
            auth.signIn(credential1, callback);
        },function (callback) {
            auth2.signIn(credential2, callback);
        }], done);
    });


    it('should be possible to add a tracker', function (done) {
        request.put({url: url + '/trackers/528538f0d8d584853c000002', json: tracker1 }, function (error, response, body) {
            assert.equal(200, response.statusCode);
            done();
        });
    });


    it('should be possible to add a tracker', function (done) {
        request.put({url: url + '/trackers/528538f0d8d584853c000003', json: tracker2 }, function (error, response, body) {
            assert.equal(200, response.statusCode);
            done();
        });
    });

    it('should be possible to add a tracker', function (done) {
        request2.put({url: url + '/trackers/528538f0d8d584853c000004', json: tracker3 }, function (error, response, body) {
            assert.equal(200, response.statusCode);
            done();
        });
    });

    it('updating location by serial should trigger notify_changed on specified tracker owned by user', function (done) {

        var complete = {
            notify_changed: false,
            update_by_serial: false,
            update_by_serial_started: false
        };

        request.get({url: url + '/location/notify_changed/528538f0d8d584853c000002', json:true}, function (error, response, body) {
            complete.notify_changed = true;
            assert(complete.update_by_serial_started);
            assert.equal(200, response.statusCode);
            assert.equal(52.710074934026935, body.latitude)
            handleComplete(complete, done);
        });

        setTimeout(function() {
            complete.update_by_serial_started = true;
            request.post({url: url + '/location/update_by_serial/' + tracker1.serial, json: locationUpdate1 }, function (error, response, body) {
                complete.update_by_serial = true;
                assert.equal(200, response.statusCode);
                handleComplete(complete, done);
            });
        }, 100);

    });


    it('updating location by serial should trigger notify_changed on tracker1 owned by user', function (done) {

        var complete = {
            notify_changed: false,
            update_by_serial: false,
            update_by_serial_started: false
        };

        request.get({url: url + '/location/notify_changed', json:true}, function (error, response, body) {
            complete.notify_changed = true;
            assert(complete.update_by_serial_started);
            assert.equal(200, response.statusCode);
            assert.equal(52.710074934026935, body.latitude)
            handleComplete(complete, done);
        });

        setTimeout(function() {
            complete.update_by_serial_started = true;
            request.post({url: url + '/location/update_by_serial/' + tracker1.serial, json: locationUpdate1 }, function (error, response, body) {
                complete.update_by_serial = true;
                assert.equal(200, response.statusCode);
                handleComplete(complete, done);
            });
        }, 100);

    });


    it('updating location by serial should trigger notify_changed on tracker2 owned by user', function (done) {

        var complete = {
            notify_changed: false,
            update_by_serial: false,
            update_by_serial_started: false
        };

        request.get({url: url + '/location/notify_changed', json:true}, function (error, response, body) {
            complete.notify_changed = true;
            assert(complete.update_by_serial_started);
            assert.equal(200, response.statusCode);
            assert.equal(52.710074934026935, body.latitude)
            handleComplete(complete, done);
        });

        setTimeout(function() {
            complete.update_by_serial_started = true;
            request.post({url: url + '/location/update_by_serial/' + tracker2.serial, json: locationUpdate1 }, function (error, response, body) {
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

        request.get({url: url + '/location/notify_changed/528538f0d8d584853c000002', json:true}, function (error, response, body) {
            complete.notify_changed1 = true;
            assert(complete.update_by_serial1_started);
            assert(complete.update_by_serial2_started);
            assert( complete.notify_changed2);
            assert.equal(200, response.statusCode);
            assert.equal(52.710074934026935, body.latitude)
            handleComplete(complete, done);
        });

        request2.get({url: url + '/location/notify_changed/528538f0d8d584853c000004', json:true}, function (error, response, body) {
            complete.notify_changed2 = true;
            assert(complete.update_by_serial1_started);
            assert(!complete.update_by_serial2_started);
            assert(!complete.notify_changed1);
            assert.equal(200, response.statusCode);
            assert.equal(53.710074934026935, body.latitude)
            handleComplete(complete, done);
        });


        setTimeout(function() {
            complete.update_by_serial1_started = true;
            request2.post({url: url + '/location/update_by_serial/' + tracker3.serial, json: locationUpdate2 }, function (error, response, body) {
                complete.update_by_serial1 = true;
                assert.equal(200, response.statusCode);
                handleComplete(complete, done);
            });

            setTimeout(function() {
                complete.update_by_serial2_started = true;
                request.post({url: url + '/location/update_by_serial/' + tracker1.serial, json: locationUpdate1 }, function (error, response, body) {
                    complete.update_by_serial2 = true;
                    assert.equal(200, response.statusCode);
                    handleComplete(complete, done);
                });
            },100);
        }, 100);
    });
});
