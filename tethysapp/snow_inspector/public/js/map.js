

$(document).ready(function () {

	var modislayer = createModisLayer();
	var pixelBoundaries;
	var styleCache = {};

	//build the bing map layer
	var bing_layer = new ol.layer.Tile({

		source: new ol.source.BingMaps({
			imagerySet: 'AerialWithLabels',
			key: 'Ak-dzM4wZjSqTlzveKz5u0d4IQ4bRzVI309GxmkgSVr1ewS6iPSrOvOKhA-CJlm3'
		}),
		visibility: false
	});

    //build OpenStreet map layer
    var openstreet_layer = new ol.layer.Tile({
          source: new ol.source.OSM(),
          visibility: false
        });

    //build MapQuest map layer
    var mapQuest_layer = new ol.layer.Tile({
        source: new ol.source.MapQuest({layer: 'sat'}),
        visibility: false
                 });

    //build Esri map layer
    var esri_layer = new ol.layer.Tile({
	source: new ol.source.XYZ({
		attribution: [new ol.Attribution({
			html: 'Tiles &copy; <a href="http://services.arcgisonline.com/ArcGIS/' +
			'rest/services/World_Topo_Map/MapServer>ArcGIS</a>'
		})],
		url: 'http://server.arcgisonline.com/ArcGIS/rest/services/' +
		'World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
		})
	});
	baseMapLayer = esri_layer;


	$("#btnShowModis").click(function(){

		if (modislayer.getVisible()) {
			modislayer.setVisible(false);
			$("#btnShowModis").val("Show Modis Layer")
		} else {
			modislayer.setVisible(true);
			$("#btnShowModis").val("Hide Modis Layer")
		}
	})

	$("#btnShowPixels").click(function(){
		//add geojson layer with tile outlines
		var extent = map.getView().calculateExtent(map.getSize());

		var extentLatLon = ol.proj.transformExtent(extent, 'EPSG:3857', 'EPSG:4326')
		var xmin = extentLatLon[0];
		var ymin = extentLatLon[1];
		var xmax = extentLatLon[2];
		var ymax = extentLatLon[3];

		var baseurl = '/apps/snow-inspector/pixel-borders/';

		var pxDate = $("#endDate").val();

		var pixel_url = baseurl +'?lonmin=' + xmin + '&latmin=' + ymin + '&lonmax=' + xmax + '&latmax=' + ymax + '&date=' + pxDate;
		console.log(pixel_url)

		var pixel_source = new ol.source.GeoJSON({
			projection : 'EPSG:3857',
			url : pixel_url
		});

		if (typeof pixelBoundaries === 'undefined') {
			pixelBoundaries = new ol.layer.Vector({
				source : pixel_source,
				style : function(feature, resolution) {
					var text = feature.get('val');
					if (!styleCache[text]) {
						styleCache[text] = [new ol.style.Style({
							fill : new ol.style.Fill({
								color : 'rgba(255, 255, 255, 0.1)'
							}),
							stroke : new ol.style.Stroke({
								color : '#319FD3',
								width : 1
							}),
							text : new ol.style.Text({
								font : '12px sans-serif',
								text : text,
								fill : new ol.style.Fill({
									color : '#000'
								}),
								stroke : new ol.style.Stroke({
									color : '#fff',
									width : 3
								})
							}),
							zIndex : 999
						})];
					}
					return styleCache[text];
				}
			});
			map.addLayer(pixelBoundaries);
		} else {
			pixelBoundaries.setSource(pixel_source);
		}
	});


	$("#selectBaseMap").change(function () {
        var selected_value = this.value;
        console.log(selected_value);

		if (selected_value == "bing") {
			esri_layer.setVisible(false);
			mapQuest_layer.setVisible(false);
			openstreet_layer.setVisible(false);
			bing_layer.setVisible(true);
		} else if (selected_value == "mapquest") {
			esri_layer.setVisible(false);
			openstreet_layer.setVisible(false);
			bing_layer.setVisible(false);
			mapQuest_layer.setVisible(true);
		} else if(selected_value=="osm") {
			esri_layer.setVisible(false);
			bing_layer.setVisible(false);
			mapQuest_layer.setVisible(false);
			openstreet_layer.setVisible(true);
		} else if(selected_value=="esri") {
			bing_layer.setVisible(false);
			mapQuest_layer.setVisible(false);
			openstreet_layer.setVisible(false);
			esri_layer.setVisible(true);
		}
    });


	function createModisLayer() {

		var modisDate = $("#endDate").val();
		var modisUrl = "//map1{a-c}.vis.earthdata.nasa.gov/wmts-webmerc/" +
				"MODIS_Terra_Snow_Cover/default/" + modisDate +
				"/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png"

		var modis = new ol.source.XYZ({
			url: modisUrl
		});
        return new ol.layer.Tile({source: modis});
	}

	function updateModisLayer() {
		var modisDate1 = $("#endDate").val();
		console.log(modisDate1);

		var modisUrl1 = "//map1{a-c}.vis.earthdata.nasa.gov/wmts-webmerc/" +
				"MODIS_Terra_Snow_Cover/default/" + modisDate1 +
				"/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png"

		var modisSource = new ol.source.XYZ({
			url: modisUrl1
		});
		modislayer.setSource(modisSource);
	}

	$('#endDate').datepicker().on('changeDate', function (ev) {
    	console.log('date changed!');
    	updateModisLayer();
	});


var source = new ol.source.Vector();

map = new ol.Map({
	layers: [mapQuest_layer, bing_layer, openstreet_layer, esri_layer, modislayer],
	controls: ol.control.defaults(),
	target: 'map_view',
	view: new ol.View({
		center: [0, 0],
		zoom: 2
	})
});


var vector = new ol.layer.Vector({
  source: source,
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 255, 0.2)'
    }),
    stroke: new ol.style.Stroke({
      color: '#ffcc33',
      width: 2
    }),
    image: new ol.style.Circle({
      radius: 7,
      fill: new ol.style.Fill({
        color: '#ffcc33'
      })
    })
  })
});

map.addLayer(vector);



var lat = 40.2380;
var lon = -111.5500;
var dbPoint = {
	"type": "Point",
	"coordinates": [lon, lat]
}



function addPoint(coordinates){	
	var geometry = new ol.geom.Point(coordinates);
	var feature = new ol.Feature({
		geometry: geometry,
		attr: 'Some Property'
	});
	vector.getSource().clear();
	vector.getSource().addFeature(feature);
	$("#")
}

function refreshDate(){
	var endDate = $("#endDate").val();
	console.log(endDate);
	$("#end").val(endDate);
}


var coords = ol.proj.transform(dbPoint.coordinates, 'EPSG:4326','EPSG:3857');
addPoint(coords);
map.getView().setCenter(coords);

$("#inputDays").val($("#inputDays").attr("placeholder"));
$("#inputLon").val(lon);
$("#inputLat").val(lat);

map.on('click', function(evt) {
	var coordinate = evt.coordinate;
	addPoint(coordinate);
	//now update lat and long in textbox

	var lonlat = ol.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326');
	$("#inputLon").val(lonlat[0].toFixed(6));
	$("#inputLat").val(lonlat[1].toFixed(6));
	if (lonlat[0] < -180) {
		$("#inputLon").val((360 + lonlat[0]).toFixed(6));
	}
})

});
