import React, {useEffect, useMemo, useState} from "react";
import get from "lodash/get";
import {useFalcor} from '~/modules/avl-falcor';
import {pgEnv} from "~/utils/";
import {isJson} from "~/utils/macros.jsx";
import VersionSelectorSearchable from "../shared/versionSelector/searchable.jsx";
import GeographySearch from "../shared/geographySearch.jsx";
import DisasterSearch from "../shared/disasterSearch.jsx";
import {Loading} from "~/utils/loading.jsx";
import {metaData} from "./config.js";
import {Link} from "react-router-dom";
import {formatDate} from "~/utils/macros.jsx";
import {ButtonSelector} from "../shared/buttonSelector.jsx";
import {RenderColorPicker} from "../shared/colorPicker.jsx";
import {scaleThreshold} from "d3-scale";
import {getColorRange} from "~/pages/DataManager/utils/color-ranges.js";
import ckmeans from '~/utils/ckmeans';
import {EditMap,ViewMap} from "../shared/TemplateMap";
import {Attribution} from "../shared/attribution.jsx";




const defaultColors = getColorRange(5, "Oranges", false);
const getDomain = (data = [], range = []) => {
    if (!data?.length || !range?.length) return [];
    return data?.length && range?.length ? ckmeans(data, Math.min(data?.length, range?.length)) : [];
}
const getColorScale = (data, colors) => {
    const domain = getDomain(data, colors)

    return scaleThreshold()
        .domain(domain)
        .range(colors);
}
const getGeoColors = ({geoid, data = [], columns = [], paintFn, colors = [], ...rest}) => {
    if (!data?.length || !colors?.length) return {};
    const geoids = data.map(d => d.geoid);
    const stateFips = ((geoid+'' || '')?.substring(0, 2) || geoids[0] || '00').substring(0, 2);
    const geoColors = {}

    const colorScale = getColorScale(
        data.map((d) => paintFn ? paintFn(d) : d[columns?.[0]]).filter(d => d),
        colors
    );
    const domain = getDomain(
        data.map((d) => paintFn ? paintFn(d) : d[columns?.[0]]).filter(d => d),
        colors
    )
    for (let id = 0; id <= 999; id += 1) {
        const gid = stateFips + id.toString().padStart(3, '0');

        const record = data.find(d => d.geoid === gid) || {};
        const value = paintFn ? paintFn(record) : record[columns?.[0]];
        geoColors[gid] = geoids.includes(gid) && value ? colorScale(value) : '#d0d0ce';
    }
    return {geoColors, domain};
}




async function getData({geoid,disasterNumber,ealViewId, type='total_losses', numColors='5', colors=defaultColors, size="1", height=500}, falcor) {
    //return {}
    if(!ealViewId ||  !geoid || !disasterNumber ) {
        console.log('getdata not running',ealViewId ,  geoid , disasterNumber  )
        return {}
    }
    // console.log('test', ealViewId)
    // console.log('getdata', type, metaData[type])
    const dependencyPath = (view_id) => ["dama", pgEnv, "viewDependencySubgraphs", "byViewId", view_id],
        geomColName = `substring(${metaData[type]?.geoColumn || 'geoid'}, 1, 5)`,
        disasterNumberColName = metaData[type]?.disasterNumberColumn || 'disaster_number',
        columns = Array.isArray(metaData[type]?.columns) ? metaData[type]?.columns : Object.values(metaData[type]?.columns || {}),
        options = JSON.stringify({
            aggregatedLen: true,
            filter: false && geoid?.toString()?.length === 5 ? {
                [disasterNumberColName]: [disasterNumber],
                [geomColName]: [geoid]
            } : {[disasterNumberColName]: [disasterNumber]},
            groupBy: [disasterNumberColName, geomColName]
        }),
        attributes = {
            geoid: `${geomColName} as geoid`,
            ...(columns || [])
                .reduce((acc, curr) => ({...acc, [curr]: `sum(${curr}) as ${curr}`}), {})
        },
        gromPath = view_id => ['dama', pgEnv, 'viewsbyId', view_id, 'options', options];

    const attributionPath = view_id => ['dama', pgEnv, 'views', 'byId', view_id, 'attributes', ['source_id', 'view_id', 'version', '_modified_timestamp']];
    const res = await falcor.get(dependencyPath(ealViewId))

    const deps = get(res, ["json", ...dependencyPath(ealViewId), "dependencies"]);

    // console.log('deps', res, deps, dependencyPath(ealViewId))

    const stateView = deps?.find(dep => dep.type === "tl_state");
    const typeId = deps?.find(dep => dep.type === metaData[type]?.type);
    //console.log('typeID', typeId, deps)
    if(!typeId?.view_id) {
        return {}
    }
    typeId?.view_id
    let title = metaData[type].title
    let geomRes = await falcor.get(
        [...gromPath(typeId.view_id), 'length'],
        attributionPath(typeId.view_id)
    );

    const len = get(geomRes, ['json', ...gromPath(typeId.view_id), 'length']);

    const resData = await falcor.get([
        ...gromPath(typeId.view_id), 'databyIndex', 
        {from: 0,to: len - 1}, 
        Object.values(attributes)
    ])
        
    let data = Object.values(get(resData, ['json', ...gromPath(typeId.view_id), 'databyIndex'], {}));
    data = [...Array(len).keys()].map(i => {
        return Object.keys(attributes).reduce((acc, curr) => ({
            ...acc,
            [curr]: data[i][attributes[curr]]
        }), {});
    });

    const geomColTransform = [`st_asgeojson(st_envelope(ST_Simplify(geom, ${false && geoid?.toString()?.length === 5 ? `0.1` : `0.5`})), 9, 1) as geom`],
        geoIndices = {from: 0, to: 0},
        stateFips = get(data, [0, 'geoid']) || geoid?.substring(0, 2),
        geoPath = ({view_id}) => ['dama', pgEnv, 'viewsbyId', view_id,
            'options', JSON.stringify({filter: {geoid: [false && geoid?.toString()?.length === 5 ? geoid : stateFips.substring(0, 2)]}}),
            'databyIndex'
        ];
    geomRes = await falcor.get([...geoPath(stateView), geoIndices, geomColTransform]);
    const geom = get(geomRes, ["json", ...geoPath(stateView), 0, geomColTransform]);
    //const colors =  metaData[type].colors || defaultColors

    // const columns = Array.isArray(metaData[type]?.columns) ? metaData[type]?.columns : Object.values(metaData[type]?.columns || {})
    //console.log('getGeoCOlors', geoid, data,columns, metaData[type].paintFn, colors)
    const {geoColors, domain} = getGeoColors({geoid, data, columns, paintFn: metaData[type].paintFn, colors});
    const attributionData = {} //get(falcorCache, ['dama', pgEnv, 'views', 'byId', typeId, 'attributes'], {});
    //console.log('test', geoColors)
    const geoids = [...new Set(Object.keys(geoColors || {}).map(geoId => geoId.substring(0, 5)))]


   
    const sources = [{
      id: "counties",
      source: {
        "type": "vector",
        "url": "https://dama-dev.availabs.org/tiles/data/hazmit_dama_s365_v778_1694455888142.json"
      },
    }]

    // console.log('geoids', geoids)

    const layers = [{
      "id": "counties",
      "source": "counties",
      "source-layer": "s365_v778",
      "type": "fill",
      "filter" :  ["in", ['get', "geoid"], ['literal', geoids]],
      
      "paint": {
        "fill-color": ["get", ["get", "geoid"], ["literal", geoColors]],
      }
    },
    {
      "id": "counties-line",
      "source": "counties",
      "source-layer": "s365_v778",
      "type": "line",
      "filter" :  ["in", ['get', "geoid"], ['literal', geoids]],
      "paint": {
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5, 0.5,
          22, 2
        ],
        "line-color": "#efefef",
        "line-opacity": 0.5
      }
    }]
    
    //console.log('mapfocus', geom ? get(JSON.parse(geom), 'bbox', null ) : null)

            
    return {
        view: metaData[type],
        ealViewId,
        disasterNumber,
        geoid,
        type,
        title,
        domain,
        sources,
        layers,
        attributionData,
        size,
        height,
        colors,
        // legend: {
        //     size,
        //     domain, 
        //     range: colors, 
        //     title, 
        //     show: metaData[type].legend !== false
        // },
        mapFocus: geom ? get(JSON.parse(geom), 'bbox', null ) : null,
        showLegend:  metaData[type].legend !== false
    }
}


const Edit = ({value, onChange, size}) => {
    const {falcor, falcorCache} = useFalcor();

    let cachedData = useMemo(() => {
        return value && isJson(value) ? JSON.parse(value) : {}
    }, [value]);

    //console.log('Edit: value,', size)
   
    const baseUrl = '/';

    const ealSourceId = 343;
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');
    const [compData, setCompData] = useState({
        ealViewId: cachedData?.ealViewId || 837,
        geoid: cachedData?.geoid || '36',
        disasterNumber: cachedData?.disasterNumber || null,
        type: cachedData?.type || 'total_losses',
        typeId: cachedData?.typeId,
        data: cachedData?.data,
        mapFocus: cachedData.mapFocus,
        numColors: cachedData?.numColors || 5,
        shade: cachedData?.shade || 'Oranges',
        colors: cachedData?.colors || defaultColors,
        title: cachedData?.title,
        height: cachedData?.height || 500
    })

    useEffect(() => {
        // if data is set outside map delete image
        delete compData.img;
        setCompData({...compData, ...cachedData})   
    },[cachedData])

    
    useEffect(() => {
        const load = async () => {
            const {
                geoid,disasterNumber,ealViewId, type ,colors, height
            } = compData
            //console.log(geoid, disasterNumber)
            
            if (!geoid || !disasterNumber) {
                console.log('not going to load mfer')
                setStatus('Please Select a Geography & Disaster');
                
                //return Promise.resolve();
            } else {
                setStatus(undefined);
                setLoading(true);
                //console.log('EDIT: get data',geoid,disasterNumber,ealViewId, type)
        
                let data = await getData({
                    geoid,
                    disasterNumber,
                    ealViewId, 
                    type,
                    colors,
                    size,
                    height
                }, falcor)
                console.log(
                    'testing got data', value === JSON.stringify({...cachedData, ...data}), 
                    'args', )
                if(value !== JSON.stringify({...cachedData, ...data})) {
                    onChange(JSON.stringify({...cachedData, ...data}))
                }
                setLoading(false)
            }
        }
        load();
    }, [compData]);

    
    const layerProps = useMemo(() => { 
        console.log('setting Layer Props', cachedData)
        return {
            ccl: {
                ...cachedData,
                change: e => {
                    
                    if(value !== JSON.stringify({...cachedData, ...e})){
                        console.log('change from map')
                        onChange(JSON.stringify({...cachedData,...e}))
                    }
                }
            }
        }
    },[cachedData])

    //console.log('layerProps', layerProps)

    return (
        <div className='w-full'>
            <div className='relative'>
                <div className={'border rounded-md border-blue-500 bg-blue-50 p-2 m-1'}>
                    Edit Controls
                    <VersionSelectorSearchable
                        source_id={ealSourceId}
                        view_id={compData.ealViewId}
                        onChange={(v) => setCompData({...compData, "ealViewId": v})}
                        className={'flex-row-reverse'}
                    />
                    <GeographySearch 
                        value={compData.geoid} 
                        onChange={(v) => setCompData({...compData, "geoid": v})}
                        className={'flex-row-reverse'}
                    />
                    <DisasterSearch
                        view_id={compData.ealViewId}
                        value={compData.disasterNumber}
                        geoid={compData.geoid}
                        onChange={(v) => setCompData({...compData, "disasterNumber": v})}
                        className={'flex-row-reverse'}
                    />
                    <ButtonSelector
                        label={'Type:'}
                        types={Object.keys(metaData).map(t => ({label: t.replace('_', ' '), value: t}))}
                        type={compData.type}
                        setType={e => {
                            setCompData({...compData, 
                                "colors": metaData[e].colors || defaultColors,
                                "type": e
                            })
                        }}
                    />
                    {!metaData[compData.type].colors &&
                        <RenderColorPicker
                        title={'Colors: '}
                        numColors={compData.numColors}
                        setNumColors={(v) => setCompData({...compData, "numColors": v})}
                        shade={compData.shade}
                        setShade={(v) => setCompData({...compData, "shade": v})}
                        colors={compData.colors}
                        setColors={(v) => setCompData({...compData, "colors": v})}
                    />}
                    <ButtonSelector
                        label={'Size:'}
                        types={[{label: 'X Small', value: 200},{label: 'Small', value: 500},{label: 'Medium', value: 700},{label: 'Large', value: 900}]}
                        type={compData.height}
                        setType={v => setCompData({...compData, "height": v})}
                    />
                </div>
                {
                    loading ? <Loading/> :
                        status ? <div className={'p-5 text-center'}>{status}</div> :
                            <React.Fragment>
                                <div className={`flex-none w-full p-1`} style={{height: `${compData.height}px`}}>
                                    <EditMap
                                        falcor={falcor}
                                        layerProps={layerProps}
                                        legend={{
                                            size,
                                            domain: compData?.domain || [], 
                                            range: compData.colors, 
                                            title: compData.title, 
                                            show: metaData[compData.type].legend !== false
                                        }}
                                    />
                                </div>
                                <Attribution baseUrl={baseUrl} attributionData={compData.attributionData} />
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
    const baseUrl = '/';
    const attributionData = data?.attributionData;
    const layerProps =  {ccl: {...data }}
    // console.log('render view', data)

    return (
        <div className='relative w-full p-6'>
            {
               data.img  ?
                    <div className='h-80vh flex-1 flex flex-col'>
                        <img alt='Choroplath Map' src={get(data, ['img'])}/>
                        
                    </div> : 
                    <div className={`flex-none w-full p-1`} style={{height: `${data.height}px`}}>
                        <ViewMap
                            layerProps={layerProps}
                            legend={{
                                size: data.size,
                                domain: data?.domain || [], 
                                range: data.colors, 
                                title: data.title, 
                                show: data.showLegend
                            }}
                        />
                    </div> 
                    
            }
            <Attribution baseUrl={baseUrl} attributionData={attributionData} />
        </div>
    )
}


export default {
    "name": 'Map: FEMA Disaster Loss',
    "type": 'Map',
    "variables": 
[        {
            name: 'geoid',
            default: '36'
        },
        {
            name: 'disasterNumber',
            default: '1406'
        },
        {
            name: 'ealViewId',
            default: 837,
            hidden: true
        },
        {
            name: 'type',
            hidden: true
        },
        {
            name: 'size',
            hidden: true
        },
        {
            name: 'height',
            hidden: true
        }
    ],
    getData,

    "EditComp": Edit,
    "ViewComp": View
}