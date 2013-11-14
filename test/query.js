var async = require('async');
var configureDryRoutes = require('express-dry-router');
var user = require('../routes/user');
var collectionApi = require('../lib/collection-api');
var databaseUtils = require('../lib/database-utils');
var should = require('should');
var requestApi = require('request');
var request = requestApi.defaults({followRedirect: false, jar: requestApi.jar()});
var server = require('../server');
var assert = require('assert');
var async = require('async');
var dropDatabase = require('../lib/drop-database');

var port = 3007;

var url = 'http://localhost:' + port;
var auth = require('./helper/auth')(url, request);


var getCollectionRoute = function (collection, indexes, callback) {
    var route = {};
    route[collection] = collectionApi(collection);
    databaseUtils.addIndexs(collection, indexes, function (err) {
        callback(null, route);
    });
};

var collection = 'items';

var configRoutes = function (app, callback) {
    getCollectionRoute(collection, ['user', 'firstName', 'lastName', 'age', 'british'], function (err, route) {
        configureDryRoutes(route, app, undefined, ['use']);
        configureDryRoutes(user, app, undefined, ['use']);
        configureDryRoutes(route, app);
        configureDryRoutes(user, app);
        callback(err);
    });
};

var objectArray = [
    {
        firstName: "Alex",
        lastName: "Birkett",
        age: 35,
        british: true
    },
    {
        firstName: "Xiaolei",
        lastName: "Liu",
        age: 21,
        british: false
    },
    {
        firstName: "John",
        lastName: "Smith",
        age:45,
        british: true
    },
    {
        firstName: 'Zhong',
        lastName: 'Li',
        age: 35,
        british: false
    }
];



var dbUrl = 'mongodb://localhost/testQuery';

var credential1 = {
    email: 'test@ten20.com',
    password: 'passwordone'
};

var collectionUrl = url + '/' + collection;

describe('test query', function () {


    before(function (done) {
        async.series([function (callback) {
            dropDatabase(dbUrl, callback);
        }, function (callback) {
            server.startServer(port, dbUrl, configRoutes, callback);
        },function (callback) {
            auth.signUp(credential1, callback);
        },function (callback) {
            auth.signIn(credential1, callback);
        }], done);
    });

    after(function (done) {
        async.series([function (callback) {
            auth.signOut(callback);
        }, function (callback) {
            server.close(callback);
        }], done);

    });

    it('should store object in response to POST', function (done) {
        request.put({url: collectionUrl, json: objectArray }, function (error, response, body) {
            assert.equal(200, response.statusCode);
            done();
        });
    });

    var objectAsReturnedFromServer;

    it('should respond to GET with entire collection', function (done) {
        request.get(collectionUrl, function (error, response, body) {
            assert.equal(200, response.statusCode);
            var jsonObject = objectAsReturnedFromServer = JSON.parse(body);
            assert.equal(4, jsonObject.items.length);
            assert.equal('Alex', jsonObject.items[0].firstName);
            assert.equal('Xiaolei', jsonObject.items[1].firstName);
            assert.equal('John', jsonObject.items[2].firstName);
            assert.equal('Zhong', jsonObject.items[3].firstName);
            done();
        });
    });


    it('should respond to query for firstname=Alex with Alex\'s record', function (done) {
        request.get(collectionUrl + '?firstName=Alex', function (error, response, body) {
            assert.equal(200, response.statusCode);
            var jsonObject = JSON.parse(body);
            assert.equal(1, jsonObject.items.length);
            done();
        });
    });


    it('should respond to query for age=35 with Alex\'s and Zhong\'s record', function (done) {
        request.get(collectionUrl + '?age=35', function (error, response, body) {
            assert.equal(200, response.statusCode);
            var jsonObject = JSON.parse(body);
            assert.equal(2, jsonObject.items.length);
            assert.equal('Alex', jsonObject.items[0].firstName);
            assert.equal('Zhong', jsonObject.items[1].firstName);
            done();
        });
    });

    it('should respond to query for british=true with Alex\'s and John\'s records', function (done) {
        request.get(collectionUrl + '?british=true', function (error, response, body) {
            assert.equal(200, response.statusCode);
            var jsonObject = JSON.parse(body);
            assert.equal(2, jsonObject.items.length);
            assert.equal('Alex', jsonObject.items[0].firstName);
            assert.equal('John', jsonObject.items[1].firstName);
            done();
        });
    });

    it('should respond to query for british=false with Xiaolei\'s and Zhong\'s records', function (done) {
        request.get(collectionUrl + '?british=false', function (error, response, body) {
            assert.equal(200, response.statusCode);
            var jsonObject = JSON.parse(body);
            assert.equal(2, jsonObject.items.length);
            assert.equal('Xiaolei', jsonObject.items[0].firstName);
            assert.equal('Zhong', jsonObject.items[1].firstName);
            done();
        });
    });

    it('should respond to query for british=true and age=35 with Alex\'s record', function (done) {
        request.get(collectionUrl + '?british=true&age=35', function (error, response, body) {
            assert.equal(200, response.statusCode);
            var jsonObject = JSON.parse(body);
            assert.equal(1, jsonObject.items.length);
            assert.equal('Alex', jsonObject.items[0].firstName);
            done();
        });
    });

    it('should respond to query for ?age=gt$34 with Alex, John, and Zhong\'s record', function (done) {
        request.get(collectionUrl + '?age=gt$34', function (error, response, body) {
            assert.equal(200, response.statusCode);
            var jsonObject = JSON.parse(body);
            assert.equal(3, jsonObject.items.length);
            assert.equal('Alex', jsonObject.items[0].firstName);
            assert.equal('Zhong', jsonObject.items[1].firstName);
            assert.equal('John', jsonObject.items[2].firstName);

            done();
        });
    });


    it('should respond to query for ?age=gte$35 with Alex, John, and Zhong\'s record', function (done) {
        request.get(collectionUrl + '?age=gte$35', function (error, response, body) {
            assert.equal(200, response.statusCode);
            var jsonObject = JSON.parse(body);
            assert.equal(3, jsonObject.items.length);
            assert.equal('Alex', jsonObject.items[0].firstName);
            assert.equal('Zhong', jsonObject.items[1].firstName);
            assert.equal('John', jsonObject.items[2].firstName);

            done();
        });
    });

    it('should respond to query for ?age=lt$35 with Xiaolei\'s record', function (done) {
        request.get(collectionUrl + '?age=lt$35', function (error, response, body) {
            assert.equal(200, response.statusCode);
            var jsonObject = JSON.parse(body);
            assert.equal(1, jsonObject.items.length);
            assert.equal('Xiaolei', jsonObject.items[0].firstName);
            done();
        });
    });


    it('should respond to query for ?age=lte$35 with Alex, Zhong and Xiaolei\'s record', function (done) {
        request.get(collectionUrl + '?age=lte$35', function (error, response, body) {
            assert.equal(200, response.statusCode);
            var jsonObject = JSON.parse(body);
            assert.equal(3, jsonObject.items.length);
            assert.equal('Xiaolei', jsonObject.items[0].firstName);
            assert.equal('Alex', jsonObject.items[1].firstName);
            assert.equal('Zhong', jsonObject.items[2].firstName);
            done();
        });
    });

    it('should respond to query for object id greater than first object id with second, third and fourth objects', function (done) {
        request.get(collectionUrl + '?_id=gt$' + objectAsReturnedFromServer.items[0]._id, function (error, response, body) {
            assert.equal(200, response.statusCode);
            var jsonObject = JSON.parse(body);
            assert.equal(3, jsonObject.items.length);
            assert.equal('Xiaolei', jsonObject.items[0].firstName);
            assert.equal('John', jsonObject.items[1].firstName);
            assert.equal('Zhong', jsonObject.items[2].firstName);

            done();
        });
    });

    it('should respond to query for specific id', function (done) {
        request.get(collectionUrl + '?_id=' + objectAsReturnedFromServer.items[0]._id, function (error, response, body) {
            assert.equal(200, response.statusCode);
            var jsonObject = JSON.parse(body);
            assert.equal(1, jsonObject.items.length);
            assert.equal('Alex', jsonObject.items[0].firstName);
            done();
        });
    });
});
