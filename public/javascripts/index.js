/*global window, navigator, L, $ */

(function () {

	"use strict";

	var map, marker;

	function initMap() {
		map = L.map('map', {
			closePopupOnClick: false
		}).setView([59.31566, 18.05955], 10);

	    L.tileLayer('http://{s}.eniro.no/geowebcache/service/tms1.0.0/map2x/{z}/{x}/{y}.png', {
	        subdomains: ['map01', 'map02', 'map03', 'map04'],
	        attribution: 'Maps from <a href="http://www.eniro.se">Eniro</a>',
	        tms: true,
	        maxZoom: 17
	    }).addTo(map);
	}

	function saveEvent() {
		$.post('/events', {
			'text': $('textarea').val(),
			'lat': marker.getLatLng().lat,
			'lng': marker.getLatLng().lng,
			'zoom': map.getZoom()
		}).fail(function (err) {
			window.alert("Det gick inte att spara. Testa igen lite senare.");
			console.error(err);
		}).done(function (event) {
			window.location.href = event._id;
		});
	}

	function addMarker() {
		marker = L.marker(map.getCenter(), {
			draggable: true
		}).addTo(map);

		var html = [];
		html.push('<strong>Dra markören eller klicka i kartan för att välja plats.</strong>');
		html.push('<br/>');
		html.push('<textarea cols="34" rows="10" placeholder="Vad händer här?"></textarea>');
		html.push('<br/>');
		html.push('<button id="submit">Spara</button>');

		map.on('popupopen', function (evt) {
			$('#submit').click(saveEvent);
		});

		var popup = L.popup({
			offset: L.point(0, -35)
		})
			.setLatLng(marker.getLatLng())
		    .setContent(html.join(''))
		    .openOn(map);

		marker.on('dragstart', function () {
			map.removeLayer(popup);
		});

		marker.on('dragend', function () {
			popup.setLatLng(marker.getLatLng()).openOn(map);
		});

		map.on('click', function (evt) {
			marker.setLatLng(evt.latlng);
			popup.setLatLng(marker.getLatLng()).openOn(map);
		});
	}

	function positionSuccess(position) {
		var latlng = new L.LatLng(position.coords.latitude, position.coords.longitude);
		map.setView(latlng, Math.max(map.getZoom(), 15));
	    setTimeout(addMarker, 1000);
	}

	function positionError(err) {
		console.warn(err);
	    addMarker();
	}

	window.onload = function () {

		initMap();

		if (navigator.geolocation) {
	        navigator.geolocation.getCurrentPosition(positionSuccess, positionError, {
				enableHighAccuracy: true
	        });
	    }
	};

}());