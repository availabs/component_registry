import React, {useEffect, useMemo, useState} from "react";
import get from "lodash/get";
import {useFalcor} from '~/modules/avl-falcor';
import {pgEnv} from "~/utils/";
import {isJson} from "~/utils/macros.jsx";
import {RenderNRITable} from "./components/RenderNRITable.jsx";
import VersionSelectorSearchable from "../shared/versionSelector/searchable.jsx";
import GeographySearch from "../shared/geographySearch.jsx";
import {Loading} from "~/utils/loading.jsx";
import {RenderColumnControls} from "../shared/columnControls.jsx";
import {HazardSelectorSimple} from "../shared/HazardSelector/hazardSelectorSimple.jsx";
import {metaData} from "./components/config.js";
import {ButtonSelector} from "../shared/buttonSelector.jsx";

const ealSourceId = 343;
const nriSourceId = 159;
const nriTractsSourceId = 346;

const dataSourceMapping = {
    avail_counties: ealSourceId,
    nri: nriSourceId,
    nri_tracts: nriTractsSourceId
}

async function getData({
                           dataSource, geoid, filters, dataSourceViewId, hazard, visibleCols,
                           pageSize, sortBy,  filterValue, dataSourceSRCId,
                       }, falcor) {
    let typeId;
    const countyView = metaData.dataSources.find(d => d.value === dataSource)?.geomView;

    const nriGeoCol = metaData.dataSources.find(d => d.value === dataSource)?.geomCol,
        nriAttributes = metaData.columns(hazard, dataSource),
        nriLenOptions =
            JSON.stringify({
                aggregatedLen: false,
                filter: {[`substring(${nriGeoCol}, 1, ${geoid?.toString()?.length})`]: [geoid]},
            }),
        nriOptions =
            JSON.stringify({
                filter: {[`substring(${nriGeoCol}, 1, ${geoid?.toString()?.length})`]: [geoid]},
            }),
        nriPath = (view_id) => ["dama", pgEnv, "viewsbyId", view_id, "options"];

    let anchorCols = nriAttributes.find(a => a.value === 'stcofips' || a.value === 'tractfips')?.label;

    const
        geoNamesOptions = JSON.stringify({
            ...geoid && {filter: {[`substring(geoid, 1, ${geoid?.toString()?.length})`]: [geoid]}}
        }),
        geoNamesPath = view_id => ["dama", pgEnv, "viewsbyId", view_id, "options", geoNamesOptions];

    const dependencyPath = (view_id) => ["dama", pgEnv, "viewDependencySubgraphs", "byViewId", view_id];
    filters = {
        ...filters,
        ...nriAttributes
            .filter(c => c.filter)
            .reduce((acc, curr) => ({...acc, [curr.label]: curr.filter}), {})
    }

    if (dataSource === 'avail_counties') {
        const dependencyRes = await falcor.get(dependencyPath(dataSourceViewId));
        const deps = get(dependencyRes, ["json", ...dependencyPath(dataSourceViewId), "dependencies"]);
        typeId = deps.find(dep => dep.type === 'nri')?.view_id;

        if (!typeId) {
            return {}
        }
    } else {
        typeId = dataSourceViewId;
    }

    if (!typeId) {
        return {};
    }

    const geoNameLenRes = await falcor.get([...geoNamesPath(countyView), "length"]);
    const geoNameLen = get(geoNameLenRes, ["json", ...geoNamesPath(countyView), "length"], 0);

    if (geoNameLen) {
        await falcor.get([...geoNamesPath(countyView), "databyIndex", {
            from: 0,
            to: geoNameLen - 1
        }, ["geoid", "namelsad"]]);
    }

    const lenRes = await falcor.get([...nriPath(typeId), nriLenOptions, 'length']);
    const len = Math.min(get(lenRes, ['json', ...nriPath(typeId), nriLenOptions, 'length'], 0), 250),
        nriIndices = {from: 0, to: len - 1};

    await falcor.get(
        [...nriPath(typeId), nriOptions, 'databyIndex', nriIndices, nriAttributes.map(v => v.value)],
        ['dama', pgEnv, 'views', 'byId', typeId, 'attributes', ['source_id', 'view_id', 'version', '_modified_timestamp']]
    );

    const falcorCache = falcor.getCache();

    const geoNames = Object.values(get(falcorCache, [...geoNamesPath(countyView), "databyIndex"], {}));
    const dataModifier = data => {
        data.map(row => {
            row.stcofips = geoNames?.find(gn => gn.geoid === row.stcofips)?.namelsad || row.stcofips;
        })
        return data
    };
    const data = Object.values(get(falcorCache,
        [...nriPath(typeId), nriOptions, 'databyIndex'],
        {}));

    dataModifier(data);

    const columns =
        visibleCols
            .map(c => nriAttributes.find(nriA => nriA.label === c))
            .filter(c => c)
            .map(col => {
                return {
                    Header: col.label,
                    accessor: col.value,
                    align: col.align || 'right',
                    width: col.width || '15%',
                    filter: col.filter || filters[col.label],
                    ...col
                }
            });

    const attributionData = get(falcorCache, ['dama', pgEnv, 'views', 'byId', typeId, 'attributes'], {});

    return {
        dataSource,
        dataSourceSRCId,
        dataSourceViewId,
        typeId,
        hazard,
        geoid,
        data,
        columns,
        visibleCols,
        pageSize, sortBy, filterValue,
        attributionData,
        nriAttributes,
        anchorCols
    }
}

const Edit = ({value, onChange}) => {
    const {falcor, falcorCache} = useFalcor();

    let cachedData = value && isJson(value) ? JSON.parse(value) : {};
    const baseUrl = '/';

    const [dataSource, setDataSource] = useState(cachedData?.dataSource || 'avail_counties');
    const [dataSourceSRCId, setDataSourceSRCId] = useState(cachedData?.dataSourceSRCId || 343);
    const [dataSourceViewId, setDataSourceViewId] = useState(cachedData?.dataSourceViewId || 837);

    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(cachedData?.status);
    const [geoid, setGeoid] = useState(cachedData?.geoid || '36');
    const [filters, setFilters] = useState(cachedData?.filters || {});
    const [filterValue, setFilterValue] = useState(cachedData?.filterValue || {});
    const [visibleCols, setVisibleCols] = useState(cachedData?.visibleCols || []);
    const [pageSize, setPageSize] = useState(cachedData?.pageSize || 5);
    const [sortBy, setSortBy] = useState(cachedData?.sortBy || {});
    const [hazard, setHazard] = useState(cachedData?.hazard);

    useEffect(() => {
        async function load(){
            if (!geoid || !hazard) {
                !geoid && setStatus('Please Select a Geography');
                !hazard && setStatus('Please Select a Hazard');
                return;
            } else {
                setStatus(undefined)
            }
            setLoading(true);
            setStatus(undefined);
            const data = await getData({
                dataSource, dataSourceSRCId, dataSourceViewId, geoid, filters, hazard, visibleCols,
                pageSize, sortBy,  filterValue,
            }, falcor);

            onChange(JSON.stringify({
                ...data,
            }));

            setLoading(false);
        }

        load()
    }, [geoid, hazard, dataSource, dataSourceSRCId, dataSourceViewId,
        pageSize, sortBy, filters, filterValue, visibleCols
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
                            setDataSourceSRCId(dataSourceMapping[e])
                            setDataSourceViewId(undefined)
                            setVisibleCols([]);
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
                    <HazardSelectorSimple hazard={hazard} setHazard={setHazard}/>
                    <RenderColumnControls
                        cols={cachedData.nriAttributes?.map(a => a.label)}
                        anchorCols={cachedData.anchorCols ? [cachedData.anchorCols] : []}
                        visibleCols={visibleCols}
                        setVisibleCols={setVisibleCols}
                        filters={filters}
                        setFilters={setFilters}
                        filterValue={filterValue}
                        setFilterValue={setFilterValue}
                        pageSize={pageSize}
                        setPageSize={setPageSize}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                    />
                </div>
                {
                    loading ? <Loading/> :
                        status ? <div className={'p-5 text-center'}>{status}</div> :
                            <RenderNRITable
                                geoid={geoid}
                                data={cachedData.data}
                                columns={cachedData.columns}
                                nriAttributes={cachedData.nriAttributes}
                                filterValue={filterValue}
                                pageSize={pageSize}
                                sortBy={sortBy}
                                attributionData={cachedData.attributionData}
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
    if (!value) return ''

    let data = typeof value === 'object' ?
        value['element-data'] :
        JSON.parse(value)
    return (
        <div className='relative w-full p-6'>
            {
                data?.status ?
                    <div className={'p-5 text-center'}>{data?.status}</div> :
                    <RenderNRITable {...data} baseUrl={'/'}/>
            }
        </div>
    )
}



export default {
    "name": 'Table: NRI',
    "type": 'Table',
    "variables": [
        {
            name: 'dataSource',
            default: 'avail_counties',
            hidden: true
        },
        {
            name: 'dataSourceSRCId',
            default: 343,
            hidden: true
        },
        {
            name: 'dataSourceViewId',
            default: 837,
            hidden: true
        },
        {
            name: 'typeId',
            default: 837,
            hidden: true
        },
        {
            name: 'geoid',
            default: '36',
        },
        {
            name: 'filters',
            default: [],
            hidden: true
        },
        {
            name: 'filterValue',
            default: {},
            hidden: true
        },
        {
            name: 'visibleCols',
            default: [],
            hidden: true
        },
        {
            name: 'sortBy',
            default: {},
            hidden: true
        },
    ],
    getData,
    "EditComp": Edit,
    "ViewComp": View
}