var routes = require('./routes');
var trackers = require('./routes/trackers');
var socket = require('./routes/socket');
var addRoutes = require('./router');

module.exports = function(app, io) {
    app.post('/api/tracker/message', routes.index);
    addRoutes(trackers, app);

    io.set('log level', 1);
    io.set('transports', [
        'websocket'
        , 'flashsocket'
        , 'htmlfile'
        , 'xhr-polling'
        , 'jsonp-polling'
        ]);

    io.sockets.on('connection', socket);
};
