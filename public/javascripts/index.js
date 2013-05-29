/*global window, L */

(function() {

	var map, marker;

	function positionSuccess(position) {
		var latlng = new L.LatLng(position.coords.latitude, position.coords.longitude);
		map.setView(latlng, Math.max(map.getZoom(), 15));
	}

	function positionError(err) {
		console.warn(err);
	}

	function initMap() {
		map = L.map('map').setView([59.31566, 18.05955], 13);

	    var url = 'http://{s}.eniro.no/geowebcache/service/tms1.0.0/{layer}/{z}/{x}/{y}.{ext}';
	    var options = {
	        subdomains: ['map01', 'map02', 'map03', 'map04'],
	        attribution: 'Maps from <a href="http://www.eniro.se">Eniro</a>',
	        tms: true                    
	    };

	    L.tileLayer(url, L.Util.extend({
	        layer: 'map2x',
	        ext: 'png',
	        maxZoom: 17
	    }, options)).addTo(map);

	    setTimeout(addMarker, 2000);
	}

	function addMarker() {
		marker = L.marker(map.getCenter(), {
			draggable: true
		}).addTo(map);

		var html = [] ;
		html.push('<strong>Dra markören eller klicka i kartan för att välja plats.</strong>')
		html.push('<br/>')
		html.push('<textarea cols="34" rows="10" placeholder="Vad händer här?"></textarea>');
		html.push('<br/>')
		html.push('<button id="submit">Spara</button>');
		marker.bindPopup(html.join(''), {
			closeButton: false
		});
		marker.openPopup();

		$('#submit').click(function () {
			$.post('/events', {
				'text': $('textarea').val()
			}).fail(function (err) {
				console.error(err);
			}).done(function (result) {
				console.log(result);
			});
		});

		marker.on('dragend', function () {
			marker.openPopup();
		});

		map.on('click', function (evt) {
			marker.setLatLng(evt.latlng);
			marker.openPopup();
		});
	}

	window.onload = function () {

		initMap();

		if (navigator.geolocation) {
	        navigator.geolocation.getCurrentPosition(positionSuccess, positionError, { enableHighAccuracy: true });
	    }
	}
}());