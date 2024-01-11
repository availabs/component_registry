import { hazardsMeta } from "~/utils/colors.jsx";
import get from "lodash/get.js";
import {fnum, fnumIndex, fnumToNumber, HoverComp, range} from "~/utils/macros.jsx";
import { Link } from "react-router-dom";
import React from "react";
import { BarGraph } from "~/modules/avl-graph/src/index.js";
import { RenderLegend } from "./RenderLegend.jsx";
import {ButtonSelector} from "../../shared/buttonSelector.jsx";
import {Attribution} from "../../shared/attribution.jsx";

const colNameMapping = {
    swd_population_damage: 'Population Damage',
    fusion_property_damage: 'Property Damage',
    fusion_crop_damage: 'Crop Damage',
    disaster_number: 'Disaster Number',
    swd_ttd: 'Non Declared Total',
    ofd_ttd: 'Declared Total',
};

const nonDeclaredDisastersColor = '#be00ff';

export const RenderBarChart = ({ chartDataActiveView = [], disaster_numbers = [], attributionData, baseUrl, hazard, consequence=`_td` }) => {
    if(!chartDataActiveView?.length) return null;

    const [threshold, setThreshold] = React.useState('Max');
    const minYear = Math.min(...chartDataActiveView.map(d => d.year));
    const maxYear = Math.max(...chartDataActiveView.map(d => d.year));

    const keys = disaster_numbers.map(dn => `${dn}${consequence}`);
    const yearWiseTotals = chartDataActiveView.map(d => keys.reduce((a,c) => a + (+d[c] || 0) ,0));
    const maxValue = Math.max(...yearWiseTotals);
    const maxValueFormatted = +fnumIndex(maxValue, maxValue.toString().length).trim().split(' ')[0];
    const roundingMultiplier = Math.ceil(maxValueFormatted / 5);
    const roundedMaxValue = 5 * roundingMultiplier;
    const multiplier = (n = 100) =>
        (
            Math.floor(maxValue / maxValueFormatted) +
            n - (Math.floor(maxValue / maxValueFormatted) % n || n)
        ) /
        ( Math.floor(maxValueFormatted) === 1 ? 5 : 1);
    const stopPoints = [0.05, 0.5, 0.75];
    const ticks = stopPoints.map(p => roundedMaxValue * p * multiplier());

    const upperLimit = threshold === 'Max' ? maxValue : fnumToNumber(threshold);

    return (
        <div className={`w-full pt-10 my-1 block flex flex-col`} style={{height: "450px"}}>
            <RenderLegend hazard={hazard} nonDeclaredDisastersColor={nonDeclaredDisastersColor}/>
            <ButtonSelector types={[...ticks.map(t => fnumIndex(t, 0)), 'Max']}  type={threshold} setType={setThreshold} size={'large'}/>
            <BarGraph
                key={"numEvents"}
                data={chartDataActiveView}
                keys={keys}
                indexBy={"year"}
                xScale={{domain: range(1996, maxYear)}}
                axisBottom={{tickDensity: 3, axisColor: '#000', axisOpacity: 0}}
                yScale={{domain: [0, upperLimit]}}
                axisLeft={{
                    format: d => fnumIndex(d, 0),
                    gridLineOpacity: 0,
                    showGridLines: true,
                    ticks: 5,
                    // tickValues: [5_000_000, 500_000_000, 700_000_000, 10_000_000_000, 20_000_000_000],
                    axisColor: '#000',
                    axisOpacity: 0
                }}
                paddingInner={0.1}
                colors={(value, ii, d, key) => {
                    return key?.split('_')[0] === 'Non-declared Disasters' ? nonDeclaredDisastersColor :
                        get(hazardsMeta, [d[`${key?.split('_')[0]}_nri_category`], 'color'], nonDeclaredDisastersColor)
                }}
                hoverComp={{
                    HoverComp: HoverComp,
                    valueFormat: fnumIndex,
                    keyFormat: k => colNameMapping[k] || k.replace('_td', '').replace('_cd', '').replace('_pd', '')
                }}
                groupMode={"stacked"}
            />
            <Attribution baseUrl={baseUrl} attributionData={attributionData} />
        </div>
    )
};