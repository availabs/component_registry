import React, {useEffect, useMemo, useState} from "react";
import {AvlMap} from '~/modules/avl-maplibre/src';
import {ChoroplethCountyFactory} from "./layers/choroplethCountyLayer.jsx";
import * as d3scale from "d3-scale";
import * as d3 from 'd3'
import {d3Formatter} from "~/utils/macros.jsx";
import {CirclesFactory} from "./layers/circlesLayer.jsx";
import {scaleLinear, scaleSqrt} from "d3-scale";

const widths = {
    '1/3': 290,
    '2/3': 370,
    '1/2': 370,
    '2': 370,
    '1': 370,
    [undefined]: 370
}

const RenderChoroplethLegend = ({size, domain, range, fmt, title,}) => {
    const RenderLegendBox = ({value, color, fmt, className, i}) => {
        const width = `${widths[size] / (range.length + 1)}px`,
            heightParent = '40px',
            heightChild = '20px';
        return (
            <div key={i} className={`flex flex-col h-[${heightParent}] ${className}`} style={{width}}>
                <div className={`h-[${heightChild}]`} style={{backgroundColor: color, width}}/>
                <div className={`h-[${heightChild}] text-xs text-right`} style={{width}}>
                    { fmt ? fmt(value) : value }
                </div>
            </div>
        )
    }
    return (
        <div className={`relative w-[${widths[size]}px] float-left mt-[20px] m-5 -mb-[100px] rounded-md`}
             style={{zIndex: 10}}>
            {
                title && <label className={'font-sm pl-2'}>{title}</label>
            }
            <div className={'flex flex-row justify-center inline-block align-middle pt-2.5'}>
                {
                    range.map((r, i) => {
                        return <RenderLegendBox key={i} i={i} value={domain[i]} color={r} fmt={fmt}/>
                    })
                }
                <RenderLegendBox value={'N/A'} color={'#d0d0ce'} className={'ml-1'}/>
            </div>
        </div>
    )
}

const RenderCirclesLegend = ({size, domain, range, fmt, title,}) => {

    const minValue =  Math.min(...domain.filter(d => d));
    const maxValue = Math.max(...domain.filter(d => d));

    const RenderLegendBox = ({value, color, fmt, className}) => {
        var height = 110
        var width = 150

        var svg = d3.select("#legend > svg")
            .attr("width", width)
            .attr("height", height)

        var size = scaleLinear()
            .domain([minValue, maxValue])
            .range(range)

        // Add legend: circles
        var valuesToShow = [minValue, maxValue]
        var xCircle = 60
        var xLabel = 120
        var yCircle = 105
        svg
            .selectAll("legend")
            .data(valuesToShow)
            .enter()
            .append("circle")
            .attr("cx", xCircle)
            .attr("cy", function(d){ return yCircle - +size(d) } )
            .attr("r", function(d){ return +size(d) })
            .style("fill", "none")
            .attr("stroke", "#3f3f3f")

        // Add legend: segments
        svg
            .selectAll("legend")
            .data(valuesToShow)
            .enter()
            .append("line")
            .attr('x1', function(d){ return xCircle + size(d) } )
            .attr('x2', xLabel)
            .attr('y1', function(d){ return yCircle - size(d) } )
            .attr('y2', function(d){ return yCircle - size(d) } )
            .attr('stroke', 'black')
            .style('stroke-dasharray', ('2,2'))

        // Add legend: labels
        svg
            .selectAll("legend")
            .data(valuesToShow)
            .enter()
            .append("text")
            .attr('x', xLabel)
            .attr('y', function(d){ return yCircle - size(d) } )
            .text( function(d){ return fmt(d) } )
            .style("font-size", 12)
            .attr('alignment-baseline', 'middle')
    }

    return (
        <div className={`absolute float-left mt-[20px] m-5 rounded-md`}
             style={{zIndex: 10}}>
            {
                title && <label className={'font-md pl-2'}>{title}</label>
            }
            <div className={'flex flex-col justify-center inline-block align-middle pt-2.5'}>
                <div id="legend"><svg id={'legend_svg'} xmlns="http://www.w3.org/2000/svg"/></div>
                <RenderLegendBox value={maxValue} fmt={fmt}/>
            </div>
        </div>
    )
}

const DrawLegend = ({
                        domain=[],
                        range=[],
                        title,
                        scaleType = 'quantile',
                        type = 'Choropleth',
                        format = '0.2s',
                        size,
                        show = true
}) => {
    if(!show) return null;

    let scale;
    switch (scaleType) {
        case "linear":
            scale = scaleLinear()
                .domain([Math.min(...domain), Math.max(...domain)])
                .range(range);
            break;
        case "quantile":
            scale = d3scale.scaleQuantile()
                .domain(domain)
                .range(range);
            break;
        case "quantize":
            scale = d3scale.scaleQuantize()
                .domain(domain)
                .range(range);
            break;
        case "threshold":
            scale = d3scale.scaleThreshold()
                .domain(domain)
                .range(range);
            break;

    }

    const fmt = (typeof format === "function") ? format : d3Formatter(format);

    return type === 'Choropleth' ?
        <RenderChoroplethLegend domain={domain} range={range} fmt={fmt} size={size} title={title}/> :
        <RenderCirclesLegend domain={domain} range={range} fmt={fmt} size={size} title={title}/>

}
export const RenderMap = ({falcor, layerProps, legend, interactive=true, layers=['Choropleth']}) => {
    const layersMap = {
        Choropleth: ChoroplethCountyFactory,
        Circles: CirclesFactory
    }

    const mapLayers = React.useRef(
        layers.map(l => layersMap[l]())
    );

    return (
        <>
            <DrawLegend {...legend} />
            <AvlMap
                falcor={falcor}
                mapOptions={{
                    interactive: interactive,
                    navigationControl: false,
                    styles: [
                        {
                            name: 'blank',
                            style: {
                                sources: {},
                                version: 8,
                                layers: [{
                                    "id": "background",
                                    "type": "background",
                                    "layout": {"visibility": "visible"},
                                    "paint": {"background-color": 'rgba(208, 208, 206, 0)'}
                                }]
                            }
                        },
                        {
                            name: "Light",
                            style: "https://api.maptiler.com/maps/dataviz-light/style.json?key=mU28JQ6HchrQdneiq6k9"
                        }]

                }}
                navigationControl={false}
                layers={mapLayers.current}
                layerProps={layerProps}
                CustomSidebar={() => <div/>}
            />
        </>
    )
}