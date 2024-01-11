import get from "lodash/get.js";
import {RenderSvgBar} from "../svgBar.jsx";
import React from "react";
import {hazardsMeta} from "~/utils/colors.jsx";
import {fnumIndex} from "~/utils/macros.jsx";
import {scaleQuantize} from "d3-scale";
import {components} from "react-select";

const palattes = [
    ["#f5b899", "#f8b46f", "#fdd0a2", "#fdae6b",
        "#fd8d3c", "#f16913", "#d94801", "#a63603",
        "#7f2704"],
    ["#f5b899", "#f8b46f", "#ffa342", "#ff8218",
        "#e76100", "#c94e00", "#be4000", "#9d3400",
        "#792606"],
    ["#ffb950", "#FFAD33", "#FF931F", "#FF7E33",
        "#FA5E1F", "#B81702", "#A50104", "#8E0103",
        "#7A0103"],
    ["#FFB600", "#FFAA00", "#FF9E00", "#FF9100",
        "#FF8500", "#FF7900", "#FF6D00", "#FF6000",
        "#FF4800"]
];

const colors = scaleQuantize().domain([0, 101]).range(palattes[2]);

const freqToText = (f, suffix='%') =>
    <span className={"pl-1"}>
        {f}
        <span className={"text-xs pl-1"}>
            {suffix === '%' ? '%' : `events/${suffix === 'daily' ? 'day' : 'yr'}`}
        </span>
    </span>;

export const RenderHazardStatBox = ({
    isTotal,
    hazard,
    statePercentile,
    nationalPercentile,
    hazardPercentileArray,
    hazardPercentile,
    actualLoss,
    actualLossWithPop,
    eal,
    exposure,
    frequency,
    frequencySum,
    numEvents,
    numSevereEvents,
    numFEMADeclared,
    deaths,
    injuries,
    size,
    style,
    visibleCols,
    isGrid = true
}) => {

    const blockClass = {
        large: "flex flex-col pt-2 text-sm",
        small: `flex ${style === 'full' ? `flex-row` : `flex-col`} flex-wrap justify-between pt-2 ${isGrid ? `text-xs` : `text-sm`}`
    };
    const blockWrapper = {
        large: `flex flex-col justify-between shrink-0 ml-5 pt-2`,
        small: `flex flex-col divide-y  ${isGrid ? `text-center` : `text-center`}`
    };
    const valueClass = `font-medium text-gray-800 ${isGrid ? `text-sm` : `text-xl`} overflow-wrap`
    const svgBarHeight = {large: 30, small: 12};
    const svgBarRadius = {large: 20, small: 10};
    const fontSizeInner = {large: "14.5px", small: "12.5px"};
    const fontSizeOuter = {large: "13.5px", small: "11.5px"};


    return (
        <div className={`border border-gray-200 text-gray-900 rounded-lg p-5 ${eal ? `bg-slate-50` : `bg-slate-200`}`}>
            <div className={`w-full border-b-4 rounded flex flex-wrap items-center font-medium tracking-wide uppercase ${isGrid ? `text-base` : `text-lg`}`}
                 style={{borderColor: get(hazardsMeta, [hazard, "color"], "")}}>
                {!isTotal &&
                    <div className={`rounded-full mr-2 mb-0 font-bold ${hazardsMeta[hazard]?.icon}`}
                         style={{
                             height: "15px",
                             width: "15px",
                             color: get(hazardsMeta, [hazard, "color"], "")
                         }}
                    />}
                {isTotal ? "Total" : hazardsMeta[hazard]?.name}
            </div>
            <div className={`w-full ${size === "large" ? `flex flex-row justify-between` : ``}`}>
                <div className={"w-full pr-1"}>
                    {
                        visibleCols.includes('National Percentile Bar') &&
                        <div className={"w-full pt-1"}>
                            <div className={blockWrapper[size]}>
                                <label className={blockClass[size]}>Risk</label>
                            </div>
                            <RenderSvgBar
                                data={[{
                                    label: "",
                                    value: (nationalPercentile)?.toFixed(2),
                                    color: colors(nationalPercentile),
                                    width: nationalPercentile
                                }]}
                                height={svgBarHeight[size]}
                                radius={svgBarRadius[size]}
                                fontSizeInner={fontSizeInner[size]}
                                fontSizeOuter={fontSizeOuter[size]}
                            />
                        </div>
                    }

                    {
                        isTotal && visibleCols.includes('Loss Distribution Bar') &&
                        <div className={"w-full pt-4"}>
                            {
                                <RenderSvgBar
                                    data={(hazardPercentileArray || [])
                                        .map((h, hI) => ({
                                            label: '',
                                            value: h.label,
                                            showValue: true,
                                            valueFloat: 'right',
                                            valueCutoff: 10,
                                            color: h.color,
                                            width: h.value
                                        }))}
                                    width={statePercentile}
                                    height={svgBarHeight[size]}
                                    radius={svgBarRadius[size]}
                                    fontSizeInner={fontSizeInner[size]}
                                    fontSizeOuter={fontSizeOuter[size]}
                                />
                            }
                        </div>
                    }
                </div>
                <div className={blockWrapper[size]}>
                    {
                        visibleCols.includes('Expected Annual Loss (EAL)') &&
                        <div className={blockClass[size]}>
                            <label className={isTotal ? 'break-word w-[25px]' : ''}>
                                {isTotal ? `Expected Annual Loss (EAL)` : `EAL`}
                            </label>
                            <span className={valueClass}>
                                {fnumIndex(eal, 2, true)}
                            </span>
                            {!isTotal && visibleCols.includes('Hazard Percentile Bar') &&
                                <RenderSvgBar
                                    data={[{
                                        label: "",
                                        value: `${hazardPercentile}%`,
                                        color: hazardsMeta[hazard]?.color,
                                        width: hazardPercentile
                                    }]}
                                    height={svgBarHeight[size]}
                                    radius={svgBarRadius[size]}
                                    fontSizeInner={fontSizeInner[size]}
                                    fontSizeOuter={fontSizeOuter[size]}
                                />
                            }
                        </div>
                    }

                    {!isTotal && visibleCols.includes('Actual Loss') &&
                        <div className={blockClass[size]}><label>Actual Loss</label>
                            <span className={valueClass}>
                                {fnumIndex(actualLoss, 2, true)}
                            </span>
                        </div>
                    }
                    {!isTotal && visibleCols.includes('Actual Loss (with Population)') &&
                        <div className={blockClass[size]}><label>Actual Loss (with Population)</label>
                            <span className={valueClass}>
                                {fnumIndex(actualLossWithPop, 2, true)}
                            </span>
                        </div>
                    }
                    {!isTotal && visibleCols.includes('Exposure') &&
                        <div className={blockClass[size]}><label>Exposure</label>
                            <span className={valueClass}>
                                    {fnumIndex(exposure, 2, true)}
                                </span>
                        </div>
                    }
                    {!isTotal && visibleCols.includes('# Events') &&
                        <div className={blockClass[size]}><label># Events</label>
                            <span className={valueClass}>
                                    {fnumIndex(numEvents)}
                                </span>
                        </div>
                    }
                    {!isTotal && visibleCols.includes('# Severe Events') &&
                        <div className={blockClass[size]}><label># Severe Events</label>
                            <span className={valueClass}>
                                    {fnumIndex(numSevereEvents)}
                                </span>
                        </div>
                    }
                    {!isTotal && visibleCols.includes('# FEMA Declared Disasters') &&
                        <div className={blockClass[size]}><label># FEMA Declared Disasters</label>
                            <span className={valueClass}>
                                    {fnumIndex(numFEMADeclared)}
                                </span>
                        </div>
                    }
                    {!isTotal && visibleCols.includes('Frequency (yearly)') &&
                        <div className={blockClass[size]}><label>Frequency</label>
                            <span className={valueClass}>
                                    {freqToText((frequency || 0)?.toFixed(2), 'yearly')}
                                </span>
                        </div>
                    }

                    {!isTotal && visibleCols.includes('Frequency (daily)') &&
                        <div className={blockClass[size]}><label>Frequency</label>
                            <span className={valueClass}>
                                    {freqToText(((frequency || 0)/365)?.toFixed(2), 'daily')}
                                </span>
                        </div>
                    }
                    {!isTotal && visibleCols.includes('Frequency (%)') &&
                        <div className={blockClass[size]}><label>Frequency</label>
                            <span className={valueClass}>
                                    {freqToText(frequency ? (frequency / frequencySum * 100)?.toFixed(2) : 0, '%')}
                                </span>
                        </div>
                    }
                    {!isTotal && visibleCols.includes('Deaths') &&
                        <div className={blockClass[size]}><label>Deaths</label>
                            <span className={valueClass}>
                                    {fnumIndex(deaths)}
                                </span>
                        </div>
                    }
                    {!isTotal && visibleCols.includes('Injuries') &&
                        <div className={blockClass[size]}><label>Injuries</label>
                            <span className={valueClass}>
                                    {fnumIndex(injuries)}
                                </span>
                        </div>
                    }
                </div>
            </div>
        </div>);
}