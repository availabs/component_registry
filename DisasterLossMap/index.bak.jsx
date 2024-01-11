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
import {RenderMap} from "../shared/Map/RenderMap.jsx";
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
        geoColors[gid] = geoids.includes(gid) && value ? colorScale(value) : '#d0d0ce';
    }
    return {geoColors, domain};
}
const Edit = ({value, onChange, size}) => {
    const {falcor, falcorCache} = useFalcor();

    let cachedData = value && isJson(value) ? JSON.parse(value) : {};
    const baseUrl = '/';

    const ealSourceId = 343;
    const [ealViewId, setEalViewId] = useState(cachedData?.ealViewId || 837);
    const [disasterNumber, setDisasterNumber] = useState(cachedData?.disasterNumber || null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(cachedData?.status);
    const [geoid, setGeoid] = useState(cachedData?.geoid || '36');
    const [type, setType] = useState(cachedData?.type || 'total_losses');
    const [typeId, setTypeId] = useState(cachedData?.typeId);
    const [data, setData] = useState(cachedData?.data);
    const [mapFocus, setMapfocus] = useState(cachedData?.mapFocus);
    const [numColors, setNumColors] = useState(cachedData?.numColors || 5);
    const [shade, setShade] = useState(cachedData?.shade || 'Oranges');
    const [colors, setColors] = useState(cachedData?.colors || defaultColors);
    const [title, setTitle] = useState(cachedData?.title);
    const [height, setHeight] = useState(cachedData?.height || 500);

    const dependencyPath = (view_id) => ["dama", pgEnv, "viewDependencySubgraphs", "byViewId", view_id],
        geomColName = `substring(${metaData[type].geoColumn || 'geoid'}, 1, 5)`,
        disasterNumberColName = metaData[type].disasterNumberColumn || 'disaster_number',
        columns = Array.isArray(metaData[type]?.columns) ? metaData[type]?.columns : Object.values(metaData[type]?.columns),
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

    useEffect(() => setColors(metaData[type].colors || defaultColors), [type])
    useEffect(() => {
        // get required data, pass paint properties as prop.
        async function getData() {
            if (!geoid || !disasterNumber) {
                !geoid && setStatus('Please Select a Geography');
                !disasterNumber && setStatus('Please Select a Disaster');
                return Promise.resolve();
            } else {
                setStatus(undefined)
            }
            setLoading(true);
            setStatus(undefined);

            return falcor.get(dependencyPath(ealViewId)).then(async res => {

                const deps = get(res, ["json", ...dependencyPath(ealViewId), "dependencies"]);

                const stateView = deps.find(dep => dep.type === "tl_state");
                const typeId = deps.find(dep => dep.type === metaData[type]?.type);

                if (!typeId) {
                    setLoading(false)
                    setStatus('This component only supports EAL versions that use Fusion data.')
                    return Promise.resolve();
                }
                setTypeId(typeId.view_id);
                setTitle(metaData[type].title)
                const geomRes = await falcor.get(
                    [...gromPath(typeId.view_id), 'length'],
                    attributionPath(typeId.view_id)
                );

                const len = get(geomRes, ['json', ...gromPath(typeId.view_id), 'length']);

                await len && falcor.get([...gromPath(typeId.view_id), 'databyIndex', {
                    from: 0,
                    to: len - 1
                }, Object.values(attributes)])
                    .then(async res => {
                        let data = Object.values(get(res, ['json', ...gromPath(typeId.view_id), 'databyIndex'], {}));
                        data = [...Array(len).keys()].map(i => {
                            return Object.keys(attributes).reduce((acc, curr) => ({
                                ...acc,
                                [curr]: data[i][attributes[curr]]
                            }), {});
                        });

                        setData(data);

                        if (!data?.length) return Promise.resolve();

                        const geomColTransform = [`st_asgeojson(st_envelope(ST_Simplify(geom, ${false && geoid?.toString()?.length === 5 ? `0.1` : `0.5`})), 9, 1) as geom`],
                            geoIndices = {from: 0, to: 0},
                            stateFips = get(data, [0, 'geoid']) || geoid?.substring(0, 2),
                            geoPath = ({view_id}) =>
                                ['dama', pgEnv, 'viewsbyId', view_id,
                                    'options', JSON.stringify({filter: {geoid: [false && geoid?.toString()?.length === 5 ? geoid : stateFips.substring(0, 2)]}}),
                                    'databyIndex'
                                ];
                        const geomRes = await falcor.get([...geoPath(stateView), geoIndices, geomColTransform]);
                        const geom = get(geomRes, ["json", ...geoPath(stateView), 0, geomColTransform]);
                        if (geom) {
                            setMapfocus(get(JSON.parse(geom), 'bbox'));
                        }
                    })

                setLoading(false);
            })
        }

        getData()
    }, [geoid, ealViewId, disasterNumber, type, numColors, shade, colors]);

    const {geoColors, domain} = getGeoColors({geoid, data, columns: columns, paintFn: metaData[type].paintFn, colors});
    // const domain = getDomain(data, colors);

    const attributionData = get(falcorCache, ['dama', pgEnv, 'views', 'byId', typeId, 'attributes'], {});
    const layerProps =
        {
            ccl: {
                view: metaData[type],
                data,
                geoColors,
                mapFocus,
                domain,
                colors,
                title,
                size,
                height,
                showLegend:  metaData[type].legend !== false,
                change: e => onChange(JSON.stringify({
                    ...e,
                    disasterNumber,
                    ealViewId,
                    geoid,
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
                    showLegend: metaData[type].legend !== false
                }))
            }
        };

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
                    <DisasterSearch
                        view_id={ealViewId}
                        value={disasterNumber}
                        geoid={geoid}
                        onChange={setDisasterNumber}
                        className={'flex-row-reverse'}
                    />
                    <ButtonSelector
                        label={'Type:'}
                        types={Object.keys(metaData).map(t => ({label: t.replace('_', ' '), value: t}))}
                        type={type}
                        setType={e => {
                            setColors(metaData[e].colors || defaultColors)
                            setType(e)
                        }}
                    />
                    {!metaData[type].colors &&
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
                        types={[{label: 'X Small', value: 200},{label: 'Small', value: 500},{label: 'Medium', value: 700},{label: 'Large', value: 900}]}
                        type={height}
                        setType={e => {setHeight(e)}}
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
                                        legend={{domain, range: colors, title, show: metaData[type].legend !== false}}
                                    />
                                </div>
                                <Attribution baseUrl={baseUrl} attributionData={attributionData} />
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
                        <Attribution baseUrl={baseUrl} attributionData={attributionData} />
                    </div>
            }
        </div>
    )
}


export default {
    "name": 'Map: FEMA Disaster Loss',
    "type": 'Map',
    "EditComp": Edit,
    "ViewComp": View
}