

var assert = require('assert');
var async = require('async');
var MongoClient = require('mongodb').MongoClient
var requestApi = require('request');
var request = requestApi.defaults({followRedirect: false, jar: requestApi.jar()});
var dropDatabase = require('../../lib/drop-database');
var configRoute = require('../../lib/route-config');
var server = require('../../server');


var db;

var dbUrl = 'mongodb://localhost/testCollectionAdmin';

var getUnusedPort = require('../port-helper');
var port = getUnusedPort();

var url = 'http://localhost:' + port;

describe('test collection admin', function () {


    before(function (done) {
        async.waterfall([function (callback) {
            dropDatabase(dbUrl, callback);
        }, function (callback) {
            server.startServer(port, dbUrl, configRoute, callback);
        }, function(callback) {
            MongoClient.connect(dbUrl, callback);
        }, function(adb, callback) {
            db = adb;
            db.createCollection('testcollection', callback);
        }
        ], done);
    });

    after(function (done) {
        if (db) {
            db.close();
        }
        done();
    });

    it('should be possible to delete a collection', function (done) {
        request.del({url: url + '/collection-admin/testcollection', json:true}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            db.collections(function(err, collections) {
                 collections.forEach(function (collection) { assert.notEqual(collection.collectionName, 'testcollection')});
                done();
            });
        });
    });

    it('should be possible to delete a collection', function (done) {
        request.del({url: url + '/collection-admin/testcollection', json:true}, function (error, response, body) {
            assert.equal(response.statusCode, 404);
            done();
        });
    });

});