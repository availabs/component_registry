import React, {useEffect, useState} from "react";
import get from "lodash/get";
import { useFalcor } from '~/modules/avl-falcor';
import { pgEnv } from "~/utils/";
import { isJson } from "~/utils/macros.jsx";
import { RenderStatBoxes } from "./components/RenderStatBoxes.jsx";
import { ProcessDataForMap } from "./utils";
import VersionSelectorSearchable from "../shared/versionSelector/searchable.jsx";
import GeographySearch from "../shared/geographySearch.jsx";
import { Loading } from "~/utils/loading.jsx"
import {HazardSelectorSimple} from "../shared/HazardSelector/hazardSelectorSimple.jsx";

async function getData({ealViewId, hazard, fusionSourceId, geoid}, falcor){
    const dependencyPath = ["dama", pgEnv, "viewDependencySubgraphs", "byViewId", ealViewId];

    const res = await falcor.get(dependencyPath)

    const deps = get(res, ["json", ...dependencyPath, "dependencies"]);

    const fusionView = deps.find(d => d.type === "fusion");
    if(!fusionView) {
       return {}
    }

    const dataPath = hazard !== 'total' ?
        ["fusion", pgEnv, "source", fusionSourceId, "view", fusionView.view_id, "byGeoid", geoid,
            'hazards', JSON.stringify([hazard]),
            "lossByYearByDisasterNumber"] :
        ["fusion", pgEnv, "source", fusionSourceId, "view", fusionView.view_id, "byGeoid", geoid,
            "lossByYearByDisasterNumber"];

    await falcor.get(
        dataPath,
        ['dama', pgEnv, 'views', 'byId', fusionView.view_id, 'attributes', ['source_id', 'view_id', 'version', '_modified_timestamp']]
    );

    const falcorCache = falcor.getCache();

    const lossByYearByDisasterNumber =
            get(falcorCache, [...dataPath, "value"], []),
        { total } = ProcessDataForMap(lossByYearByDisasterNumber);

    const numDeclaredEvents = lossByYearByDisasterNumber.reduce((acc, d) => acc + +(d.disaster_number !== 'SWD' ? d.num_declared : 0), 0),
        numNonDeclaredEvents = lossByYearByDisasterNumber.reduce((acc, d) => acc + +(d.disaster_number === 'SWD' ? d.num_non_declared : 0), 0)

    const attributionData = get(falcorCache, ['dama', pgEnv, 'views', 'byId', fusionView.view_id, 'attributes'], {});

    return {
        numDeclaredEvents,
        numNonDeclaredEvents,
        total,
        attributionData,
        hazard,
        geoid,
        ealViewId,
        fusionSourceId
    }
}

const Edit = ({value, onChange}) => {
    const { falcor, falcorCache } = useFalcor();

    let data = value && isJson(value) ? JSON.parse(value) : {};
    const baseUrl = '/';

    const ealSourceId = 343;
    const [ealViewId, setEalViewId] = useState(data?.ealViewId || 837);
    const fusionSourceId= 336;
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(data?.status);
    const [geoid, setGeoid] = useState(data?.geoid || '36');
    const [hazard, setHazard] = useState(data?.hazard || 'total');

    useEffect( () => {
        async function load(){
            if (!geoid) {
                setStatus('Please Select a Geography');
            } else {
                setStatus(undefined)
            }
            setLoading(true);
            setStatus(undefined);

            const data = await getData({ealViewId, hazard, fusionSourceId, geoid}, falcor);

            onChange(JSON.stringify({
                ...data,
            }));

            setLoading(false);
        }

        load()
    }, [geoid, ealViewId, hazard]);

    return (
        <div className='w-full'>
            <div className='relative'>
                <div className={'border rounded-md border-blue-500 bg-blue-50 p-2 m-1'}>
                    Edit Controls
                    <VersionSelectorSearchable source_id={ealSourceId} view_id={ealViewId} onChange={setEalViewId} className={'flex-row-reverse'} />
                    <GeographySearch value={geoid} onChange={setGeoid} className={'flex-row-reverse'} />
                    <HazardSelectorSimple hazard={hazard} setHazard={setHazard} showTotal={true}/>
                </div>
                {
                    loading ? <Loading /> :
                        status ? <div className={'p-5 text-center'}>{status}</div> :
                            <>
                                <RenderStatBoxes
                                    numNonDeclaredEvents={data.numNonDeclaredEvents}
                                    numDeclaredEvents={data.numDeclaredEvents}
                                    total={data.total}
                                    attributionData={data.attributionData}
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
                    <RenderStatBoxes {...data} baseUrl={'/'}/>
            }
        </div>
    )           
}


export default {
    "name": 'Card: Declared vs Non-Declared Loss',
    "type": 'Pie Chart',
    "variables": [
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
            name: 'geoid',
            default: '36',
        },
        {
            name: 'hazard',
            default: 'total',
            hidden: true
        },
    ],
    getData,
    "EditComp": Edit,
    "ViewComp": View
}