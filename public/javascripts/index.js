/*global window, L */

window.onload = function () {
	var map = L.map('map').setView([59.31566, 18.05955], 13);

    var url = 'http://{s}.eniro.no/geowebcache/service/tms1.0.0/{layer}/{z}/{x}/{y}.{ext}';
    var options = {
        subdomains: ['map01', 'map02', 'map03', 'map04'],
        attribution: 'Maps from <a href="http://www.eniro.se">Eniro</a>',
        tms: true                    
    };

    var mapLayer = L.tileLayer(url, L.Util.extend({
        layer: 'map2x',
        ext: 'png',
        maxZoom: 17
    }, options));

	mapLayer.addTo(map);
}