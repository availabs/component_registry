import React, {useEffect, useMemo, useState} from "react";
import {AvlMap} from '~/modules/avl-maplibre/src';

import {SimpleMapLayerFactory} from "./layers/simpleLayer"

import { DrawLegend } from './Legends'

import {PMTilesProtocol} from '../../utils/pmtiles/index.ts'

export const EditMap = ({falcor, layerProps, legend, layerType}) => {

    const mapLayer = React.useRef(layerType ? layerType() : SimpleMapLayerFactory())
    
    return (
        <div className='w-full h-full border border-pink-400 relative'>
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
           <div className='px-6 py-10 absolute bottom-0 right-0'><i className=' text-2xl text-slate-400 -rotate-45 fal fa-location-circle'/></div> 
        </div>
    )
}


export const ViewMap = ({falcor, layerProps, legend, layerType}) => {
    
    const mapLayer = React.useRef(layerType ? layerType() : SimpleMapLayerFactory())

    return (
        <div className='w-full h-full relative'>
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
            <div className='px-6 py-10 absolute bottom-0 right-0'><i className=' text-2xl text-slate-400 -rotate-45 fal fa-location-circle'/></div> 
        </div>
    )
}