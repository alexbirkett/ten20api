var async = require('async');
var user = require('../../../routes/user');
var requestApi = require('request');
var request = requestApi.defaults({followRedirect: false});
var server = require('../../../server');
var assert = require('assert');
var dropDatabase = require('../../../lib/drop-database');
var configRoute = require('../../../lib/route-config');

var getUnusedPort = require('../../helper/port-helper');
var port = getUnusedPort();


var url = 'http://localhost:' + port;
var auth = require('./../../helper/auth')(url, request);

var dbUrl = 'mongodb://localhost/testPasswordReset';

var signupCredential = {
    email: 'test@ten20.com',
    password: 'oldpassword',
    username: 'tester'
};


describe('test password reset endpoint', function () {

    before(function (done) {
        async.series([function (callback) {
            dropDatabase(dbUrl, callback);
        }, function (callback) {
            server.startServer(port, dbUrl, configRoute, callback);
        }, function (callback) {
            auth.signUp(signupCredential, callback);
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

    it('should not be possible to log in with new password', function (done) {
        var loginCredential = {
            email: 'test@ten20.com',
            password: 'newpassword'
        };

        auth.signIn(loginCredential, function(error, response, body) {
            assert(response.statusCode, 401);
            done();
        });
    });


    it('should not be possible to generate a password reset token for a user that does not exist', function (done) {
        request.get({url: url + '/reset_password/generate_token/sdfsdfsd', json:true}, function (error, response, body) {
            assert.equal(response.statusCode, 404);
            done();
        });
    });


    var tokenAcquiredUsingEmailAddress;

    it('should be possible to generate a password reset token using email address', function (done) {
        request.get({url: url + '/reset_password/generate_token/test@ten20.com', json:true}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            assert(body.token);
            tokenAcquiredUsingEmailAddress = body.token;
            assert.equal(body.email, 'test@ten20.com');
            done();
        });
    });

   it('should be possible to reset password reset using token acquired using email address', function (done) {
        var requestBody = {
            token: tokenAcquiredUsingEmailAddress,
            password: 'newpassword'
        };

        request.put({url: url + '/reset_password', json:requestBody}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            done();
        });
    });

   it('should be possible to log in with new password', function (done) {
        var loginCredential = {
           email: 'test@ten20.com',
           password: 'newpassword'
        };

        auth.signIn(loginCredential, function(error, response, body) {
            assert(response.statusCode, 200);
            auth.signOut(function() {
                done();
            });
        });
   });

   it('should not be possible to reuse token acquired using email address', function (done) {
        var requestBody = {
            token: tokenAcquiredUsingEmailAddress,
            password: 'newpassword'
        };

        request.put({url: url + '/reset_password', json:requestBody}, function (error, response, body) {
            assert.equal(response.statusCode, 404);
            done();
        });
    });

    var tokenAcquiredUsingUserName;

    it('should be possible to generate a password reset token using a username', function (done) {
        request.get({url: url + '/reset_password/generate_token/tester', json:true}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            assert(body.token);
            tokenAcquiredUsingUserName = body.token;
            assert.equal(body.email, 'test@ten20.com');
            done();
        });
    });

    it('should be possible to reset password reset using token acquired using username', function (done) {
        var requestBody = {
            token: tokenAcquiredUsingUserName,
            password: 'anothernewpassword'
        };

        request.put({url: url + '/reset_password', json:requestBody}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            done();
        });
    });

    it('should be possible to log in with new password', function (done) {
        var loginCredential = {
            email: 'test@ten20.com',
            password: 'anothernewpassword'
        };

        auth.signIn(loginCredential, function(error, response, body) {
            assert(response.statusCode, 200);
            auth.signOut(function() {
                done();
            });
        });
    });

});
