import React, {useMemo} from "react";
import {fnum, fnumIndex, fnumToNumber, HoverComp, range} from "~/utils/macros.jsx";
import {Link} from "react-router-dom";
import {Attribution} from "../../shared/attribution.jsx";
import get from "lodash/get.js";
import {LineGraph} from "~/modules/avl-graph/src/index.js";

const colors = ['#ff0404', '#18e71a', '#7a3a00', '#192e98',
    '#b804ff', '#e7186e', '#595959', '#185e57']
const LegendFactory = ({data, colors, getLegendLabel}) =>
    (
        <div>
            {
                data?.map((d, i) =>
                    <div className={'flex flex-row items-center space-between'} key={ i }>
                        <div className={`w-[10px] h-[10px] rounded-full`} style={{backgroundColor: colors[i]} }/>
                        <label className={'text-sm ml-2'}>
                            { d.id }
                        </label>
                    </div>
                )
            }
        </div>
    )

export const RenderCensusLineChart = ({
                                         title, data = [], geoid, sumType
                                     }) => {
    return (
        <>
            <label>{title}</label>
            <div className={'flex flex-row h-[300px]'}>
                <LineGraph
                    key={"id"}
                    data={data}
                    colors={colors}
                    // xScale={{domain: data.map(d => d.x)}}
                    axisBottom={{tickDensity: 3, axisColor: '#000', axisOpacity: 0.1, showGridLines: true}}
                    // yScale={{domain: [0, maxValue]}}
                    axisLeft={{
                        format: d => fnumIndex(d, sumType === 'pct' ? 2 : 0),
                        gridLineOpacity: 0.1,
                        showGridLines: true,
                        ticks: 5,
                        // tickValues: [5_000_000, 500_000_000, 700_000_000, 10_000_000_000, 20_000_000_000],
                        axisColor: '#000',
                        axisOpacity: 0
                    }}
                    // paddingInner={0.1}
                    // // colors={(value, ii, d, key) => {
                    // //     return key?.split('_')[0] === 'Non-declared Disasters' ? nonDeclaredDisastersColor :
                    // //         get(hazardsMeta, [d[`${key?.split('_')[0]}_nri_category`], 'color'], nonDeclaredDisastersColor)
                    // // }}
                    // hoverComp={{
                    //     HoverComp: HoverComp,
                    //     valueFormat: fnumIndex,
                    //     // keyFormat: k => labels?.[k]?.label || k
                    // }}
                    // groupMode={"stacked"}
                />
                <LegendFactory
                    data={data}
                    colors={colors}
                />
            </div>
        </>
    )
};