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

var port = 5053;

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
    getCollectionRoute(collection, ['user'], function (err, route) {
        configureDryRoutes(route, app, undefined, ['use']);
        configureDryRoutes(user, app, undefined, ['use']);
        configureDryRoutes(route, app);
        configureDryRoutes(user, app);
        callback(err);
    });
};


var objectArray = [
];

for (var i = 0; i < 10000; i++) {
   objectArray[i] = { name: 'item' + i }
}


var dbUrl = 'mongodb://localhost/testPagination';

var credential1 = {
    email: 'test@ten20.com',
    password: 'passwordone'
};

var collectionUrl = url + '/' + collection;

describe('test pagination', function () {


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

    it('should respond to GET trackers', function (done) {
        request.get(collectionUrl, function (error, response, body) {
            assert.equal(200, response.statusCode);
            var jsonObject = JSON.parse(body);
            console.log(jsonObject);
            assert.equal(10, jsonObject.items.length);
            done();
        });
    });

});
