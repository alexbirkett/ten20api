var server = require('./server')
var configRoute = require('./lib/route-config');
require('./lib/memory-leak');

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
    if (err) {
        console.log('server did not start ' + err);
    } else {
        console.log('server started on port ' + argv.port + ' dbname ' + argv.dbname);
    }

});