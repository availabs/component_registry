import React, {useEffect, useMemo, useState} from "react";
import get from "lodash/get";
import { useFalcor } from '~/modules/avl-falcor';
import { pgEnv } from "~/utils/";
import { isJson } from "~/utils/macros.jsx";
import { RenderDisasterLossStats } from "./components/RenderDisasterLossStats.jsx";
import VersionSelectorSearchable from "../shared/versionSelector/searchable.jsx";
import GeographySearch from "../shared/geographySearch.jsx";
import DisasterSearch from "../shared/disasterSearch.jsx";
import { Loading } from "~/utils/loading.jsx";

const colAccessNameMapping = {
    'disaster_number': 'distinct disaster_number as disaster_number',
}

async function getData ({ealViewId, geoid, disasterNumber}, falcor) {
    const dependencyPath = (view_id) => ["dama", pgEnv, "viewDependencySubgraphs", "byViewId", view_id];
    const res = await falcor.get(dependencyPath(ealViewId))
    const deps = get(res, ["json", ...dependencyPath(ealViewId), "dependencies"]);
    const dlsDeps = deps.find(dep => dep.type === "disaster_loss_summary");

 
    const disasterLossView = dlsDeps.view_id
    const hmgpView = 798;
    const disasterWebSummariesView = 512;

    const geoIdCol = geoid?.toString()?.length === 2 ? "substring(geoid, 1, 2)" : geoid?.toString()?.length === 5 ? "geoid" : `'all'`,
        disasterDetailsAttributes = {
    // ...disasterNumber && {disaster_number: "disaster_number"},
            geoid: `${geoIdCol} as geoid`,
            fema_property_damage: "sum(fema_property_damage) as fema_property_damage",
            ihp_loss: "sum(ihp_loss) as ihp_loss",
            pa_loss: "sum(pa_loss) as pa_loss",
            sba_loss: "sum(sba_loss) as sba_loss",
            nfip_loss: "sum(nfip_loss) as nfip_loss",
            // hmgp_funding: "sum(hmgp_funding) as hmgp_funding",
            fema_crop_damage: "sum(fema_crop_damage) as fema_crop_damage"
        },
        disasterDetailsOptions = JSON.stringify({
            filter: {
                ...geoid && {[geoIdCol]: [geoid]},
                ...disasterNumber && {disaster_number: [disasterNumber]}
            },
            exclude: {fema_incident_begin_date: ['null']},
            groupBy: [1]
        }),
        disasterDetailsPath = (view_id) => ["dama", pgEnv, "viewsbyId", view_id, "options", disasterDetailsOptions];

    const hmgpAttributes = {
            hmgp_funding: "SUM(federal_share_obligated) as hmgp_funding",
        },
        hmgpOptions = JSON.stringify({
            filter: {
                ...disasterNumber && {disaster_number: [disasterNumber]}
            },
        }),
       hmgpPath = ["dama", pgEnv, "viewsbyId", hmgpView, "options", hmgpOptions];


    const disasterWebSummariesAttributes = {
            ihp_loss: "total_amount_ihp_approved as ihp_loss",
            pa_loss: "total_obligated_amount_pa as pa_loss"
        },
        disasterWebSummariesOptions = JSON.stringify({
            filter: {
                ...disasterNumber && {disaster_number: [disasterNumber]}
            },
        }),
        disasterWebSummariesPath = (view_id) => ["dama", pgEnv, "viewsbyId", view_id, "options", disasterWebSummariesOptions];

    const finalResp = await falcor.get(
        [...disasterDetailsPath(dlsDeps.view_id), "databyIndex", { from: 0, to: 0 }, Object.values(disasterDetailsAttributes)],
        [...hmgpPath, "databyIndex", { from: 0, to: 0 }, Object.values(hmgpAttributes)],
        [...disasterWebSummariesPath(disasterWebSummariesView), "databyIndex", { from: 0, to: 0 }, Object.values(disasterWebSummariesAttributes)],
        ['dama', pgEnv, 'views', 'byId', [dlsDeps.view_id, disasterWebSummariesView], 'attributes', ['source_id', 'view_id', 'version', '_modified_timestamp']]
    );

    const ihpLoss = get(finalResp, ['json', ...disasterWebSummariesPath(disasterWebSummariesView), "databyIndex", 0, disasterWebSummariesAttributes.ihp_loss], 0),
        paLoss = get(finalResp, ['json', ...disasterWebSummariesPath(disasterWebSummariesView), "databyIndex", 0, disasterWebSummariesAttributes.pa_loss], 0),
        sbaLoss = get(finalResp, ['json', ...disasterDetailsPath(disasterLossView), "databyIndex", 0, disasterDetailsAttributes.sba_loss], 0),
        nfipLoss = get(finalResp, ['json', ...disasterDetailsPath(disasterLossView), "databyIndex", 0, disasterDetailsAttributes.nfip_loss], 0),
        usdaLoss = get(finalResp, ['json', ...disasterDetailsPath(disasterLossView), "databyIndex", 0, disasterDetailsAttributes.fema_crop_damage], 0),
        hmgpFunding = get(finalResp, ['json', ...hmgpPath, "databyIndex", 0, hmgpAttributes.hmgp_funding], 0);
        
    return {
        ealViewId,
        disasterNumber,
        geoid,
        disasterLossView,
        ihpLoss,
        paLoss,
        sbaLoss,
        nfipLoss,
        usdaLoss,
        hmgpFunding,
        totalLoss: (+ihpLoss + +paLoss + +sbaLoss + +nfipLoss + +usdaLoss + +hmgpFunding),
        attributionData: [disasterLossView, disasterWebSummariesView]
            .map(view => get(finalResp, ['json','dama', pgEnv, 'views', 'byId', view, 'attributes'], {}))
    }
}

const Edit = ({value, onChange}) => {
    const { falcor, falcorCache } = useFalcor();

    let cachedData = value && isJson(value) ? JSON.parse(value) : {};
    const baseUrl = '/';

    
    const ealSourceId = 343;
    const [ealViewId, setEalViewId] = useState(cachedData?.ealViewId || 837);
    const [disasterNumber, setDisasterNumber] = useState(cachedData?.disasterNumber);

    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(cachedData?.status);
    const [geoid, setGeoid] = useState(cachedData?.geoid || '36');

    useEffect( () => {
        async function load(){
            if(!geoid || !disasterNumber){
                setStatus('Please Select a Geography && disasterNumber.');
                return Promise.resolve();
            }else{
                setStatus(undefined)
            }
            setLoading(true);
            setStatus(undefined);
            const data = await getData({geoid,disasterNumber,ealViewId},falcor)
            if(data.totalLoss) {
                onChange(JSON.stringify(data))
            }
            setLoading(false);
        }

        load()
    }, [geoid, ealViewId, disasterNumber]);


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
                        showAll={true}
                        className={'flex-row-reverse'}
                    />
                </div>
                {loading ? <Loading /> :
                    status ? <div className={'p-5 text-center'}>{status}</div> :
                    <RenderDisasterLossStats
                        totalLoss={cachedData.totalLoss}
                        ihpLoss={cachedData.ihpLoss}
                        paLoss={cachedData.paLoss}
                        sbaLoss={cachedData.sbaLoss}
                        nfipLoss={cachedData.nfipLoss}
                        usdaLoss={cachedData.usdaLoss}
                        hmgpFunding={cachedData.hmgpFunding}
                        attributionData={cachedData.attributionData}
                        baseUrl={cachedData.baseUrl}
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
                    <RenderDisasterLossStats {...data} baseUrl={'/'}/>
            }
        </div>
    )           
}


export default {
    "name": 'Card: FEMA Disaster Loss Summary',
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