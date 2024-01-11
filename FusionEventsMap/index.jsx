import React, {memo, useEffect, useMemo, useState} from "react";
import get from "lodash/get";
import {useFalcor} from '~/modules/avl-falcor';
import {pgEnv} from "~/utils/";
import {isJson} from "~/utils/macros.jsx";
import VersionSelectorSearchable from "../shared/versionSelector/searchable.jsx";
import GeographySearch from "../shared/geographySearch.jsx";
import {Loading} from "~/utils/loading.jsx";
import {metaData} from "./config.js";
import {ButtonSelector} from "../shared/buttonSelector.jsx";
import {RenderColorPicker} from "../shared/colorPicker.jsx";
import {scaleLinear, scaleThreshold} from "d3-scale";
import {getColorRange} from "~/pages/DataManager/utils/color-ranges.js";
import ckmeans from '~/utils/ckmeans';
import {RenderMap} from "../shared/Map/RenderMap.jsx";
import {Attribution} from "../shared/attribution.jsx";
import {HazardSelectorSimple} from "../shared/HazardSelector/hazardSelectorSimple.jsx";
import {handleMapFocus, setChoroplethData, setCirclesData} from "./macros.js";

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

const getRadiusScale = (domain = []) => {
    return scaleLinear()
        .domain([Math.min(...domain), Math.max(...domain)])
        .range([5, 50]);
}
const getGeoColors = ({geoid, data = [], columns = [], paintFn, colors = [], ...rest}) => {
    if (!data?.length || !colors?.length) return {};
    const geoids = data.map(d => d.geoid);
    const stateFips = (geoid?.substring(0, 2) || geoids[0] || '00').substring(0, 2);
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
        geoColors[gid] = geoids.includes(gid) && value ? colorScale(value) : '#d3d3d3';
    }
    return {geoColors, domain};
}

const parseJson = (value) => {
    try {
        return JSON.parse(value);
    }catch (e){
        return null;
    }
}
const makeFeatures = ({data = []}) => {
    const radiusScale = getRadiusScale(data.filter(d => !isNaN(+d.magnitude)).map(d => +d.magnitude));

    const geoJson = {
        type: 'FeatureCollection',
        features: data.map(d => ({
            'type': 'Feature',
            'properties': {color: d.color, borderColor: '#6e6e6e', radius: radiusScale(+d.magnitude), ...d},
            'geometry': parseJson(d.location)
        }))
    }

    return geoJson
}

const Edit = ({value, onChange, size}) => {
    const {falcor, falcorCache} = useFalcor();

    let cachedData = value && isJson(value) ? JSON.parse(value) : {};
    const baseUrl = '/';

    const ealSourceId = 343;
    const [ealViewId, setEalViewId] = useState(cachedData?.ealViewId || 837);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(cachedData?.status);
    const [geoid, setGeoid] = useState(cachedData?.geoid || '36');
    const [type, setType] = useState(cachedData?.type || 'Choropleth');
    const [attribute, setAttribute] = useState(cachedData?.attribute || 'Property Loss');
    const [hazard, setHazard] = useState(cachedData?.hazard || 'hail');
    const [typeId, setTypeId] = useState(cachedData?.typeId);
    const [data, setData] = useState(cachedData?.data);
    const [mapFocus, setMapfocus] = useState(cachedData?.mapFocus);
    const [numColors, setNumColors] = useState(cachedData?.numColors || 5);
    const [shade, setShade] = useState(cachedData?.shade || 'Oranges');
    const [colors, setColors] = useState(cachedData?.colors || getColorRange(5, "Oranges", false));
    const [title, setTitle] = useState(cachedData?.title);
    const [height, setHeight] = useState(cachedData?.height || 500);

    const dependencyPath = (view_id) => ["dama", pgEnv, "viewDependencySubgraphs", "byViewId", view_id],
        geomColName = `geoid`,
        choroplethColumns = Object.values(metaData.fusion.columns),
        choroplethOptions = JSON.stringify({ //duplicate this route to get loss per event_id
            aggregatedLen: true,
            filter: {
                [`substring(${geomColName}, 1, ${geoid?.toString()?.length})`]: [geoid],
                'nri_category': [hazard]
            },
            groupBy: [geomColName]
        }),
        choroplethAttributes = {
            geoid: `${geomColName} as geoid`,
            'event_ids': 'array_agg(distinct event_id) as event_ids',
            ...(choroplethColumns || [])
                .reduce((acc, curr) => ({...acc, [curr]: `${curr}`}), {})
        },
        choroplethPath = view_id => ['dama', pgEnv, 'viewsbyId', view_id, 'options', choroplethOptions];

    const eventMagnitudeColumns = Object.values(metaData.fusion.columns),
        eventMagnitudeOptions = JSON.stringify({ //duplicate this route to get loss per event_id
            aggregatedLen: true,
            filter: {
                [`substring(${geomColName}, 1, ${geoid?.toString()?.length})`]: [geoid],
                'nri_category': [hazard]
            },
            exclude: {
                [metaData.fusion.rawColumns[attribute]]: ['null', 0]
            },
            groupBy: [geomColName, 'event_id', 'nri_category']
        }),
        eventMagnitudeAttributes = {
            geoid: `${geomColName} as geoid`,
            'event_id': 'event_id',
            'nri_category': 'nri_category',
            ...(eventMagnitudeColumns || [])
                .reduce((acc, curr) => ({...acc, [curr]: `${curr}`}), {})
        },
        eventMagnitudePath = view_id => ['dama', pgEnv, 'viewsbyId', view_id, 'options', eventMagnitudeOptions];

    const circlesOptions = ids => JSON.stringify({
            filter: {
                event_id: ids
            },
        }),
        circlesAttributes = {
            geoid: `substring(${geomColName}, 1, 5) as geoid`,
            'event_id': 'event_id',
            'lat': 'begin_lat',
            'lon': 'begin_lon',
            'point': 'ST_AsGeoJson(ST_setSrid(ST_MakePoint(begin_lon, begin_lat), 4326)) as point'
        },
        circlesPath = view_id => ['dama', pgEnv, 'viewsbyId', view_id, 'options'];

    const countyCentroidOptions = geoids => JSON.stringify({
            filter: {
                geoid: geoids
            }
        }),
        countyCentroidAttributes = {
            'geoid': `geoid`,
            'centroid': `st_asgeojson(st_centroid(geom)) as centroid`
        },
        countyCentroidPath = view_id => ['dama', pgEnv, 'viewsbyId', view_id, 'options'];

    const attributionPath = view_id => ['dama', pgEnv, 'views', 'byId', view_id, 'attributes', ['source_id', 'view_id', 'version', '_modified_timestamp']];


    useEffect(() => {
        // get required data, pass paint properties as prop.
        async function getData() {
            if (!geoid) {
                !geoid && setStatus('Please Select a Geography');
                return Promise.resolve();
            } else {
                setStatus(undefined)
            }
            setLoading(true);
            setStatus(undefined);
            return falcor.get(dependencyPath(ealViewId)).then(async res => {

                const deps = get(res, ["json", ...dependencyPath(ealViewId), "dependencies"]);

                const stateView = deps.find(dep => dep.type === "tl_state");
                const countyView = deps.find(dep => dep.type === "tl_county");
                const typeId = deps.find(dep => dep.type === 'fusion');
                const nceiEView = deps.find(dep => dep.type === 'ncei_storm_events_enhanced');

                if (!typeId) {
                    setLoading(false)
                    setStatus('This component only supports EAL versions that use Fusion data.')
                    return Promise.resolve();
                }
                setTypeId(typeId.view_id);
                setTitle(`Fusion ${attribute}`)

                if (type === 'Choropleth') {
                    await setChoroplethData({
                        falcor,
                        choroplethPath,
                        attributionPath,
                        choroplethAttributes,
                        typeId,
                        setLoading,
                        setData
                    })
                }


                if (type === 'Circles') {
                    await setCirclesData({
                        falcor,
                        eventMagnitudePath,
                        attributionPath,
                        circlesPath,
                        countyCentroidPath,
                        countyCentroidOptions,
                        countyCentroidAttributes,
                        eventMagnitudeAttributes,
                        circlesOptions,
                        circlesAttributes,
                        typeId,
                        nceiEView,
                        countyView,
                        setLoading,
                        setData,
                        attribute
                    })
                }

                await handleMapFocus({geoid, data, pgEnv, falcor, stateView, setMapfocus});

                setLoading(false);
            })
        }

        getData()
    }, [geoid, ealViewId, type, numColors, shade, colors, hazard, attribute]);

    const {geoColors, domain} = getGeoColors(
        {
            geoid, data,
            columns: choroplethColumns,
            paintFn: d => d[metaData.fusion.columns[attribute]],
            colors
        });


    const geoJson = makeFeatures({data});

    const attributionData = get(falcorCache, ['dama', pgEnv, 'views', 'byId', typeId, 'attributes'], {});
    const layerProps = useMemo(() => (
        {
            ccl: {
                view: metaData.fusion,
                data: (data || []).map(d => ({event_id: d.event_id, magnitude: d.magnitude})),
                // dataFormat: d => d,
                domain: type === 'Circles' ?
                    [...new Set(data.map(d => d.magnitude))] :
                    domain,
                range: type === 'Circles' ? [5, 50] : colors,
                showLegend: true,
                geoJson,
                hazard,
                attribute,
                type,
                geoColors,
                mapFocus,
                colors,
                title,
                size,
                height,
                change: e => onChange(JSON.stringify({
                    ...e,
                    domain: type === 'Circles' ?
                        [...new Set(data.map(d => d.magnitude))] :
                        domain,
                    range: type === 'Circles' ? [5, 50] : colors,
                    ealViewId,
                    geoid,
                    hazard,
                    geoJson,
                    attribute,
                    status,
                    type,
                    typeId,
                    attributionData,
                    data,
                    geoColors,
                    mapFocus,
                    numColors,
                    colors,
                    height
                }))
            }
        }),
        [ealViewId,
            geoid,
            hazard,
            geoJson,
            attribute,
            status,
            type,
            typeId,
            attributionData,
            data,
            geoColors,
            mapFocus,
            domain,
            numColors,
            colors,
            height,
            title,
            size
        ]
    );

    return (
        <div className='w-full'>
            <div className='relative'>
                <div className={'border rounded-md border-blue-500 bg-blue-50 p-2 m-1'}>
                    Edit Controls
                    <VersionSelectorSearchable
                        source_id={ealSourceId}
                        view_id={ealViewId}
                        onChange={setEalViewId}
                        className={'flex-row-reverse'}
                    />
                    <GeographySearch value={geoid} onChange={setGeoid} className={'flex-row-reverse'}/>
                    <HazardSelectorSimple
                        hazard={hazard}
                        setHazard={e => {
                            setData([])
                            setHazard(e)
                        }}
                    />
                    <ButtonSelector
                        label={'Type:'}
                        types={['Choropleth', 'Circles']}
                        type={type}
                        setType={type => {
                            setData([])
                            setType(type)
                        }}
                    />
                    <ButtonSelector
                        label={'Attribute:'}
                        types={
                            Object.keys(metaData.fusion.columns).map(c => ({label: c, value: c}))
                        }
                        type={attribute}
                        setType={setAttribute}
                    />
                    {type === 'Choropleth' &&
                        <RenderColorPicker
                            title={'Colors: '}
                            numColors={numColors}
                            setNumColors={setNumColors}
                            shade={shade}
                            setShade={setShade}
                            colors={colors}
                            setColors={setColors}
                        />}
                    <ButtonSelector
                        label={'Size:'}
                        types={[{label: 'Small', value: 500}, {label: 'Medium', value: 700}, {
                            label: 'Large',
                            value: 900
                        }]}
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
                                        falcor={falcor}
                                        layerProps={layerProps}
                                        legend={{
                                            domain: type === 'Circles' ?
                                                [...new Set(data.map(d => d.magnitude))] :
                                                domain,
                                            range: type === 'Circles' ? [5, 50] : colors,
                                            title,
                                            scaleType: type === 'Circles' ? 'linear' : 'quantile',
                                            type
                                            }}
                                        layers={[type]}
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
                data?.status ?
                    <div className={'p-5 text-center'}>{data?.status}</div> :
                    <div className='h-80vh flex-1 flex flex-col'>
                        <img alt='Choroplath Map' src={get(data, ['img'])}/>
                        <Attribution baseUrl={baseUrl} attributionData={attributionData}/>
                    </div>
            }
        </div>
    )
}


export default {
    "name": 'Map: Fusion Events Map',
    "type": 'Map',
    "EditComp": Edit,
    "ViewComp": View
}