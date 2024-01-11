import * as d3scale from "d3-scale";
import {format as d3format} from "d3-format";
import {d3Formatter} from "~/utils/macros.jsx";
const widths = {
    '1/3': 236,
    '2/3': 420,
    '1/2': 420,
    '2': 420,
    '1': 420,
    [undefined]: 420
}
export const drawLegend = (layer, newCanvas, mbCanvas) => {
    if(layer.showLegend === false) return null;

    const context = newCanvas.getContext("2d")
    context.drawImage(mbCanvas, 0, 0);

    let x = 0,
        y = 20,
        h = layer.legend.title ? 80 : 50;
    context.fillStyle = 'white'
    context.roundRect(x, y, widths[layer?.size] + 15, h, 5);
    context.fill();

    if(layer.legend.title){
        context.font = layer?.size === '1/3' ? "1rem Arial" : "1rem Arial";
        context.fillStyle = '#232323';
        y += 20;

        const text = layer.legend.title;
        context.fillText(text, x + 10, y, widths[layer?.size]);
        y += 10
    }

    x += 10
    y += 10

    const w = widths[layer.size] / (layer.legend.range.length + 1.1);
    layer.legend.range.forEach((c, i) => {
        context.fillStyle = c;
        context.fillRect(x + i * w, y, w, 20);
    })

    // No data legend box
    context.fillStyle = '#d0d0ce';
    context.fillRect(5 + x + layer.legend.range.length * w, y, w, 20);

    let scale;

    // eslint-disable-next-line default-case
    switch (layer.legend.type) {
        case "quantile":
            scale = d3scale.scaleQuantile()
                .domain(layer.legend.domain)
                .range(layer.legend.range);
            break;
        case "quantize":
            scale = d3scale.scaleQuantize()
                .domain(layer.legend.domain)
                .range(layer.legend.range);
            break;
        case "threshold":
            scale = d3scale.scaleThreshold()
                .domain(layer.legend.domain)
                .range(layer.legend.range);
            break;
    }

    const format = (typeof layer.legend.format === "function") ?
        layer.legend.format :
        d3Formatter(layer.legend.format);

    x += 3;
    y += 33;
    context.fillStyle = '#232323'
    context.font = layer?.size === '1/3' ? "10px Arial" : "11px Arial";
    context.textAlign = "right";
    layer.legend.range.forEach((c, i) => {
        const text = format(scale?.invertExtent(c)[1]);
        context.fillText(text, x + w + i * w, y);
    })

    // No data text
    const text = 'N/A';
    context.fillText(text, 5 + x + w + layer.legend.range.length * w, y);

    return 0;
}