import {hazardsMeta} from "~/utils/colors.jsx";
import get from "lodash/get.js";
import React from "react";

const floodPlainColors = {
    '{"flood_zone":["AH","A","VE","AO","AE"]}': {
        color: '#6e0093',
        name: '100 Year'
    },
    '{"flood_zone":["X"]}': {
        color: '#2a6400',
        name: '500 Year'
    },
}

const buildingTypeLabels = {
    [JSON.stringify({value_source: ['ogs']})]: 'State Owned',
    [JSON.stringify({critical: ['not null']})] : 'Critical'
}
export const RenderLegend = ({floodPlain=[], hazard=[], buildingType}) =>
    (
        <div className={'flex flex-col'}>
            <label>{buildingTypeLabels[buildingType]} assets in high hazard risk areas</label>
            <div className={"flex flex-rows flex-wrap gap-2 text-xs align-middle"}>
                {
                    Array.isArray(floodPlain) && floodPlain?.length ?
                        floodPlain.map(fp => {
                            return (
                                <div className={"h-full flex"} key={floodPlainColors[fp]?.name}>
                                    <span className={"rounded-full m-1 shrink-0"}
                                          style={{
                                              height: "10px",
                                              width: "10px",
                                              backgroundColor: floodPlainColors[fp]?.color
                                          }}
                                    />
                                    <label className={"pl-1"}>{floodPlainColors[fp]?.name}</label>
                                </div>
                            )
                        }) : null
                }
                {
                    Object.keys(hazardsMeta)
                        .filter(key => !hazard || hazard.includes(key))
                        .sort((a,b) => hazardsMeta[a].name.localeCompare(hazardsMeta[b].name))
                        .map(key =>
                            <div className={"h-full flex flex-wrap"} key={key}>
                            <span className={"rounded-full m-1 shrink-0"}
                                  style={{
                                      height: "10px",
                                      width: "10px",
                                      backgroundColor: get(hazardsMeta, [key, "color"], "#d0d0ce")
                                  }}/>
                                <label className={"pl-1"}>{hazardsMeta[key].name}</label>
                            </div>)
                }
            </div>
        </div>
    );