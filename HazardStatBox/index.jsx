import React, {useEffect, useState} from "react";
import {useFalcor} from "~/modules/avl-falcor";
import {hazardsMeta} from '~/utils/colors';
import VersionSelectorSearchable from "../shared/versionSelector/searchable.jsx";
import GeographySearch from "../shared/geographySearch.jsx";
import {isJson} from "~/utils/macros.jsx";
import get from "lodash/get.js";
import {pgEnv} from "~/utils";
import {RenderGridOrBox} from "./components/RenderGridOrBox.jsx";
import {Loading} from "~/utils/loading.jsx";
import {ButtonSelector} from "../shared/buttonSelector.jsx";
import {RenderColumnControls} from "../shared/columnControls.jsx";
import {HazardSelectorSimple} from "../shared/HazardSelector/hazardSelectorSimple.jsx";
import HazardSelectorMulti from "../shared/HazardSelector/hazardSelectorMulti.jsx";

const freqCol =
        Object.keys(hazardsMeta)
            .reduce((acc, key) =>
                    ({
                        ...acc,
                        ...{
                            [key]: `sum(${get(hazardsMeta, [key, "prefix"], "total")}_afreq) as ${get(hazardsMeta, [key, "prefix"], "total")}_freq`
                        }
                    })
                , {}),
    expCol =
        Object.keys(hazardsMeta)
            .reduce((acc, key) => (
                {
                    ...acc,
                    [key]: `sum(${get(hazardsMeta, [key, "prefix"], "total")}_expt) as ${get(hazardsMeta, [key, "prefix"], "total")}_exp`
                }
            ), {}),
    evntsCol =
        Object.keys(hazardsMeta)
            .reduce((acc, key) => (
                {
                    ...acc,
                    ...{
                        [key]: `sum(${get(hazardsMeta, [key, "prefix"], "total")}_evnts) as ${get(hazardsMeta, [key, "prefix"], "total")}_evnts`
                    }
                }
            ), {});


async function getData({ealSourceId=343, ealViewId, isTotal, geoid, hazard, severeEventThreshold,
                           type, visibleCols, style},  falcor) {
    const npCol = isTotal ? "total_rank" : "hazard_rank",
        ealCol = isTotal ? "nri_eal_total" : "nri_eal";

    geoid = ''+geoid
    let
        fipsCol = `substring(stcofips, 1, ${geoid?.toString()?.length})`,
        nriOptions = JSON.stringify({
            filter: {[fipsCol]: [geoid]},
            groupBy: [fipsCol]
        }),
        nriPath = (view_id) => ["dama", pgEnv, "viewsbyId", view_id, "options", nriOptions];
    let
        actualLossCol = "sum(fusion_property_damage) + sum(fusion_crop_damage) as actual_damage",
        actualLossWithPopCol = "sum(fusion_property_damage) + sum(fusion_crop_damage) + (sum(swd_population_damage) * 11600000) as actual_damage_with_population",
        numSevereEventsCol = `count(distinct CASE WHEN coalesce(fusion_property_damage, 0) + coalesce(fusion_crop_damage, 0) + coalesce(swd_population_damage, 0) >= ${severeEventThreshold} THEN event_id ELSE null END) as num_severe_events`,
        numEventsCol = `count(distinct CASE WHEN disaster_number is not null AND coalesce((fusion_property_damage), 0) + coalesce((fusion_crop_damage), 0)+ coalesce((swd_population_damage), 0) > 0 
							  THEN disaster_number 
							  WHEN disaster_number is null THEN event_id::text
						END) as num_events`, // count either disaster_number or event_id
        numFEMADeclaredCol = `COALESCE(array_length(array_remove(array_agg(distinct CASE WHEN coalesce((fusion_property_damage), 0) + coalesce((fusion_crop_damage), 0)+ coalesce((swd_population_damage), 0) > 0 THEN disaster_number ELSE null END), null), 1), 0) as num_fema_declared`,
        deathsCol = `sum(deaths_direct) + sum(deaths_indirect) as deaths`,
        injuriesCol = `sum(injuries_direct) + sum(injuries_indirect) as injuries`,
        geoidCOl = `substring(geoid, 1, ${geoid?.toString()?.length})`,
        fusionAttributes = [`${geoidCOl} as geoid`, "nri_category", actualLossCol, actualLossWithPopCol, numEventsCol, numSevereEventsCol, numFEMADeclaredCol, deathsCol, injuriesCol],
        fusionAttributesTotal = [`${geoidCOl} as geoid`, actualLossCol, actualLossWithPopCol],
        fusionOptions = JSON.stringify({
            aggregatedLen: true,
            filter: isTotal ? {[geoidCOl]: [geoid]} : {[geoidCOl]: [geoid]},
            exclude: {['EXTRACT(YEAR from coalesce(fema_incident_begin_date, swd_begin_date))']: ['null']},
            groupBy: [geoidCOl, "nri_category"]
        }),
        fusionOptionsTotal = JSON.stringify({
            aggregatedLen: true,
            filter: isTotal ? {[geoidCOl]: [geoid]} : {[geoidCOl]: [geoid]},
            exclude: {['EXTRACT(YEAR from coalesce(fema_incident_begin_date, swd_begin_date))']: ['null']},
            groupBy: [geoidCOl]
        }),
        fusionPath = (view_id) => ["dama", pgEnv, "viewsbyId", view_id, "options", fusionOptions],
        fusionPathTotal = (view_id) => ["dama", pgEnv, "viewsbyId", view_id, "options", fusionOptionsTotal];
    // console.log('falcor get', 
    //      ["dama", pgEnv, "viewDependencySubgraphs", "byViewId", ealViewId],
    //     ["comparative_stats", pgEnv, "byEalIds", "source", ealSourceId, "view", ealViewId, "byGeoid", geoid]
    // )
    const res = await falcor.get(
        ["dama", pgEnv, "viewDependencySubgraphs", "byViewId", ealViewId],
        ["comparative_stats", pgEnv, "byEalIds", "source", ealSourceId, "view", ealViewId, "byGeoid", geoid]
    )

    const deps = get(res, ["json", "dama", pgEnv, "viewDependencySubgraphs", "byViewId", ealViewId, "dependencies"]);
    const nriView = deps.find(d => d.type === "nri");
    const fusionView = deps.find(d => d.type === "fusion");

    if (!fusionView) {
        return {}
    }

    const lenRes = await falcor.get([...fusionPath(fusionView.view_id), "length"]);
    const len = get(lenRes, ["json", ...fusionPath(fusionView.view_id), "length"], 0);

    const fusionByIndexRoute = [...fusionPath(fusionView.view_id), "databyIndex", {
        from: 0,
        to: len - 1
    }, fusionAttributes];
    const fusionTotalByIndexRoute = [...fusionPathTotal(fusionView.view_id), "databyIndex", {
        from: 0,
        to: 0
    }, fusionAttributesTotal];

    const attributionRoute = ['dama', pgEnv, 'views', 'byId',
        [ealViewId, nriView.view_id, fusionView.view_id],
        'attributes', ['source_id', 'view_id', 'version', '_modified_timestamp']];

    const routes = isTotal && len ? [fusionByIndexRoute, fusionTotalByIndexRoute, attributionRoute] :
        !isTotal && len ? [[...nriPath(nriView.view_id), "databyIndex", {
            from: 0,
            to: len - 1
        }, [...Object.values(freqCol), ...Object.values(expCol), ...Object.values(evntsCol)]], fusionByIndexRoute, fusionTotalByIndexRoute, attributionRoute] : [];
    await falcor.get(...routes);

    // set data
    const falcorCache = falcor.getCache();

    const attributionDataFn = view_id => get(falcorCache, ['dama', pgEnv, 'views', 'byId', view_id, 'attributes'], {});

    const attributionData = [ealViewId, nriView.view_id, fusionView.view_id].map(d => (
        {
            source_id: attributionDataFn(d)?.source_id,
            view_id: attributionDataFn(d)?.view_id,
            version: attributionDataFn(d)?.version,
            _modified_timestamp: attributionDataFn(d)?._modified_timestamp?.value
        }
    ))

    const hazardPercentileArray =
        get(falcorCache, ["comparative_stats", pgEnv, "byEalIds", "source", ealSourceId, "view", ealViewId, "byGeoid", geoid, "value"], [])
            .filter(row => row.geoid === geoid && hazardsMeta[row.nri_category])
            .map(d => ({
                key: d.nri_category,
                label: hazardsMeta[d.nri_category].name,
                color: hazardsMeta[d.nri_category].color,
                value: (d.nri_eal * 100 / d.nri_eal_total).toFixed(2),
                eal: get(d, ealCol, 0),
                nationalPercentile: get(d, npCol, 0) * 100,
                actualLoss: (Object.values(
                    get(falcorCache,
                        isTotal ? [...fusionPathTotal(fusionView.view_id), "databyIndex"] : [...fusionPath(fusionView.view_id), "databyIndex"],
                        {}))
                    .find(fc => fc.nri_category === d.nri_category) || {})[actualLossCol],
                actualLossWithPop: (Object.values(
                    get(falcorCache,
                        isTotal ? [...fusionPathTotal(fusionView.view_id), "databyIndex"] : [...fusionPath(fusionView.view_id), "databyIndex"],
                        {}))
                    .find(fc => fc.nri_category === d.nri_category) || {})[actualLossWithPopCol],
                numSevereEvents: (Object.values(get(falcorCache, [...fusionPath(fusionView.view_id), "databyIndex"], {}))
                    .find(fc => fc.nri_category === d.nri_category) || {})[numSevereEventsCol],
                numEvents: (Object.values(get(falcorCache, [...fusionPath(fusionView.view_id), "databyIndex"], {}))
                    .find(fc => fc.nri_category === d.nri_category) || {})[numEventsCol],
                numFEMADeclared: (Object.values(get(falcorCache, [...fusionPath(fusionView.view_id), "databyIndex"], {}))
                    .find(fc => fc.nri_category === d.nri_category) || {})[numFEMADeclaredCol],
                deaths: (Object.values(get(falcorCache, [...fusionPath(fusionView.view_id), "databyIndex"], {}))
                    .find(fc => fc.nri_category === d.nri_category) || {})[deathsCol],
                injuries: (Object.values(get(falcorCache, [...fusionPath(fusionView.view_id), "databyIndex"], {}))
                    .find(fc => fc.nri_category === d.nri_category) || {})[injuriesCol],
                exposure: get(falcorCache, [...nriPath(nriView.view_id), "databyIndex", 0, expCol[d.nri_category]]),
                frequency: get(falcorCache, [...nriPath(nriView.view_id), "databyIndex", 0, freqCol[d.nri_category]], 0),
            }))
            .sort((a, b) => +b.value - +a.value);

    const size =
        type === 'card' && hazard !== 'total' ? 'small' :
            type === 'card' && hazard === 'total' ? 'large' : 'small';

    return {
        hazardPercentileArray,
        attributionData,
        size,
        visibleCols,
        style,

        ealViewId,
        geoid,
        hazard,
        isTotal,
        type,
        severeEventThreshold
    }
}

const Edit = ({value, onChange}) => {
    const {falcor, falcorCache} = useFalcor();

    let cachedData = value && isJson(value) ? JSON.parse(value) : {};

    const ealSourceId = 343;
    const [ealViewId, setEalViewId] = useState(cachedData?.ealViewId || 837);

    const [loading, setLoading] = useState(true);
    const [hazard, setHazard] = useState(cachedData?.hazard || 'total');
    const [type, setType] = useState(cachedData?.type || 'card');
    const [style, setStyle] = useState(cachedData?.style || 'compact');
    const [status, setStatus] = useState(cachedData?.status);
    const [geoid, setGeoid] = useState(cachedData?.geoid || '36');
    const [isTotal, setIsTotal] = useState(cachedData?.isTotal || (hazard === 'total' && type === 'card'));
    const [visibleCols, setVisibleCols] = useState(cachedData?.visibleCols || []);
    const [severeEventThreshold, setSevereEventsThreshold] = useState(cachedData.severeEventThreshold || 1_000_000);

    const cols = [
        {label: 'National Percentile Bar', forTotal: undefined},
        {label: 'Loss Distribution Bar', forTotal: true},
        {label: 'Hazard Percentile Bar', forTotal: false},
        {label: 'Expected Annual Loss (EAL)', forTotal: undefined},
        {label: 'Actual Loss', forTotal: false},
        {label: 'Actual Loss (with Population)', forTotal: false},
        {label: 'Exposure', forTotal: false},
        {label: '# Events', forTotal: false},
        {label: 'Frequency (yearly)', forTotal: false},
        {label: 'Frequency (daily)', forTotal: false},
        {label: 'Frequency (%)', forTotal: false},
        {label: '# Severe Events', forTotal: false},
        {label: '# FEMA Declared Disasters', forTotal: false},
        {label: 'Deaths', forTotal: false},
        {label: 'Injuries', forTotal: false},
    ]
    React.useEffect(() => {
        async function load(){
            if (!geoid) {
                setStatus('Please Select a Geography');
            } else {
                setStatus(undefined)
            }
            setLoading(true);
            setStatus(undefined);

            const data = await getData({
                ealSourceId, ealViewId, geoid, hazard, isTotal, type, visibleCols, severeEventThreshold, style
            }, falcor);

            onChange(JSON.stringify({
                ...data,
            }));

            setLoading(false);
        }

        load()
    }, [ealViewId, geoid, hazard, isTotal, type, visibleCols, severeEventThreshold, style]);

    const size = cachedData.size;
    const attributionData = cachedData.attributionData

    const hazardPercentileArray = cachedData.hazardPercentileArray;

    return (
        <div className='w-full'>
            <div className='relative'>
                <div className={'border rounded-md border-blue-500 bg-blue-50 p-2 m-1'}>
                    Edit Controls
                    <VersionSelectorSearchable source_id={ealSourceId} view_id={ealViewId} onChange={setEalViewId}
                                               className={'flex-row-reverse'}/>
                    <GeographySearch value={geoid} onChange={setGeoid} className={'flex-row-reverse'}/>
                    <ButtonSelector
                        label={'Component Type:'}
                        types={['card', 'grid']}
                        type={type}
                        setType={e => {
                            setHazard(e === 'grid' ? null : 'total');
                            setIsTotal(e === 'card')
                            setType(e);
                        }}
                    />
                    <ButtonSelector
                        label={'Component Style:'}
                        types={['compact', 'full']}
                        type={style}
                        setType={setStyle}
                    />

                    {
                        type === 'grid' ?
                            <HazardSelectorMulti
                                value={hazard === 'total' || !hazard ? Object.keys(hazardsMeta) : Array.isArray(hazard) ? hazard : [hazard]}
                                onChange={setHazard}
                                className={'flex-row-reverse'}
                                showAll={true}
                            /> :
                            <HazardSelectorSimple
                                hazard={hazard}
                                setHazard={e => {
                                    setIsTotal(e === 'total')
                                    setHazard(e)
                                }}
                                showTotal={true}
                                />
                    }
                    <RenderColumnControls
                        cols={cols.filter(col => col.forTotal === isTotal || col.forTotal === undefined).map(col => col.label)}
                        visibleCols={visibleCols}
                        setVisibleCols={setVisibleCols}
                    />

                    {
                        visibleCols.includes('# Severe Events') && (
                            <div className={'w-full pt-2 mt-3 flex flex-row text-sm'}>
                                <label className={'shrink-0 pr-2 py-2 my-1 w-1/4'}>Severe Events Threshold:</label>
                                <input
                                    className={'p-2 ml-2 my-1 bg-white rounded-md w-full shrink'}
                                    type={'number'}
                                    value={severeEventThreshold}
                                    onChange={e => setSevereEventsThreshold(e.target.value)}
                                    onWheel={(e) => e.target.blur()}
                                    placeholder={'Enter Threshold'}
                                />
                            </div>
                        )
                    }
                </div>
                <div className='relative w-full p-1'>
                    {
                        loading ? <Loading/> :
                            status ? <div className={'p-5 text-center'}>{status}</div> :
                                <div>
                                    <RenderGridOrBox
                                        visibleCols={visibleCols}
                                        hazard={hazard}
                                        hazardPercentileArray={hazardPercentileArray}
                                        size={size}
                                        style={style}
                                        isTotal={isTotal}
                                        type={type}
                                        attributionData={attributionData}
                                        baseUrl={'/'}
                                    />
                                </div>
                    }
                </div>
            </div>
        </div>
    )
}


const View = ({value}) => {
    if (!value) return ''

    let data = typeof value === 'object' ?
        value['element-data'] :
        JSON.parse(value)

    return (
        <div className=''>
            <RenderGridOrBox {...data} baseUrl={'/'}/>
        </div>
    )
}


export default {
    "name": 'Card: Hazard Risk',
    "type": 'Card/Grid',
    "variables": [
        {
            name: 'ealSourceId',
            default: 343,
            hidden: true
        },
        {
            name: 'ealViewId',
            default: 837,
            hidden: true
        },
        {
            name: 'geoid',
            default: '36',
        },
        {
            name: 'hazard',
            default: 'total',
            hidden: true
        },
        {
            name: 'isTotal',
            default: true,
            hidden: true
        },
        {
            name: 'type',
            default: 'card',
            hidden: true
        },
        {
            name: 'visibleCols',
            default: [],
            hidden: true
        },
        {
            name: 'severeEventThreshold',
            default: 1_000_000,
            hidden: true
        },
        {
            name: 'style',
            default: 'compact',
            hidden: true
        },
    ],
    getData,
    "EditComp": Edit,
    "ViewComp": View
}