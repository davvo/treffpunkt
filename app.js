
/**
 * Module dependencies.
 */

var express = require('express')
  , mongodb = require('mongodb')
  , http = require('http')
  , path = require('path')
  , io = require('socket.io');

var app = express();

// all environments
app.set('port', process.env.VCAP_APP_PORT || 8080);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

mongodb.MongoClient.connect(process.env.MONGO_URL, function(err, db) {
	if (!err) {
		console.log("Connected to mongodb");

		var events = require('./routes/events');
		events.bindRoutes(app, db);

		// express webserver
		var server = http.createServer(app);		
		server.listen(app.get('port'), function () {
		  console.log('Server listening on port ' + app.get('port'));
		});
		
		// websocket
		var ws = io.listen(server);
		ws.sockets.on('connection', function (socket) { 
			events.bindWebSocket(ws.sockets, socket, db);
		});

	} else {
		console.error(err);
	}
});


