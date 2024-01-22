import get from "lodash/get";
import { LayerContainer } from "~/modules/avl-maplibre/src";
import { getColorRange } from "~/modules/avl-components/src";
import {drawLegend} from "./drawLegend.jsx";
import {d3Formatter} from "~/utils/macros.jsx";

class EALChoroplethOptions extends LayerContainer {
  constructor(props) {
    super(props);
  }

  //{"tiles":{"layers":[{"id":"state_2010","type":"fill","paint":{"fill-color":"#0080ff","fill-opacity":0.5},"source":"hazmit_dama_s360_v750_1692038514334","source-layer":"state_2010"},{"id":"county_2010","type":"fill","paint":{"fill-color":"#0080ff","fill-opacity":0.5},"source":"hazmit_dama_s360_v750_1692038514334","source-layer":"county_2010"},{"id":"tract_2010","type":"fill","paint":{"fill-color":"#0080ff","fill-opacity":0.5},"source":"hazmit_dama_s360_v750_1692038514334","source-layer":"tract_2010"},{"id":"cousub_2010","type":"fill","paint":{"fill-color":"#0080ff","fill-opacity":0.5},"source":"hazmit_dama_s360_v750_1692038514334","source-layer":"cousub_2010"},{"id":"state_2020","type":"fill","paint":{"fill-color":"#0080ff","fill-opacity":0.5},"source":"hazmit_dama_s360_v750_1692038514334","source-layer":"state_2020"},{"id":"county_2020","type":"fill","paint":{"fill-color":"#0080ff","fill-opacity":0.5},"source":"hazmit_dama_s360_v750_1692038514334","source-layer":"county_2020"},{"id":"tract_2020","type":"fill","paint":{"fill-color":"#0080ff","fill-opacity":0.5},"source":"hazmit_dama_s360_v750_1692038514334","source-layer":"tract_2020"},{"id":"cousub_2020","type":"fill","paint":{"fill-color":"#0080ff","fill-opacity":0.5},"source":"hazmit_dama_s360_v750_1692038514334","source-layer":"cousub_2020"}],"sources":[{"id":"hazmit_dama_s360_v750_1692038514334","source":{"url":"$HOST/data/hazmit_dama_s360_v750_1692038514334.json","type":"vector"}}]},"layerNames":["state_2010","county_2010","tract_2010","cousub_2010","state_2020","county_2020","tract_2020","cousub_2020"]}

  name = "ccl";
  id = "ccl";
  data = [];
  sources = [
    {
      id: "tiger",
      source: {
        "url":"pmtiles://graph.availabs.org/tiles/hazmit_dama_s360_v750_1692038514334.json",
        "type":"vector"
      }
    },
    {
      id: "counties",
      source: {
        "type": "vector",
        "url": "https://dama-dev.availabs.org/tiles/data/hazmit_dama_s365_v778_1694455888142.json"
      },
    },
    // {
    //   id: "tracts",
    //   source: {
    //     "type": "vector",
    //     "url": "https://tiles.availabs.org/data/tl_2020_36_tract.json"
    //   },
    // }
  ];

  layers = [
    {
      "id": "counties",
      "source": "tiger",
      "source-layer": "county_2020",
      "type": "fill",
      "paint": {
        "fill-color": '#e1e1e1',
      }
    },
    {
      "id": "tracts",
      "source": "tiger",
      "source-layer": "tract_2020",
      "type": "fill",
      "paint": {
        "fill-color": '#e1e1e1'
      }
    },
    {
      "id": "counties-line",
      "source": "tiger",
      "source-layer": "county_2020",
      "type": "line",
      "paint": {
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5, 0.5,
          22, 2
        ],
        "line-color": "#efefef",
        "line-opacity": 0.5
      }
    },
    // {
    //   "id": "tracts-line",
    //   "source": "tracts",
    //   "source-layer": "tl_2020_36_tract",
    //   "type": "line",
    //   "paint": {
    //     "line-width": [
    //       "interpolate",
    //       ["linear"],
    //       ["zoom"],
    //       5, 0.5,
    //       22, 2
    //     ],
    //     "line-color": "#efefef",
    //     "line-opacity": 0.5
    //   }
    // },
  ];

  legend = {
    Title: e => '',
    type: "threshold",
    format: "0.2s",
    domain: [0, 25, 50, 75, 100],
    range: getColorRange(5, "RdYlGn", false),
    show: true
  };

  onClick = {
    layers: ["counties", "tracts"],
    callback: (layerId, features) => {
      this.props.onClick && this.props.onClick(layerId, features)
    }
  }

  // onHover = {
  //   layers: ["counties", "tracts"],
  //   HoverComp: ({ data, layer }) => {
  //     return (
  //       <div style={{ maxHeight: "300px" }} className={`rounded relative px-1 overflow-auto scrollbarXsm bg-white`}>
  //         {
  //           data?.length && data.map((row, i) =>
  //             <div key={i} className="flex">
  //               {
  //                 row?.length && row.map((d, ii) =>
  //                   <div key={ii}
  //                     // style={{maxWidth: '200px'}}
  //                        className={`
  //                   ${ii === 0 ? "flex-1 font-bold" : "overflow-auto scrollbarXsm"}
  //                   ${row.length > 1 && ii === 0 ? "mr-4" : ""}
  //                   ${row.length === 1 && ii === 0 ? `border-b-2 text-lg ${i > 0 ? "mt-1" : ""}` : ""}
  //                   `}>
  //                     {d}
  //                   </div>
  //                 )
  //               }
  //             </div>
  //           )
  //         }
  //       </div>
  //     );
  //   },
  //   callback: (layerId, features, lngLat) => {
  //     return features.reduce((a, feature) => {
  //       let { view: currentView, data } = this.props;
  //       const fmt = d3Formatter('0.2s');
  //       const keyMapping = key => Array.isArray(currentView?.columns) ? key : Object.keys(currentView?.columns || {}).find(k => currentView.columns[k] === key);
  //       let record = data.find(d => d.geoid === feature.properties.geoid),
  //         response = [
  //           [feature.properties.geoid, ''],
  //           ...Object.keys(record || {})
  //             .filter(key => key !== 'geoid')
  //             .map(key => keyMapping(key) ? [keyMapping(key), fmt(get(record, key))] : [fmt(get(record, key))]),
  //           currentView?.paintFn ? ['Total', fmt(currentView.paintFn(record || {}) || 0)] : null,
  //         ];
  //       return response;
  //     }, []);
  //   }
  // };

  init(map, falcor, props) {
    map.fitBounds([-125.0011, 24.9493, -66.9326, 49.5904], {duration: 0});
    map.on('idle', (e) => {
      const canvas = document.querySelector("canvas.maplibregl-canvas"),
          newCanvas = document.createElement("canvas");

      let img;

      newCanvas.width = canvas.width;
      newCanvas.height = canvas.height;

      const context = newCanvas.getContext("2d")
      context.drawImage(canvas, 0, 0);


      drawLegend({legend: this.legend, showLegend: this.props.showLegend, filters: this.filters, size: this.props.size}, newCanvas, canvas);
      img = newCanvas.toDataURL();
      this.img = img;
      this.props.change && this.props.change({filters: this.filters, img, bounds: map.getBounds(), legend: this.legend, style: this.style})

    })

  }

  // fetchData(falcor) {
  //
  // }

  handleMapFocus(map, props) {
    if (props.mapFocus) {
      try {
          map.fitBounds(props.mapFocus, {duration: 0, padding: 50})
      } catch (e) {
        map.fitBounds([-125.0011, 24.9493, -66.9326, 49.5904], {duration: 0});
      }
    } else {
    map.fitBounds([-125.0011, 24.9493, -66.9326, 49.5904], {duration: 0});
    }
  }

  paintMap(map, props) {
    let { geoColors = {}, domain = [], colors = [], title = '', geoLayer = 'counties' } = props
    this.legend.domain = domain;
    this.legend.range = colors;
    this.legend.title = title;

    const hideLayer = geoLayer === 'counties' ? 'tracts' : 'counties';

    map.setLayoutProperty(geoLayer, 'visibility', 'visible');
    map.setFilter(geoLayer, ["in", ['get', "geoid"], ['literal', Object.keys(geoColors)]]);
    map.setPaintProperty(geoLayer, "fill-color", ["get", ["get", "geoid"], ["literal", geoColors]]);

    const geoids = [...new Set(Object.keys(geoColors).map(geoId => geoId.substring(0, 5)))]

    map.setLayoutProperty(`counties-line`, 'visibility', 'visible');
    map.setFilter(`counties-line`, ["in", ['get', "geoid"], ['literal', geoids]]);

    map.setLayoutProperty(hideLayer, 'visibility', 'none');
    // map.setLayoutProperty(`${hideLayer}-line`, 'visibility', 'none');
  }

  receiveProps(props, prev, map, falcor) {
    this.paintMap(map, props);
    this.handleMapFocus(map, props);
  }

  // render(map, falcor) {
  // }
}

export const ChoroplethCountyFactory = (options = {}) => new EALChoroplethOptions(options);