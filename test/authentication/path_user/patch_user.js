var async = require('async');
var user = require('../../../routes/user');
var requestApi = require('request');
var request = requestApi.defaults({followRedirect: false });
var server = require('../../../server');
var assert = require('assert');
var dropDatabase = require('../../../lib/drop-database');
var configRoute = require('../../../lib/route-config');

var getUnusedPort = require('../../helper/port-helper');
var port = getUnusedPort();

var url = 'http://localhost:' + port;
var auth = require('../../helper/auth')(url, request);

var dbUrl = 'mongodb://localhost/patch_user';

describe('test signup', function () {

    before(function (done) {
        async.series([function (callback) {
            dropDatabase(dbUrl, callback);
        }, function (callback) {
            server.startServer(port, dbUrl, configRoute, callback);
        }], done);

    });

    var credentialOne = {
        email: 'test@ten20.com',
        username: 'tester',
        password: 'password'
    };

    var credentialTwo = {
        email: 'test2@ten20.com',
        username: 'tester2',
        password: 'password2'
    };

    it('should be possible to sign up with valid credential one', function (done) {
        request.post({url: url + '/signup', json: credentialOne}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            done();
        });
    });

    it('should be possible to sign up with valid credential two', function (done) {
        request.post({url: url + '/signup', json: credentialTwo}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            done();
        });
    });

    var credential1request;
    it('setup: authenticate with credential1', function (done) {
        auth.authenticate(credentialOne, function(err, request) {
            assert.ifError(err);
            credential1request = request;
            done();
        });
    });

    var credential2request;
    it('setup: authenticate with credential1', function (done) {
        auth.authenticate(credentialTwo, function(err, request) {
            assert.ifError(err);
            credential2request = request;
            done();
        });
    });

    it('should be possible to get user info', function (done) {
        credential1request.get({ url: url + '/user', json: true}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            assert.equal(body.email, 'test@ten20.com');
            assert.equal(body.username, 'tester');
            assert(!body.password);
            done();
        });
    });

    it('should be possible to change the email address', function (done) {
        credential1request.patch({url: url + '/user', json: {
            email: 'test3@ten20.com'
        }}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            done();
        });
    });

    it('should be possible to get user info after update', function (done) {
        credential1request.get({ url: url + '/user', json: true}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            assert.equal(body.email, 'test3@ten20.com');
            assert.equal(body.username, 'tester');
            assert(!body.password);
            done();
        });
    });

    it('should be possible to change the username', function (done) {
        credential1request.patch({url: url + '/user', json: {
            username: 'tester3'
        }}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            done();
        });
    });

    it('should be possible to get user info after update', function (done) {
        credential1request.get({ url: url + '/user', json: true}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            assert.equal(body.email, 'test3@ten20.com');
            assert.equal(body.username, 'tester3');
            assert(!body.password);
            done();
        });
    });

    it('should not be possible to change the email address to one that is in use', function (done) {
        credential1request.patch({url: url + '/user', json: {
            email: 'test2@ten20.com'
        }}, function (error, response, body) {
            assert.equal(response.statusCode, 403);
            done();
        });
    });

    it('should not be possible to change the email to an address that does not include an @ symbol', function (done) {
        credential1request.patch({url: url + '/user', json: {
            email: 'test2ten20.com'
        }}, function (error, response, body) {
            assert.equal(response.statusCode, 400);
            done();
        });
    });

    it('should not be possible to change the email to an address that is less than 3 chars long', function (done) {
        credential1request.patch({url: url + '/user', json: {
            email: '@b'
        }}, function (error, response, body) {
            assert.equal(response.statusCode, 400);
            done();
        });
    });

    it('user object should be unchanged after update', function (done) {
        credential1request.get({ url: url + '/user', json: true}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            assert.equal(body.email, 'test3@ten20.com');
            assert.equal(body.username, 'tester3');
            assert(!body.password);
            done();
        });
    });

    it('should not be possible to change the username to one that is already in use', function (done) {
        credential1request.patch({url: url + '/user', json: {
            username: 'tester2'
        }}, function (error, response, body) {
            assert.equal(response.statusCode, 403);
            done();
        });
    });

    it('user object should be unchanged after update', function (done) {
        credential1request.get({ url: url + '/user', json: true}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            assert.equal(body.email, 'test3@ten20.com');
            assert.equal(body.username, 'tester3');
            assert(!body.password);
            done();
        });
    });

    it('should not be possible to set the username to 0 length', function (done) {
        credential1request.patch({url: url + '/user', json: {
            username: ''
        }}, function (error, response, body) {
            assert.equal(response.statusCode, 400);
            done();
        });
    });

    it('should not be possible to set a username that includes an @', function (done) {
        credential1request.patch({url: url + '/user', json: {
            username: 'a@b.com'
        }}, function (error, response, body) {
            assert.equal(response.statusCode, 400);
            done();
        });
    });

    it('user object should be unchanged after update', function (done) {
        credential1request.get({ url: url + '/user', json: true}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            assert.equal(body.email, 'test3@ten20.com');
            assert.equal(body.username, 'tester3');
            assert(!body.password);
            done();
        });
    });

    it('should be possible to authenticate with existing password', function (done) {
        request.post({url: url + '/authenticate', json:  { email: 'tester3', password: 'password'}}, function (err, response, body) {
            assert.ifError(err);
            assert.equal(response.statusCode, 200);
            done();
        });
    });

    it('should be possible to change password', function (done) {
        credential1request.patch({url: url + '/user', json: {
            password: 'password3'
        }}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            done();
        });
    });

    it('should no longer be possible to authenticate with old password', function (done) {
        request.post({url: url + '/authenticate', json:  { email: 'tester3', password: 'password'}}, function (err, response, body) {
            assert.ifError(err);
            assert.equal(response.statusCode, 401);
            done();
        });
    });

    it('should be possible to authenticate with the new password', function (done) {
        request.post({url: url + '/authenticate', json:  { email: 'tester3', password: 'password3'}}, function (err, response, body) {
            assert.ifError(err);
            assert.equal(response.statusCode, 200);
            done();
        });
    });

    it('should not be possible to set a password less than 8 characters', function (done) {
        credential1request.patch({url: url + '/user', json: {
            password: '123567'
        }}, function (error, response, body) {
            assert.equal(response.statusCode, 400);
            done();
        });
    });

    it('should still be possible to authenticate with existing password', function (done) {
        request.post({url: url + '/authenticate', json:  { email: 'tester3', password: 'password3'}}, function (err, response, body) {
            assert.ifError(err);
            assert.equal(response.statusCode, 200);
            done();
        });
    });
});
