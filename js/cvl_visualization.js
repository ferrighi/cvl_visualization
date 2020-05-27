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
var site_name = Drupal.settings.site_name;
//console.log(extracted_info);


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
var iconStyleBl = new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(0,0,255,0.1)',
    }),
    stroke: new ol.style.Stroke({
      color: 'blue',
      width: 2
    }),
});

var iconStyleGr = new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(186, 168, 168,0.1)',
    }),
    stroke: new ol.style.Stroke({
      color: 'gray',
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
      src: '/'+path+'/icons/pinBl.png'
   }))
});

var iconStylePGr = new ol.style.Style({
    image: new ol.style.Icon(({
      anchor: [0.5, 0.0],
      anchorOrigin: 'bottom-left',
      anchorXUnits: 'fraction',
      anchorYUnits: 'fraction',
      opacity: 1.00,
      src: '/'+path+'/icons/pinGr.png'
   }))
});

var iconStyleP2 = new ol.style.Style({
    image: new ol.style.Icon(({
      anchor: [0.5, 0.0],
      anchorOrigin: 'bottom-left',
      anchorXUnits: 'fraction',
      anchorYUnits: 'fraction',
      opacity: 1.00,
      src: '/'+path+'/icons/pinBk.png'
   }))
});

// Define all layers
var layer = {};

// Base layer WMS
layer['base']  = new ol.layer.Tile({
   type: 'base',
   title: 'base',
   source: new ol.source.TileWMS({ 
       url: 'https://public-wms.met.no/backgroundmaps/northpole.map',
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

// title on hover tooltip
var tlphov = document.createElement("div");
tlphov.setAttribute("id","tooltip-hov")

var overlayh = new ol.Overlay({
  element: tlphov,
});
map.addOverlay(overlayh);

function id_tooltip_h(){
  map.on('pointermove', function(evt) {
    var coordinate = evt.coordinate;
    var feature_ids = {};
    map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
      //console.log(feature);
      feature_ids[feature.get('id')] = {title: feature.get('title')};
    });
    if(feature_ids.length !== 0) {
      tlphov.style.display = 'inline-block';
      tlphov.innerHTML = '';
      for(var id in feature_ids){
        overlayh.setPosition([coordinate[0] + coordinate[0]*2/100, coordinate[1] -  coordinate[1]*2/100]);
        tlphov.innerHTML += feature_ids[id].title+'<br>';
      }
    }
  });
}

// add popup with thumbnails
var container = document.getElementById('popup');
var content = document.getElementById('popup-content');

var overlay = new ol.Overlay({
  element: container,
  className: 'thumb-pop'
});
map.addOverlay(overlay);

// clickable ID in tooltop
var tlp = document.createElement("div");
tlp.setAttribute("id","tooltip")
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
                                        url_lp: feature.get('related_info'),
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
                                        cit_publisher: feature.get('citation')[4],
                                        has_ts: feature.get('has_ts'),
                                        core: feature.get('core'),
                                        access_constraint: feature.get('constraints')[0],
                                        use_constraint: feature.get('constraints')[1],
                                        isotopic: feature.get('iso_keys_coll_act')[0],
                                        keywords: feature.get('iso_keys_coll_act')[1],
                                        collection: feature.get('iso_keys_coll_act')[2],
                                        activity: feature.get('iso_keys_coll_act')[3],};
  });
  if(feature_ids.length !== 0) {
     tooltip.style.display = 'inline-block';
     tooltip.innerHTML = '';
     content.innerHTML = '';
     for(var id in feature_ids){



var markup = `
<a target="_blank" href="${feature_ids[id].url_lp}" style="width: 55%; display: inline-block;"><strong>${feature_ids[id].title}</strong></a>
<button type="button" class="cvl-button" data-toggle="collapse" data-target="#md-more-${id}">Metadata</button> 
<button type="button" class="cvl-button"><a target="_blank" href="${(feature_ids[id].url_h) !='' ? feature_ids[id].url_h : feature_ids[id].url_lp}">Direct Download</a></button>
<button type="button" style="display: ${(feature_ids[id].has_ts == 'true') ? 'unset': 'none'};" class="cvl-button" data-toggle="collapse" data-target="#md-ts-${id}" 
onclick="fetch_ts_variables('${feature_ids[id].url_o}', 'md-ts-${id}');">Interactive Plotting</button>

<div style="height: 0.4em; background-color: white;"></div>

<div id="md-more-${id}" style="background-color:white; overflow-y: hidden; height: 0px" class="collapse">
<table class="cvl-table">
  <tr style="border: none;">
  <td style="width:20%; border: none;"><img class="cvl-thumb" src="${feature_ids[id].thumb}"></td>
  <td style="border: none;">
  <strong>Title: </strong>${feature_ids[id].title}<br>
  <strong>Abstract: </strong>${feature_ids[id].abs}<br>
  <button data-parent="#cvl-acc" type="button" class="cvl-button" data-toggle="collapse" style="margin-top: 2em;" data-target="#md-full-${id}">Full Metadata</button> 
  <button data-parent="#cvl-acc" type="button" class="cvl-button" data-toggle="collapse" style="margin-top: 2em;" data-target="#md-access-${id}">Data Access</button> 
  </td></tr>
</table>

<div id="cvl-acc">
<div class="panel">
<div id="md-full-${id}" style="background-color:white; overflow-y: hidden; height: 0px" class="collapse">
<table class="cvl-table">
  <tr><td colspan="2" style="width:25%;"><strong>Title: </strong></td><td>${feature_ids[id].title}</td></tr>
  <tr><td colspan="2" style="width:25%;"><strong>ID: </strong></td><td>${feature_ids[id].id}</td></tr>
  <tr><td colspan="2" style="width:25%;"><strong>Abstract: </strong></td><td>${feature_ids[id].abs}</td></tr>
  <tr><td colspan="2" style="width:25%;"><strong>Last metadata update: </strong></td><td>${feature_ids[id].last_md_update}</td></tr>
  <tr><td colspan="2" style="width:25%;"><strong>Metadata ID: </strong></td><td>${feature_ids[id].id}</td></tr>
  <tr><td colspan="2" style="width:25%;"><strong>Landing Page: </strong></td><td><a href="${feature_ids[id].url_lp}">${feature_ids[id].url_lp}</a></td></tr>
  <tr><td colspan="2" style="width:25%;"><strong>Time start: </strong></td><td>${feature_ids[id].timeStart}</td></tr>
  <tr><td colspan="2" style="width:25%;"><strong>Time end: </strong></td><td>${feature_ids[id].timeEnd}</td></tr>
  <tr><td colspan="2" style="width:25%;"><strong>Extent (N,S,E,W): </strong></td><td>${feature_ids[id].extent}</td></tr>
  <tr><td colspan="2" style="width:25%;"><strong>Geographical center (lat,lon): </strong></td><td>${feature_ids[id].latlon}</td></tr>
  <tr><td colspan="2" style="width:25%;"><strong>Access constraint: </strong></td><td>${feature_ids[id].access_constraint}</td></tr>
  <tr><td colspan="2" style="width:25%;"><strong>Use constraint: </strong></td><td>${feature_ids[id].use_constraint}</td></tr>
  <tr><td style="width:10%;" rowspan="4"><strong>Data Access</strong></td><td>HTTP access: </td><td><a href="${feature_ids[id].url_h}">${feature_ids[id].url_h}</a></td></tr>
  <tr><td>OPeNDAP access: </td><td><a href="${feature_ids[id].url_o}.html">${feature_ids[id].url_o}</a></td></tr>
  <tr><td>WMS access: </td><td><a href="${feature_ids[id].url_w}?SERVICE=WMS&REQUEST=GetCapabilities">${feature_ids[id].url_w}</a></td></tr>
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
  <tr><td colspan="2" style="width:25%;"><strong>Isotopic Category: </strong></td><td>${feature_ids[id].isotopic}</td></tr>
  <tr><td colspan="2" style="width:25%;"><strong>Keywords: </strong></td><td>${feature_ids[id].keywords}</td></tr>
  <tr><td colspan="2" style="width:25%;"><strong>Collection: </strong></td><td>${feature_ids[id].collection}</td></tr>
  <tr><td colspan="2" style="width:25%;"><strong>Activity Type: </strong></td><td>${feature_ids[id].activity}</td></tr>
  <tr><td colspan="2" style="width:25%;"><strong>Dataset production status: </strong></td><td>${feature_ids[id].ds_prod_status}</td></tr>
  <tr><td colspan="2" style="width:25%;"><strong>Metadata status: </strong></td><td>${feature_ids[id].md_status}</td></tr>
</table>
</div>
</div>

<div class="panel">
<div id="md-access-${id}" style="background-color:white; overflow-y: hidden; height: 0px" class="collapse">
<table class="cvl-table">
  <tr><td style="width:20%;"><strong>HTTP access: </strong></td><td><a href="${feature_ids[id].url_h}">${feature_ids[id].url_h}</a></td></tr>
  <tr><td style="width:20%;"><strong>OPeNDAP access: </strong></td><td><a href="${feature_ids[id].url_o}.html">${feature_ids[id].url_o}</a></td></tr>
  <tr><td style="width:20%;"><strong>WMS access: </strong></td><td><a href="${feature_ids[id].url_w}?SERVICE=WMS&REQUEST=GetCapabilities">${feature_ids[id].url_w}</a></td></tr>
  <tr><td style="width:20%;"><strong>ODATA access: </strong></td><td><a href="${feature_ids[id].url_od}">${feature_ids[id].url_od}</a></td></tr>
</table>
</div>
</div>

</div>
</div>

<div id="md-ts-${id}" style="background-color:white; overflow-y: hidden; height: 0px" class="collapse">
<select name="var_list" id="var_list" onchange="plot_ts('${feature_ids[id].url_o}');">
     <option>Choose a variable</option>
</select>

<div id="tsplot"></div>

</div>
`;

        if(true){
           if(feature_ids[id].thumb !==''){
        content.innerHTML += feature_ids[id].title+"<a target=\"_blank\" href=\""+site_name+"/metsis/map/wms?dataset="+feature_ids[id].id+"&solr_core="+feature_ids[id].core+"\"><img class=\"cvl-thumb\" style=\"padding: 0.8em;\"src=\""+feature_ids[id].thumb+"\"></a></br>";
        //content.innerHTML += feature_ids[id].title+"<img class=\"cvl-thumb\" style=\"padding: 0.8em;\"src=\""+feature_ids[id].thumb+"\"></a></br>";
           }
        tooltip.innerHTML += markup;  
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
        related_info: extracted_info[i12][8][0],
        iso_keys_coll_act: extracted_info[i12][9],
        info_status: extracted_info[i12][10],
        data_center: extracted_info[i12][11],
        citation: extracted_info[i12][12],
        has_ts: extracted_info[i12][13],
        constraints: extracted_info[i12][14],
        core: extracted_info[i12][15],
  });
  iconFeaturesPol.push(iconFeaturePol);

  if ((extracted_info[i12][1]).includes("S1") || (extracted_info[i12][1]).includes("S2")) {
     iconFeaturePol.setStyle(iconStyleGr);
  }else{
     iconFeaturePol.setStyle(iconStyleBl);
  }
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
        related_info: extracted_info[i12][8][0],
        iso_keys_coll_act: extracted_info[i12][9],
        info_status: extracted_info[i12][10],
        data_center: extracted_info[i12][11],
        citation: extracted_info[i12][12],
        has_ts: extracted_info[i12][13],
        constraints: extracted_info[i12][14],
        core: extracted_info[i12][15],
    });

    iconFeaturesPin.push(iconFeaturePin);
    if ((extracted_info[i12][2][0] !== extracted_info[i12][2][1]) || (extracted_info[i12][2][2] !== extracted_info[i12][2][3])) {
       if ((extracted_info[i12][1]).includes("S1") || (extracted_info[i12][1]).includes("S2")) {
          iconFeaturePin.setStyle(iconStylePGr);
       }else{
       iconFeaturePin.setStyle(iconStyleP1);
       }
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
id_tooltip_h()

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


function fetch_ts_variables(url_o, md_ts_id) {
  fetch('http://'+ts_ip+'/ncplot/plot?get=param&resource_url='+url_o)
  .then(response => response.json())
  .then(data => {
    //clear options
    var opts = document.getElementById("var_list");
    var length = opts.options.length;
    for (i = length-1; i > 0; i--) {
       select.options[i] = null;
    }
    for (const variable of data.y_axis) {
      var el = document.createElement("option");
      el.textContent = variable;
      el.value = variable;
      document.getElementById(md_ts_id).children[0].appendChild(el);
    }
  });
}

function plot_ts(url_o) {
  let loader =  '<img id="ts-plot-loader" src="/'+path+'/icons/loader.gif">';
  document.getElementById('tsplot').innerHTML = loader;
  var variable = document.getElementById("var_list").value;
  fetch('http://'+ts_ip+'/ncplot/plot?get=plot&resource_url='+url_o+'&variable='+variable)
  .then(function (response) {
      return response.json();
  })
  .then(function (item) {
      Bokeh.embed.embed_item(item);
      document.getElementById('tsplot').innerHTML = '';
  })
}


//function addRow() {
//     var table = document.getElementById("list");
//     var one = JSON.parse(localStorage["createEvent"]);
//     for (var i = 0; i < one.length; i++) {
//         var this_tr = document.createElement("tr");
//         for (var j=0; j < one[i].length; j++) {
//             var this_td = document.createElement("td");
//             var text = document.createTextNode(one[i][j]);
//             this_td.appendChild(text);
//             this_tr.appendChild(this_td);
//         }
//         table.appendChild(this_tr);
//}

