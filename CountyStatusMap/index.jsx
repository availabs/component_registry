import React, {useEffect, useMemo, useState} from "react";
import get from "lodash/get";
import {useFalcor} from '~/modules/avl-falcor';
import {pgEnv} from "~/utils/";
import {isJson} from "~/utils/macros.jsx";
import VersionSelectorSearchable from "../shared/versionSelector/searchable.jsx";
import GeographySearch from "../shared/geographySearch.jsx";
import {Loading} from "~/utils/loading.jsx";
import {ButtonSelector} from "../shared/buttonSelector.jsx";
import {RenderColorPicker} from "../shared/colorPicker.jsx";
import {scaleThreshold} from "d3-scale";
import {getColorRange} from "~/pages/DataManager/utils/color-ranges.js";
import ckmeans from '~/utils/ckmeans';
import {RenderMap} from "../shared/Map/RenderMap.jsx";
import {EditMap,ViewMap} from "../shared/TemplateMap";
import {HazardSelectorSimple} from "../shared/HazardSelector/hazardSelectorSimple.jsx";
import {hazardsMeta} from "~/utils/colors.jsx";
import {Attribution} from "../shared/attribution.jsx";
import {useNavigate} from "react-router-dom";


/*

Expired
Date is null || > 5 years :  Red
> 4 years : ..
> 3 years : ..
> 2 years : ..
> 1 years : orange

Approved
-----------
approved > 4 years : yellow
approved > 3 years : ..
approved > 2 years : ..
approved > 1 years : green

*/

const defaultColors = ['#a50026','#d73027','#f46d43','#fdae61','#fee08b','#ffffbf','#d9ef8b','#a6d96a','#66bd63','#1a9850','#006837']




const getDateDiff = (date) => {
    if(!date || date === 'NULL') return null;
    const date1 = new Date();
    const date2 = new Date(date);
    date2.setFullYear(date2.getFullYear() + 5);

    // console.log(date1.getFullYear(), date2.getFullYear(), date2.getFullYear() - date1.getFullYear() )
    return (Math.ceil( (date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24)) / 365)
};




async function getData({geoid, data = [], columns = [], geoAttribute, colors = defaultColors, size = 1, height=500, ...rest}, falcor) {
    //return {}
    
    if (!data?.length || !colors?.length) return {};

    const geoids = data.map(d => d[geoAttribute]);
    const stateFips = (geoid?.substring(0, 2) || geoids[0] || '00').substring(0, 2);
    const geoColors = {}
    const geoLayer = geoids[0]?.toString().length === 5 ? 'counties' : 'tracts';

    const diffData = data.map((d) => {
        return getDateDiff(d[columns?.[0]]) || -5
    })

    console.log('data diff', diffData)


    const colorScale = scaleThreshold()
        .domain([-5,-4,-3,-2,-1,1,2,3,4,5])
        .range(['#a50026','#d73027','#f46d43','#fdae61','#fee08b','#ffffbf','#d9ef8b','#a6d96a','#66bd63','#1a9850','#006837']);
    
    const domain = [-5,-4,-3,-2,-1,1,2,3,4,5]

    data.forEach(record => {
        const value = (getDateDiff(record[columns?.[0]]) || -5);
        geoColors[record[geoAttribute]] = value ? colorScale(value) : '#d0d0ce';
    })

    const attributionData = {} //get(falcorCache, ['dama', pgEnv, 'views', 'byId', typeId, 'attributes'], {});
    //console.log('test', geoColors)
    //const geoids = [...new Set(Object.keys(geoColors || {}).map(geoId => geoId.substring(0, 5)))]


   
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
    const title = 'County Plan Status Map'
            
    return {
        //view: metaData[type],
        geoid,
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
        // mapFocus: geom ? get(JSON.parse(geom), 'bbox', null ) : null,
        showLegend:  true// metaData[type].legend !== false
    }
}


const Edit = ({value, onChange, size}) => {

    const {falcor, falcorCache} = useFalcor();

    let cachedData = value && isJson(value) ? JSON.parse(value) : {};
    const baseUrl = '/';

    const [dataSources, setDataSources] = useState(cachedData?.dataSources || []);
    const [dataSource, setDataSource] = useState(cachedData?.dataSource);
    const [version, setVersion] = useState(cachedData?.version);

    // const [attribute, setAttribute] = useState(/*cachedData?.attribute ||*/ 'plan_approval_date');
    const attribute = 'plan_approval_date';
    const [geoAttribute, setGeoAttribute] = useState(cachedData?.geoAttribute);


    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(cachedData?.status);
    const [compData, setCompData] = useState({
        geoid: cachedData?.geoid || '36',
        //geoAttribute: cachedData?.geoAttribute,
        data: cachedData?.data || [],
        type: cachedData?.type || 'total_losses',
        typeId: cachedData?.typeId,
        mapFocus: cachedData.mapFocus,
        numColors: cachedData?.numColors || 5,
        colors: cachedData?.colors || defaultColors,
        title: cachedData?.title || 'County Plan Status Map',
        height: cachedData?.height || 500,
        size: 1,
        stateView: 285
    })
  
    const stateView = 285; // need to pull this based on categories
    const category = 'County Descriptions';

    const options = JSON.stringify({
        filter: {...geoAttribute && {[`substring(${geoAttribute}::text, 1, ${compData?.geoid?.toString()?.length})`]: [compData?.geoid]}},
    });
    const lenPath = ['dama', pgEnv, 'viewsbyId', version, 'options', options, 'length'];
    const dataPath = ['dama', pgEnv, 'viewsbyId', version, 'options', options, 'databyIndex'];
    const dataSourceByCategoryPath = ['dama', pgEnv, 'sources', 'byCategory', category];
    const attributionPath = ['dama', pgEnv, 'views', 'byId', version, 'attributes'],
        attributionAttributes = ['source_id', 'view_id', 'version', '_modified_timestamp'];

    const navigate = useNavigate();

    useEffect(() => {
        async function getData() {
            setLoading(true);
            setStatus(undefined);
            // fetch data sources from categories that match passed prop
            await falcor.get(dataSourceByCategoryPath);
            setDataSources(get(falcor.getCache(), [...dataSourceByCategoryPath, 'value'], []))
            // fetch columns, data
            setLoading(false);
        }
        getData()
    }, []);

    useEffect(() => {
        const geoAttribute =
            (
                dataSources.find(ds => ds.source_id === dataSource)?.metadata?.columns  ||
                dataSources.find(ds => ds.source_id === dataSource)?.metadata ||
                [])
                .find(c => c.display === 'geoid-variable');
        geoAttribute?.name && setGeoAttribute(geoAttribute?.name);
    }, [dataSources, dataSource]);

    useEffect(() => {
        async function getData() {
            if(!attribute || !geoAttribute || !version || !dataSource) {
                !dataSource && setStatus('Please select a Datasource.');
                !version && setStatus('Please select a version.');
                !geoAttribute?.length && setStatus('No geo attribute found.');
                !attribute?.length && setStatus('Please select columns.');
                setLoading(false);
                return;
            }
            setLoading(true);
            setStatus(undefined);
            // setTitle(metaData.title(hazardsMeta[hazard]?.name, attribute, consequence))

            await falcor.get(lenPath);
            const len = get(falcor.getCache(), lenPath, 0);

            await falcor.get([...dataPath, {from: 0, to: len - 1}, [geoAttribute, attribute]]);
            await falcor.get([...attributionPath, attributionAttributes]);

            setLoading(false);

        }

        getData()
    }, [dataSource, version, geoAttribute, attribute]);

    useEffect(() => {
        setCompData({ ...compData, data: Object.values(get(falcorCache, dataPath, {}))}) ;
    }, [falcorCache, dataSource, version, geoAttribute, attribute])

    // useEffect(() => {
    //     async function getData() {
    //         const {geoid} = compData
    //         if (!geoid || !attribute) {
    //             !geoid && setStatus('Please Select a Geography.');
    //             return Promise.resolve();
    //         } else {
    //             setStatus(undefined)
    //         }
    //         setLoading(true);
    //         setStatus(undefined);

    //         const geomColTransform = [`st_asgeojson(st_envelope(ST_Simplify(geom, ${false && geoid?.toString()?.length === 5 ? `0.1` : `0.5`})), 9, 1) as geom`],
    //         geoIndices = {from: 0, to: 0},
    //         stateFips = get(data, [0, 'geoid']) || geoid?.substring(0, 2),
    //         geoPath = (view_id) =>
    //             ['dama', pgEnv, 'viewsbyId', view_id,
    //                 'options', JSON.stringify({filter: {geoid: [false && geoid?.toString()?.length === 5 ? geoid : stateFips.substring(0, 2)]}}),
    //                 'databyIndex'
    //             ];
    //         const geomRes = await falcor.get([...geoPath(stateView), geoIndices, geomColTransform]);
    //         const geom = get(geomRes, ["json", ...geoPath(stateView), 0, geomColTransform]);

    //         if (geom) {
    //             setMapfocus(get(JSON.parse(geom), 'bbox'));
    //         }
    //         setLoading(false);
    //     }

    //     getData()
    // }, [compData, attribute, dataSource]);

    const attributionData = get(falcorCache, attributionPath, {});

    // const {geoColors, domain, geoLayer} =
    //     getGeoColors({});

    // console.log('testing', geoColors, domain, geoLayer)

    // ----------------- Map Sources Code---------------
    // useEffect(() => {
    //     // if data is set outside map delete image
    //     delete compData.img;
    //     setCompData({...compData, ...cachedData})   
    // },[cachedData])

    
    useEffect(() => {
        const load = async () => {
            const {
                geoid,data, colors, height, size
            } = compData
            //console.log(geoid, disasterNumber)
            
            if (!geoid ) {
                console.log('not going to load mfer')
                setStatus('Please Select a Geography ');
                
                //return Promise.resolve();
            } else {
                setStatus(undefined);
                setLoading(true);
                //console.log('EDIT: get data',geoid,disasterNumber,ealViewId, type)
        
                let out = await getData({
                    geoid, 
                    data, 
                    columns: [attribute], 
                    geoAttribute, 
                    colors,
                    size,
                    height
                }, falcor)
                console.log(
                    'testing got data', value === JSON.stringify({...cachedData, ...out}), 
                    'args', )
                if(value !== JSON.stringify({...cachedData, ...out})) {
                    onChange(JSON.stringify({...cachedData, ...out}))
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

    //----------------------------------------------------------


    return (
        <div className='w-full'>
            <div className='relative'>
                <div className={'border rounded-md border-blue-500 bg-blue-50 p-2 m-1'}>
                    Edit Controls
                    <ButtonSelector
                        label={'Data Source:'}
                        types={dataSources.map(ds => ({label: ds.name, value: ds.source_id}))}
                        type={dataSource}
                        setType={e => {
                            // setAttribute(undefined);
                            setGeoAttribute(undefined);
                            setVersion(undefined);
                            // setData([]);

                            setDataSource(e);
                        }}
                    />
                    <VersionSelectorSearchable
                        source_id={dataSource}
                        view_id={version}
                        onChange={setVersion}
                        className={'flex-row-reverse'}
                    />
                    <GeographySearch value={compData.geoid} 
                        onChange={(v) => setCompData({...compData, "geoid": v})} 
                        className={'flex-row-reverse'}
                    />

                   
                    <ButtonSelector
                        label={'Size:'}
                        types={[{label: 'Small', value: 500}, {label: 'Medium', value: 700}, {
                            label: 'Large',
                            value: 900
                        }]}
                        type={compData.height}
                        setType={(v) => setCompData({...compData, "height": v})}
                    />
                </div>
                {
                    loading ? <Loading/> :
                        status ? <div className={'p-5 text-center'}>{status}</div> :
                            <React.Fragment>
                                <div className={`flex-none w-full p-1`} style={{height: `${compData.height || '500'}px`}}>
                                    {/*<RenderMap
                                        falcor={falcor}
                                        layerProps={layerProps}
                                        legend={{domain, range: colors, title, size}}
                                        layers={['Choropleth']}
                                    />*/}
                                <EditMap
                                        falcor={falcor}
                                        layerProps={layerProps}
                                        legend={{
                                            size,
                                            domain: compData?.domain || [], 
                                            range: compData.colors, 
                                            title: compData.title, 
                                            show: true//metaData[compData.type].legend !== false
                                        }}
                                    />
                                </div>
                                <Attribution baseUrl={baseUrl} attributionData={attributionData}/>
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
        </div>
    )
}


export default {
    "name": 'Map: County Status',
    "type": 'Map',
    "EditComp": Edit,
    "ViewComp": View
}