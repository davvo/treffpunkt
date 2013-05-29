module.exports = function (app, db) {

	app.post('/events', function(req, res) {
		  res.send("respond with a resource");
	});

};