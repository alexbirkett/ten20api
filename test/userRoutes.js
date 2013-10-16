var should = require('should');
var server = require('../server');
var requestApi = require('request')
var request = requestApi.defaults({followRedirect: false, jar: requestApi.jar()});

var assert = require('assert');

describe('user routes', function () {
    var url = 'http://localhost:3000';

    var credential = {
        email: 'test@ten20.com',
        password: 'test'
    };

    var invalidCredential = {
        email: 'test@ten20.com',
        password: 'test2'
    };


    before(function (done) {
        server.startServer(3000, 'testdb', done);
    });

    after(function (done) {
        server.close(done);
    });

    it('should redirect to signin form before authenticated', function (done) {

        request.get(url + '/user/info', function (error, response, body) {
            assert.ifError(error);
            response.should.have.property('statusCode', 302);
            response.headers.should.have.property('location', '/#signin');
            done();
        });

    });


    it('should create an account success', function (done) {
        request.post({url: url + '/signup', json: credential}, function (error, response, body) {
            response.should.have.property('statusCode', 200);
            response.body.should.have.property('message');
            response.body.message.should.not.equal('server interal error!');
            done();
        });
    });

    it('should still redirect to signin form before authenticated after account creation', function (done) {
        request.get(url + '/user/info', function (error, response, body) {
            assert.ifError(error);
            response.should.have.property('statusCode', 302);
            response.headers.should.have.property('location', '/#signin');
            done();
        });

    });

    it('should not signin with invalid credentials', function (done) {
        request.post({url: url + '/signin', json: invalidCredential}, function (error, response, body) {
            response.should.have.property('statusCode', 200);
            response.body.should.have.property('message');
            response.body.message.should.equal('Invalid password');
            done();
        });

    });


    it('should still redirect to signin form before authenticated after invalid login attempt', function (done) {
        request.get(url + '/user/info', function (error, response, body) {
            assert.ifError(error);
            response.should.have.property('statusCode', 302);
            response.headers.should.have.property('location', '/#signin');
            done();
        });

    });

    it('should signin with valid credentials', function (done) {
        request.post({url: url + '/signin', json: credential}, function (error, response, body) {
            response.should.have.property('statusCode', 200);
            response.body.should.have.property('message');
            response.body.message.should.equal('');
            done();
        });

    });

    it('should get user info success', function (done) {
        request.get(url + '/user/info', function (error, response, body) {
            assert.ifError(error);
            var body = JSON.parse(response.body);
            body.should.have.property('email');
            body.should.have.property('_id');
            done();
        });
    });

    it('should logout', function (done) {
        request.get(url + '/signout', function (error, response, body) {
            assert.ifError(error);
            response.should.have.property('statusCode', 302);
            response.headers.should.have.property('location', '/');
            done();
        });
    });


    it('should redirect to signin form after signout', function (done) {
        request.get(url + '/user/info', function (error, response, body) {
            assert.ifError(error);
            response.should.have.property('statusCode', 302);
            response.headers.should.have.property('location', '/#signin');
            done();
        });
    });
});
