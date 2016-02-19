var popupDiv = $('#welcome-popup');

$(document).ready(function () {


	var lat = 49.9;
	var lon = 15.3;
	var default_zoom = 8;
	var map_zoom = default_zoom;


	var modislayer = createModisLayer();
	var pixelBoundaries;
	var styleCache = {};

	var snow_resources = [
		'95cee185705b42acbf30879392c0e004',
		'befab7857d41484baa7f6cd429206148',
		'e890f486e5f74c9ab393b847372c527f',
		'1b005f1311ed4a679afc4d76ebee9a97'

	]
	var snow_dates = [
		'2016-02-15',
		'2016-02-16',
		'2016-02-17',
		'2016-02-18'
	]

	var my_date = '2016-02-18';


	var urlParams = getUrlVars();

	sld_body_temple = '<?xml version="1.0" encoding="ISO-8859-1"?><StyledLayerDescriptor version="1.0.0" xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
      + "<NamedLayer><Name>_WS_AND_LAYER_NAME_</Name><UserStyle><Name>mysld</Name><Title>Probability gradient</Title><FeatureTypeStyle><Rule><RasterSymbolizer><ColorMap>"
      + '<ColorMapEntry color="#FFFFFF" quantity="-1.7e+308" opacity="0"/><ColorMapEntry color="#9EC8FF" quantity="0.50" opacity="0.5"/><ColorMapEntry color="#FF12F7" quantity="0.99" opacity="0.75"/></ColorMap></RasterSymbolizer></Rule></FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>'

	if (typeof urlParams !== 'undefined') {

		if (urlParams.length < 2) {
			if (document.referrer == "https://apps.hydroshare.org/apps/") {
				$('#extra-buttons').append('<a class="btn btn-default btn-sm" href="https://apps.hydroshare.org/apps/">Return to HydroShare Apps</a>');
			}
			popupDiv.modal('show');

		}

		url_lat = urlParams["lat"];
		url_lon = urlParams["lon"];
		url_date = urlParams["date"];
		url_days = urlParams["days"];
		url_zoom = urlParams["zoom"];

		if (typeof url_days !== 'undefined') {
			$("#inputDays").attr("placeholder", url_days);
		}
		if (typeof url_lat !== 'undefined') {
			lat = parseFloat(url_lat);
		}
		if (typeof url_lon !== 'undefined') {
			lon = parseFloat(url_lon);
		}
		if (typeof url_date !== 'undefined') {
			$("#date").val(url_date);
			$("#date").datepicker('update');
			console.log(url_date);
			my_date = url_date;
		}
		if (typeof url_zoom !== 'undefined') {
			map_zoom = url_zoom;
		} else {
			map_zoom = default_zoom;
		}
	} else {
		//popupDiv.modal('show');
	}

	//snow location point
	var dbPoint = {
		"type": "Point",
		"coordinates": [lon, lat]
	}

	//build the bing map layer
	var bing_layer = new ol.layer.Tile({
		source: new ol.source.BingMaps({
			imagerySet: 'AerialWithLabels',
			key: 'AkCPywc954jTLm72zRDvk0JpSJarnJBYPWrNYZB1X8OajN_1DuXj1p5u1Hy2betj'
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


	//build OpenSnowMap layer one
	var esri_layer = new ol.layer.Tile({
		source: new ol.source.XYZ({ url: 'http://otile1.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.jpg' })
	});

	//build ski path layer
	var ski_layer = new ol.layer.Tile({
		source: new ol.source.XYZ({ url: 'http://www.opensnowmap.org/opensnowmap-overlay/{z}/{x}/{y}.png' })
	})

	//build geoserver layer (WMS)
	var res_index = snow_dates.indexOf(my_date);

	var geosvr_url_base = 'http://apps.hydroshare.org:8181';
	var layer_name = snow_resources[res_index];
	var ws_name = 'www.hydroshare.org';

    var layer_id = ws_name + ':' + layer_name;
	var geo_server_wms = geosvr_url_base + '/geoserver/wms';
    var layer_id = ws_name + ':' + layer_name;

	var sld_body = sld_body_temple.replace('_WS_AND_LAYER_NAME_', layer_id);
	geoserver_layer = new ol.layer.Image({
        source: new ol.source.ImageWMS({
          ratio: 1,
          url: geo_server_wms,
          params: {
                LAYERS: layer_id,
                //STYLES: 'my_sld',
                //sld: 'http://127.0.0.1:8080/geoserver/www/styles/sld.sld'
                'SLD_BODY': sld_body
                  }
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


	//add geojson layer with tile outlines
	function add_pixel_boundaries() {

		var extent = map.getView().calculateExtent(map.getSize());

		var extentLatLon = ol.proj.transformExtent(extent, 'EPSG:3857', 'EPSG:4326')
		var xmin = extentLatLon[0];
		var ymin = extentLatLon[1];
		var xmax = extentLatLon[2];
		var ymax = extentLatLon[3];

		var baseurl = '/apps/snow-inspector/pixel-borders/';

		var pxDate = $("#date").val();

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
	}


	$("#btnShowPixels").click(function(){

		//changing the button text...
		if ($("#btnShowPixels").val() == 'Show Pixels') {
			add_pixel_boundaries();
			$("#btnShowPixels").val('Hide Pixels');

		} else {
			if (typeof pixelBoundaries !== 'undefined') {
				pixelBoundaries.getSource().clear();
			}
			$("#btnShowPixels").val('Show Pixels');
		}
	});


	$("#selectBaseMap").change(function () {
        var selected_value = this.value;

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
		// save the selected value
		$('#layer').val(selected_value);
    });

    function getUrlVars() {
		var vars = [], hash;
		var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
		for(var i = 0; i < hashes.length; i++)
		{
			hash = hashes[i].split('=');
			vars.push(hash[0]);
			vars[hash[0]] = hash[1];
		}
		return vars;
	}


	function createModisLayer() {

		var modisDate = $("#date").val();
		var modisUrl = "//map1{a-c}.vis.earthdata.nasa.gov/wmts-webmerc/" +
				"MODIS_Terra_Snow_Cover/default/" + modisDate +
				"/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png"

		var modis = new ol.source.XYZ({
			url: modisUrl
		});
        return new ol.layer.Tile({source: modis});
	}

	function updateModisLayer() {
		var modisDate1 = $("#date").val();
		console.log(modisDate1);

		var modisUrl1 = "//map1{a-c}.vis.earthdata.nasa.gov/wmts-webmerc/" +
				"MODIS_Terra_Snow_Cover/default/" + modisDate1 +
				"/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png"

		var modisSource = new ol.source.XYZ({
			url: modisUrl1
		});
		modislayer.setSource(modisSource);
	}

	function configure_show_pixels(newZoom) {
		if (newZoom < 13) {
			if ($('#btnShowPixels').is(":visible")) {
				$('#btnShowPixels').hide();
			}
			if (typeof pixelBoundaries !== 'undefined') {
				pixelBoundaries.getSource().clear();
			}
		}
		if (newZoom >= 13) {
		  if (!($('#btnShowPixels').is(":visible"))) {
				$('#btnShowPixels').show();
		  }
		}
	}

	$('#endDate').datepicker().on('changeDate', function (ev) {
    	console.log('date changed!');
    	updateModisLayer();
	});


	map = new ol.Map({
		layers: [esri_layer, ski_layer, geoserver_layer],
		controls: ol.control.defaults(),
		target: 'map_view',
		view: new ol.View({
			center: [0, 0],
			zoom: map_zoom
		})
	});

	// refreshing map style
	//if (map != null && geoserver_layer != null) {
	//	var oseamNew = geoserver_layer.getSource();
	//	oseamNew.updateParams({'sld_body': sld_body_temple});
	//	map.render();
	//}

	// checking zoom end
	map.getView().on('propertychange', function(e) {
	   switch (e.key) {
		  case 'resolution':
			  console.log('zoom changed!');
			  var newZoom = map.getView().getZoom();
			  console.log(newZoom);
			  $('#zoom').val(newZoom);

			  configure_show_pixels(newZoom);
			  break;


	   }
	});

var source = new ol.source.Vector();
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
configure_show_pixels(map.getView().getZoom());




function addPoint(coordinates){	
	var geometry = new ol.geom.Point(coordinates);
	var feature = new ol.Feature({
		geometry: geometry,
		attr: 'Some Property'
	});
	vector.getSource().clear();
	vector.getSource().addFeature(feature);
}

function addPointLonLat(coordinates){
	var coords = ol.proj.transform(coordinates, 'EPSG:4326','EPSG:3857');
	addPoint(coords);
	map.getView().setCenter(coords);
}

function refreshDate(){
	var endDate = $("#date").val();
	console.log(endDate);
	$("#end").val(endDate);
}

var coords = [lon, lat];
console.log(coords);
addPointLonLat(coords);


$("#inputDays").val($("#inputDays").attr("placeholder"));
$("#inputLon").val(lon);
$("#inputLat").val(lat);
$('#zoom').val(map.getView().getZoom());

	//set the enddate
	$("#end").val(my_date);
	$("#date").val(my_date);
	$("#date").datepicker('update');
	$('.app-title').text('Snow Probability Map: ' + my_date);

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
	$('#zoom').val(map.getView().getZoom());
})

});
