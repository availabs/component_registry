import React, {useMemo} from "react";
import {fnum, fnumIndex, fnumToNumber, HoverComp, range} from "~/utils/macros.jsx";
import {Link} from "react-router-dom";
import {Attribution} from "../../shared/attribution.jsx";
import get from "lodash/get.js";
import {BarGraph} from "~/modules/avl-graph/src/index.js";

const blockClass = `bg-slate-100 p-5 text-center flex flex-col border rounded-md`

export const RenderCensusBarChart = ({
                                         title, data = [], geoid
                                     }) => {
    const maxValue = Math.max(...data.map(d => d[geoid]))

    return (
        <>
            <label>{title}</label>
            <BarGraph
                key={"id"}
                data={data}
                keys={[geoid]}
                indexBy={"id"}
                xScale={{domain: data.map(d => d.id)}}
                axisBottom={{tickDensity: 3, axisColor: '#000', axisOpacity: 0, rotateDeg: -90}}
                yScale={{domain: [0, maxValue]}}
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
                // colors={(value, ii, d, key) => {
                //     return key?.split('_')[0] === 'Non-declared Disasters' ? nonDeclaredDisastersColor :
                //         get(hazardsMeta, [d[`${key?.split('_')[0]}_nri_category`], 'color'], nonDeclaredDisastersColor)
                // }}
                hoverComp={{
                    HoverComp: HoverComp,
                    valueFormat: fnumIndex,
                    // keyFormat: k => labels?.[k]?.label || k
                }}
                // groupMode={"stacked"}
            />
        </>
    )
};