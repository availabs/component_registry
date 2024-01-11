import { fnumIndex, HoverComp } from "~/utils/macros.jsx";
import React from "react";
import {PieGraph} from "~/modules/avl-graph/src/index.js";
import {Link} from "react-router-dom";
import {Attribution} from "../../shared/attribution.jsx";

const colNameMapping = {
    swd_population_damage: 'Population Damage',
    fusion_property_damage: 'Property Damage',
    fusion_crop_damage: 'Crop Damage',
    disaster_number: 'Disaster Number',
    swd_ttd: 'Non Declared Events Total ($)',
    ofd_ttd: 'FEMA Declared Disaster Total ($)',
};

export const RenderPieChart = ({ data, attributionData, baseUrl }) => {
    const pieColors = {
        ofd_ttd: '#0089ff',
        swd_ttd: '#ff003b'
    }
    return (
        <div className={`w-full my-1 block flex flex-col`} style={{ height: "300px" }}>
            <div className={"flex flex-row pr-5 pt-5"}>
                {
                    Object.keys(pieColors)
                        .map(key => {

                            return (
                                <div className={"flex px-2"} key={key}>
                                    <div className={"rounded-full self-center align-middle"}
                                         style={{
                                             height: "15px",
                                             width: "15px",
                                             backgroundColor: pieColors[key]
                                         }} />
                                    <span className={"pl-2"}>{colNameMapping[key]}</span>
                                </div>
                            )
                        })
                }
            </div>
            <PieGraph
                key={"numEvents"}
                data={data}
                keys={Object.keys(pieColors)}
                colors={Object.values(pieColors)}
                indexBy={"year"}
                axisBottom={d => d}
                axisLeft={{ format: fnumIndex, gridLineOpacity: 1, gridLineColor: "#9d9c9c" }}
                paddingInner={0.1}
                hoverComp={{
                    HoverComp: HoverComp,
                    valueFormat: fnumIndex,
                    keyFormat: k => colNameMapping[k] || k
                }}
                groupMode={"stacked"}
            />
            <Attribution baseUrl={baseUrl} attributionData={attributionData} />
        </div>
    );
};