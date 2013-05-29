
/**
 * Module dependencies.
 */

var express = require('express')
  , mongodb = require('mongodb')
  , http = require('http')
  , path = require('path');

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
		require('./routes/events')(app, db);
		http.createServer(app).listen(app.get('port'), function () {
		  console.log('Server listening on port ' + app.get('port'));
		});
	} else {
		console.error(err);
	}
});


