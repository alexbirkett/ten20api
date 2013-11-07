/**
 * Module dependencies.
 */

var express = require('express')
var http = require('http')
var path = require('path')
var MongoClient = require('mongodb').MongoClient
var async = require('async')
var MemStore = express.session.MemoryStore
var routes = require('./routes');
var user = require('./routes/user');
var socket = require('./routes/socket');
var configurePassport = require('./configurePassport');
var configureDryRoutes = require('express-dry-router');
var dbSingleton = require('./db');
var collectionApi = require('./lib/collection-api');

var trackerRoute = collectionApi('tracker');
var tripsRoute =  collectionApi('trip');

var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

module.exports.startServer = function (port, dbUrl, callback) {
    async.waterfall([
        function (callback) {
            MongoClient.connect(dbUrl, callback);
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
            configurePassport(app, db);
            configureDryRoutes(user, app, undefined, ['use']);
            dbSingleton.setDb(db);
            io.set('log level', 1);
            io.set('transports', [
                'websocket'
                , 'flashsocket'
                , 'htmlfile'
                , 'xhr-polling'
                , 'jsonp-polling'
            ]);

            io.sockets.on('connection', socket);
            configureDryRoutes(trackerRoute, app, '/trackers', ['use']);
            configureDryRoutes(tripsRoute, app, '/trips', ['use']);

            app.post('/api/tracker/message', routes.index);
            configureDryRoutes(trackerRoute, app, '/trackers');
            configureDryRoutes(tripsRoute, app, '/trips');
            configureDryRoutes(user, app);
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

