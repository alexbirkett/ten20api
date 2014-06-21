var should = require('should');
var server = require('../server');
var requestApi = require('request');
var request = requestApi.defaults({followRedirect: false, jar: requestApi.jar()});
var dropDatabase = require('../lib/drop-database');
var async = require('async');
var assert = require('assert');
var configRoutes = require('../lib/route-config');

var port = 3006;

var dbName = 'userRoutes';
var dbUrl = 'mongodb://localhost/' + dbName;

describe('user routes', function () {
    var url = 'http://localhost:' + port;

    var credential = {
        email: 'test@ten20.com',
        password: 'testtest',
        username: 'testertesterson'
    };

    var invalidCredential = {
        email: 'test@ten20.com',
        password: 'testtest2'
    };


    var url = 'http://localhost:' + port;

    before(function (done) {
        async.series([function (callback) {
            dropDatabase(dbUrl, callback);
        }, function (callback) {
            server.startServer(port, dbUrl, configRoutes, callback);
        }], done);
    });

    after(function (done) {
        server.close(done);
    });

    it('should not be possible to access user endpoint', function (done) {

        request.get(url + '/user', function (error, response, body) {
            assert.ifError(error);
            assert.equal(401, response.statusCode);
            done();
        });

    });

    it('should create an account', function (done) {
        request.post({url: url + '/signup', json: credential}, function (error, response, body) {
            assert.ifError(error);
            assert.equal(200, response.statusCode);
            done();
        });
    });

    it('should still not be possible to access info endpoint after create account', function (done) {
        request.get(url + '/user', function (error, response, body) {
            assert.ifError(error);
            assert.equal(401, response.statusCode);
            done();
        });

    });

   it('should fail to create account an second time', function (done) {
        request.post({url: url + '/signup', json: credential}, function (error, response, body) {
            assert.ifError(error);
            assert.equal(403, response.statusCode);
            done();
        });
    });

    it('should not authenticate with invalid credentials', function (done) {
        request.post({url: url + '/authenticate', json: invalidCredential}, function (error, response, body) {
            assert.ifError(error);
            assert.equal(401, response.statusCode);

            response.body.should.have.property('message');
            response.body.message.should.equal('Invalid password');
            done();
        });

    });

    it('should still not be possible to access user endpoint after invalid login attempt', function (done) {
        request.get(url + '/user', function (error, response, body) {
            assert.ifError(error);
            assert.equal(401, response.statusCode);
            done();
        });

    });

    var headers;

    it('should authenticate with valid credentials', function (done) {
        request.post({url: url + '/authenticate', json: credential}, function (error, response, body) {
            assert.ifError(error);
            assert.equal(200, response.statusCode);

            response.body.should.have.property('token');
            headers = {
                'Authorization': 'Bearer ' + body.token
            };

            done();
        });

    });

    it('should access user endpoint', function (done) {
        request.get({url: url + '/user', headers: headers, json:true}, function (error, response, body) {
            assert.ifError(error);
            assert.equal(200, response.statusCode);
            assert.equal(body.email, 'test@ten20.com');
            assert.equal(body.username, 'testertesterson');
            done();
        });
    });

    it('should not be possible to access info endpoint without token', function (done) {
        request.get(url + '/user', function (error, response, body) {
            assert.ifError(error);
            assert.equal(response.statusCode, 401);
            done();
        });

    });

});
