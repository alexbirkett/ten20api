var routes = require('./routes');
var tracker = require('./routes/tracker');
var socket = require('./routes/socket');
var addRoutes = require('./router');

module.exports = function(app, io) {
    app.post('/api/tracker/message', routes.index);
    addRoutes(tracker, app);

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
