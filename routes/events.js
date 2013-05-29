"use strict";

var ObjectId = require('mongodb').ObjectID;

module.exports = function (app, db) {

	app.post('/events', function (req, res) {
		db.collection('events').insert({
			'text': req.body.text,
			'lat': req.body.lat,
			'lng': req.body.lng,
			'zoom': req.body.zoom
		}, {'w': 1}, function (err, records) {
			if (err) {
				res.send(500, err);
			} else {
				res.send(records[0]);
			}
		});
	});

	app.get('/:event', function (req, res) {
		db.collection('events').findOne({'_id': new ObjectId(req.params.event)}, function (err, event) {
			if (err) {
				res.send(500, err);
			} else if (!event) {
				res.send(404);
			} else {
				res.render('show_event', event);
			}
		});
	});

};