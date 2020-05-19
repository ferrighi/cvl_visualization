//initialize projection
var prj = 'EPSG:4326';
var defzoom = 4;

// two projections will be possible
// 32661
proj4.defs('EPSG:32661', '+proj=stere +lat_0=90 +lat_ts=90 +lon_0=0 +k=0.994 +x_0=2000000 +y_0=2000000 +datum=WGS84 +units=m +no_defs');
ol.proj.proj4.register(proj4);
var ext32661 = [-10e+06,-10e+06,10e+06,10e+06]; 
var center32661 = [15,80]; 
var proj32661 = new ol.proj.Projection({
  code: 'EPSG:32661',
  extent: [-20000000,-30000000,20000000,10000000]
});

// 4326
var ext4326 = [-180.0000, -90.0000, 180.0000, 90.0000]; 
var center4326 = [15,70]; 
var proj4326 = new ol.proj.Projection({
  code: 'EPSG:4326',
  extent: ext4326
});

projObjectforCode = {
   'EPSG:4326': {extent: ext4326, center: center4326, projection: proj4326},
   'EPSG:32661': {extent: ext32661, center: center32661, projection: proj32661}};

// Import variables from php: array(address, id, layers)
var extracted_info = Drupal.settings.extracted_info;
var path = Drupal.settings.path;
var ts_ip = Drupal.settings.ts_ip;
var pins = Drupal.settings.pins;
console.log(extracted_info);


//document.getElementsByClassName("datasets")[0].style.display = 'none';

var ch = document.getElementsByName('projection');

for (var i = ch.length; i--;) {
    ch[i].onchange = function change_projection() {
        var prj = this.value;
    map.setView(new ol.View({
                  zoom: defzoom,
                  minZoom: 1,
                  maxZoom: 12,
                  center: projObjectforCode[prj].center,
                  projection: projObjectforCode[prj].projection,}))
    layer['base'].getSource().refresh();
    //clear pins and polygons
    map.getLayers().getArray()[1].getSource().clear(true);
    if (pins) {
      map.getLayers().getArray()[2].getSource().clear(true);
    }
    //rebuild vector source
    buildFeatures(projObjectforCode[prj].projection);
    }
}

//in nbs s1-ew
var iconStyleB = new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(0,0,255,0.1)',
    }),
    stroke: new ol.style.Stroke({
      color: 'blue',
      width: 2
    }),
});

//in nbs s1-iw
var iconStyleG = new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(0,255,0,0.1)',
    }),
    stroke: new ol.style.Stroke({
      color: 'green',
      width: 2
    }),
});

//in nbs s2
var iconStyleR = new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(255,0,0,0.1)',
    }),
    stroke: new ol.style.Stroke({
      color: 'red',
      width: 2
    }),
});

var iconStyleP1 = new ol.style.Style({
    image: new ol.style.Icon(({
      anchor: [0.5, 0.0],
      anchorOrigin: 'bottom-left',
      anchorXUnits: 'fraction',
      anchorYUnits: 'fraction',
      opacity: 1.00,
      src: '/'+path+'/icons/pinR.png'
   }))
});

var iconStyleP2 = new ol.style.Style({
    image: new ol.style.Icon(({
      anchor: [0.5, 0.0],
      anchorOrigin: 'bottom-left',
      anchorXUnits: 'fraction',
      anchorYUnits: 'fraction',
      opacity: 1.00,
      src: '/'+path+'/icons/pin.png'
   }))
});

// Define all layers
var layer = {};

// Base layer WMS
layer['base']  = new ol.layer.Tile({
   type: 'base',
   title: 'base',
   displayInLayerSwitcher: false,
   source: new ol.source.TileWMS({ 
       url: 'http://public-wms.met.no/backgroundmaps/northpole.map',
       params: {'LAYERS': 'world', 'TRANSPARENT':'false', 'VERSION':'1.1.1','FORMAT':'image/png'},
       crossOrigin: 'anonymous'
   })
});

var map = new ol.Map({
   target: 'map-cvl',
   layers: [ layer['base']
           ],
   view: new ol.View({
                 zoom: defzoom, 
                 minZoom: 1,
                 maxZoom: 12,
                 center: center4326,
                 projection: prj,
   })
});


// clickable ID in tooltop
var tlp = document.createElement("div");
tlp.setAttribute("id","tooltip")
tlp.setAttribute("style","margin-top: 1em; margin-bottom: 1em; background-color: rgba(0,0,0,0.2); font-size: small; width:100%;")
document.getElementById("map-cvl").appendChild(tlp);
function id_tooltip(){
var tooltip = document.getElementById('tooltip');

map.on('click', function(evt) {

  var coordinate = evt.coordinate;
  overlay.setPosition([coordinate[0] + coordinate[0]*20/100, coordinate[1] +  coordinate[1]*20/100]);


  var feature_ids = {};

  map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
      feature_ids[feature.get('id')] = {url_o: feature.get('url')[0],
                                        url_w: feature.get('url')[1],
                                        url_h: feature.get('url')[2],
                                        url_od: feature.get('url')[3], 
                                        id: feature.get('id'), 
                                        extent: feature.get('extent'), 
                                        latlon: feature.get('latlon'), 
                                        title: feature.get('title'), 
                                        abs:feature.get('abs'), 
                                        timeStart: feature.get('time')[0],
                                        timeEnd: feature.get('time')[1],
                                        thumb: feature.get('thumb'),
                                        url_lp: feature.get('related_info')[0],
                                        url_ug: feature.get('related_info')[1],
                                        ds_prod_status: feature.get('info_status')[0],
                                        md_status: feature.get('info_status')[1],
                                        last_md_update: feature.get('info_status')[2],
                                        dc_sh: feature.get('data_center')[0],
                                        dc_ln: feature.get('data_center')[1],
                                        dc_url: feature.get('data_center')[2],
                                        dc_cr: feature.get('data_center')[3],
                                        dc_cn: feature.get('data_center')[4],
                                        dc_ce: feature.get('data_center')[5],
                                        cit_cr: feature.get('citation')[0],
                                        cit_tit: feature.get('citation')[1],
                                        cit_date: feature.get('citation')[2],
                                        cit_place: feature.get('citation')[3],
                                        has_ts: true,
                                        cit_publisher: feature.get('citation')[4],
                                        isotopic: feature.get('iso_keys_coll')[0],
                                        keywords: feature.get('iso_keys_coll')[1],
                                        collection: feature.get('iso_keys_coll')[2],};
  });
  if(feature_ids.length !== 0) {
     tooltip.style.display = 'inline-block';
     tooltip.innerHTML = '';
     content.innerHTML = '';
     for(var id in feature_ids){


var markup = `
<a target="_blank" href="${feature_ids[id].url_lp}" style="width: 50%; display: inline-block;"><strong>${feature_ids[id].title}</strong></a>
<button type="button" style="margin-left: 2em;" class="button" data-toggle="collapse" data-target="#md-more-${id}" >Metadata</button> 
<button type="button" style="margin-left: 2em;" class="button"><a target="_blank" href="${feature_ids[id].url_h}">Direct Download</a></button>
<button type="button" style="margin-left: 2em; display: ${feature_ids[id].has_ts ? 'unset': 'none'};" class="button" data-toggle="collapse" data-target="#md-ts-${id}" 
onclick="fetch_ts_variables('${feature_ids[id].url_o}', 'md-ts-${id}');">Interactive Plotting</button>

<div style="height: 0.4em; background-color: white;"></div>

<div id="md-more-${id}" style="background-color:white; overflow-y: hidden; height: 0px" class="collapse">
<table style="font-size: 14px; border:none;">
  <tr style="border: none;">
  <td style="width:20%; border: none;"><img src="${feature_ids[id].thumb}"></td>
  <td style="border: none;">
  <strong>Title: </strong>${feature_ids[id].title}<br>
  <strong>Abstract: </strong>${feature_ids[id].abs}<br>
  <button type="button" class="button" data-toggle="collapse" style="margin-top: 2em;" data-target="#md-full-${id}">Full Metadata</button> 
  <button type="button" class="button" data-toggle="collapse" style="margin-top: 2em;" data-target="#md-access-${id}">Data Access</button> 
  <button type="button" class="button" data-toggle="collapse" style="margin-top: 2em;" data-target="#md-cit-${id}">Citation Info</button> 
  </td></tr>
</table>
</div>

<div id="md-full-${id}" style="background-color:white; overflow-y: hidden; height: 0px" class="collapse">
<table style="font-size: 14px; border:none;">
  <tr><td colspan="2" style="width:25%;"><strong>Title: </strong></td><td>${feature_ids[id].title}</td></tr>
  <tr><td colspan="2" style="width:25%;"><strong>ID: </strong></td><td>${feature_ids[id].id}</td></tr>
  <tr><td colspan="2" style="width:25%;"><strong>Abstract: </strong></td><td>${feature_ids[id].abs}</td></tr>
  <tr><td colspan="2" style="width:25%;"><strong>Product ID: </strong></td><td>${feature_ids[id].id}</td></tr>
  <tr><td colspan="2" style="width:25%;"><strong>Landing Page: </strong></td><td><a href="${feature_ids[id].url_lp}">${feature_ids[id].url_lp}</a></td></tr>
  <tr><td colspan="2" style="width:25%;"><strong>Users Guide: </strong></td><td><a href="${feature_ids[id].url_ug}">${feature_ids[id].url_ug}</a></td></tr>
  <tr><td colspan="2" style="width:25%;"><strong>Time start: </strong></td><td>${feature_ids[id].timeStart}</td></tr>
  <tr><td colspan="2" style="width:25%;"><strong>Time end: </strong></td><td>${feature_ids[id].timeEnd}</td></tr>
  <tr><td style="width:10%;" rowspan="4"><strong>Data Access</strong></td><td>HTTP access: </td><td><a href="${feature_ids[id].url_h}">${feature_ids[id].url_h}</a></td></tr>
  <tr><td>OPeNDAP access: </td><td><a href="${feature_ids[id].url_o}">${feature_ids[id].url_o}</a></td></tr>
  <tr><td>WMS access: </td><td><a href="${feature_ids[id].url_w}">${feature_ids[id].url_w}</a></td></tr>
  <tr><td>ODATA access: </td><td><a href="${feature_ids[id].url_od}">${feature_ids[id].url_od}</a></td></tr>
  <tr><td style="width:10%;" rowspan="6"><strong>Data Center</strong></td><td>Short name: </td><td>${feature_ids[id].dc_sh}</td></tr>
  <tr><td>Long name: </td><td>${feature_ids[id].dc_ln}</td></tr>
  <tr><td>URL: </td><td><a href="${feature_ids[id].dc_url}">${feature_ids[id].dc_url}</a></td></tr>
  <tr><td>Contact role: </td><td>${feature_ids[id].dc_cr}</td></tr>
  <tr><td>Contact name: </td><td>${feature_ids[id].dc_cn}</td></tr>
  <tr><td>Contact email:</td><td>${feature_ids[id].dc_ce}</td></tr>
  <tr><td style="width:10%;" rowspan="5"><strong>Citation</strong></td><td>Creator: </td><td>${feature_ids[id].cit_cr}</td></tr>
  <tr><td>Title: </td><td>${feature_ids[id].cit_tit}</td></tr>
  <tr><td>Date: </td><td>${feature_ids[id].cit_date}</td></tr>
  <tr><td>Place: </td><td>${feature_ids[id].cit_place}</td></tr>
  <tr><td>Publisher:</td><td>${feature_ids[id].cit_publisher}</td></tr>
  <tr><td colspan="2" style="width:25%;"><strong>Extent (N,S,E,W): </strong></td><td>${feature_ids[id].extent}</td></tr>
  <tr><td colspan="2" style="width:25%;"><strong>Geographical center (lat,lon): </strong></td><td>${feature_ids[id].latlon}</td></tr>
  <tr><td colspan="2" style="width:25%;"><strong>Isotopic Category: </strong></td><td>${feature_ids[id].isotopic}</td></tr>
  <tr><td colspan="2" style="width:25%;"><strong>Keywords: </strong></td><td>${feature_ids[id].keywords}</td></tr>
  <tr><td colspan="2" style="width:25%;"><strong>Collection: </strong></td><td>${feature_ids[id].collection}</td></tr>
  <tr><td colspan="2" style="width:25%;"><strong>Dataset production status: </strong></td><td>${feature_ids[id].ds_prod_status}</td></tr>
  <tr><td colspan="2" style="width:25%;"><strong>Metadata status: </strong></td><td>${feature_ids[id].md_status}</td></tr>
  <tr><td colspan="2" style="width:25%;"><strong>Last metadata update: </strong></td><td>${feature_ids[id].last_md_update}</td></tr>
</table>
</div>

<div id="md-access-${id}" style="background-color:white; overflow-y: hidden; height: 0px" class="collapse">
<table style="font-size: 14px; border:none;">
  <tr><td style="width:20%;"><strong>HTTP access: </strong></td><td><a href="${feature_ids[id].url_h}">${feature_ids[id].url_h}</a></td></tr>
  <tr><td style="width:20%;"><strong>OPeNDAP access: </strong></td><td><a href="${feature_ids[id].url_o}">${feature_ids[id].url_o}</a></td></tr>
  <tr><td style="width:20%;"><strong>WMS access: </strong></td><td><a href="${feature_ids[id].url_w}">${feature_ids[id].url_w}</a></td></tr>
  <tr><td style="width:20%;"><strong>ODATA access: </strong></td><td><a href="${feature_ids[id].url_od}">${feature_ids[id].url_od}</a></td></tr>
</table>
</div>

<div id="md-cit-${id}" style="background-color:white; overflow-y: hidden; height: 0px" class="collapse">
<table style="font-size: 14px; border:none;">
  <tr><td>Creator: </td><td>${feature_ids[id].cit_cr}</td></tr>
  <tr><td>Title: </td><td>${feature_ids[id].cit_tit}</td></tr>
  <tr><td>Date: </td><td>${feature_ids[id].cit_date}</td></tr>
  <tr><td>Place: </td><td>${feature_ids[id].cit_place}</td></tr>
  <tr><td>Publisher:</td><td>${feature_ids[id].cit_publisher}</td></tr>
  <tr><td>Full citation string:</td><td>${feature_ids[id].cit_cr},${feature_ids[id].cit_tit} (${feature_ids[id].cit_date}),${feature_ids[id].cit_place}, published by:${feature_ids[id].cit_publisher}</td></tr>
</table>
</div>

<div id="md-ts-${id}" style="background-color:white; overflow-y: hidden; height: 0px" class="collapse">
<select name="var_list" id="var_list" onchange="plot_ts('${feature_ids[id].url_o}');">
     <option>Choose a variable</option>
</select>

<div id="tsplot"></div>

</div>
`;

        if(true){
        content.innerHTML += "Preview: <br><a target=\"_blank\" href=\"https://mynewsite.metsis.met.no/metsis/map/wms?dataset="+feature_ids[id].id+"&solr_core=nbs-l1\"><img style=\"padding: 0.8em;\"src=\""+feature_ids[id].thumb+"\"></a></br>";

        tooltip.innerHTML += markup;  
        }else{
        //tooltip.innerHTML += 'Get Metadata: <a target="_blank" href=\"https://adc-test.met.no/metsis/display/metadata/?core=l1&datasetID='+id+'\">'+feature_ids[id].title+'</a><br>';
        tooltip.innerHTML += '<strong>'+feature_ids[id].title+'</strong> <button type="button" class="btn btn-info adc-button-small form-submit" data-toggle="collapse" data-target="#md'+id+'">More</button> <a href=\"https://adc-test.met.no/metsis/display/metadata/?core=l1&datasetID='+id+'\" style="margin-left:1em;" class="button btn btn-info adc-button-small">Full Metadata</a><br> <div style="height: 0.4em; background-color: white;"></div><div id="md'+id+'" style="background-color:white; overflow-y: hidden; height: 0px" class="collapse">Abstract: '+feature_ids[id].abs+'<br><strong>Time start:</strong> '+feature_ids[id].timeStart+'<br><strong>Time end:</strong>'+feature_ids[id].timeEnd+'</div>';
        }
     }

  }
});
}

//build up the point/polygon features
function buildFeatures(prj) {


var iconFeaturesPol=[];
for(var i12=0; i12 <= extracted_info.length-1; i12++){
if ((extracted_info[i12][2][0] !== extracted_info[i12][2][1]) || (extracted_info[i12][2][2] !== extracted_info[i12][2][3])) {
  box_tl = ol.proj.transform([extracted_info[i12][2][3], extracted_info[i12][2][0]], 'EPSG:4326', prj);
  box_tr = ol.proj.transform([extracted_info[i12][2][2], extracted_info[i12][2][0]], 'EPSG:4326', prj);
  box_bl = ol.proj.transform([extracted_info[i12][2][3], extracted_info[i12][2][1]], 'EPSG:4326', prj);
  box_br = ol.proj.transform([extracted_info[i12][2][2], extracted_info[i12][2][1]], 'EPSG:4326', prj);
  geom = new ol.geom.Polygon([[box_tl, box_tr, box_br, box_bl, box_tl]]);
  var iconFeaturePol = new ol.Feature({
        //type: 'click',
	url: [extracted_info[i12][0][0], extracted_info[i12][0][1], extracted_info[i12][0][2], extracted_info[i12][0][3]],
        id: extracted_info[i12][1],
        geometry: geom,
        extent: [extracted_info[i12][2][0], extracted_info[i12][2][1], extracted_info[i12][2][2], extracted_info[i12][2][3]],
        latlon: extracted_info[i12][3],
        title: extracted_info[i12][4],
        abs: extracted_info[i12][5],
        time: [extracted_info[i12][6][0], extracted_info[i12][6][1]],
        thumb: extracted_info[i12][7],
        related_info: [extracted_info[i12][8][0],extracted_info[i12][8][1]],
        iso_keys_coll: extracted_info[i12][9],
        info_status: extracted_info[i12][10],
        data_center: extracted_info[i12][11],
        citation: extracted_info[i12][12],
        ts: extracted_info[i12][13],
  });
  iconFeaturesPol.push(iconFeaturePol);
 

  iconFeaturePol.setStyle(iconStyleB);
}
}

//create a vector source with all points
var vectorSourcePol = new ol.source.Vector({
  features: iconFeaturesPol
});

//create a vector layer with all points from the vector source and pins
var vectorLayerPol = new ol.layer.Vector({
  source: vectorSourcePol,
  //style: iconStyle,
});

map.addLayer(vectorLayerPol);


//all points
if (pins) {
  var iconFeaturesPin=[];
  for(var i12=0; i12 <= extracted_info.length-1; i12++){
    geom = new ol.geom.Point(ol.proj.transform([extracted_info[i12][3][1], extracted_info[i12][3][0]], 'EPSG:4326', prj));
    var iconFeaturePin = new ol.Feature({
	url: [extracted_info[i12][0][0], extracted_info[i12][0][1], extracted_info[i12][0][2], extracted_info[i12][0][3]],
        id: extracted_info[i12][1],
        geometry: geom,
        extent: [extracted_info[i12][2][0], extracted_info[i12][2][1], extracted_info[i12][2][2], extracted_info[i12][2][3]],
        latlon: extracted_info[i12][3],
        title: extracted_info[i12][4],
        abs: extracted_info[i12][5],
        time: [extracted_info[i12][6][0], extracted_info[i12][6][1]],
        thumb: extracted_info[i12][7],
        related_info: [extracted_info[i12][8][0],extracted_info[i12][8][1]],
        iso_keys_coll: extracted_info[i12][9],
        info_status: extracted_info[i12][10],
        data_center: extracted_info[i12][11],
        citation: extracted_info[i12][12],
        ts: extracted_info[i12][13],
    });

    iconFeaturesPin.push(iconFeaturePin);
    if ((extracted_info[i12][2][0] !== extracted_info[i12][2][1]) || (extracted_info[i12][2][2] !== extracted_info[i12][2][3])) {
       iconFeaturePin.setStyle(iconStyleP1);
    }else{
       iconFeaturePin.setStyle(iconStyleP2);
    }
  }

//create a vector source with all points
  var vectorSourcePin = new ol.source.Vector({
    features: iconFeaturesPin
  });

//create a vector layer with all points from the vector source and pins
  var vectorLayerPin = new ol.layer.Vector({
    source: vectorSourcePin,
    //style: iconStyle,
  });
  map.addLayer(vectorLayerPin);
}

}

//initialize features
buildFeatures(prj);

// display clickable ID in tooltip
id_tooltip()

//Mouseposition
var mousePositionControl = new ol.control.MousePosition({
   coordinateFormat : function(co) {
      return ol.coordinate.format(co, template = 'lon: {x}, lat: {y}', 2);
   },
   projection : 'EPSG:4326', 
});
map.addControl(mousePositionControl);

//Zoom to extent
var zoomToExtentControl = new ol.control.ZoomToExtent({
});
map.addControl(zoomToExtentControl);


var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');

var overlay = new ol.Overlay({
  element: container,
  autoPan: true,
  autoPanAnimation: {
    duration: 250
  }
});

map.addOverlay(overlay);

function fetch_ts_variables(url_o, md_ts_id) {
  fetch('http://'+ts_ip+'/ncplot/plot?get=param&resource_url='+url_o)
  .then(response => response.json())
  .then(data => {
    for (const variable of data.y_axis) {
      console.log(variable);
      var el = document.createElement("option");
      el.textContent = variable;
      el.value = variable;
      document.getElementById(md_ts_id).children[0].appendChild(el);
    }
  });
}


function plot_ts(url_o) {
  document.getElementById('tsplot').innerHTML = "";
  var variable = document.getElementById("var_list").value;
  fetch('http://'+ts_ip+'/ncplot/plot?get=plot&resource_url='+url_o+'&variable='+variable)
  .then(function (response) {
      return response.json();
  })
  .then(function (item) {
      Bokeh.embed.embed_item(item);
  })
}


