import React, {useEffect, useMemo, useState} from "react";
import get from "lodash/get";
import {useFalcor} from '~/modules/avl-falcor';
import {pgEnv} from "~/utils/";
import {isJson} from "~/utils/macros.jsx";
import GeographySearch from "../shared/geographySearch.jsx";
import {Loading} from "~/utils/loading.jsx";
import {ButtonSelector} from "../shared/buttonSelector.jsx";
import {getColorRange} from "~/pages/DataManager/utils/color-ranges.js";
import {RenderMap} from "../shared/Map/RenderMap.jsx";


const getGeoColors = ({geoid, colors = [], ...rest}) => {
    const geoColors = {}
    const stateFips = geoid?.toString()?.substring(0, 2) || '36';

    for (let id = 0; id <= 999; id += 1) {
        const gid = stateFips + id.toString().padStart(3, '0');
        geoColors[gid] = gid === geoid ? '#ffda00' : '#d0d0ce';
    }

    return {geoColors};
}

async function getData({
                           geoid, size, height, numColors, shade
                       }, falcor) {
    const stateView = 285; // need to pull this based on categories
    const countyView = 286;

    // mapFocus
    const geomColTransform = [`st_asgeojson(st_envelope(ST_Simplify(geom, ${false && geoid?.toString()?.length === 5 ? `0.1` : `0.5`})), 9, 1) as geom`],
        geoIndices = {from: 0, to: 0},
        stateFips = geoid?.toString()?.substring(0, 2),
        geoPath = (view_id) =>
            ['dama', pgEnv, 'viewsbyId', view_id,
                'options', JSON.stringify({
                filter: {
                    geoid: [false && geoid?.toString()?.length >= 5 ? geoid : stateFips.substring(0, 2)]
                }}),
                'databyIndex'
            ];
    const geomRes = await falcor.get([...geoPath(false && geoid?.toString()?.length === 5 ? countyView : stateView), geoIndices, geomColTransform]);
    const geom = get(geomRes, ["json", ...geoPath(false && geoid?.toString()?.length === 5 ? countyView : stateView), 0, geomColTransform]);
    const mapFocus = get(JSON.parse(geom), 'bbox');

    const {geoColors} = getGeoColors({geoid});

    const geoLayer = 'counties';
    console.log('geoColors', geoColors)
    const layerProps = {
        ccl: {
            view: {},
            data: [],
            geoColors,
            mapFocus,
            geoLayer,
            height,
            size
        }
    }

    return {
        geoid,
        mapFocus,
        geoColors,
        geoLayer,
        layerProps,
        size,
        height,
        numColors,
        shade
    }
}

const Edit = ({value, onChange, size}) => {

    const {falcor, falcorCache} = useFalcor();

    let cachedData = value && isJson(value) ? JSON.parse(value) : {};
    const baseUrl = '/';

    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(cachedData?.status);
    const [geoid, setGeoid] = useState(cachedData?.geoid || '36');
    const [numColors, setNumColors] = useState(cachedData?.numColors || 5);
    const [shade, setShade] = useState(cachedData?.shade || 'Oranges');
    const [height, setHeight] = useState(cachedData?.height || 500);

    useEffect(() => {
        // get required data, pass paint properties as prop.
        async function load(){
            if (!geoid) {
                !geoid && setStatus('Please Select a Geography.');
                return Promise.resolve();
            } else {
                setStatus(undefined)
            }
            setLoading(true);
            setStatus(undefined);

            const data = await getData({
                geoid, size, height, numColors, shade
            }, falcor);

            onChange(JSON.stringify({
                ...data,
            }));

            setLoading(false);
        }

        load()
    }, [geoid, size, height, numColors, shade]);

    return (
        <div className='w-full'>
            <div className='relative'>
                <div className={'border rounded-md border-blue-500 bg-blue-50 p-2 m-1'}>
                    Edit Controls
                    <GeographySearch value={geoid} onChange={setGeoid} className={'flex-row-reverse'}/>
                    <ButtonSelector
                        label={'Size:'}
                        types={[
                            {label: 'X-Small', value: 300},
                            {label: 'Small', value: 500},
                            {label: 'Medium', value: 700},
                            {label: 'Large', value: 900}
                        ]}
                        type={height}
                        setType={e => {
                            setHeight(e)
                        }}
                    />
                </div>
                {
                    loading ? <Loading/> :
                        status ? <div className={'p-5 text-center'}>{status}</div> :
                            <React.Fragment>
                                <div className={`flex-none w-full p-1`} style={{height: `${height}px`}}>
                                    <RenderMap
                                        interactive={true}
                                        falcor={falcor}
                                        layerProps={cachedData.layerProps}
                                        legend={{show: false}}
                                    />
                                </div>
                            </React.Fragment>
                }
            </div>
        </div>
    )
}

Edit.settings = {
    hasControls: true,
    name: 'ElementEdit'
}

const View = ({value}) => {
    if (!value) return ''

    let data = typeof value === 'object' ?
        value['element-data'] :
        JSON.parse(value)

    return (
        <div className='relative w-full p-6'>
            {
                data.img  ?
                    <div className='h-80vh flex-1 flex flex-col'>
                        <img alt='Choroplath Map' src={get(data, ['img'])}/>
                    </div> :
                    <div className={`flex-none w-full p-1`} style={{height: `${data.height}px`}}>
                        <RenderMap
                            interactive={false}
                            layerProps={data.layerProps}
                            legend={{show: false}}
                        />
                    </div>

            }
        </div>
    )
}


export default {
    "name": 'Map: County Highlight',
    "type": 'Map',
    "variables": [
        {
            name: 'geoid',
            default: '36',
        },
        {
            name: 'size',
            hidden: true
        },
        {
            name: 'height',
            hidden: true
        },
        {
            name: 'numColors',
            hidden: true
        },
        {
            name: 'shade',
            hidden: true
        },
        {
            name: 'colors',
            hidden: true,
            default: getColorRange(5, "Oranges", false)
        }
    ],
    getData,
    "EditComp": Edit,
    "ViewComp": View
}