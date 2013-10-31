var should = require('should');
var requestApi = require('request');
var request = requestApi.defaults({followRedirect: false, jar: requestApi.jar()});
var server = require('../server');
var assert = require('assert');
var async = require('async');
var dropDatabase = require('../dropDatabase');

var trackers = [
    {
        "name": "Xiaolei",
        "iconEmail": "alex@birkett.no",
        "iconColor": "FF00FF",
        "serialNumber": "14234234234", // device serial number
        "lastUpdateTimestamp": (new Date()).valueOf(),
        "fence": "on 5km", // on *km, off
        "latitude": 52.80113,
        "longitude": -1.63130,
        "speed": "20", // km/h
        "course": "359", // degrees
        "gpsAvailable": true
    },
    {
        "name": "Alex",
        "iconEmail": "alex@birkett.no",
        "iconColor": "FF00FF",
        "serialNumber": "24234234235", // device serial number
        "lastUpdateTimestamp": (new Date()).valueOf(),
        "fence": "off", // on *km, off
        "latitude": 52.80323,
        "longitude": -1.61930,
        "speed": "10", // km/h
        "course": "13", // degrees
        "gpsAvailable": true
    },
    {
        "iconEmail": "alex@birkett.no",
        "iconColor": "FF00FF",
        "serialNumber": "24234234235", // device serial number
        "lastUpdateTimestamp": (new Date()).valueOf(),
        "fence": "off", // on *km, off
        "latitude": 52.80323,
        "longitude": -1.61930,
        "speed": "10", // km/h
        "course": "13", // degrees
        "gpsAvailable": true
    }
];

var port = 3001;

var dbName = 'testTrackers';// + new Date().toUTCString().replace(/\s+/g,'');
var dbUrl = 'mongodb://localhost/' + dbName;

describe('trackers api', function () {
    var url = 'http://localhost:' + port;

    before(function (done) {
        async.series([function (callback) {
            dropDatabase(dbUrl, callback);
        }, function (callback) {
            server.startServer(port, dbName, callback);
        }], done);
    });

    after(function (done) {
        server.close(done);
    });

    describe('routes: --> /trackers/', function () {

        var credential1 = {
            email: 'test@ten20.com',
            password: 'passwordone'
        };

        var credential2 = {
            email: 'test2@ten20.com',
            password: 'passwordtwo'
        };

        it('GET should respond with 403 before login', function (done) {
            request.get(url + '/trackers', function (error, response, body) {
                assert.equal(403, response.statusCode);
                done();
            });
        });

        it('PUT should respond with 403 before login', function (done) {
            request.put(url + '/trackers', function (error, response, body) {
                assert.equal(403, response.statusCode);
                done();
            });
        });

        it('POST should respond with 403 before login', function (done) {
            request.post(url + '/trackers', function (error, response, body) {
                assert.equal(403, response.statusCode);
                done();
            });
        });

        it('DELETE should respond with 403 before login', function (done) {
            request.del(url + '/trackers', function (error, response, body) {
                assert.equal(403, response.statusCode);
                done();
            });
        });

        it('setup: create a test account', function (done) {
            request.post({url: url + '/signup', json: credential1}, function (error, response, body) {
                assert.ifError(error);
                assert.equal(200, response.statusCode);
                done();
            });
        });

        it('should signin with valid credentials', function (done) {
            request.post({url: url + '/signin', json: credential1}, function (error, response, body) {
                assert.equal(200, response.statusCode);
                done();
            });
        });

        it('GET should yield zero trackers', function (done) {
            request.get(url + '/trackers', function (error, response, body) {
                assert.equal(200, response.statusCode);

                var jsonBody = JSON.parse(body);

                jsonBody.should.have.lengthOf(0);
                done();
            });
        });


        it('POST should add tracker', function (done) {
            request.post({url: url + '/trackers', json: trackers[0] }, function (error, response, body) {
                assert.equal(200, response.statusCode);
                done();
            });
        });

        it('GET should yield posted tracker', function (done) {
            request.get(url + '/trackers', function (error, response, body) {
                assert.equal(200, response.statusCode);

                var jsonBody = JSON.parse(body);

                jsonBody.should.have.lengthOf(1);
                var tracker = jsonBody[0];
                tracker.should.have.property('latitude', 52.80113);
                tracker.should.have.property('longitude', -1.63130);
                done();
            });
        });

        it('PUT /trackers should replace entire collection of trackers', function (done) {
            request.put({url: url + '/trackers', json: trackers }, function (error, response, body) {
                assert.equal(200, response.statusCode);
                done();
            });
        });

        it('GET should yield posted trackers', function (done) {
            request.get(url + '/trackers', function (error, response, body) {
                assert.equal(200, response.statusCode);

                var jsonBody = JSON.parse(body);
                jsonBody.should.have.lengthOf(3);
                assert.equal(undefined, jsonBody[0].name);
                assert.equal('Alex', jsonBody[1].name);
                assert.equal('Xiaolei', jsonBody[2].name);
                done();
            });
        });

        it('GET /trackers/ add document with id 526fb0b3970998723e000004 (does not exist)', function (done) {
            request.get({url: url + '/trackers/526fb0b3970998723e000004' }, function (error, response, body) {
                assert.equal(404, response.statusCode);
                done();
            });
        });

        it('PUT /trackers/526fb0b3970998723e000004 add document with id 526fb0b3970998723e000004', function (done) {
            request.put({url: url + '/trackers/526fb0b3970998723e000004', json: trackers[0] }, function (error, response, body) {
                assert.equal(200, response.statusCode);
                done();
            });
        });


        it('GET /trackers/ add document with id 526fb0b3970998723e000004', function (done) {
            request.get({url: url + '/trackers/526fb0b3970998723e000004' }, function (error, response, body) {
                assert.equal(200, response.statusCode);
                assert.equal(trackers[0].name, JSON.parse(body).name);
                done();
            });
        });

        it('PUT /trackers/526fb0b3970998723e000004 replace document with id 526fb0b3970998723e000004', function (done) {
            request.put({url: url + '/trackers/526fb0b3970998723e000004', json: trackers[1] }, function (error, response, body) {
                assert.equal(200, response.statusCode);
                done();
            });
        });

        it('GET /trackers/ add document with id 526fb0b3970998723e000004', function (done) {
            request.get({url: url + '/trackers/526fb0b3970998723e000004' }, function (error, response, body) {
                assert.equal(200, response.statusCode);
                assert.equal(trackers[1].name, JSON.parse(body).name);
                done();
            });
        });

        it('should logout', function (done) {
            request.get(url + '/signout', function (error, response, body) {
                assert.ifError(error);
                done();
            });
        });

        it('GET should respond with 403 after logout', function (done) {
            request.get(url + '/trackers', function (error, response, body) {
                assert.equal(403, response.statusCode);
                done();
            });
        });


        it('setup: create second test account', function (done) {
            request.post({url: url + '/signup', json: credential2}, function (error, response, body) {
                assert.ifError(error);
                assert.equal(200, response.statusCode);
                done();
            });
        });

        it('should signin with valid credentials', function (done) {
            request.post({url: url + '/signin', json: credential2}, function (error, response, body) {
                assert.equal(200, response.statusCode);
                done();
            });
        });

        it('GET should yield zero trackers', function (done) {
            request.get(url + '/trackers', function (error, response, body) {
                assert.equal(200, response.statusCode);
                var jsonBody = JSON.parse(body);
                jsonBody.should.have.lengthOf(0);
                done();
            });
        });

        it('GET /trackers/ with id 526fb0b3970998723e000004 owned by other account should return 403', function (done) {
            request.get({url: url + '/trackers/526fb0b3970998723e000004' }, function (error, response, body) {
                assert.equal(403, response.statusCode);
                done();
            });
        });

        it('POST should add tracker', function (done) {
            request.post({url: url + '/trackers', json: trackers[1] }, function (error, response, body) {
                assert.equal(200, response.statusCode);
                done();
            });
        });

    });
});
