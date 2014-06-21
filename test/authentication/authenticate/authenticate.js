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
console.log(port);

var url = 'http://localhost:' + port;
var auth = require('./../../helper/auth')(url, request);

var dbUrl = 'mongodb://localhost/jwt';

describe('test authentication', function () {

    before(function (done) {
        async.series([function (callback) {
            dropDatabase(dbUrl, callback);
        }, function (callback) {
            server.startServer(port, dbUrl, configRoute, callback);
        }], done);

    });

    var credential = {
        email: 'test@ten20.com',
        password: 'password',
        username: 'tester'
    };

    var invalidCredential = {
        email: 'test@ten20.com',
        password: 'wrongpassword'
    };

    var noPasswordCredential = {
        email: 'test@ten20.com'
    };

    it('should be possible to sign up', function (done) {
        request.post({url: url + '/signup', json: credential}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            done();
        });
    });

    it('should not be possible to authenticate with invalid password', function (done) {
        request.post({url: url + '/authenticate', json: invalidCredential}, function (error, response, body) {
            assert.equal(response.statusCode, 401);
            done();
        });
    });

    it('should not be possible to authenticate with no password', function (done) {
        request.post({url: url + '/authenticate', json: noPasswordCredential}, function (error, response, body) {
            assert.equal(response.statusCode, 401);
            done();
        });
    });

    it('should not be possible to authenticate with invalid username and password', function (done) {

        request.post({url: url + '/authenticate', json: invalidCredential}, function (error, response, body) {
            assert.equal(response.statusCode, 401);
            done();
        });
    });

    var token;
    it('should  be possible to authenticate with valid email and password', function (done) {
        request.post({url: url + '/authenticate', json: {
            email: 'test@ten20.com',
            password: 'password'
        }}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            token = body.token;
            done();
        });
    });

    var token;
    it('should  be possible to authenticate with valid username and password', function (done) {
        request.post({url: url + '/authenticate', json: {
            email: 'tester',
            password: 'password'
        }}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            token = body.token;
            done();
        });
    });

    it('should not be possible to get user info without a token', function (done) {

        request.get({url: url + '/user/info', json: true}, function (error, response, body) {
            assert.equal(response.statusCode, 401);
            done();
        });
    });

    it('should  be possible to get user info with a token', function (done) {

        var options = { url: url + '/user',
            json: true,
            headers: {
                'Authorization': 'Bearer ' + token
            }
        };

        request.get(options, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            done();
        });
    });
});
