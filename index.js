var routes = require('./routes');
var trackers = require('./routes/trackers');
var user = require('./routes/user');
var socket = require('./routes/socket');
var configurePassport = require('./configurePassport');
var configureDryRoutes = require('express-dry-router');
var db = require('./db');

var Ten20Api = function(app, db, io) {
   this.app = app;
   this.db = db;
   this.io = io;
};

Ten20Api.prototype.configureMiddleware = function() {
    configurePassport(this.app, this.db);
    this.app.use('/user', user.ensureAuthenticated);
    user.setDb(this.db);
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
    configureDryRoutes(trackers, this.app, undefined, ['use']);
};

Ten20Api.prototype.configureRoutes = function () {
    this.app.post('/api/tracker/message', routes.index);
    configureDryRoutes(trackers, this.app);
    configureDryRoutes(user.console, this.app);
};


module.exports = Ten20Api;