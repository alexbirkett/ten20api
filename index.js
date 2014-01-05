var server = require('./server')
var configRoute = require('./lib/route-config');

var optimist = require('optimist');
var argv = optimist.usage('Usage: $0  --dbname [string] --port [num]').
    options('d', {
        alias: 'dbname',
        describe: 'database name'
    }).
    options('p', {
        alias: 'port',
        describe: 'port'
    }).
    default('p', 3001).
    default('d', 'ten20api')
    .argv;

server.startServer(argv.port, 'mongodb://localhost/' + argv.dbname, configRoute, function(err) {
    console.log('servar started on port ' + argv.port + ' dbname ' + argv.dbname);
});