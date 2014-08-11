/**
 * Module dependencies.
 */

var express = require('express')
var http = require('http')
var path = require('path')
var MongoClient = require('mongodb').MongoClient
var async = require('async')
var dbSingleton = require('./lib/db');
var secretSingleton = require('./lib/secret');
var bodyParser = require('body-parser');
var morgan  = require('morgan');

var server;
module.exports.startServer = function (port, dbUrl, secret, configRoute, callback) {
    var app = express();
    server = require('http').createServer(app);
    secretSingleton.setSecret(secret);
    async.waterfall([
        function (callback) {
            MongoClient.connect(dbUrl, callback);
        },
        function (db, callback) {

            dbSingleton.setDb(db);
            app.set('port', port);
            app.use(bodyParser());
            if ('development' == app.get('env')) {
                app.use(morgan());
            }

            configRoute(app, callback);
        },
        function(callback) {
            console.log('starting server on port ' + app.get('port'));
            server.listen(app.get('port'), callback);
        }
    ], function (err, result) {
        callback(err);
    });
};

module.exports.close = function (callback) {
    server.close(callback);
};

