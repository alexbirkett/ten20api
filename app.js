
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path')
  , configureApi = require('./index.js');

var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

app.configure(function(){
  app.set('port', process.env.PORT || 3001);
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

configureApi(app, io);

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
