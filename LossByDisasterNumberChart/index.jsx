import React, {useEffect, useMemo, useState} from "react";
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
                           fusionViewId,
                           consequence,
                           hazard,
                           geoid,
                       }, falcor){

    const dependencyPath = ["dama", pgEnv, "viewDependencySubgraphs", "byViewId", ealViewId];
    const disasterNameAttributes = ['distinct disaster_number as disaster_number', 'declaration_title'],
        disasterNamePath = (view_id) => ['dama', pgEnv,  "viewsbyId", view_id, "options"];

    const res = await falcor.get(dependencyPath);
    const deps = get(res, ["json", ...dependencyPath, "dependencies"]);

    const fusionView = deps.find(d => d.type === "fusion");
    if(!fusionView) {
        return {};
    }

    const dataPath = hazard !== 'total' ?
        ["fusion", pgEnv, "source", fusionSourceId, "view", fusionView.view_id, "byGeoid", geoid,
            'hazards', JSON.stringify([hazard]),
            "lossByYearByDisasterNumber"] :
        ["fusion", pgEnv, "source", fusionSourceId, "view", fusionView.view_id, "byGeoid", geoid,
            "lossByYearByDisasterNumber"];

    const lossRes = await falcor.get(
        dataPath,
        ['dama', pgEnv, 'views', 'byId', fusionView.view_id, 'attributes', ['source_id', 'view_id', 'version']]
    );
    console.log('lossRes', get(lossRes,
        ['json', ...dataPath], []), lossRes)

    const disasterNumbers = get(lossRes,
        ['json', ...dataPath], [])
        .map(dns => dns.disaster_number)
        ?.filter(dns => dns !== 'SWD')
        .sort((a, b) => +a - +b);

    if(disasterNumbers?.length){
        const ddcView = deps.find(d => d.type === "disaster_declarations_summaries_v2");

        await falcor.get([...disasterNamePath(ddcView.view_id), JSON.stringify({ filter: { disaster_number: disasterNumbers.sort((a, b) => +a - +b)}}),
            'databyIndex', {from: 0, to: disasterNumbers.length - 1}, disasterNameAttributes]);

        const falcorCache = falcor.getCache();

        const disasterNames = Object.values(get(falcorCache, [...disasterNamePath(ddcView?.view_id)], {}))
            .reduce((acc, d) => [...acc, ...Object.values(d?.databyIndex || {})], [])
            .reduce((acc, disaster) => {
                acc[disaster['distinct disaster_number as disaster_number']] = disaster.declaration_title;
                return acc;
            }, {});

        const lossByYearByDisasterNumber = get(falcorCache, [...dataPath, "value"], []),
            { processed_data: chartDataActiveView, disaster_numbers } =
                ProcessDataForMap(lossByYearByDisasterNumber, disasterNames);

        const attributionData = get(falcorCache, ['dama', pgEnv, 'views', 'byId', fusionViewId, 'attributes'], {});

        return {
            chartDataActiveView,
            disaster_numbers,
            attributionData,
            ealSourceId,
            ealViewId,
            fusionViewId,
            geoid,
            hazard,
            consequence
        }
    }
}

const Edit = ({value, onChange}) => {
    const { falcor, falcorCache } = useFalcor();

    let data = value && isJson(value) ? JSON.parse(value) : {};
    const baseUrl = '/';

    const ealSourceId = data?.ealSourceId || 343;
    const [ealViewId, setEalViewId] = useState(data?.ealViewId || 837);
    const fusionSourceId= 336;
    const [fusionViewId, setFusionViewId] = useState(data?.fusionViewId || 834);

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(data?.status);
    const [geoid, setGeoid] = useState(data?.geoid || '36');
    const [hazard, setHazard] = useState(data?.hazard || 'total');
    const [consequence, setConsequence] = useState(data?.consequence || '_td');

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
                fusionViewId,
                consequence,
                hazard,
                geoid,
            }, falcor);

            onChange(JSON.stringify({
                ...data
            }));

            setLoading(false);
        }

        load()
    }, [geoid, ealViewId, fusionViewId, geoid, hazard, consequence]);

    const attributionData = data.attributionData;

    return (
        <div className='w-full'>
            <div className='relative'>
                <div className={'border rounded-md border-blue-500 bg-blue-50 p-2 m-1'}>
                    Edit Controls
                    <VersionSelectorSearchable source_id={ealSourceId} view_id={ealViewId} onChange={setEalViewId} className={'flex-row-reverse'} />
                    <GeographySearch value={geoid} onChange={setGeoid} className={'flex-row-reverse'} />
                    <HazardSelectorSimple hazard={hazard} setHazard={setHazard} showTotal={true}/>
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
                                    chartDataActiveView={data.chartDataActiveView}
                                    disaster_numbers={data.disaster_numbers}
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
    "name": 'Graph: Historic Loss by Disaster Number',
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
        }
    ],
    getData,
    "EditComp": Edit,
    "ViewComp": View
}