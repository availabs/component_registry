import React, {useEffect, useMemo, useState} from "react";
import get from "lodash/get";
import { useFalcor } from '~/modules/avl-falcor';
import { pgEnv } from "~/utils/";
import { isJson } from "~/utils/macros.jsx";
import { RenderDisasterInfoStats } from "./components/RenderDisasterInfoStats.jsx";
import VersionSelectorSearchable from "../shared/versionSelector/searchable.jsx";
import GeographySearch from "../shared/geographySearch.jsx";
import DisasterSearch from "../shared/disasterSearch.jsx";
import { Loading } from "~/utils/loading.jsx";

const colAccessNameMapping = {
    'disaster_number': 'distinct disaster_number as disaster_number',
}

async function getData({geoid, disasterNumber, ealViewId}, falcor){
    const dependencyPath = (view_id) => ["dama", pgEnv, "viewDependencySubgraphs", "byViewId", view_id];
    const res = await falcor.get(dependencyPath(ealViewId))
    
    const deps = get(res, ["json", ...dependencyPath(ealViewId), "dependencies"]);
    const ddsDeps = deps.find(d => d.type === "disaster_declarations_summaries_v2");

    // if(!ddsDeps) {
    //     setLoading(false)
    //     setStatus('This component only supports EAL versions that use Fusion data.')
    //     return Promise.resolve();
    // }

    const disasterDecView = ddsDeps.view_id
    const disasterDetailsPath = (view_id) => ["dama", pgEnv, "viewsbyId", view_id, "options", disasterDetailsOptions, "databyIndex"];
    const disasterDetailsAttributes = [
        "disaster_number",
        "declaration_title",
        "incident_begin_date",
        "incident_end_date",
        "incident_type",
        'ARRAY_AGG(distinct fips_state_code || fips_county_code) as geoid'
    ]
    const disasterDetailsOptions = JSON.stringify({
        filter: { disaster_number: [disasterNumber] },
        groupBy: [1, 2, 3, 4, 5]
    })

    const finalResp = await falcor.get(
        [...disasterDetailsPath(ddsDeps.view_id), { from: 0, to: 0 }, disasterDetailsAttributes],
        ['dama', pgEnv, 'views', 'byId', ddsDeps.view_id, 'attributes', ['source_id', 'view_id', 'version']]
    );
    return {
        ealViewId,
        geoid,
        disasterNumber,
        disasterDecView,
        title: get(finalResp, ['json',...disasterDetailsPath(disasterDecView), 0, "declaration_title"]),
        incidentType: get(finalResp, ['json',...disasterDetailsPath(disasterDecView), 0, "incident_type"]),
        declarationDate: get(finalResp, ['json',...disasterDetailsPath(disasterDecView), 0, "incident_begin_date"], ""),
        endDate: get(finalResp, ['json',...disasterDetailsPath(disasterDecView), 0, "incident_end_date"], ""),
        attributionData: get(finalResp, ['json','dama', pgEnv, 'views', 'byId', disasterDecView, 'attributes'], {})
    }
  
    
}

const Edit = ({value, onChange}) => {
    const { falcor, falcorCache } = useFalcor();

    let cachedData = useMemo(() => value && isJson(value) ? JSON.parse(value) : {}, [value]);
    const baseUrl = '/';

    const ealSourceId = 343;
    const [ealViewId, setEalViewId] = useState(cachedData?.ealViewId || 837);
    const [disasterNumber, setDisasterNumber] = useState(cachedData?.disasterNumber);

    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(undefined);
    const [geoid, setGeoid] = useState(cachedData?.geoid || '36');

    useEffect( () => {
        async function load () {
            console.log('got to load', ealViewId, geoid, disasterNumber)
            if(!geoid || !disasterNumber){
                setStatus('Please Select a Geography and a Disaster.');
                return Promise.resolve();
            } else{
                setStatus(undefined);
            }
            console.log()
            setLoading(true);
            setStatus(undefined);
            let data = await getData({ealViewId, geoid,disasterNumber}, falcor)
            if(data.title) {
                onChange(JSON.stringify(data))    
            }
            setLoading(false)
        } 

        load()

    }, [geoid, ealViewId, disasterNumber]);


   /* useEffect(() => {
        if(!loading){
            onChange(JSON.stringify(
                ))
        }
    },
    [status, ealViewId, geoid, attributionData, disasterNumber, title, incidentType, declarationDate]);*/

    return (
        <div className='w-full'>
            <div className='relative'>
                <div className={'border rounded-md border-blue-500 bg-blue-50 p-2 m-1'}>
                    Edit Controls
                    <VersionSelectorSearchable source_id={ealSourceId} view_id={ealViewId} onChange={setEalViewId} className={'flex-row-reverse'} />
                    <GeographySearch value={geoid} onChange={setGeoid} className={'flex-row-reverse'} />
                    <DisasterSearch
                        view_id={ealViewId}
                        value={disasterNumber}
                        geoid={geoid}
                        onChange={setDisasterNumber}
                        className={'flex-row-reverse'}
                    />
                </div>
                {
                    loading ? <Loading /> :
                        status ? <div className={'p-5 text-center'}>{status}</div> :
                        <RenderDisasterInfoStats
                            title={cachedData?.title}
                            incidentType={cachedData?.incidentType}
                            declarationDate={cachedData?.declarationDate}
                            endDate={cachedData?.endDate}
                            attributionData={cachedData?.attributionData}
                            disasterNumber={cachedData?.disasterNumber}
                            baseUrl={baseUrl}
                        />
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
                    <RenderDisasterInfoStats {...data} baseUrl={'/'}/>
            }
        </div>
    )           
}


export default {
    "name": 'Card: FEMA Disaster Info',
    "type": 'Hero Stats',
    "variables": [
        {
            name: 'geoid',
            default: '36'
        },
        {
            name: 'disasterNumber',
            default: '1406'
        },
        {
            name: 'ealViewId',
            default: 837,
            hidden: true
        }
    ],
    getData,
    "EditComp": Edit,
    "ViewComp": View
}