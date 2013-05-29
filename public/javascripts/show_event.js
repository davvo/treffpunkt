/*global window, navigator, L, $, $event */

(function () {

	"use strict";

	var map, marker;

	function joinEvent() {
		console.log("join");
	}

	function buildPopup() {
		var html = [];
		html.push($event.text);
		html.push('<br/>');
		html.push('<button id="joinButton">Jag kommer!</button>');

		var popup = L.popup({
			offset: L.point(0, -35)
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

	function initMap() {
		map = L.map('map', {
			closePopupOnClick: false
		}).setView([$event.lat, $event.lng], $event.zoom);

	    L.tileLayer('http://{s}.eniro.no/geowebcache/service/tms1.0.0/map2x/{z}/{x}/{y}.png', {
	        subdomains: ['map01', 'map02', 'map03', 'map04'],
	        attribution: 'Maps from <a href="http://www.eniro.se">Eniro</a>',
	        tms: true,
	        maxZoom: 17
	    }).addTo(map);

	    marker = L.marker([$event.lat, $event.lng]).addTo(map);
	    
	    buildPopup();
	}

	function positionSuccess(position) {
		var latlng = new L.LatLng(position.coords.latitude, position.coords.longitude);
	}

	function positionError(err) {
		console.warn(err);
	}

	window.onload = function () {
		initMap();
	};

}());