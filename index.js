var server = require('./server')
var configRoute = require('./route-config');

server.startServer(3001, 'mongodb://localhost/ten20api', configRoute, function() {

});