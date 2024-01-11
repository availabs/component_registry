import get from "lodash/get";
import { LayerContainer } from "~/modules/avl-maplibre/src";
import { getColorRange } from "~/modules/avl-components/src";
import {drawLegend} from "./drawLegend.jsx";
import {d3Formatter} from "~/utils/macros.jsx";

class EALChoroplethOptions extends LayerContainer {
  constructor(props) {
    super(props);
  }

  name = "ccl";
  id = "ccl";
  data = [];
  sources = [
    // {
    //   id: "states",
    //   source: {
    //     "type": "vector",
    //     "url": "https://api.mapbox.com/v4/mapbox.satellite/{x}/{y}/{z}.webp?sku=101PRSiEvYwSK&access_token=tk.eyJ1IjoiYW0zMDgxIiwiZXhwIjoxNjg2NTk1ODM1LCJpYXQiOjE2ODY1OTIyMzUsInNjb3BlcyI6WyJlc3NlbnRpYWxzIiwic2NvcGVzOmxpc3QiLCJtYXA6cmVhZCIsIm1hcDp3cml0ZSIsInVzZXI6cmVhZCIsInVzZXI6d3JpdGUiLCJ1cGxvYWRzOnJlYWQiLCJ1cGxvYWRzOmxpc3QiLCJ1cGxvYWRzOndyaXRlIiwic3R5bGVzOnRpbGVzIiwic3R5bGVzOnJlYWQiLCJmb250czpsaXN0IiwiZm9udHM6cmVhZCIsImZvbnRzOndyaXRlIiwic3R5bGVzOndyaXRlIiwic3R5bGVzOmxpc3QiLCJzdHlsZXM6ZG93bmxvYWQiLCJzdHlsZXM6cHJvdGVjdCIsInRva2VuczpyZWFkIiwidG9rZW5zOndyaXRlIiwiZGF0YXNldHM6bGlzdCIsImRhdGFzZXRzOnJlYWQiLCJkYXRhc2V0czp3cml0ZSIsInRpbGVzZXRzOmxpc3QiLCJ0aWxlc2V0czpyZWFkIiwidGlsZXNldHM6d3JpdGUiLCJkb3dubG9hZHM6cmVhZCIsInZpc2lvbjpyZWFkIiwidmlzaW9uOmRvd25sb2FkIiwibmF2aWdhdGlvbjpkb3dubG9hZCIsIm9mZmxpbmU6cmVhZCIsIm9mZmxpbmU6d3JpdGUiLCJzdHlsZXM6ZHJhZnQiLCJmb250czptZXRhZGF0YSIsInNwcml0ZS1pbWFnZXM6cmVhZCIsImRhdGFzZXRzOnN0dWRpbyIsImN1c3RvbWVyczp3cml0ZSIsImNyZWRlbnRpYWxzOnJlYWQiLCJjcmVkZW50aWFsczp3cml0ZSIsImFuYWx5dGljczpyZWFkIl0sImNsaWVudCI6Im1hcGJveC5jb20iLCJsbCI6MTY2NzMyNjMxNDMwMSwiaXUiOm51bGwsImVtYWlsIjoiYW0zMDgxQGdtYWlsLmNvbSJ9.MUxuViB3XLGcyKfIvNuP3A"
    //   },
    // },
    {
      id: "counties",
      source: {
        "type": "vector",
        "url": "https://dama-dev.availabs.org/tiles/data/hazmit_dama_s365_v778_1694455888142.json"
      },
    },
    {
      id: "tracts",
      source: {
        "type": "vector",
        "url": "https://tiles.availabs.org/data/tl_2020_36_tract.json"
      },
    }
  ];

  layers = [
    {
      "id": "counties",
      "source": "counties",
      "source-layer": "s365_v778",
      "type": "fill",
      "paint": {
        "fill-color": '#e1e1e1',
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
      "id": "counties-line",
      "source": "counties",
      "source-layer": "s365_v778",
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