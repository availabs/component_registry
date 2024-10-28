import get from "lodash/get";
import { LayerContainer } from "~/modules/avl-maplibre/src";
import { getColorRange } from "~/modules/avl-components/src";
import {d3Formatter} from "../../../utils/macros.jsx";
import {drawLegend} from "./drawLegendCircles.jsx";
import union from '@turf/union'
import centroid from '@turf/centroid'


class CirclesOptions extends LayerContainer {
  constructor(props) {
    super(props);
  }

  name = "ccl";
  id = "ccl";
  data = [];
  sources = [
    {
      id: "counties",
      source: {
        "type": "vector",
        "url": "https://tiles.availabs.org/data/tiger_carto.json"
      },
    },
    {
      id: "cousub-label-points",
      source: {
        "type": "geojson",
        "data": {
          "type": "FeatureCollection",
          "features": []
        }
      }
    },
    {
      id: "tracts",
      source: {
        "type": "vector",
        "url": "https://tiles.availabs.org/data/tl_2020_36_tract.json"
      },
    },
    {
      id: "cosubs",
      source: {
         "type": "vector",
         "tiles": [
            "https://graph.availabs.org/dama-admin/hazmit_dama/tiles/1003/{z}/{x}/{y}/t.pbf?cols=substring(geoid, 1, 5) as geoid,namelsad"
         ],
         "format": "pbf"
      }
    },
    {
      id: "circles",
      source: {
        "type": "geojson",
        data: {
          type: 'FeatureCollection',
          features: [],
        }
      },
    },

  ];

  layers = [
    {
      "id": "counties",
      "source": "counties",
      "source-layer": "s365_v778",
      "type": "fill",
      "paint": {
        "fill-color": '#e1e1e1'
      }
    },
    {
      "id": "counties-line",
      "source": "counties",
      "source-layer": "s365_v778",
      "type": "line",
      paint: {
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5, 2,
          22, 4
        ],
        "line-color": "#000",
        "line-opacity": 0.5
      }
    },
    {
      "id": "cosubs-line",
      "source": "cosubs",
      "source-layer": "view_1003",
      "type": "line",
      "paint": {
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5, 0.5,
          22, 1.5
        ],
         "line-dasharray": [2, 2],
        "line-color": "#999",
        "line-opacity": 0.7
      }
    },
    {
      "id": "tracts",
      "source": "tracts",
      "source-layer": "tl_2020_36_tract",
      "type": "fill",
      "paint": {
        "fill-color": '#e1e1e1'
      }
    },
    {
      "id": "tracts-line",
      "source": "tracts",
      "source-layer": "tl_2020_36_tract",
      "type": "line",
      "paint": {
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5, 0.5,
          22, 2
        ],
        "line-color": "#ffffff",
        "line-opacity": 0.3
      }
    },
    {
      "id": "circles",
      "source": "circles",
      "type": "circle",
      "paint": {
        'circle-color': ['get', 'color'],
        'circle-stroke-color': ['get', 'borderColor'],
        'circle-stroke-width': 1,
        'circle-opacity': 0.5,
        'circle-radius': ['get', 'radius'],
      }
    },
    // {
    //   "id": "label-points",
    //   "source": "cousub-label-points",
    //   "type": "circle",
    //   "paint": {
    //     'circle-color': '#000',
    //     'circle-stroke-width': 1,
    //     'circle-opacity': 0.5,
    //     'circle-radius': 3,
    //   }
    // },
    {
      "id": "cousub-labels",
      "source": "cousub-label-points",
      'type': 'symbol',
      'layout': {
          'text-field': ['get', 'namelsad'],
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
          'text-radial-offset': 0.5,
          'text-justify': 'auto',
          'text-size': 10,
      },
      'paint': {
        'text-color': '#343434'
      }
    },
  ];

  legend = {
    Title: e => '',
    type: "threshold",
    format: "0.2s",
    domain: [0, 25, 50, 75, 100],
    range: getColorRange(5, "RdYlGn", false),
    show: true
  };

  // onHover = {
  //   layers: ['circles'],
  //   HoverComp: ({ data, layer }) => {
  //     return (
  //       <div style={{ maxHeight: "400px" }} className={`rounded relative px-1 overflow-auto scrollbar-sm bg-white`}>
  //         {
  //           data?.length && data.map((d, i) =>
  //             d.map(row => (
  //                 <div key={i} className="flex border border-blue-300">
  //                   {
  //                       row?.length && row.map((d, ii) =>
  //                           <div key={ii}
  //                                className={`
  //                                 ${ii === 0 ? "flex-1 font-bold" : "overflow-auto scrollbarXsm"}
  //                                 ${row.length > 1 && ii === 0 ? "mr-4" : ""}
  //                                 ${row.length === 1 && ii === 0 ? `border-b-2 text-lg ${i > 0 ? "mt-1" : ""}` : ""}
  //                                 `}>
  //                             {d}
  //                           </div>
  //                       )
  //                   }
  //                 </div>
  //             ))
  //           )
  //         }
  //       </div>
  //     );
  //   },
  //   callback: (layerId, features, lngLat) => {
  //     return features.reduce((a, feature) => {
  //       let { view: currentView, data, dataFormat, idCol = 'event_id' } = this.props;
  //       const fmt = dataFormat || d3Formatter('0.2s');
  //       let record = data.find(d => d[idCol] === feature.properties[idCol]),
  //         response = [
  //           [feature.properties.geoid, ''],
  //           ...Object.keys(record || {})
  //             .filter(key => key !== 'geoid')
  //             .map(key => [key, key === idCol ? get(record, key) : fmt(get(record, key))]),
  //           currentView?.paintFn ? ['Total', fmt(currentView.paintFn(record || {}) || 0)] : null,
  //         ];
  //       return [...a, response];
  //     }, []);
  //   }
  // };

  init(map, falcor, props) {
    map.fitBounds([-125.0011, 24.9493, -66.9326, 49.5904], {duration: 0});
    // map.on('styledata', () => console.log('styling'));
    map.on('idle', async (e) => {
      //console.log('idle')
      const canvas = document.querySelector("canvas.maplibregl-canvas"),
          newCanvas = document.createElement("canvas");

      let img;

      newCanvas.width = canvas.width;
      newCanvas.height = canvas.height;

      const context = newCanvas.getContext("2d");
      // context.beginPath();
      // context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      // context.beginPath();
      // context.drawImage(canvas, 0, 0);

      if(this.props.showLegend){
        await drawLegend({legend: this.legend, showLegend: this.props.showLegend, filters: this.filters, size: this.props.size}, newCanvas, canvas);
      }else{
        context.beginPath();
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        context.beginPath();
        context.drawImage(canvas, 0, 0);
      }
      img = newCanvas.toDataURL();
      this.img = img;
      this.props.change && this.props.change({filters: this.filters, img, bounds: map.getBounds(), legend: this.legend, style: this.style})

    })

  }

  handleMapFocus(map, props) {
    if (props.mapFocus) {
      try {
          map.fitBounds(props.mapFocus, {duration: 0})
      } catch (e) {
        map.fitBounds([-125.0011, 24.9493, -66.9326, 49.5904], {duration: 0});
      }
    } else {
    map.fitBounds([-125.0011, 24.9493, -66.9326, 49.5904], {duration: 0});
    }
  }

  paintMap(map, props) {
    let { geoColors = {}, domain = [], colors = [], title = '', geoLayer = 'counties', geoJson = {} } = props
    this.legend.domain = domain;
    this.legend.range = colors;
    this.legend.title = title;
    const hideLayer = geoLayer === 'counties' ? 'tracts' : 'counties';

    map.setFilter(geoLayer, ["in", ['get', "geoid"], ['literal', Object.keys(geoColors)]]);
    map.setFilter(`${geoLayer}-line`, ["in", ['get', "geoid"], ['literal', Object.keys(geoColors)]]);
    map.setLayoutProperty(hideLayer, 'visibility', 'none');
    map.setLayoutProperty(`${hideLayer}-line`, 'visibility', 'none');
    map.getSource('circles').setData(geoJson);


    const geoids = [...new Set(Object.keys(geoColors).map(geoId => geoId.substring(0, 5)))]
    map.setLayoutProperty(`counties-line`, 'visibility', 'visible');
    map.setFilter(`counties-line`, ["in", ['get', "geoid"], ['literal', geoids]]);
    map.setLayoutProperty(`cosubs-line`, 'visibility', 'visible');
    map.setFilter(`cosubs-line`, ["in", ['get', "geoid"], ['literal', geoids]]);

    let resultFeatures = []
    let sourceFearures = []
    setTimeout(function() {
      //'cosubs'
      resultFeatures = map.queryRenderedFeatures({layers: ['cosubs-line']});
      //sourceFearures = map.querySourceFeatures('cosubs', {'sourceLayer': 'view_1003'});
      let sourceUnion = resultFeatures.reduce((out,curr) => {
        if(!out[curr.properties.namelsad]) {
          out[curr.properties.namelsad] = curr
        } else {
          let unioned = union({type: "FeatureCollection", features: [out[curr.properties.namelsad], curr]})
          out[curr.properties.namelsad] = unioned
          out[curr.properties.namelsad].properties = curr.properties
        }
        return out
      },[])
      //console.log('rendered features', resultFeatures, sourceUnion)
      //console.log('feature label points', ;
      map.getSource('cousub-label-points').setData({
        "type": "FeatureCollection",
        features: Object.values(sourceUnion)
          //.filter(d => sourceNames.includes(d.properties.namelsad))
          .map((feat,i) => { 
            return {
              type: "Feature",
              id: i,
              properties: feat.properties,
              geometry: {
                "type": "Point",
                "coordinates": centroid(feat.geometry).geometry.coordinates//polylabel(feat.geometry.coordinates)
              } 
            }
          })
      });
      // console.log('label features', {
      //   "type": "FeatureCollection",
      //   features: Object.values(sourceUnion)
      //     //.filter(d => sourceNames.includes(d.properties.namelsad))
      //     .map((feat,i) => { 
      //       return {
      //         type: "Feature",
      //         id: i,
      //         properties: feat.properties,
      //         geometry: {
      //           "type": "Point",
      //           "coordinates": centroid(feat.geometry).geometry.coordinates//polylabel(feat.geometry.coordinates)
      //         } 
      //       }
      //     })
      // });
    }, 500);  
  
  }

  receiveProps(props, prev, map, falcor) {
    this.paintMap(map, props);
    this.handleMapFocus(map, props);
  }

  // render(map, falcor) {
  // }
}

export const CirclesFactory = (options = {}) => new CirclesOptions(options);