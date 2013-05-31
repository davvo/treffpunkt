/*global window, location, navigator, L, FB, io, $, $event */

(function () {

	"use strict";

	var map,
		marker,

		markers = [],
		popups = [],

		fbLoginStatus,
		fbUserId,
		fbName,

		socket,
		watchId;

	function watchPosition() {
		if (navigator.geolocation) {
			watchId = navigator.geolocation.watchPosition(function (response) {
				socket.emit('position', {
					event: $event._id,
					user: fbUserId,
					lat: response.coords.latitude,
					lng: response.coords.longitude
				});
			});
		}
	}

	function joinEvent() {
		if (fbLoginStatus !== 'connected') {
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
			// Update popup footer
			var footer = $('.footer').empty();
			$('<img>')
				.attr('src', 'http://graph.facebook.com/' + fbUserId + '/picture')
				.appendTo(footer);
			$('<span>')
				.attr('id', 'fbName')
				.html(fbName ? fbName : '')
				.appendTo(footer);

			var textField = $('<input>')
				.attr('type', 'text')
				.attr('placeholder', 'Säg något');

			var button = $('<input>')
				.attr('type', 'submit')
				.val('Säg');

			var form = $('<form>')
				.append(textField)
				.append(button)
				.appendTo(footer)
				.submit(function (evt) {
					evt.preventDefault();
					socket.emit('say', {
						'event': $event._id,
						'user': fbUserId,
						'words': textField.val()
					});
				});

		}
	}

	function buildPopup() {
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

		html.push('<h2>Vi kommer</h2>');
		html.push('<ul class="attendees">');
		html.push('</ul>');
		html.push('</div>');

		html.push('<div class="footer">');
		html.push('<button id="joinButton">Jag kommer!</button>');
		html.push('</div>');

		var popup = L.popup({
			offset: L.point(0, -63)
		})
			.setLatLng(marker.getLatLng())
			.setContent(html.join(''));

		map.on('popupopen', function (evt) {
			if (evt.popup === popup) {
				$('#joinButton').click(joinEvent);
			}
		});

		marker.on('click', function (evt) {
			popup.openOn(map);
		});

		popup.openOn(map);
	}

	function updateAttendees() {
		var items = [];
		$.each($event.attendees, function (user, data) {
			var li = $('<li>');
			items.push(li);

			$('<img>')
				.attr('src', 'http://graph.facebook.com/' + user + '/picture')
				.appendTo(li);


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
		$('ul.attendees').empty().append(items);
	}

	function positionSuccess(position) {
		var latlng = new L.LatLng(position.coords.latitude, position.coords.longitude);
	}

	function positionError(err) {
		console.warn(err);
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

		buildPopup();
	}

	function initFacebook() {
		FB.init({
			appId: '669263889756589',
			status: true,
			xfbml: true
		});
		FB.Event.subscribe('auth.statusChange', function (response) {
			fbLoginStatus = response.status;
			if (response.authResponse) {
				fbUserId = response.authResponse.userID;

				FB.api("/me", function (response) {
					fbName = response.name;
					$('#fbName').html(fbName);
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
		popup.setContent('<p class="say">' + words + '</p>');
		map.addLayer(popup);

		popup._container.className = popup._container.className + " say";
	}

	function initSocket() {
		socket = io.connect("/");

		socket.on('update', function (data) {
			if (data.event === $event._id) {
				$event.attendees[data.user.id] = data.user;
				updateAttendees();
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