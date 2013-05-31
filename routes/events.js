"use strict";

var ObjectId = require('mongodb').ObjectID;

exports.bindRoutes = function (app, db) {

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
				event.attendees = event.attendees || {};
				res.render('show_event', {
					'event': JSON.stringify(event)
				});
			}
		});
	});

};

exports.bindWebSocket = function (sockets, socket, db) {

	socket.on('join', function (data) {
		var userData = {
			'id': data.user,
			'ts': new Date()
		};

		var set = {};
		set['attendees.' + data.user] = userData;

		db.collection('events').update(
			{'_id': new ObjectId(data.event)},
			{'$set': set},
			{'w': 1},
			function (err, result) {
				if (err) {
					socket.emit('error', err);
				} else {
					sockets.emit('update', {
						'event': data.event,
						'user': userData
					});
				}
			}
		);

		socket.broadcast.emit('load:coords', data);
	});

	socket.on('position', function (data) {
		var userData = {
			'id': data.user,
			'ts': new Date(),
			'pos': {
				'lat': data.lat,
				'lng': data.lng
			}
		};

		var set = {};
		set['attendees.' + data.user] = userData;

		db.collection('events').update(
			{'_id': new ObjectId(data.event)},
			{'$set': set},
			{'w': 1},
			function (err, result) {
				if (err) {
					socket.emit('error', err);
				} else {
					sockets.emit('update', {
						'event': data.event,
						'user': userData
					});
				}
			}
		);
	});

	socket.on('say', function (data) {
		sockets.emit('say', data);
	});

};