import React, {useEffect, useMemo, useState} from "react";
import {AvlMap} from '~/modules/avl-maplibre/src';

import {SimpleMapLayerFactory} from "./layers/simpleLayer"

import { DrawLegend } from './Legends'

import {PMTilesProtocol} from '~/pages/DataManager/utils/pmtiles/index.ts'

export const EditMap = ({falcor, layerProps, legend, layerType}) => {

    const mapLayer = React.useRef(layerType ? layerType() : SimpleMapLayerFactory())
    
    return (
        <div className='w-full h-full border border-pink-400'>
            {legend && <DrawLegend {...legend} />}
            <AvlMap
                falcor={falcor}
                mapOptions={{
                    protocols: [PMTilesProtocol],
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
                        }
                    ]

                }}
                layers={[mapLayer.current]}
                layerProps={layerProps}
                CustomSidebar={() => <div/>}
            />
        </div>
    )
}


export const ViewMap = ({falcor, layerProps, legend, layerType}) => {
    
    const mapLayer = React.useRef(layerType ? layerType() : SimpleMapLayerFactory())

    return (
        <div className='w-full h-full'>
            <DrawLegend {...legend} />
            <AvlMap
                mapOptions={{
                    protocols: [PMTilesProtocol],
                    interactive: false,
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
                        }
                    ]

                }}
                navigationControl={false}
                layers={[mapLayer.current]}
                layerProps={layerProps}
                CustomSidebar={() => <div/>}
            />
        </div>
    )
}