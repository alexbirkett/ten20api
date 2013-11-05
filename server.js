/**
 * Module dependencies.
 */

var express = require('express')
    , http = require('http')
    , path = require('path')
    , Ten20Api = require('./index')
    , MongoClient = require('mongodb').MongoClient
    , async = require('async')
    , MemStore = express.session.MemoryStore

var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

module.exports.startServer = function (port, dbName, callback) {
    async.waterfall([
        function (callback) {
            MongoClient.connect('mongodb://localhost/' + dbName, callback);
        },
        function (db, callback) {


            app.set('port', port);
            app.use(express.favicon());
            app.use(express.logger('dev'));
            app.use(express.bodyParser());
            app.use(express.methodOverride());

            app.use(express.cookieParser('some secret'));
            app.use(express.session({secret: 'secret_key',  key: 'apis', store: MemStore({
                reapInterval: 60000 * 10
            })}));

            if ('development' == app.get('env')) {
                app.use(express.errorHandler());
            }
            var ten20api = new Ten20Api(app, db, io);
            ten20api.configureMiddleware();
            ten20api.configureRoutes();
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

