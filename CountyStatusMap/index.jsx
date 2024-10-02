import React, {useEffect, useMemo, useState} from "react";
import get from "lodash/get";
import {useFalcor} from '~/modules/avl-falcor';
import {pgEnv} from "../utils";
import {isJson} from "../utils/macros.jsx";
import VersionSelectorSearchable from "../shared/versionSelector/searchable.jsx";
import GeographySearch from "../shared/geographySearch.jsx";
import {Loading} from "../utils/loading.jsx";
import {ButtonSelector} from "../shared/buttonSelector.jsx";
import {RenderColorPicker} from "../shared/colorPicker.jsx";
import {scaleThreshold} from "d3-scale";
import {getColorRange} from "../utils/color-ranges.js";
import ckmeans from '../utils/ckmeans';
import {RenderMap} from "../shared/Map/RenderMap.jsx";
import {EditMap,ViewMap} from "../shared/TemplateMap";
import { SimpleMapLayer } from "../shared/TemplateMap/layers/simpleLayer"
import {HazardSelectorSimple} from "../shared/HazardSelector/hazardSelectorSimple.jsx";
import {hazardsMeta} from "../utils/colors.jsx";
import {Attribution} from "../shared/attribution.jsx";
import {useNavigate} from "react-router-dom";


class CountyMapLayer extends SimpleMapLayer {
    onHover = {
        layers: ["counties", "tracts"],
        HoverComp: ({ data, layer }) => {
          return (
            <div style={{ maxHeight: "300px" }} className={`rounded relative p-4 overflow-auto scrollbarXsm bg-white`}>
              <div className='text-blue-500 font-bold'>{data?.county}</div>
              <div className='text-xs text-slate-400 uppercase font-bold'>Plan status</div>
              <div className='text-sm'>{data?.plan_status}</div>
              <div className='text-xs text-slate-400 uppercase font-bold'>Plan Expiration Date</div>
              <div className='text-sm'>{data?.approval_date}</div>
            </div>
          );
        },
        callback: (layerId, features, lngLat) => {
          let { data } = this.props;
          let record = data.find(d => ''+d.geoid === ''+features?.[0]?.properties?.geoid) || {}
          return record
        }
  };
}

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

const defaultColors = ['#a50026','#fee08b','#1a9850']
//  ['#a50026','#d73027','#f46d43','#fdae61','#fee08b','#ffffbf','#d9ef8b','#a6d96a','#66bd63','#1a9850','#006837']

const CountyStatusLegend = () => (
    <div className='absolute top-4 left-4 bg-white p-4'>
        County LHMP Status
        {[
            {name: 'Approved Plan', color: '#1a9850'},
            {name: 'Plan Update in Progress', color: '#fee08b'},
            {name: 'Plan Expired. No Update in Progress.', color: '#a50026'}
        ].map(d => (
            <div className='flex items-center py-1'>
                <div className='h-6 w-6 rounded' style={{backgroundColor:d.color}} />
                <div className = 'flex-1 px-2 text-sm text-slate-600'> {d.name} </div>
            </div>
        ))}
    </div>
)


const getDateDiff = (date) => {
    if(!date || date === 'NULL') return null;
    const date1 = new Date();
    const date2 = new Date(date);
    date2.setFullYear(date2.getFullYear() + 5);

    // console.log(date1.getFullYear(), date2.getFullYear(), date2.getFullYear() - date1.getFullYear() )
    return (Math.ceil( (date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24)) / 365)
};




async function getData({geoid,  version,  colors = defaultColors, size = 1, height=500, ...rest}, falcor) {
    //return {}
    const geoAttribute = 'geoid'
    // console.log('version', version)
    version = 1456
    const columns = ['county','approval_date', 'under_fema_review_yes_no', 'update_in_progress'];

    const options = JSON.stringify({
        filter: {...geoAttribute && {[`substring(${geoAttribute}::text, 1, ${geoid?.toString()?.length})`]: [geoid]}},
    });
    const lenPath = ['dama', pgEnv, 'viewsbyId', version, 'options', options, 'length'];
    const dataPath = ['dama', pgEnv, 'viewsbyId', version, 'options', options, 'databyIndex'];
    //const dataSourceByCategoryPath = ['dama', pgEnv, 'sources', 'byCategory', category];
    const attributionPath = ['dama', pgEnv, 'views', 'byId', version, 'attributes'],
        attributionAttributes = ['source_id', 'view_id', 'version', '_modified_timestamp'];


    const lendata = await falcor.get(lenPath);
    const len = get(lendata, ['json',...lenPath], 0);

    

    const dataResponse = await falcor.get([...dataPath, {from: 0, to: len - 1}, [geoAttribute, ...columns]]);
    const attrResp = await falcor.get([...attributionPath, attributionAttributes]);
    const attributionData = get(attrResp, ['json', ...attributionPath], {});

    const data =  Object.values(get(dataResponse, ['json',...dataPath], {}))
  

    if (!data?.length || !colors?.length) return {};

    const geoids = data.map(d => d[geoAttribute] + '');
    const stateFips = (geoid?.substring(0, 2) || geoids[0] || '00').substring(0, 2);
    const geoColors = {}
    const geoLayer = geoids[0]?.toString().length === 5 ? 'counties' : 'tracts';

    const diffData = data.map((d) => {
        return getDateDiff(d[columns?.[0]]) || -5
    })


    const colorScale = scaleThreshold()
        .domain([-22,-0.01,0])
        .range(['#efb700','#d73027','#1a9850']);
    
    const domain = [-22,-1,0]

    data.forEach(record => {
        let value = (getDateDiff(record['approval_date']) || -5);
        record.plan_status = "Plan Approved"
        if((record['under_fema_review_yes_no'] === 't' || record['update_in_progress'] === 't')) {
            value = -23
            record.plan_status = 'Update in Progress'
        } else if (value < 0 && record['update_in_progress'] === 'f') {
          record.plan_status = "Plan Expired, No Update in Progress"
        } else {
           record.plan_status = "Plan Approved"
        }
        geoColors[(record[geoAttribute]+'')] = value ? colorScale(value) : '#d0d0ce';
    })

    
    //console.log('test', geoColors)
    //const geoids = [...new Set(Object.keys(geoColors || {}).map(geoId => geoId.substring(0, 5)))]


   
    const sources =  [{
          id: "counties",
          source: {
            "type": "vector",
            "url": "https://tiles.availabs.org/data/tiger_carto.json"
          },
        }]

    // console.log('geoids', geoids)

    const layers = [{
      "id": "counties",
      "source": "counties",
      "source-layer": "s365_v778",
      "type": "fill",
      "filter" :   ['==', '36', ['slice',['string', ['get', 'geoid']],0,2]],
      
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
        mapFocus: [-79.761313,40.477399,-71.777491,45.01084],
        data
    }
}


const Edit = ({value, onChange, size}) => {

    const {falcor, falcorCache} = useFalcor();

    let cachedData = value && isJson(value) ? JSON.parse(value) : {};
    const baseUrl = '/';

    const [dataSources, setDataSources] = useState(cachedData?.dataSources || []);
    const [dataSource, setDataSource] = useState(cachedData?.dataSource);
    const [version, setVersion] = useState(cachedData?.version || 1456);
    const [geoAttribute, setGeoAttribute] = useState(cachedData?.geoAttribute || 'geoid');
    // const [attribute, setAttribute] = useState(/*cachedData?.attribute ||*/ 'plan_approval_date');
    


    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(cachedData?.status);
    const [compData, setCompData] = useState({
        geoid: cachedData?.geoid || '36',
        //geoAttribute: cachedData?.geoAttribute,
        data: cachedData?.data || [],
        type: cachedData?.type || 'total_losses',
        typeId: cachedData?.typeId,
        mapFocus: cachedData.mapFocus || [-79.761313,40.477399,-71.777491,45.01084],
        numColors: cachedData?.numColors || 5,
        colors: cachedData?.colors || defaultColors,
        title: cachedData?.title || 'County Plan Status Map',
        height: cachedData?.height || 500,
        attributionData: cachedData.attributionData || {},
        size: 1,
        
    })
  
    const category = 'county statuses';

    
    const dataSourceByCategoryPath = ['dama', pgEnv, 'sources', 'byCategory', category];
    

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
        const load = async () => {
            console.log('load on compdataChange')
            const {
                geoid, colors, height, size
            } = compData
           
            
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
                    version,
                    colors,
                    size,
                    height
                }, falcor)
                // console.log(
                //     'testing got data', value === JSON.stringify({...cachedData, ...out}), 
                //     'args', )
                if(value !== JSON.stringify({...cachedData, ...out})) {
                    //console.log('changing value')
                    onChange(JSON.stringify({...cachedData, ...out}))
                }
                setLoading(false)
            }
        }
        load();
    }, [compData, version]);

    const layerProps = useMemo(() => { 
        //console.log('setting Layer Props', cachedData)
        return {
            ccl: {
                ...cachedData,
                change: e => {
                    // turn off image saving
                    e.img = undefined
                    if(value !== JSON.stringify({...cachedData, ...e})){
                        //console.log('change from map', e)

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
                                <div className={`flex-none w-full p-1 relative`} style={{height: `${compData.height || '500'}px`}}>
                                    <CountyStatusLegend />
                                    <EditMap
                                        falcor={falcor}
                                        layerType= {() => new CountyMapLayer()}
                                        layerProps={layerProps}
                                        legend={false}
                                    />
                                </div>
                                <Attribution baseUrl={baseUrl} attributionData={compData.attributionData}/>
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
    console.log('test 123', data)

    return (
        <div className='relative w-full p-6'>
            {
               data.img  ?
                    <div className='h-80vh flex-1 flex flex-col relative'>
                         <CountyStatusLegend />
                        <img alt='Choroplath Map' src={get(data, ['img'])}/>
                        
                    </div> : 
                    <div className={`flex-none w-full p-1 relative`} style={{height: `${data.height}px`}}>
                        <CountyStatusLegend />
                        <ViewMap
                            layerProps={{ccl: data}}
                            layerType= {() => new CountyMapLayer()}
                            legend={{show:false}}
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