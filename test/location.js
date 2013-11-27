var config = require('../lib/config');
config.setLongPollTimeOut(500);
config.setLongPollCleanupInterval(40);


var async = require('async');
var user = require('../routes/user');
var requestApi = require('request');
var request = requestApi.defaults({followRedirect: false, jar: requestApi.jar()});
var server = require('../server');
var assert = require('assert');
var dropDatabase = require('../lib/drop-database');
var configRoute = require('../lib/route-config');



var port = 3008;

var url = 'http://localhost:' + port;
var auth = require('./helper/auth')(url, request);


var dbUrl = 'mongodb://localhost/testLocation';

var credential1 = {
    email: 'test@ten20.com',
    password: 'passwordone'
};

var credential2 = {
    email: 'test2@ten20.com',
    password: 'passwordtwo'
};

var tracker = {
    serial: "24234234235"
};

var locationUpdate = {
    timestamp: 1385473735305,
    latitude: 52.710074934026935,
    longitude: -1.8910935332479069,
    serial: '24234234235'
}

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
        },function (callback) {
            auth.signIn(credential1, callback);
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

    it('should be possible to add a tracker', function (done) {
        request.put({url: url + '/trackers/528538f0d8d584853c000002', json: tracker }, function (error, response, body) {
            assert.equal(200, response.statusCode);
            done();
        });
    });


    it('updating location by serial should trigger notify_changed', function (done) {

        var complete = {
            notify_changed: false,
            update_by_serial: false
        };

        request.get({url: url + '/location/notify_changed/528538f0d8d584853c000002', json:true}, function (error, response, body) {
            complete.notify_changed = true;
            assert(complete.update_by_serial);
            assert.equal(200, response.statusCode);
            assert.equal(52.710074934026935, body.latitude)
            handleComplete(complete, done);
        });

        setTimeout(function() {
            request.post({url: url + '/location/update_by_serial/' + tracker.serial, json: locationUpdate }, function (error, response, body) {
                complete.update_by_serial = true;
                assert(!complete.notify_changed);
                assert.equal(200, response.statusCode);
                handleComplete(complete, done);
            });
        }, 100);

    });


    it('admin: sign in with credential two', function (done) {
        async.series([function (callback) {
            auth.signOut(callback);
        },function (callback) {
            auth.signIn(credential2, callback);
        }], done);
    });


    it('updating location by serial owned by other user should not trigger notify_changed', function (done) {

        var complete = {
            notify_changed: false,
            update_by_serial: false
        };
        request.get({url: url + '/location/notify_changed/528538f0d8d584853c000002', json:true}, function (error, response, body) {
            assert.equal(408, response.statusCode);
            complete.notify_changed = true;
            handleComplete(complete, done);
        });

        setTimeout(function() {
            request.post({url: url + '/location/update_by_serial/' + tracker.serial, json: locationUpdate }, function (error, response, body) {
                setTimeout(function() {
                    assert.equal(200, response.statusCode);
                    assert(!complete.notify_changed);
                    complete.update_by_serial = true;
                    handleComplete(complete, done);
                }, 100);
            });
        }, 100);

    });
});
