var routes = require('./routes');
var user = require('./routes/user');
var socket = require('./routes/socket');
var configurePassport = require('./configurePassport');
var configureDryRoutes = require('express-dry-router');
var db = require('./db');
var collectionApi = require('./lib/collection-api');


var trackerRoute = collectionApi('tracker');

var Ten20Api = function(app, db, io) {
   this.app = app;
   this.db = db;
   this.io = io;
};

Ten20Api.prototype.configureMiddleware = function() {
    configurePassport(this.app, this.db);
    configureDryRoutes(user, this.app, undefined, ['use']);
    db.setDb(this.db);
    this.io.set('log level', 1);
    this.io.set('transports', [
        'websocket'
        , 'flashsocket'
        , 'htmlfile'
        , 'xhr-polling'
        , 'jsonp-polling'
    ]);

    this.io.sockets.on('connection', socket);
    configureDryRoutes(trackerRoute, this.app, '/trackers', ['use']);
};

Ten20Api.prototype.configureRoutes = function () {
    this.app.post('/api/tracker/message', routes.index);
    configureDryRoutes(trackerRoute, this.app, '/trackers');
    configureDryRoutes(user, this.app);
};

module.exports = Ten20Api;