// Creating map object
var myMap = L.map("map", {
    center: [37.8, -96],
    zoom: 4
});


// Adding tile layer
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/dark-v10', // https://docs.mapbox.com/api/maps/styles/
    tileSize: 512,
    zoomOffset: -1,
    accessToken: API_KEY
}).addTo(myMap);


// Load in GeoJson data
var geoData = "static/data/dma_shp.json";
var dmaData = "static/data/dma_info.json";

var geojson;
var dmajson;



// // Function for color
// function getColor(d) {
//     return d > 2.8 ? '#bd0026' :
//         d > 2.4 ? '#f03b20' :
//         d > 2.0 ? '#fd8d3c' :
//         d > 1.8 ? '#feb24c' :
//         d > 1.4 ? '#fed976' :
//         '#ffffb2';
// } // END of getColor


// var marker = new L.marker([50.93090893614901, -119.09580429108364], { opacity: 0 }); //opacity may be set to zero
// marker.bindTooltip(`<h5>Children's Zyrtec at Family Dollar </h5>
// <h6>5.9.2021 - 9.26.2021</h6>`, { permanent: true, className: "my-label", offset: [0, 0] });
// marker.addTo(myMap);

// function highlight state when hovered with mouse
function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 3,
        color: 'black',
        dashArray: '',
        fillOpacity: 0.5
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
    info.update(layer.feature.properties);
}

// what happens on mouse out
function resetHighlight(e) {
    geojson.resetStyle(e.target);

    info.update();
}

var info = L.control({ position: 'bottomleft' });


//Grab data with d3
d3.json(geoData, data => {
    console.log(data.features)

    d3.json(dmaData, data_legend => {

        const vcr_array = Object.values(data_legend);
        vcr_array.sort();

        const len = vcr_array.length;

        var per16 = Math.floor(len * .166) - 1;
        var per33 = Math.floor(len * .332) - 1;
        var per50 = Math.floor(len * .498) - 1;
        var per66 = Math.floor(len * .664) - 1;
        var per83 = Math.floor(len * .83) - 1;

        function getColor(d) {
            return d > vcr_array[per83] ? '#bd0026' :
                d > vcr_array[per66] ? '#f03b20' :
                d > vcr_array[per50] ? '#fd8d3c' :
                d > vcr_array[per33] ? '#feb24c' :
                d > vcr_array[per16] ? '#fed976' :
                '#ffffb2';
        } // END of getColor      

        for (let i = 0; i < data.features.length; i++) {

            const curr_dma = data.features[i].properties.dma
            var filtered = Object.fromEntries(Object.entries(data_legend).filter(([k, v]) => k == curr_dma));

            for (var key in filtered) {
                const key_value = filtered[key]
                data.features[i].properties.vcr_value = key_value;
            }
        };


        geojson = L.geoJson(data, {
            onEachFeature(feature, layer) {
                layer.on({
                    mouseover: highlightFeature,
                    mouseout: resetHighlight,
                    click: function(event) {
                        myMap.fitBounds(event.target.getBounds()); // zoom feature
                    }
                });
            },
            style(feature) {
                return {
                    fillColor: getColor(feature.properties.vcr_value),
                    weight: 1,
                    opacity: 0.7,
                    color: 'black',
                    fillOpacity: 0.8
                };
            },
        }).addTo(myMap)

        info.onAdd = function(myMap) {
            this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
            this.update();
            return this._div;
        };

        // method that we will use to update the control based on feature properties passed
        info.update = function(props) {
            this._div.innerHTML = '<h5>Visit Conversion Report:</h5>' + (props ?
                '<b>' + '<h6>DMA:</h6>' + props.dma + '<h6>Name:</h6>' + props.NAME + '<h6>VCR %:</h6>' + props.vcr_value :
                'Hover over a DMA');
        };

        info.addTo(myMap);

        // // Watermark logo aki
        // L.Control.Watermark = L.Control.extend({
        //     onAdd: function(map) {
        //         var img = L.DomUtil.create('img');

        //         img.src = 'static/images/AkiLogo_Color.png';
        //         img.style.width = '80px';

        //         return img;
        //     },

        //     onRemove: function(myMap) {
        //         // Nothing to do here
        //     }
        // });

        // L.control.watermark = function(opts) {
        //     return new L.Control.Watermark(opts);
        // }

        // L.control.watermark({ position: 'topright' }).addTo(myMap);

        // Create legend
        // https://gis.stackexchange.com/questions/141745/horizontal-legend-leaflet-js
        var legend = L.control({ position: 'topright' });

        legend.onAdd = function(map) {

            var div = L.DomUtil.create('div', 'info legend'),
                grades = [0, vcr_array[per16], vcr_array[per33], vcr_array[per50],
                    vcr_array[per66], vcr_array[per83]
                ],
                labels = [];


            //https://codepen.io/haakseth/pen/KQbjdO
            div.innerHTML += "<h4>VCR %</h4>"


            // loop through our density intervals and generate a label with a colored square for each interval
            for (var i = 0; i < grades.length; i++) {
                div.innerHTML +=
                    '<i style="background:' + getColor(grades[i]) + '"></i> ' +
                    grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
            }

            return div;
        };

        legend.addTo(myMap);

    })
})