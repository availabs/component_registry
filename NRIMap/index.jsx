import React, {useEffect, useMemo, useState} from "react";
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
import {scaleThreshold} from "d3-scale";
import {getColorRange} from "~/pages/DataManager/utils/color-ranges.js";
import ckmeans from '~/utils/ckmeans';
import {RenderMap} from "../shared/Map/RenderMap.jsx";
import {HazardSelectorSimple} from "../shared/HazardSelector/hazardSelectorSimple.jsx";
import {hazardsMeta} from "~/utils/colors.jsx";
import {Attribution} from "../shared/attribution.jsx";

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
    // const stateFips = (geoid?.toString()?.substring(0, 2) || geoids[0] || '00').substring(0, 2);
    const geoColors = {}

    const colorScale = getColorScale(
        data.map((d) => paintFn ? paintFn(d) : d[columns?.[0]]).filter(d => d),
        colors
    );
    const domain = getDomain(
        data.map((d) => paintFn ? paintFn(d) : d[columns?.[0]]).filter(d => d),
        colors
    )

    data.forEach(record => {
        const value = paintFn ? paintFn(record) : record[columns?.[0]];
        geoColors[record.geoid] = value ? colorScale(value) : '#d0d0ce';
    })
    return {geoColors, domain};
}

async function getData({
                           geoAttribute, geoid, version, attribute, colors, title, dataSource, size, height,
                           hazard, consequence, typeId, dataSourceSRCId, dataSourceViewId,
                           numColors, shade
                       }, falcor) {
    const stateView = 285; // need to pull this based on categories
    const countyView = 286;

    const
        geomColName = metaData.dataSources.find(d => d.value === dataSource)?.geomCol,
        columns = [hazard === 'total' ? `eal_val${consequence || `t`}` : `${hazardsMeta[hazard]?.prefix}_${attribute}${consequence || ``}`],
        options = JSON.stringify({
            filter: {[`substring(${geomColName}, 1, ${geoid?.toString()?.length})`]: [geoid]},
        }),
        attributes = {
            geoid: `${geomColName} as geoid`,
            ...(columns || [])
                .reduce((acc, curr) => ({...acc, [curr]: `${curr}`}), {})
        },
        dataPath = view_id => ['dama', pgEnv, 'viewsbyId', view_id, 'options', options];

    const attributionPath = view_id => ['dama', pgEnv, 'views', 'byId', view_id, 'attributes', ['source_id', 'view_id', 'version', '_modified_timestamp']];

    const dataLenRes = await falcor.get(
        [...dataPath(typeId), 'length'],
        attributionPath(typeId)
    );

    const len = get(dataLenRes, ['json', ...dataPath(typeId), 'length']);

    const dataRes = await falcor.get([...dataPath(typeId), 'databyIndex', {
        from: 0,
        to: len - 1
    }, Object.values(attributes)]);

    let data = Object.values(get(dataRes, ['json', ...dataPath(typeId), 'databyIndex'], {}));
    data = [...Array(len).keys()].map(i => {
        return Object.keys(attributes).reduce((acc, curr) => ({
            ...acc,
            [curr]: data[i][attributes[curr]]
        }), {});
    });

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

    const {geoColors, domain} = getGeoColors({geoid, data, columns: columns, paintFn: metaData.paintFn, colors});

    const attributionData = get(falcor.getCache(), ['dama', pgEnv, 'views', 'byId', typeId, 'attributes'], {});

    const geoLayer = metaData.dataSources.find(d => d.value === dataSource)?.geoLayer;

    const layerProps = {
        ccl: {
            view: metaData,
            data,
            geoColors,
            mapFocus,
            domain,
            colors,
            title,
            hazard,
            attribute,
            consequence,
            dataSource,
            dataSourceSRCId,
            dataSourceViewId,
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
        attribute,
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
        dataSourceSRCId,
        dataSourceViewId,
        hazard, consequence, typeId,
        numColors, shade
    }
}

const Edit = ({value, onChange, size}) => {

    const {falcor, falcorCache} = useFalcor();

    let cachedData = value && isJson(value) ? JSON.parse(value) : {};
    const baseUrl = '/';

    const [dataSource, setDataSource] = useState(cachedData?.dataSource || 'avail_counties');
    const [dataSourceSRCId, setDataSourceSRCId] = useState(cachedData?.dataSourceSRCId);
    const [dataSourceViewId, setDataSourceViewId] = useState(cachedData?.dataSourceViewId);
    const [typeId, setTypeId] = useState(cachedData?.typeId);

    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(cachedData?.status);
    const [geoid, setGeoid] = useState(cachedData?.geoid || '36');
    const [hazard, setHazard] = useState(cachedData?.hazard || 'total');
    const [data, setData] = useState(cachedData?.data);
    const [attribute, setAttribute] = useState(cachedData?.attribute || 'eal');
    const [consequence, setConsequance] = useState(cachedData?.consequence || 't');
    const [mapFocus, setMapfocus] = useState(cachedData?.mapFocus);
    const [numColors, setNumColors] = useState(cachedData?.numColors || 5);
    const [shade, setShade] = useState(cachedData?.shade || 'Oranges');
    const [colors, setColors] = useState(cachedData?.colors || getColorRange(5, "Oranges", false));
    const [title, setTitle] = useState(cachedData?.title);
    const [height, setHeight] = useState(cachedData?.height || 500);

    const dependencyPath = (view_id) => ["dama", pgEnv, "viewDependencySubgraphs", "byViewId", view_id];

    useEffect(() => {
        const ealSourceId = 343;
        const nriSourceId = 159;
        const nriTractsSourceId = 346;

        setLoading(true);
        const dataSourceMapping = {
            avail_counties: ealSourceId,
            nri: nriSourceId,
            nri_tracts: nriTractsSourceId
        }
        setDataSourceSRCId(dataSourceMapping[dataSource]);
    }, [dataSource]);

    useEffect(() => {
        async function setView() {
            setLoading(true)
            if (dataSource === 'avail_counties') {
                const dependencyRes = await falcor.get(dependencyPath(dataSourceViewId));
                const deps = get(dependencyRes, ["json", ...dependencyPath(dataSourceViewId), "dependencies"], []);
                const typeId = deps.find(dep => dep.type === 'nri');

                if (!typeId) {
                    setLoading(false)
                    setStatus('This component only supports EAL versions that use Fusion data.')
                    return Promise.resolve();
                }
                setTypeId(typeId.view_id);
            }else{
                setTypeId(dataSourceViewId)
            }
            // setLoading(false)
        }

        setView();
    }, [dataSourceSRCId, dataSourceViewId]);

    useEffect(() => {
        // get required data, pass paint properties as prop.

        async function load(){
            if (!geoid || !hazard || !attribute || (attribute !== 'afreq' && !consequence)) {
                !consequence && setStatus('Please Select a Consequence.')
                !attribute && setStatus('Please Select an Attribute.');
                !hazard && setStatus('Please Select a Hazard.');
                !geoid && setStatus('Please Select a Geography.');
                return Promise.resolve();
            } else {
                setStatus(undefined)
            }
            setLoading(true);
            setStatus(undefined);

            setTitle(metaData.title(hazard === 'total' ? '' : hazardsMeta[hazard]?.name, attribute, consequence))

            const data = await getData({
                 geoid, attribute, colors, title, dataSource, size, height,
                hazard, consequence, typeId, dataSourceSRCId, dataSourceViewId,
                numColors, shade
            }, falcor);

            onChange(JSON.stringify({
                ...data,
            }));

            setLoading(false);
        }

        load()
    }, [
        typeId,
        geoid, hazard, attribute, consequence,
        numColors, shade, colors,
        title, dataSource, size, height, dataSourceSRCId, dataSourceViewId
    ]);

    return (
        <div className='w-full'>
            <div className='relative'>
                <div className={'border rounded-md border-blue-500 bg-blue-50 p-2 m-1'}>
                    Edit Controls
                    <ButtonSelector
                        label={'Data Source:'}
                        types={metaData.dataSources}
                        type={dataSource}
                        setType={e => {
                            // setAttribute(undefined);
                            // setConsequance(undefined);
                            setDataSourceViewId(undefined);
                            setDataSourceSRCId(undefined);
                            setDataSource(e);
                        }}
                    />
                    <VersionSelectorSearchable
                        source_id={dataSourceSRCId}
                        view_id={dataSourceViewId}
                        onChange={setDataSourceViewId}
                        className={'flex-row-reverse'}
                    />
                    <GeographySearch value={geoid} onChange={setGeoid} className={'flex-row-reverse'}/>
                    <HazardSelectorSimple hazard={hazard} setHazard={e => {
                        e === 'total' && setAttribute('eal')
                        setHazard(e)
                    }} showTotal={true}/>
                    <ButtonSelector
                        label={'Attribute:'}
                        types={
                            Object.keys(metaData.attributes)
                                .map(t => ({label: t.replace('_', ' '), value: metaData.attributes[t]}))
                        }
                        type={attribute}
                        setType={e => {
                            setAttribute(e);
                            e === 'afreq' && setConsequance(null)
                        }}
                        disabled={!hazard || hazard === 'total'}
                        disabledTitle={'Please Select a Hazard.'}
                    />
                    <ButtonSelector
                        label={'Consequence:'}
                        types={
                            Object.keys(metaData.consequences)
                                .filter(c => (!hazard || hazard === 'total') ? !['Population', 'Population $'].includes(c) : true)
                                .map(t => ({label: t.replace('_', ' '), value: metaData.consequences[t]}))
                        }
                        type={consequence}
                        setType={setConsequance}
                        disabled={attribute === 'afreq' || !attribute}
                        disabledTitle={'Frequency is independent of Consequence.'}
                        autoSelect={false}
                    />
                    <RenderColorPicker
                        title={'Colors: '}
                        numColors={numColors}
                        setNumColors={setNumColors}
                        shade={shade}
                        setShade={setShade}
                        colors={colors}
                        setColors={setColors}
                    />
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
                                        interactive={true}
                                        falcor={falcor}
                                        layerProps={cachedData.layerProps}
                                        legend={{domain: cachedData.domain, range: colors, title, size}}
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
    const attributionData = data?.attributionData;

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
            <Attribution baseUrl={baseUrl} attributionData={attributionData}/>
        </div>
    )
}


export default {
    "name": 'Map: NRI',
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
            name: 'consequence',
            hidden: true
        },
        {
            name: 'attribute',
            default: 'eal',
            hidden: true
        },
        {
            name: 'typeId',
            hidden: true
        },
        {
            name: 'dataSourceSRCId',
            hidden: true
        },
        {
            name: 'dataSourceViewId',
            hidden: true
        },
        {
            name: 'title',
            hidden: true
        },
        {
            name: 'dataSource',
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