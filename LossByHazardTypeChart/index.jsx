import React, {useEffect, useState} from "react";
import get from "lodash/get";
import { useFalcor } from '~/modules/avl-falcor';
import { pgEnv } from "~/utils/";
import { isJson } from "~/utils/macros.jsx";
import { RenderBarChart } from "./components/RenderBarChart.jsx";
import { ProcessDataForMap } from "./utils";
import VersionSelectorSearchable from "../shared/versionSelector/searchable.jsx";
import GeographySearch from "../shared/geographySearch.jsx";
import { Loading } from "~/utils/loading.jsx"
import {HazardSelectorSimple} from "../shared/HazardSelector/hazardSelectorSimple.jsx";
import {ButtonSelector} from "../shared/buttonSelector.jsx";

async function getData({
                           ealSourceId,
                           ealViewId,
                           fusionSourceId,
                           status,
                           geoid,
                           hazard,
                           consequence,
                           base
                       }, falcor){



    const dependencyPath = ["dama", pgEnv, "viewDependencySubgraphs", "byViewId", ealViewId];
    const res = await falcor.get(dependencyPath);
    const deps = get(res, ["json", ...dependencyPath, "dependencies"]);

    const fusionView = deps.find(d => d.type === "fusion")?.view_id;
    if(!fusionView) {
        return {}
    }

    const dataPath =
        ["fusion", pgEnv, "source", fusionSourceId, "view", fusionView,
            "byGeoid", geoid,
            base === 'year' ? "lossByYearByHazardType" : "lossByMonthByHazardType"
        ];

    await falcor.get(
        dataPath,
        ['dama', pgEnv, 'views', 'byId', fusionView, 'attributes', ['source_id', 'view_id', 'version', '_modified_timestamp']]
    );

    const falcorCache = falcor.getCache();

    const lossByYearByHazardType = get(falcorCache, [...dataPath, "value"], []),
        { processed_data: chartDataActiveView } = ProcessDataForMap(lossByYearByHazardType, base);
    const attributionData = get(falcorCache, ['dama', pgEnv, 'views', 'byId', fusionView, 'attributes'], {});

    return {
        chartDataActiveView,
        attributionData,
        ealSourceId,
        ealViewId,
        fusionSourceId,
        status,
        geoid,
        hazard,
        dataPath,
        consequence,
        base
    }
}

const Edit = ({value, onChange}) => {
    const { falcor, falcorCache } = useFalcor();

    let data = value && isJson(value) ? JSON.parse(value) : {};
    const baseUrl = '/';

    const ealSourceId = data.ealSourceId || 343;
    const [ealViewId, setEalViewId] = useState(data?.ealViewId || 837);
    const fusionSourceId = data?.fusionSourceId || 336;
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(data?.status);
    const [geoid, setGeoid] = useState(data?.geoid || '36');
    const [hazard, setHazard] = useState(data?.hazard || 'total');
    const [consequence, setConsequence] = useState(data?.consequence || '_td');
    const [base, setBase] = useState(data?.base || 'year');

    useEffect( () => {
        async function load(){
            if(!geoid){
                setStatus('Please Select a Geography');
            }else{
                setStatus(undefined)
            }
            setLoading(true);
            setStatus(undefined);

            const data = await getData({
                ealSourceId,
                ealViewId,
                fusionSourceId,
                geoid,
                hazard,
                consequence,
                base
            }, falcor);

            onChange(JSON.stringify({
                ...data
            }));

            setLoading(false);
        }

        load()
    }, [geoid, ealViewId, fusionSourceId, hazard, consequence, base]);

    return (
        <div className='w-full'>
            <div className='relative'>
                <div className={'border rounded-md border-blue-500 bg-blue-50 p-2 m-1'}>
                    Edit Controls
                    <VersionSelectorSearchable source_id={ealSourceId} view_id={ealViewId} onChange={setEalViewId} className={'flex-row-reverse'} />
                    <GeographySearch value={geoid} onChange={setGeoid} className={'flex-row-reverse'} />
                    <HazardSelectorSimple hazard={hazard} setHazard={   setHazard} showTotal={true}/>
                    <ButtonSelector
                        label={'Base:'}
                        types={[
                            {value: 'year', label: 'Year'},
                            {value: 'month', label: 'Month'}
                        ]}
                        type={base}
                        setType={e => {
                            setBase(e)
                        }}
                    />
                    <ButtonSelector
                        label={'Loss Type:'}
                        types={[
                            {value: '_pd', label: 'Property'},
                            {value: '_cd', label: 'Crop'},
                            {value: '_td', label: 'Total'}
                        ]}
                        type={consequence}
                        setType={setConsequence}
                    />
                </div>
                {
                    loading ? <Loading /> :
                        status ? <div className={'p-5 text-center'}>{status}</div> :
                            <>
                                <RenderBarChart
                                    base={base}
                                    chartDataActiveView={data.chartDataActiveView}
                                    attributionData={data.attributionData}
                                    hazard={hazard}
                                    consequence={consequence}
                                    baseUrl={baseUrl}
                                />
                            </>
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
    if(!value) return ''

    let data = typeof value === 'object' ?
        value['element-data'] : 
        JSON.parse(value)
    return (
        <div className='relative w-full p-6'>
            {
                data?.status ?
                    <div className={'p-5 text-center'}>{data?.status}</div> :
                    <RenderBarChart {...JSON.parse(value)} baseUrl={'/'}/>
            }
        </div>
    )           
}


export default {
    "name": 'Graph: Historic Loss by Hazard Type',
    "type": 'Bar Chart',
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
            name: 'fusionSourceId',
            default: 336,
            hidden: true
        },
        {
            name: 'fusionViewId',
            default: 834,
            hidden: true
        },
        {
            name: 'geoid',
            default: '36'
        },
        {
            name: 'hazard',
            default: 'total',
            hidden: true
        },
        {
            name: 'consequence',
            default: '_td',
            hidden: true
        },
        {
            name: 'base',
            default: 'year',
            hidden: true
        },
    ],
    getData,
    "EditComp": Edit,
    "ViewComp": View
}