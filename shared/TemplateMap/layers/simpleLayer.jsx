import get from "lodash/get";
import { LayerContainer } from "~/modules/avl-maplibre/src";
import { getColorRange } from "~/modules/avl-components/src";
import {drawLegend} from "./drawLegend.jsx";
import {d3Formatter} from "../../../utils/macros.jsx";

export class SimpleMapLayer extends LayerContainer {
  constructor(props) {
    super(props);
  }

  name = "ccl";
  id = "ccl";
  

  legend = {
    Title: e => '',
    type: "threshold",
    format: "0.2s",
    domain: [0, 25, 50, 75, 100],
    range: getColorRange(5, "RdYlGn", false),
    show: false
  };


  init(map, falcor, props) {
    map.fitBounds([-125.0011, 24.9493, -66.9326, 49.5904], {duration: 10});
    map.on('idle', (e) => {
    
      if(this.props.change) {
        const canvas = document.querySelector("canvas.maplibregl-canvas"),
          newCanvas = document.createElement("canvas");

        let img;

        newCanvas.width = canvas.width;
        newCanvas.height = canvas.height;

        const context = newCanvas.getContext("2d")
        context.drawImage(canvas, 0, 0);

        if(this?.legend?.show) {
          console.log('drawLegend', this)
          drawLegend({
            legend: this.legend, 
            showLegend: this.props.showLegend, 
            filters: this.filters, 
            size: this.props.size
          }, newCanvas, canvas);
        }

        //  console.log('idle save', { filters: this.filters, 
        //   img, 
        //   bounds: map.getBounds(),
        //   center: map.getCenter(),
        //   zoom: map.getZoom(),
        //   legend: this.legend,
        //   style: this.style
        // })

        img = newCanvas.toDataURL();
        this.props.change({
          filters: this.filters, 
          img, 
          bounds: map.getBounds(),
          center: map.getCenter(),
          zoom: map.getZoom(),
          style: this.style
        })
      }
    })

  }

  handleMapFocus(map, props) {
    //console.log('handle mapFocus', props.mapFocus)
    if (props.mapFocus) {
      try {
          map.fitBounds(props.mapFocus,{duration: 10})
      } catch (e) {
        map.fitBounds([-125.0011, 24.9493, -66.9326, 49.5904],{duration: 10});
      }
    } else {
    map.fitBounds([-125.0011, 24.9493, -66.9326, 49.5904],{duration: 10});
    }
  }

  paintMap(map, props) {
    let { domain = [], colors = [], title = '', sources = [], layers=[] } = props
    // this is updated for draw legend
    this.legend.domain = domain;
    this.legend.range = colors;
    this.legend.title = title;

    console.time('changing sources and layers')
    console.log('paint map', sources, layers)
    sources.forEach(s => {
      if(!map.getSource(s.id)) {
        map.addSource(s.id,s.source)
      }
    })

    layers.forEach(l => {
      if(map.getLayer(l.id)){
        map.removeLayer(l.id)
      }
      map.addLayer(l)
    })
    console.timeEnd('changing sources and layers')
    // map.setLayoutProperty(`${hideLayer}-line`, 'visibility', 'none');
  }

  receiveProps(props, prev, map, falcor) {
    this.paintMap(map, props);
    this.handleMapFocus(map, props);
  }

  // render(map, falcor) {
  // }
}


export const SimpleMapLayerFactory = (options = {}) => new SimpleMapLayer(options);