import React, {useEffect, useMemo, useState} from "react";
import get from "lodash/get";
import { useFalcor } from '~/modules/avl-falcor';
import { pgEnv } from "~/utils";
import { isJson } from "~/utils/macros.jsx";
import { RenderDisasterLossStats } from "./components/RenderDisasterLossStats.jsx";
import VersionSelectorSearchable from "../shared/versionSelector/searchable.jsx";
import GeographySearch from "../shared/geographySearch.jsx";
import DisasterSearch from "../shared/disasterSearch.jsx";
import { Loading } from "~/utils/loading.jsx";
import {ButtonSelector} from "../shared/buttonSelector.jsx";


async function getData ({ealViewId, geoid, disasterNumber, type}, falcor) {
    const dependencyPath = (view_id) => ["dama", pgEnv, "viewDependencySubgraphs", "byViewId", view_id];
    const res = await falcor.get(dependencyPath(ealViewId))
    const deps = get(res, ["json", ...dependencyPath(ealViewId), "dependencies"]);

    // views to get loss columns
    const disasterLossView = deps.find(dep => dep.type === "disaster_loss_summary").view_id;
    const disasterWebSummariesView = 512;


    // views to get funding columns
    const ihpView = deps.find(dep => dep.type === "individuals_and_households_program_valid_registrations_v1").view_id;
    const paView = deps.find(dep => dep.type === "public_assistance_funded_projects_details_v1_enhanced").view_id;
    const sbaView = deps.find(dep => dep.type === "sba_disaster_loan_data_new").view_id;
    const hmgpView = 798;

    // config to get loss columns
    const geoIdCol = geoid?.toString()?.length === 2 ? "substring(geoid, 1, 2)" : geoid?.toString()?.length === 5 ? "geoid" : `'all'`,
        disasterDetailsAttributes = {
            geoid: `${geoIdCol} as geoid`,
            ihp_loss: "sum(ihp_loss) as ihp_loss",
            pa_loss: "sum(pa_loss) as pa_loss",
            sba_loss: "sum(sba_loss) as sba_loss",
            nfip_loss: "sum(nfip_loss) as nfip_loss",
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

    // configs to get funding columns
    const ihpGeoIdCOl = geoid?.toString()?.length === 2 ? "substring(geoid, 1, 2)" : geoid?.toString()?.length === 5 ? "geoid" : `'all'`,
        ihpAttributes = {
            ihp_funding: "SUM(ihp_amount) as ihp_amount",
        },
        ihpOptions = JSON.stringify({
            filter: {
                ...geoid && {[ihpGeoIdCOl]: [geoid]},
                ...disasterNumber && {disaster_number: [disasterNumber]}
            },
        }),
       ihpPath = ["dama", pgEnv, "viewsbyId", ihpView, "options", ihpOptions];

    const paGeoIdCOl = geoid?.toString()?.length === 2 ? "lpad(state_number_code::text, 2, '0')" :
                                geoid?.toString()?.length === 5 ? "lpad(state_number_code::text, 2, '0') || lpad(county_code::text, 3, '0')" :
                                    `'all'`,
        paAttributes = {
            pa_funding: "SUM(total_obligated) as total_obligated",
        },
        paOptions = JSON.stringify({
            filter: {
                ...geoid && {[paGeoIdCOl]: [geoid]},
                ...disasterNumber && {disaster_number: [disasterNumber]}
            },
        }),
       paPath = ["dama", pgEnv, "viewsbyId", paView, "options", paOptions];

    const sbaGeoIdCOl = geoid?.toString()?.length === 2 ? "substring(geoid, 1, 2)" : geoid?.toString()?.length === 5 ? "geoid" : `'all'`,
        sbaAttributes = {
            sba_funding: "SUM(total_approved_loan_amount) as total_approved_loan_amount",
        },
        sbaOptions = JSON.stringify({
            filter: {
                ...geoid && {[sbaGeoIdCOl]: [geoid]},
                ...disasterNumber && {fema_disaster_number: [disasterNumber]}
            },
        }),
       sbaPath = ["dama", pgEnv, "viewsbyId", sbaView, "options", sbaOptions];

    const hmgpGeoIdCOl = geoid?.toString()?.length === 2 ? "state_number_code" :
            geoid?.toString()?.length === 5 ? "state_number_code || county_code" : `'all'`,
        hmgpAttributes = {
            hmgp_funding: "SUM(federal_share_obligated) as hmgp_funding",
        },
        hmgpOptions = JSON.stringify({
            filter: {
                ...geoid && {[hmgpGeoIdCOl]: [geoid]},
                ...disasterNumber && {disaster_number: [disasterNumber]}
            },
        }),
       hmgpPath = ["dama", pgEnv, "viewsbyId", hmgpView, "options", hmgpOptions];

    const paths = type === 'loss' ?
        [
            [...disasterDetailsPath(disasterLossView), "databyIndex", { from: 0, to: 0 }, Object.values(disasterDetailsAttributes)],
            [...disasterWebSummariesPath(disasterWebSummariesView), "databyIndex", { from: 0, to: 0 }, Object.values(disasterWebSummariesAttributes)],
            ['dama', pgEnv, 'views', 'byId', [disasterLossView], 'attributes', ['source_id', 'view_id', 'version', '_modified_timestamp']]
        ] :
        [
            [...ihpPath, "databyIndex", { from: 0, to: 0 }, Object.values(ihpAttributes)],
            [...paPath, "databyIndex", { from: 0, to: 0 }, Object.values(paAttributes)],
            [...sbaPath, "databyIndex", { from: 0, to: 0 }, Object.values(sbaAttributes)],
            [...hmgpPath, "databyIndex", { from: 0, to: 0 }, Object.values(hmgpAttributes)],
            ['dama', pgEnv, 'views', 'byId', [ihpView, paView, sbaView, hmgpView], 'attributes', ['source_id', 'view_id', 'version', '_modified_timestamp']]
        ]

    const finalResp = await falcor.get(...paths);

    const
        ihpLoss = get(finalResp, ['json', ...disasterDetailsPath(disasterLossView), "databyIndex", 0, disasterDetailsAttributes.ihp_loss], 0),
        paLoss = get(finalResp, ['json', ...disasterDetailsPath(disasterLossView), "databyIndex", 0, disasterDetailsAttributes.pa_loss], 0),
        // ihp and pa pulled from WDS slightly differ from ihp and pa tables.
        // ihpLoss = get(finalResp, ['json', ...disasterWebSummariesPath(disasterWebSummariesView), "databyIndex", 0, disasterWebSummariesAttributes.ihp_loss], 0),
        // paLoss = get(finalResp, ['json', ...disasterWebSummariesPath(disasterWebSummariesView), "databyIndex", 0, disasterWebSummariesAttributes.pa_loss], 0),
        sbaLoss = get(finalResp, ['json', ...disasterDetailsPath(disasterLossView), "databyIndex", 0, disasterDetailsAttributes.sba_loss], 0),
        nfipLoss = get(finalResp, ['json', ...disasterDetailsPath(disasterLossView), "databyIndex", 0, disasterDetailsAttributes.nfip_loss], 0),
        usdaLoss = get(finalResp, ['json', ...disasterDetailsPath(disasterLossView), "databyIndex", 0, disasterDetailsAttributes.fema_crop_damage], 0),

        ihpFunding = get(finalResp, ['json', ...ihpPath, "databyIndex", 0, ihpAttributes.ihp_funding], 0),
        paFunding = get(finalResp, ['json', ...paPath, "databyIndex", 0, paAttributes.pa_funding], 0),
        sbaFunding = get(finalResp, ['json', ...sbaPath, "databyIndex", 0, sbaAttributes.sba_funding], 0),
        hmgpFunding = get(finalResp, ['json', ...hmgpPath, "databyIndex", 0, hmgpAttributes.hmgp_funding], 0);
        
    return {
        type,
        ealViewId,
        disasterNumber,
        geoid,
        disasterLossView,
        ihpLoss,
        paLoss,
        sbaLoss,
        nfipLoss,
        usdaLoss,

        ihpFunding,
        paFunding,
        sbaFunding,
        hmgpFunding,

        totalLoss: (+ihpLoss + +paLoss + +sbaLoss + +nfipLoss + +usdaLoss),
        totalFunding: (+ihpFunding + +paFunding + +sbaFunding + +hmgpFunding),
        attributionData: (type === 'loss' ? [disasterLossView] : [ihpView, paView, sbaView, hmgpView])
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
    const [geoid, setGeoid] = useState(cachedData?.geoid === '' ? cachedData?.geoid : (cachedData?.geoid || '36'));
    const [type, setType] = useState(cachedData?.type || 'loss');

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
            const data = await getData({geoid,disasterNumber,ealViewId, type},falcor)
            if(data) {
                onChange(JSON.stringify(data))
            }
            setLoading(false);
        }

        load()
    }, [geoid, ealViewId, disasterNumber, type]);


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
                    <ButtonSelector
                        type={type}
                        setType={setType}
                        label={'Type:'}
                        types={[{value: 'loss', label: 'Assessed Loss'}, {value: 'funding', label: 'FEMA Obligated Funding'}]}
                    />
                </div>
                {loading ? <Loading /> :
                    status ? <div className={'p-5 text-center'}>{status}</div> :
                    <RenderDisasterLossStats
                        type={cachedData.type}
                        totalLoss={cachedData.totalLoss}
                        ihpLoss={cachedData.ihpLoss}
                        paLoss={cachedData.paLoss}
                        sbaLoss={cachedData.sbaLoss}
                        nfipLoss={cachedData.nfipLoss}
                        usdaLoss={cachedData.usdaLoss}

                        totalFunding={cachedData.totalFunding}
                        ihpFunding={cachedData.ihpFunding}
                        paFunding={cachedData.paFunding}
                        sbaFunding={cachedData.sbaFunding}
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
        },
        {
            name: 'type',
            default: 'loss',
            hidden: true
        }
    ],
    getData,
    "EditComp": Edit,
    "ViewComp": View
}