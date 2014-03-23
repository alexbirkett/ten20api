var async = require('async');
var user = require('../../routes/user');
var requestApi = require('request');
var request = requestApi.defaults({followRedirect: false });
var server = require('../../server');
var assert = require('assert');
var dropDatabase = require('../../lib/drop-database');
var configRoute = require('../../lib/route-config');


var port = 3012;

var url = 'http://localhost:' + port;
var auth = require('./../helper/auth')(url, request);

var dbUrl = 'mongodb://localhost/testPasswordReset';

var credential = {
    email: 'test@ten20.com',
    password: 'password',
    username: 'tester'
};


describe('test password reset endpoint', function () {

    before(function (done) {
        async.series([function (callback) {
            dropDatabase(dbUrl, callback);
        }, function (callback) {
            server.startServer(port, dbUrl, configRoute, callback);
        }], done);

    });

    var credential = {
        email: 'test@ten20.com',
        password: 'password'
    };

    var invalidCredential = {
        email: 'test@ten20.com',
        password: 'wrongpassword'
    };

    it('should be possible to sign up', function (done) {
        request.post({url: url + '/signup', json: credential}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
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
    it('should  be possible to authenticate with valid username and password', function (done) {

        request.post({url: url + '/authenticate', json: credential}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            token = body.token;

            console.log(token);
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

        var options = { url: url + '/user/info',
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
