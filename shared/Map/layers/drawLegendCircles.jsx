import React from 'react'
import * as d3scale from "d3-scale";
import {format as d3format} from "d3-format";
import {d3Formatter} from "~/utils/macros.jsx";
import {scaleLinear} from "d3-scale";
const widths = {
    '1/3': 236,
    '2/3': 420,
    '1/2': 420,
    '2': 420,
    '1': 420,
    [undefined]: 420
}

function SVGToImage(settings, context, canvas){
    let _settings = {
        svg: null,
        x: 0,
        y: 0,
        // Usually all SVG have transparency, so PNG is the way to go by default
        mimetype: "image/png",
        quality: 0.92,
        width: "auto",
        height: "auto",
        outputFormat: "base64"
    };

    // Override default settings
    for (let key in settings) { _settings[key] = settings[key]; }

    return new Promise(function(resolve, reject){
        let svgNode;

        // Create SVG Node if a plain string has been provided
        if(typeof(_settings.svg) == "string"){
            // Create a non-visible node to render the SVG string
            let SVGContainer = document.createElement("div");
            SVGContainer.style.display = "none";
            SVGContainer.innerHTML = _settings.svg;
            svgNode = SVGContainer.firstElementChild;
        }else{
            svgNode = _settings.svg;
        }

        let svgXml = new XMLSerializer().serializeToString(svgNode);
        let svgBase64 = "data:image/svg+xml;base64," + btoa(svgXml);

        const image = new Image();

        image.onload = function(){
            let finalWidth, finalHeight;

            // Calculate width if set to auto and the height is specified (to preserve aspect ratio)
            if(_settings.width === "auto" && _settings.height !== "auto"){
                finalWidth = (this.width / this.height) * _settings.height;
                // Use image original width
            }else if(_settings.width === "auto"){
                finalWidth = this.naturalWidth;
                // Use custom width
            }else{
                finalWidth = _settings.width;
            }

            // Calculate height if set to auto and the width is specified (to preserve aspect ratio)
            if(_settings.height === "auto" && _settings.width !== "auto"){
                finalHeight = (this.height / this.width) * _settings.width;
                // Use image original height
            }else if(_settings.height === "auto"){
                finalHeight = this.naturalHeight;
                // Use custom height
            }else{
                finalHeight = _settings.height;
            }


            // Render image in the canvas
            // console.log('drawing', finalHeight, finalWidth)
            context.drawImage(this, settings.x, settings.y, finalWidth, finalHeight);


                // Fullfil and Return the Base64 image
                resolve(canvas.toDataURL(_settings.mimetype, _settings.quality));

        };

        // Load the SVG in Base64 to the image
        image.src = svgBase64;
    });
}

export const drawLegend = async (layer, newCanvas, mbCanvas) => {
    if(layer.showLegend === false) return null;

    const context = newCanvas.getContext("2d")

    let x = 0,
        y = 20,
        h = 130,
        w = widths[layer?.size];
    if(layer.legend.title){
        context.font = layer?.size === '1/3' ? "1rem Arial" : "1rem Arial";
        context.fillStyle = '#232323';
        y += 20;

        const text = layer.legend.title;
        context.fillText(text, x + 10, y, w);
        y += 10
    }

    var svgElement =  document.getElementById("legend_svg");
    let {width, height} = svgElement.getBBox();
    await SVGToImage({
        // 1. Provide the SVG DOM element
        svg: document.getElementById("legend_svg"),
        // 2. Provide the format of the output image
        mimetype: "image/png",
        // 3. Provide the dimensions of the image if you want a specific size.
        //  - if they remain in auto, the width and height attribute of the svg will be used
        //  - You can provide a single dimension and the other one will be automatically calculated
        // width: "auto",
        // height: "auto",
        x,
        y,
        width,
        height,
        // 4. Specify the quality of the image
        quality: 1,
        // 5. Define the format of the output (base64 or blob)
        outputFormat: "base64"
    }, context, newCanvas).then(function(outputData){
        // If using base64 (outputs a DataURL)
        //  data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfQAAAH0...
        // Or with Blob (Blob)
        //  Blob {size: 14353, type: "image/png"}
        // console.log(outputData);
        // const img = new Image();
        // img.src = outputData;
        // img.alt = ' ';
        // context.drawImage(img, 0, 0);
        context.drawImage(mbCanvas, 0, 0);

    }).catch(function(err){
        // Log any error
        console.error(err);
    });



    return 0;
}