var async = require('async');
var user = require('../../routes/user');
var requestApi = require('request');
var request = requestApi.defaults({followRedirect: false });
var server = require('../../server');
var assert = require('assert');
var dropDatabase = require('../../lib/drop-database');
var configRoute = require('../../lib/route-config');


var port = 3014;

var url = 'http://localhost:' + port;
var auth = require('./../helper/auth')(url, request);

var dbUrl = 'mongodb://localhost/signup';

describe('test signup', function () {

    before(function (done) {
        async.series([function (callback) {
            dropDatabase(dbUrl, callback);
        }, function (callback) {
            server.startServer(port, dbUrl, configRoute, callback);
        }], done);

    });

    var invalidCredential = {
        email: 'test@ten20.com',
        password: 'wrongpassword'
    };

    var validCredential = {
        email: 'test@ten20.com',
        username: 'tester',
        password: 'password'
    };

    it('should be possible to sign up with valid credential', function (done) {
        request.post({url: url + '/signup', json: validCredential}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            done();
        });
    });

    it('should be possible to authenticate with valid credential', function (done) {
        request.post({url: url + '/authenticate', json: validCredential}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            done();
        });
    });

    it('should not be possible to sign up with and email address and password that are in use', function (done) {
        request.post({url: url + '/signup', json: {
            email: 'test@ten20.com',
            username: 'tester',
            password: 'password2'
        }}, function (error, response, body) {
            assert.equal(response.statusCode, 403);
            done();
        });
    });

    it('should still be possible to authenticate with valid credential', function (done) {
        request.post({url: url + '/authenticate', json: validCredential}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            done();
        });
    });

    it('should not be possible to sign up with an email address that is already in use', function (done) {
        request.post({url: url + '/signup', json: {
            email: 'test@ten20.com',
            username: 'tester2',
            password: 'password3'
        }}, function (error, response, body) {
            assert.equal(response.statusCode, 403);
            done();
        });
    });

    it('should not be possible to sign up with a username that is already in use', function (done) {
        request.post({url: url + '/signup', json: {
            email: 'anotherrandom@email.com',
            username: 'tester',
            password: 'password4'
        }}, function (error, response, body) {
            assert.equal(response.statusCode, 403);
            done();
        });
    });

});
