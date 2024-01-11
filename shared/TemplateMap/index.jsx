import React, {useEffect, useMemo, useState} from "react";
import {AvlMap} from '~/modules/avl-maplibre/src';

import {SimpleMapLayerFactory} from "./layers/simpleLayer"

import { DrawLegend } from './Legends'

import {Protocol, PMTiles} from '~/pages/DataManager/utils/pmtiles/index.ts'

const PMTilesProtocol = {
  type: "pmtiles",
  protocolInit: maplibre => {
    const protocol = new Protocol();
    maplibre.addProtocol("pmtiles", protocol.tile);
    return protocol;
  },
  sourceInit: (protocol, source, maplibreMap) => {
    const p = new PMTiles(source.url);
    protocol.add(p);
  }
}

export const EditMap = ({falcor, layerProps, legend}) => {
   
    const mapLayer = React.useRef(SimpleMapLayerFactory())
    
    return (
        <div className='w-full h-full border border-pink-400'>
            <DrawLegend {...legend} />
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


export const ViewMap = ({falcor, layerProps, legend}) => {
    
    const mapLayer = React.useRef(SimpleMapLayerFactory())

    // console.log('ViewMap', legend)

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