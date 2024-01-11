import React, {useMemo} from "react";
import {fnum, fnumIndex, fnumToNumber, HoverComp, range} from "~/utils/macros.jsx";
import {BarGraph} from "~/modules/avl-graph/src/index.js";

const LegendFactory = ({colors, labels}) =>
    (
        <div>
            {
                (Object.keys(colors))?.map((d) =>
                    <div className={'flex flex-row items-center space-between'} key={ d }>
                        <div className={`w-[10px] h-[10px] rounded-full`} style={{backgroundColor: colors[d]} }/>
                        <label className={'text-sm ml-2'}>
                            { labels[d] }
                        </label>
                    </div>
                )
            }
        </div>
    )

export const RenderCensusStackedBarChart = ({
                                         title, data = [], keys = [], geoid
                                     }) => {
    const maxValue = Math.max(...data.reduce((acc, d) => [...acc, keys.reduce((accK, k) => accK + +d[k], 0)], []));
    const labels = data[0]?.keyMap;
    const colors = data[0]?.colorMap;

    return (
        <div>
            <label>{title}</label>
            <div className={'flex flex-row h-[500px]'}>
                <BarGraph
                    key={"index"}
                    data={data}
                    keys={keys}
                    indexBy={"index"}
                    xScale={{domain: data.map(d => d.index)}}
                    axisBottom={{tickDensity: 3, axisColor: '#000', axisOpacity: 0}}
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
                    colors={(value, ii, d, key) => {
                        return colors[key]
                        // return key?.split('_')[0] === 'Non-declared Disasters' ? nonDeclaredDisastersColor :
                        //     get(hazardsMeta, [d[`${key?.split('_')[0]}_nri_category`], 'color'], nonDeclaredDisastersColor)
                    }}
                    hoverComp={{
                        HoverComp: HoverComp,
                        valueFormat: fnumIndex,
                        keyFormat: k => labels?.[k] || k
                    }}
                    groupMode={"stacked"}
                />
                <LegendFactory
                    colors={colors}
                    labels={labels}
                />
            </div>
        </div>
    )
};