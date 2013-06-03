/*global window, location, navigator, L, FB, io, $, $event */

(function () {

	"use strict";

	var map,
		marker,
		popup,

		markers = [],
		popups = [],

		fbUserId,
		fbName,

		socket,
		watchId;

	function watchPosition() {
		if (navigator.geolocation) {
			watchId = navigator.geolocation.watchPosition(function (response) {
				if (response.coords && fbUserId) {
					socket.emit('position', {
						event: $event._id,
						user: fbUserId,
						lat: response.coords.latitude,
						lng: response.coords.longitude
					});
				}
			});
		}
	}

	function joinEvent() {
		if (!fbUserId) {
			FB.login(function (response) {
				if (response.authResponse) {
					joinEvent();
				}
			});
		} else {
			if (!$event.attendees[fbUserId]) {
				socket.emit('join', {
					'event': $event._id,
					'user': fbUserId
				});
			}
			if (!watchId) {
				watchPosition();
			}
		}
	}

	function updatePopup() {
		var html = [];

		// Wrapper
		html.push('<div class="event">');

		// Event description
		html.push('<h1>');
		html.push($event.text);
		html.push('</h1>');

		// The link
		html.push('<h2>Skicka vidare</h2>');
		html.push('<a class="eventLink" href="' + $event._id + '">' + location.href + '</a>');

		if (Object.keys($event.attendees).length > 0) {
			html.push('<h2>Vi kommer</h2>');
			html.push('<ul class="attendees">');
			$.each($event.attendees, function (user, data) {
				html.push('<li>');
				html.push('<img src="http://graph.facebook.com/' + user + '/picture"/>');
				html.push('</li>');
			});
		}

		html.push('</ul>');
		html.push('</div>');

		html.push('<div class="footer">');

		if (fbUserId) {
			html.push('<img src="http://graph.facebook.com/' + fbUserId + '/picture">');
			html.push('<span id="fbName">' + (fbName || '') + '</span>');
			if ($event.attendees[fbUserId]) {
				html.push('<form id="sayForm">');
				html.push('<input type="text" placeholder="Säg något"/>');
				html.push('<input type="submit" value="Säg"/>');
				html.push('</form>');
			} else {
				html.push('<button class="logged-in" id="joinButton">Jag kommer</button>');
			}
		} else {
			html.push('<button id="joinButton">Jag kommer</button>');
			html.push('<p>Inloggning via Facebook</p>');
			html.push('</div>');
		}

		popup.setContent(html.join(''));
		popup.openOn(map);
	}

	function updateAttendees() {
		$.each($event.attendees, function (user, data) {
			if (data.pos) {
				var pos = [data.pos.lat, data.pos.lng];
				if (markers[user]) {
					markers[user].setLatLng(pos);
				} else {
					markers[user] = L.marker(pos, {
						icon: L.icon({
							iconUrl: 'http://floating-brook-3028.herokuapp.com/' + user,
							iconSize: [62, 71],
							iconAnchor: [31, 65]
						})
					}).addTo(map);
				}
				if (popups[user]) {
					popups[user].setLatLng(pos);
				}
			}
		});
	}

	function initMap() {
		map = L.map('map', {
			closePopupOnClick: false,
			zoomControl: false
		}).setView([$event.lat, $event.lng], $event.zoom);

		map.addControl(new L.Control.Zoom({
			position: "bottomleft"
		}));


		L.tileLayer('http://{s}.eniro.no/geowebcache/service/tms1.0.0/map2x/{z}/{x}/{y}.png', {
			subdomains: ['map01', 'map02', 'map03', 'map04'],
			attribution: 'Maps by <a href="http://www.eniro.se">Eniro</a>',
			tms: true,
			maxZoom: 17
		}).addTo(map);

		marker = L.marker([$event.lat, $event.lng], {
			icon: L.icon({
				iconUrl: '/images/marker.png',
				iconSize: [62, 71],
				iconAnchor: [31, 65]
			})
		}).addTo(map);

		popup = L.popup({
			offset: L.point(0, -63)
		}).setLatLng(marker.getLatLng());

		map.on('popupopen', function (evt) {
			if (evt.popup === popup) {
				$('#joinButton').click(joinEvent);
				$('#sayForm').submit(function (evt) {
					evt.preventDefault();
					socket.emit('say', {
						'event': $event._id,
						'user': fbUserId,
						'words': $('#sayForm input[type=text]').val()
					});
				});
			}
		});

		marker.on('click', function (evt) {
			popup.openOn(map);
		});

		map.on('click', function (evt) {
			if (fbUserId) {
				console.log(evt);
				socket.emit('position', {
					event: $event._id,
					user: fbUserId,
					lat: evt.latlng.lat,
					lng: evt.latlng.lng
				});
			}
		});

		updatePopup();
	}

	function initFacebook() {
		FB.init({
			appId: '669263889756589',
			status: true,
			xfbml: true
		});
		FB.Event.subscribe('auth.statusChange', function (response) {
			if (response.authResponse) {
				fbUserId = response.authResponse.userID;

				FB.api("/me", function (response) {
					fbName = response.name;
					$('#fbName').html(fbName);
					updatePopup();
				});

				if ($event.attendees[fbUserId]) {
					joinEvent();
				}
			}
		});
	}

	function say(user, words) {
		if (!markers[user]) {
			return;
		}
		var popup = popups[user];
		if (!popup) {
			popup = popups[user] = L.popup({
				offset: L.point(0, -63)
			});
		}
		popup.setLatLng(markers[user].getLatLng());
		map.addLayer(popup);

		popup._container.className = popup._container.className + " say";
		popup.setContent('<p class="say">' + words + '</p>');

	}

	function initSocket() {
		socket = io.connect("/");

		socket.on('update', function (data) {
			if (data.event === $event._id) {
				var newAttendee = !$event.attendees[data.user.id];
				$event.attendees[data.user.id] = data.user;
				updateAttendees();
				if (newAttendee) {
					updatePopup();
				}
			}
		});

		socket.on('say', function (data) {
			if (data.event === $event._id) {
				say(data.user, data.words);
			}
		});
	}

	window.onload = function () {
		initSocket();
		initMap();
		initFacebook();
		updateAttendees();
	};

}());