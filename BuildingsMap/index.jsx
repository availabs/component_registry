import React, {useEffect, useMemo, useState} from "react";
import get from "lodash/get";
import {useFalcor} from '~/modules/avl-falcor';
import {pgEnv} from "~/utils/";
import {isJson} from "~/utils/macros.jsx";
import VersionSelectorSearchable from "../shared/versionSelector/searchable.jsx";
import GeographySearch from "../shared/geographySearch.jsx";
import {Loading} from "~/utils/loading.jsx";
import {ButtonSelector} from "../shared/buttonSelector.jsx";
import {getColorRange} from "~/pages/DataManager/utils/color-ranges.js";
import {RenderMap} from "../shared/Map/RenderMap.jsx";
import {hazardsMeta} from "~/utils/colors.jsx";
import {Attribution} from "../shared/attribution.jsx";
import Multiselect from "../shared/MultiSelect.jsx";
import {RenderLegend} from "./components/RenderLegend.jsx";

const getGeoColors = ({
                          geoid,
                          data = [],
                          columns = [],
                          geoAttribute,
                          paintFn
}) => {
    if (!data?.length) return {};

    const geoids = data.map(d => d[geoAttribute]);
    const stateFips = (geoid?.toString()?.substring(0, 2) || geoids[0] || '00').substring(0, 2);

    const geoColors = {}
    const geoLayer = geoids[0]?.toString().length === 5 ? 'counties' : 'tracts';

    if (geoid?.toString()?.length === 5) {
        geoColors[geoid] = '#d3d3d3'
    } else {
        for (let id = 0; id <= 999; id += 1) {
            const gid = stateFips + id.toString().padStart(3, '0');

            const record = data.find(d => d.geoid === gid) || {};
            const value = paintFn ? paintFn(record) : record[columns?.[0]];
            geoColors[gid] = geoids.includes(gid) && value ? colorScale(value) : '#d3d3d3';
        }
    }

    return {geoColors, geoLayer: 'counties'};
}

const parseJson = (value) => {
    try {
        return JSON.parse(value);
    } catch (e) {
        return null;
    }
}

const pickHazardFromRow = (row, hazards) =>
    hazards.filter(h => row[`nri_${hazardsMeta[h].prefix}_eals`] >= 0)
        .sort((a,b) => +row[`nri_${hazardsMeta[b].prefix}_eals`] - +row[`nri_${hazardsMeta[a].prefix}_eals`])[0];

const makeFeatures = ({data = [], hazard, floodPlain}) => {
    const floodPlainColors = {
        '100': '#6e0093',
        '500': '#2a6400',
    }
    const radiusScale = 2;
    const geoJson = {
        type: 'FeatureCollection',
        features: data.map(d => {

            // preference: flood plains, hazards in order of highest to lowest score
            const color =
                floodPlain.length && ['AH','A','VE','AO','AE'].includes(d.flood_zone) ? floodPlainColors["100"] :
                    floodPlain.length && ['X'].includes(d.flood_zone) ? floodPlainColors["500"] :
                        hazardsMeta[pickHazardFromRow(d, hazard)]?.color;
            return {
                'type': 'Feature',
                'properties': {
                    color,
                    borderColor: color,
                    radius: radiusScale, ...d
                },
                'geometry': parseJson(d['st_asgeojson(st_centroid(footprint)) as building_centroid'])
            }
        })
    }

    return geoJson
}
// 2 queries
// 1: floodplain if selected, else return []
// 2: hazard if selected, else return []

async function getData({geoAttribute, geoid, version, hazard, colors, title, dataSource, size, height, floodPlain,
                           numColors, buildingType, hazardScoreThreshold}, falcor) {
    const stateView = 285; // need to pull this based on categories
    const countyView = 286;

    const options = JSON.stringify({
        filter: {
            ...geoAttribute && {[`substring(${geoAttribute}::text, 1, ${geoid?.toString()?.length})`]: [geoid]},
            ...JSON.parse(buildingType || '{}'),
        },
    });
    const lenPath = ['dama', pgEnv, 'viewsbyId', version, 'options', options, 'length'];
    const dataPath = ['dama', pgEnv, 'viewsbyId', version, 'options', options, 'databyIndex'];
    const attributes = [
        'building_id',
        'address',
        'st_asgeojson(st_centroid(footprint)) as building_centroid',
        ...Array.isArray(hazard) ? hazard.map(h => `nri_${hazardsMeta[h]?.prefix}_eals`) : [],
        'flood_zone'
    ];
    const attributionPath = ['dama', pgEnv, 'views', 'byId', version, 'attributes'],
        attributionAttributes = ['source_id', 'view_id', 'version', '_modified_timestamp'];


    await falcor.get(lenPath);
    const len = get(falcor.getCache(), lenPath, 0);

    await falcor.get([...dataPath, {from: 0, to: len - 1}, [geoAttribute, ...attributes]]);
    await falcor.get([...attributionPath, attributionAttributes]);
    console.log('d?', Object.values(get(falcor.getCache(), dataPath, {})), hazard, floodPlain)
    const data = Object.values(get(falcor.getCache(), dataPath, {}))
        .filter(d =>
            // at least one hazard is above threshold
            (
                hazard?.length &&
                hazard.reduce((acc, curr) =>
                        acc ||
                        typeof d[`nri_${hazardsMeta[curr]?.prefix}_eals`] !== 'object' &&
                        d[`nri_${hazardsMeta[curr]?.prefix}_eals`] >= hazardScoreThreshold
                    , false)
            ) ||
            // building falls under one of the selected flood plains
            (
                floodPlain?.length &&
                floodPlain.reduce((acc, curr) =>
                        acc ||
                        typeof d.flood_zone !== "object" &&
                        (JSON.parse(curr)?.flood_zone || []).includes(d.flood_zone)
                    , false)
            )
        )

    // mapFocus
    const geomColTransform = [`st_asgeojson(st_envelope(ST_Simplify(geom, ${geoid?.toString()?.length === 5 ? `0.1` : `0.5`})), 9, 1) as geom`],
        geoIndices = {from: 0, to: 0},
        stateFips = get(data, [0, 'geoid']) || geoid?.toString()?.substring(0, 2),
        geoPath = (view_id) =>
            ['dama', pgEnv, 'viewsbyId', view_id,
                'options', JSON.stringify({
                filter: {
                    geoid: [geoid?.toString()?.length >= 5 ? geoid : stateFips.substring(0, 2)]
                }}),
                'databyIndex'
            ];
    const geomRes = await falcor.get([...geoPath(geoid?.toString()?.length === 5 ? countyView : stateView), geoIndices, geomColTransform]);
    const geom = get(geomRes, ["json", ...geoPath(geoid?.toString()?.length === 5 ? countyView : stateView), 0, geomColTransform]);
    const mapFocus = get(JSON.parse(geom), 'bbox');

    const attributionData = get(falcor.getCache(), attributionPath, {});

    const {geoColors, domain, geoLayer} =
        getGeoColors({geoid, data, columns: attributes, geoAttribute});

    const geoJson = makeFeatures({data, hazard, floodPlain})



    const layerProps =
    {
        ccl: {
            data: (data || [])
                .map(d => ({
                    building_id: d.building_id,
                    address: typeof d.address !== 'object' ? d.address : null,
                    floodPlain : ['AH','A','VE','AO','AE'].includes(d.flood_zone) ? '100 Year' :
                        ['X'].includes(d.flood_zone) ? '500 Year' : 'None',
                    ...hazard
                        .sort((a,b) => +d[`nri_${hazardsMeta[b]?.prefix}_eals`] - +d[`nri_${hazardsMeta[a]?.prefix}_eals`])
                        .reduce((acc, h) => ({
                            ...acc,
                            [`${h} Score`]: +d[`nri_${hazardsMeta[h]?.prefix}_eals`]
                        }) ,{})
                })),
                dataFormat: d => d,
                idCol: 'building_id',
                showLegend: false,
                geoJson,
                geoColors,
                domain,
                mapFocus,
                colors,
                title,
                attributes,
                geoAttribute,
                dataSource,
                version,
                geoLayer,
                height,
                size
        }
    }
    return {
        data,
        geoAttribute,
        geoid,
        version,
        colors,
        mapFocus,
        attributionData,
        geoColors,
        domain,
        geoLayer,
        layerProps,
        title,
        dataSource,
        size,
        height,
        hazard,
        floodPlain,
        numColors,
        buildingType,
        hazardScoreThreshold
    }
}
const Edit = ({value, onChange, size}) => {

    const {falcor, falcorCache} = useFalcor();

    let cachedData = value && isJson(value) ? JSON.parse(value) : {};
    const baseUrl = '/';

    const [dataSources, setDataSources] = useState(cachedData?.dataSources || []);
    const [dataSource, setDataSource] = useState(cachedData?.dataSource);
    const [version, setVersion] = useState(cachedData?.version || 842);
    const [geoAttribute, setGeoAttribute] = useState(cachedData?.geoAttribute);
    const [buildingType, setBuildingType] = useState(cachedData?.buildingType || JSON.stringify({value_source: ['ogs']}));
    const [floodPlain, setFloodPlain] = useState(cachedData?.floodPlain || []);
    const [hazard, setHazard] = useState(cachedData?.hazard || []);
    const [hazardScoreThreshold, setHazardScoreThreshold] = useState(cachedData?.hazardScoreThreshold || 70);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(cachedData?.status);
    const [geoid, setGeoid] = useState(cachedData?.geoid || '36');
    const [data, setData] = useState(cachedData?.data);
    const [mapFocus, setMapfocus] = useState(cachedData?.mapFocus);
    const [numColors, setNumColors] = useState(cachedData?.numColors || 5);
    const [shade, setShade] = useState(cachedData?.shade || 'Oranges');
    const [colors, setColors] = useState(cachedData?.colors || getColorRange(5, "Oranges", false));
    const [title, setTitle] = useState(cachedData?.title);
    const [height, setHeight] = useState(cachedData?.height || 500);
    const stateView = 285; // need to pull this based on categories
    const category = 'Buildings';
    const dataSourceByCategoryPath = ['dama', pgEnv, 'sources', 'byCategory', category];

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
                dataSources.find(ds => ds.source_id === dataSource)?.metadata?.columns ||
                dataSources.find(ds => ds.source_id === dataSource)?.metadata ||
                [])
                .find(c => c.display === 'geoid-variable');
        geoAttribute?.name && setGeoAttribute(geoAttribute?.name);
    }, [dataSources, dataSource]);

    useEffect(() => {
        // setTitle(metaData.title(hazardsMeta[hazard]?.name, attributes, consequence))

        async function load(){
            if (!geoAttribute || !version || !dataSource || !buildingType || !geoid) {
                !buildingType?.length && setStatus('Please select Building Type.');
                !geoAttribute?.length && setStatus('No geo attribute found.');
                !geoid?.toString()?.length && setStatus('Please select a geography.');
                !version && setStatus('Please select a version.');
                !dataSource && setStatus('Please select a Datasource.');
                setLoading(false);
                return;
            }

            setLoading(true);
            setStatus(undefined);

            const data = await getData({
                geoAttribute, geoid, version, colors, title, dataSource, size, height, hazard, floodPlain,
                numColors, buildingType, hazardScoreThreshold
            }, falcor);

            onChange(JSON.stringify({
                ...data,
            }));

            setLoading(false);
        }

        load()
    }, [
        geoAttribute, geoid, version, colors, title, dataSource, size, height, hazard, floodPlain,
        numColors, buildingType, hazardScoreThreshold
    ]);
    console.log('data', data)
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
                            setGeoAttribute(undefined);
                            setVersion(undefined);
                            setData([]);

                            setDataSource(e);
                        }}
                    />
                    <VersionSelectorSearchable
                        source_id={dataSource}
                        view_id={version}
                        onChange={setVersion}
                        className={'flex-row-reverse'}
                    />
                    <GeographySearch value={geoid} onChange={setGeoid} className={'flex-row-reverse'}/>

                    <ButtonSelector
                        label={'Building Type:'}
                        types={[
                            {label: 'State Owned', value: JSON.stringify({value_source: ['ogs']})},
                            {label: 'Critical', value: JSON.stringify({critical: ['not null']})}]}
                        type={buildingType}
                        setType={setBuildingType}
                    />

                    <Multiselect
                        className={'my-1 bg-white rounded-md w-3/4 shrink flex-row-reverse'}
                        label={'Filter by'}
                        value={[...floodPlain, ...hazard]}
                        onChange={e => {
                            const floodplains = e.filter(e => e.type === 'floodplain').map(e => e.key);
                            const hazards =
                                e.filter(e => e.type === 'hazard')
                                    .map(e => e.key)
                                    .sort((a,b) => hazardsMeta[a].name.localeCompare(hazardsMeta[b].name));
                            setData([]);
                            setFloodPlain(floodplains);
                            setHazard(hazards);
                        }}
                        options={
                            [
                                {
                                    label: '100 Year',
                                    key: JSON.stringify({flood_zone: ['AH', 'A', 'VE', 'AO', 'AE']}),
                                    type: 'floodplain'
                                },
                                {
                                    label: '500 Year',
                                    key: JSON.stringify({flood_zone: ['X']}),
                                    type: 'floodplain'
                                },
                                ...Object.keys(hazardsMeta)
                                    .sort((a,b) => hazardsMeta[a].name.localeCompare(hazardsMeta[b].name))
                                    .map((k, i) => ({
                                        label: hazardsMeta[k].name,
                                        key: k,
                                        type: 'hazard'
                                    }))
                            ]
                        }
                    />

                    {hazard?.length ? <div className={'w-full flex flex-row text-sm'}>
                        <label className={'shrink-0 pr-2 py-2 my-1 w-1/4'}>Threshold:</label>
                        <input
                            key={'pageSizeInput'}
                            className={'p-2 my-1 bg-white rounded-md w-3/4 shrink'}
                            type={"number"}
                            placeholder={'Table Page Size'}
                            value={hazardScoreThreshold}
                            onChange={e => setHazardScoreThreshold(e.target.value)}
                            onWheel={e => e.target.blur()}
                        />
                    </div> : null}

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
                                <RenderLegend floodPlain={floodPlain} hazard={hazard} buildingType={buildingType}/>
                                <div className={`flex-none w-full p-1`} style={{height: `${height}px`}}>
                                    <RenderMap
                                        interactive={true}
                                        falcor={falcor}
                                        layerProps={cachedData.layerProps}
                                        legend={{domain: cachedData.domain, range: colors, title, size, show: false}}
                                        layers={['Circles']}
                                    />
                                </div>
                                <Attribution baseUrl={baseUrl} attributionData={cachedData.attributionData}/>
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

    return (
        <div className='relative w-full p-6'>
            {
                data?.status ?
                    <div className={'p-5 text-center'}>{data?.status}</div> :
                    data?.img  ?
                        <div className='h-80vh flex-1 flex flex-col'>
                            <img alt='Choroplath Map' src={get(data, ['img'])}/>
                        </div> :
                        <React.Fragment>
                            <div className={`flex-none w-full p-1`} style={{height: `${data?.height}px`}}>
                                <RenderLegend floodPlain={data?.floodPlain} hazard={data?.hazard} buildingType={data?.buildingType}/>
                                <RenderMap
                                    interactive={false}
                                    layerProps={data.layerProps}
                                    legend={{show: false}}
                                    layers={['Circles']}
                                />
                            </div>
                            <Attribution baseUrl={baseUrl} attributionData={data.attributionData}/>
                        </React.Fragment>
            }
        </div>
    )
}


export default {
    "name": 'Map: Buildings',
    "type": 'Map',
    "variables": [
        {
            name: 'geoid',
            default: '36',
        },
        {
            name: 'dataSources',
            hidden: true
        },
        {
            name: 'dataSource',
            hidden: true
        },
        {
            name: 'version',
            hidden: true
        },
        {
            name: 'geoAttribute',
            hidden: true
        },
        {
            name: 'hazard',
            hidden: true
        },
        {
            name: 'title',
            hidden: true
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
            name: 'floodPlain',
            hidden: true
        },
        {
            name: 'buildingType',
            hidden: true
        },
        {
            name: 'hazardScoreThreshold',
            hidden: true
        },
        {
            name: 'numColors',
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