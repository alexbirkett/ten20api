/**
 * Module dependencies.
 */

var express = require('express')
var http = require('http')
var path = require('path')
var MongoClient = require('mongodb').MongoClient
var async = require('async')
var MemStore = express.session.MemoryStore
var configurePassport = require('./configurePassport');
var dbSingleton = require('./db');
var app = express();
var server = require('http').createServer(app);

module.exports.startServer = function (port, dbUrl, configRoute, callback) {
    async.waterfall([
        function (callback) {
            MongoClient.connect(dbUrl, callback);
        },
        function (db, callback) {

            dbSingleton.setDb(db);
            app.set('port', port);
            app.use(express.favicon());
            app.use(express.logger('dev'));
            app.use(express.urlencoded());
            app.use(express.json());
            app.use(express.methodOverride());

            app.use(express.cookieParser('some secret'));
            app.use(express.session({secret: 'secret_key',  key: 'apis', store: MemStore({
                reapInterval: 60000 * 10
            })}));

            if ('development' == app.get('env')) {
                app.use(express.errorHandler());
            }

            configurePassport(app, db);
            configRoute(app, callback);
        },
        function(callback) {


            app.use(app.router);

            server.listen(app.get('port'), callback);
        }
    ], function (err, result) {
        callback(err);
    });
};

module.exports.close = function (callback) {
    server.close(callback);
};

