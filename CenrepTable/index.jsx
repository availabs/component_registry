import React, {useCallback, useEffect, useMemo, useState} from "react";
import get from "lodash/get";
import {useFalcor} from '~/modules/avl-falcor';
import {pgEnv} from "~/utils/";
import {isJson} from "~/utils/macros.jsx";
import {RenderBuildingsTable} from "./components/RenderBuildingsTable.jsx";
import VersionSelectorSearchable from "../shared/versionSelector/searchable.jsx";
import GeographySearch from "../shared/geographySearch.jsx";
import {Loading} from "~/utils/loading.jsx";
import {RenderColumnControls} from "../shared/columnControls.jsx";
import {addTotalRow} from "../utils/addTotalRow.js";
import {Switch} from "@headlessui/react";
import {defaultOpenOutAttributes, getNestedValue} from "../FormsTable/utils.js";
import DisasterSearch from "../shared/disasterSearch.jsx";

const isValid = ({groupBy, fn, columnsToFetch}) => {
    const fns = columnsToFetch.map(ctf => ctf.includes(' AS') ? ctf.split(' AS')[0] : ctf.split(' as')[0]);

    if(groupBy.length){
        return fns.filter(ctf =>
            !ctf.includes('sum(') &&
            !ctf.includes('array_to_string') &&
            !ctf.includes('count(')
        ).length === groupBy.length
    }else{
        return fns.filter(ctf =>
            ctf.includes('sum(') ||
            ctf.includes('array_to_string') ||
            ctf.includes('count(')
        ).length === 0
    }
}

const parseJson = str => {
    try {
        return JSON.parse(str);
    }catch (e){
        return {}
    }
}

async function getMeta({dataSources, dataSource, visibleCols, geoid}, falcor){
    const metadata = (dataSources || []).find(ds => ds.source_id === dataSource)?.metadata?.columns;
    const metaViewIdLookupCols =
        metadata?.filter(md => visibleCols.includes(md.name) && ['meta-variable', 'geoid-variable'].includes(md.display) && md.meta_lookup);

    if(metaViewIdLookupCols?.length){
        const data =
            await metaViewIdLookupCols
                .filter(md => parseJson(md.meta_lookup)?.view_id)
                .reduce(async (acc, md) => {
                    const prev = await acc;
                    const metaLookup = parseJson(md.meta_lookup);
                    const options = JSON.stringify({
                        aggregatedLen: metaLookup.aggregatedLen,
                        filter: {
                            ...metaLookup?.geoAttribute && {[`substring(${metaLookup.geoAttribute}::text, 1, ${geoid?.toString()?.length})`]: [geoid]},
                            ...(metaLookup?.filter || {})
                        }
                    });
                    const attributes = metaLookup.attributes;
                    const keyAttribute = metaLookup.keyAttribute;

                    const lenPath = ['dama', pgEnv, 'viewsbyId', metaLookup.view_id, 'options', options, 'length'];

                    const lenRes = await falcor.get(lenPath);
                    const len = get(lenRes, ['json', ...lenPath], 0);

                    if(!len) return Promise.resolve();

                    const dataPath = ['dama', pgEnv, 'viewsbyId', metaLookup.view_id, 'options', options, 'databyIndex'];
                    const dataRes = await falcor.get([...dataPath, {from: 0, to: len - 1}, attributes]);
                    const data = Object.values(get(dataRes, ['json', ...dataPath], {}))
                        .reduce((acc, d) => (
                            {
                                ...acc,
                                ...{[d[keyAttribute]]: {...attributes.reduce((acc, attr) => ({...acc, ...{[attr]: d[attr]}}), {})}}
                            }
                        ), {})

                    return {...prev, ...{[md.name]: data}};
                }, {});
        // setMetaLookupByViewId(data)
        return data;
    }
    return {}
}

const assignMeta = ({
                        metadata,
                        visibleCols,
                        dataPath,
                        options,
                        groupBy,
                        fn,
                        notNull,
                        geoAttribute,
                        geoid, disasterNumber,
                        metaLookupByViewId,
                        columns
                    }, falcor) => {
    const falcorCache = falcor.getCache();

    const metaLookupCols =
        metadata?.filter(md =>
            visibleCols.includes(md.name) &&
            ['meta-variable', 'geoid-variable'].includes(md.display)
        );

    if(metaLookupCols?.length){
        return handleExpandableRows(
            Object.values(get(falcorCache, dataPath(options({groupBy, notNull, geoAttribute, geoid})), {}))
            .map(row => {
                metaLookupCols.forEach(mdC => {
                    const currentMetaLookup = parseJson(mdC.meta_lookup);
                    const currentColName = fn[mdC.name] || mdC.name;
                    if(currentMetaLookup?.view_id){
                        const currentViewIdLookup = metaLookupByViewId[mdC.name] || [];
                        const currentKeys = row[currentColName];
                        if(currentKeys?.includes(',')){
                            row[currentColName] = currentKeys.split(',').map(ck => currentViewIdLookup[ck.trim()]?.name || ck.trim()).join(', ')
                        }else{
                            row[currentColName] = currentViewIdLookup[currentKeys]?.name || currentKeys;
                        }
                    }else{
                        row[currentColName] = currentMetaLookup[row[currentColName]] || row[currentColName];
                    }
                })
                return row;
            }),
            columns,
            fn,
            disasterNumber
        )
    }

    return handleExpandableRows(
        Object.values(get(falcorCache, dataPath(options({groupBy, notNull, geoAttribute, geoid})), {})),
        columns,
        fn,
        disasterNumber
    )

}

const handleExpandableRows = (data, columns, fn, disasterNumber) => {
    const expandableColumns = columns.filter(c => c.openOut);
    const disasterNumberCol = (fn?.['disaster_number'] || 'disaster_number');
    // if disaster number is being used to filter data, it should be in visible columns. Hide it if not needed.

    if (expandableColumns?.length) {
        const newData = data.map(row => {
            const newRow = {...row}
            newRow.expand = []
            newRow.expand.push(
                ...expandableColumns
                    .filter(col => col.name !== disasterNumberCol ||
                        (
                            !disasterNumber ||
                            (disasterNumber && getNestedValue(row[col.accessor]) && getNestedValue(row[col.accessor])?.includes(disasterNumber))
                        ))
                    .map(col => {
                    const value = getNestedValue(row[col.accessor]);

                    return {
                        key: col.display_name || col.name,
                        accessor: col.accessor,
                        value: Array.isArray(value) ? value.join(', ') : typeof value === 'object' ? '' : value, // to display arrays
                        originalValue: Array.isArray(value) ? value : typeof value === 'object' ? '' : value // to filter arrays
                    }
                })
            )
            expandableColumns.forEach(col => delete newRow[col.accessor])
            return newRow;
        })
            .filter(row =>
                !disasterNumber ||
                (disasterNumber && row[disasterNumberCol] && row[disasterNumberCol]?.includes(disasterNumber))
            );
        return newData;
    } else {
        return data.filter(row => {
                return !disasterNumber || !row[disasterNumberCol] ||
                (disasterNumber && row[disasterNumberCol] && row[disasterNumberCol]?.includes(disasterNumber))
            }
        )
    }
}

async function getData({
    // settings that require data fetching
                           dataSources, dataSource, version, geoid, geoAttribute, disasterNumber,
                           groupBy, fn, visibleCols,
                           fetchData = true, // when setting that don't require data fetching change, call getData with fetchData = false
                           data, columns, // if fetchData is false, provide these

    // settings that change appearance
                           pageSize, sortBy,  notNull,  colSizes,
                           filters, filterValue, hiddenCols, showTotal,
                           extFilterCols, extFilterValues, openOutCols, colJustify, striped,
                           extFiltersDefaultOpen, customColName, linkCols,
                       }, falcor) {
    const options = ({groupBy, notNull, geoAttribute, geoid}) => {
        return JSON.stringify({
            aggregatedLen: Boolean(groupBy?.length),
            filter: {
                ...geoAttribute && geoid?.length && {[`substring(${geoAttribute}::text, 1, ${geoid?.toString()?.length})`]: [geoid]},
            },
            exclude: {
                ...notNull?.length && notNull.reduce((acc, col) => ({...acc, [col]: ['null']}), {}) // , '', ' ' error out for numeric columns.
            },
            groupBy: groupBy,
        })
    };

    const lenPath = options => ['dama', pgEnv, 'viewsbyId', version, 'options', options, 'length'];
    const dataPath = options => ['dama', pgEnv, 'viewsbyId', version, 'options', options, 'databyIndex'];
    const attributionPath = ['dama', pgEnv, 'views', 'byId', version, 'attributes'],
        attributionAttributes = ['source_id', 'view_id', 'version', '_modified_timestamp'];

    const metadata = (dataSources || []).find(ds => ds.source_id === dataSource)?.metadata?.columns ||
                     (dataSources || []).find(ds => ds.source_id === dataSource)?.metadata ||
                     [];
    let tmpData, tmpColumns;

    if(fetchData){
        await falcor.get(lenPath(options({groupBy, notNull, geoAttribute, geoid})));
        const len = Math.min(
            get(falcor.getCache(), lenPath(options({groupBy, notNull, geoAttribute, geoid})), 0),
            590);

        await falcor.get(
            [...dataPath(options({groupBy, notNull, geoAttribute, geoid})),
                {from: 0, to: len - 1}, (visibleCols || []).map(vc => fn[vc] ? fn[vc] : vc)]);

        await falcor.get([...attributionPath, attributionAttributes]);

        const metaLookupByViewId = await getMeta({dataSources, dataSource, visibleCols, geoid}, falcor);

        tmpColumns = (visibleCols || [])
            .map(c => metadata.find(md => md.name === c))
            .filter(c => c)
            .map(col => {
                // console.log('map col Header', customColName?.[col.name] || col?.display_name || col?.name)
                return {
                    Header: customColName?.[col.name] || col?.display_name || col?.name,
                    accessor: fn?.[col?.name] || col?.name,
                    align: colJustify?.[col?.name] || col?.align || 'right',
                    width: colSizes?.[col.name] || '15%',
                    minWidth: colSizes?.[col.name] || '15%',
                    maxWidth: colSizes?.[col.name] || '15%',
                    filter: col?.filter || filters?.[col?.name],
                    extFilter: extFilterCols?.includes(col.name),
                    info: col.desc,
                    openOut: (openOutCols || [])?.includes(col?.name),
                    link: linkCols?.[col?.name],
                    ...col,
                    type: fn?.[col?.name]?.includes('array_to_string') ? 'string' : col?.type
                }
            });

        tmpData = assignMeta({
            metadata,
            visibleCols,
            dataPath,
            options,
            groupBy,
            fn,
            notNull,
            geoAttribute,
            geoid,
            disasterNumber,
            metaLookupByViewId,
            columns: tmpColumns
        }, falcor);

        addTotalRow({showTotal, data: tmpData || data, columns, setLoading: () => {}});
    } else{
        tmpColumns = visibleCols
            .map(c => metadata.find(md => md.name === c))
            .filter(c => c)
            .map(col => {
                return {
                    Header: customColName?.[col.name] || col?.display_name || col?.name,
                    accessor: fn?.[col?.name] || col?.name,
                    align: colJustify?.[col?.name] || col?.align || 'right',
                    width: colSizes?.[col.name] || '15%',
                    minWidth: colSizes?.[col.name] || '15%',
                    maxWidth: colSizes?.[col.name] || '15%',
                    filter: col?.filter || filters?.[col?.name],
                    extFilter: extFilterCols?.includes(col.name),
                    info: col.desc,
                    openOut: (openOutCols || [])?.includes(col?.name),
                    link: linkCols?.[col?.name],
                    ...col,
                    type: fn?.[col?.name]?.includes('array_to_string') ? 'string' : col?.type
                }
            });
    }

    const attributionData =  get(falcor.getCache(), attributionPath, {});

    return {
        data: fetchData ? tmpData : data, // new data is only available if fetchData is true
        columns: tmpColumns || columns, // always prioritize tmpColumns
        attributionData,
        geoid, disasterNumber, geoAttribute,
        pageSize, sortBy, groupBy, fn, notNull, showTotal, colSizes,
        filters, filterValue, visibleCols, hiddenCols,
        dataSource, dataSources, version,
        extFilterCols, extFilterValues, colJustify, striped, extFiltersDefaultOpen,
        customColName, linkCols, openOutCols
    }
}


const Edit = ({value, onChange}) => {
    const {falcor, falcorCache} = useFalcor();

    let cachedData = value && isJson(value) ? JSON.parse(value) : {};
    const baseUrl = '/';

    const [dataSources, setDataSources] = useState(cachedData?.dataSources || []);
    const [dataSource, setDataSource] = useState(cachedData?.dataSource);
    const [version, setVersion] = useState(cachedData?.version);
    const [geoAttribute, setGeoAttribute] = useState(cachedData?.geoAttribute);

    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(cachedData?.status);
    const [geoid, setGeoid] = useState(cachedData?.geoid || '36');
    const [disasterNumber, setDisasterNumber] = useState(cachedData?.disasterNumber);
    const [filters, setFilters] = useState(cachedData?.filters || {});
    const [filterValue, setFilterValue] = useState(cachedData?.filterValue || {});
    const [visibleCols, setVisibleCols] = useState(cachedData?.visibleCols || []);
    const [pageSize, setPageSize] = useState(cachedData?.pageSize || 5);
    const [sortBy, setSortBy] = useState(cachedData?.sortBy || {});
    const [groupBy, setGroupBy] = useState(cachedData?.groupBy || []);
    const [notNull, setNotNull] = useState(cachedData?.notNull || []);
    const [showTotal, setShowTotal] = useState(cachedData?.showTotal || []);
    const [fn, setFn] = useState(cachedData?.fn || []);
    const [hiddenCols, setHiddenCols] = useState(cachedData?.hiddenCols || []);
    const [colSizes, setColSizes] = useState(cachedData?.colSizes || {});
    const [extFilterCols, setExtFilterCols] = useState(cachedData?.extFilterCols || []);
    const [extFilterValues, setExtFilterValues] = useState(cachedData?.extFilterValues || {});
    const [openOutCols, setOpenOutCols] = useState(cachedData?.openOutCols || []);
    const [colJustify, setColJustify] = useState(cachedData?.colJustify || {});
    const [striped, setStriped] = useState(cachedData?.striped || false);
    const [extFiltersDefaultOpen, setExtFiltersDefaultOpen] = useState(cachedData?.extFiltersDefaultOpen || false);
    const [customColName, setCustomColName] = useState(cachedData?.customColName || {});
    const [linkCols, setLinkCols] = useState(cachedData?.linkCols || {});
    const category = 'Cenrep';

    const dataSourceByCategoryPath = ['dama', pgEnv, 'sources', 'byCategory', category];

    useEffect(() => {
        async function getData() {
            setLoading(true);
            setStatus(undefined);

            // fetch data sources from categories that match passed prop
            await falcor.get(dataSourceByCategoryPath);
            setDataSources(get(falcor.getCache(), [...dataSourceByCategoryPath, 'value'], []))

            setLoading(false);

        }

        getData()
    }, []);

    useEffect(() => {
        const geoAttribute =
            (dataSources
                .find(ds => ds.source_id === dataSource)?.metadata?.columns || [])
                .find(c => c.display === 'geoid-variable')?.name

        const geoAttributeMapped = geoAttribute?.includes(' AS') ? geoAttribute.split(' AS')[0] :
            geoAttribute?.includes(' as') ? geoAttribute.split(' as')[0] : geoAttribute;

        geoAttributeMapped && setGeoAttribute(geoAttributeMapped);
    }, [dataSources, dataSource]);



    useEffect(() => {
        async function load(){
            if(dataSources && (!visibleCols?.length || !version || !dataSource)) {
                !dataSource && setStatus('Please select a Datasource.');
                !version && setStatus('Please select a version.');
                !visibleCols?.length && setStatus('Please select columns.');

                setLoading(false);
                return;
            }

            if(!isValid({groupBy, fn, columnsToFetch: visibleCols.map(vc => fn[vc] ? fn[vc] : vc)})){
                setStatus('Please make appropriate grouping selections.');
                setLoading(false);
                return;
            }

            setLoading(true);
            setStatus(undefined);

            const data = await getData({
                dataSources, dataSource, geoAttribute, geoid, disasterNumber,
                pageSize, sortBy, groupBy, fn, notNull, showTotal, colSizes,
                filters, filterValue, visibleCols, hiddenCols,
                version, extFilterCols, extFilterValues, openOutCols, colJustify, striped, extFiltersDefaultOpen,
                customColName, linkCols, fetchData: true
            }, falcor);

            onChange(JSON.stringify({
                // only save data and columns
                ...data,
            }));

            setLoading(false);

        }

        load()
    }, [dataSources, dataSource, geoid, disasterNumber, geoAttribute, groupBy, fn, visibleCols, version]);


    useEffect(() => {
        async function load(){
            setLoading(true);
            setStatus(undefined);

            // getData that only sets settings, but doesn't fetch data.
            const tmpData = await getData({
                dataSources, dataSource, geoAttribute, geoid, disasterNumber,
                pageSize, sortBy, groupBy, fn, notNull, showTotal, colSizes,
                filters, filterValue, visibleCols, hiddenCols,
                version, extFilterCols, extFilterValues, openOutCols, colJustify, striped, extFiltersDefaultOpen,
                customColName, linkCols,
                data, columns,
                fetchData: false
            }, falcor);

            onChange(JSON.stringify({
                // only save data and columns
                ...tmpData,
            }));

            setLoading(false);
        }

        load()

    }, [
        pageSize, sortBy,  notNull,  colSizes,
        filters, filterValue, hiddenCols, showTotal,
        extFilterCols, extFilterValues, openOutCols, colJustify, striped,
        extFiltersDefaultOpen, customColName, linkCols,
    ]);

    const data = cachedData.data;

    const attributionData = cachedData.attributionData;

    const columns = cachedData.columns;

    return (
        <div className='w-full'>
            <div className='relative'>
                <div className={'border rounded-md border-blue-500 bg-blue-50 p-2 m-1'}>
                    Edit Controls
                    <div className={`flex justify-between`}>
                        <label
                            className={`shrink-0 pr-2 py-1 my-1 w-1/4`}
                        >
                            Data Source:
                        </label>
                        <select
                            className={`bg-white w-full pl-3 rounded-md my-1`}
                            value={dataSource}
                            onChange={e => {
                                setVisibleCols([])
                                setExtFilterCols([])
                                setGeoAttribute(undefined)
                                setDataSource(+e.target.value);
                            } }
                        >
                            <option key={'undefined'} value={undefined} selected disabled>Please select a data source</option>
                            {
                                dataSources.map(ds => <option key={ds.source_id} value={ds.source_id}> {ds.name} </option>)
                            }
                        </select>
                    </div>
                    <VersionSelectorSearchable
                        source_id={dataSource}
                        view_id={version}
                        onChange={setVersion}
                        className={'flex-row-reverse'}
                    />
                    <GeographySearch value={geoid} onChange={setGeoid} className={'flex-row-reverse'}/>

                    {
                        (dataSources.find(ds => ds.source_id === dataSource)?.metadata?.columns || [])
                        .find(c => c.name === 'disaster_number') // change this to type like fips-variable
                        ? <DisasterSearch
                                view_id={837}
                                value={disasterNumber}
                                geoid={geoid}
                                onChange={setDisasterNumber}
                                className={'flex-row-reverse'}
                            /> : null
                    }
                    <div className={'block w-full flex mt-1'}>
                        <label className={'align-bottom shrink-0pr-2 py-2 my-1 w-1/4'}> Striped: </label>
                        <div className={'align-bottom p-2 pl-0 my-1 rounded-md shrink self-center'}>
                            <Switch
                                key={`striped-table`}
                                checked={striped}
                                onChange={e => setStriped(!striped)}
                                className={
                                    `
                                    ${striped ? 'bg-indigo-600' : 'bg-gray-200'}
                                    relative inline-flex 
                                     h-4 w-10 shrink
                                     cursor-pointer rounded-full border-2 border-transparent 
                                     transition-colors duration-200 ease-in-out focus:outline-none focus:ring-0.5
                                     focus:ring-indigo-600 focus:ring-offset-2`
                                }
                            >
                                <span className="sr-only">toggle striped table by</span>
                                <span
                                    aria-hidden="true"
                                    className={
                                        `
                                        ${striped ? 'translate-x-5' : 'translate-x-0'}
                                        pointer-events-none inline-block 
                                        h-3 w-4
                                        transform rounded-full bg-white shadow ring-0 t
                                        transition duration-200 ease-in-out`
                                    }
                                />
                            </Switch>
                        </div>
                    </div>

                    <div className={'block w-full flex mt-1'}>
                        <label className={'align-bottom shrink-0pr-2 py-2 my-1 w-1/4'}> External filters default open: </label>
                        <div className={'align-bottom p-2 pl-0 my-1 rounded-md shrink self-center'}>
                            <Switch
                                key={`striped-table`}
                                checked={extFiltersDefaultOpen}
                                onChange={e => setExtFiltersDefaultOpen(!extFiltersDefaultOpen)}
                                className={
                                    `
                                ${extFiltersDefaultOpen ? 'bg-indigo-600' : 'bg-gray-200'}
                                relative inline-flex 
                                 h-4 w-10 shrink
                                 cursor-pointer rounded-full border-2 border-transparent 
                                 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-0.5
                                 focus:ring-indigo-600 focus:ring-offset-2`
                                }
                            >
                                <span className="sr-only">toggle External filters default open by</span>
                                <span
                                    aria-hidden="true"
                                    className={
                                        `
                                    ${extFiltersDefaultOpen ? 'translate-x-5' : 'translate-x-0'}
                                    pointer-events-none inline-block 
                                    h-3 w-4
                                    transform rounded-full bg-white shadow ring-0 t
                                    transition duration-200 ease-in-out`
                                    }
                                />
                            </Switch>
                        </div>
                    </div>

                    <RenderColumnControls
                        cols={
                           (dataSources.find(ds => ds.source_id === dataSource)?.metadata?.columns || [])
                               .filter(c => ['data-variable', 'meta-variable', 'geoid-variable'].includes(c.display))
                               .map(c => c.name)
                        }
                        metadata={dataSources.find(ds => ds.source_id === dataSource)?.metadata?.columns || []}
                        // anchorCols={anchorCols}
                        visibleCols={visibleCols}
                        setVisibleCols={setVisibleCols}
                        hiddenCols={hiddenCols}
                        setHiddenCols={setHiddenCols}
                        filters={filters}
                        setFilters={setFilters}
                        filterValue={filterValue}
                        setFilterValue={setFilterValue}
                        pageSize={pageSize}
                        setPageSize={setPageSize}
                        groupBy={groupBy}
                        setGroupBy={setGroupBy}
                        fn={fn}
                        setFn={setFn}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        notNull={notNull}
                        setNotNull={setNotNull}
                        showTotal={showTotal}
                        setShowTotal={setShowTotal}
                        colSizes={colSizes}
                        setColSizes={setColSizes}
                        extFilterCols={extFilterCols}
                        setExtFilterCols={setExtFilterCols}
                        openOutCols={openOutCols}
                        setOpenOutCols={setOpenOutCols}
                        colJustify={colJustify}
                        setColJustify={setColJustify}
                        customColName={customColName}
                        setCustomColName={setCustomColName}
                        linkCols={linkCols}
                        setLinkCols={setLinkCols}
                    />
                </div>
                {
                    loading ? <Loading/> :
                        status ? <div className={'p-5 text-center'}>{status}</div> :
                            <RenderBuildingsTable
                                geoid={geoid}
                                data={data}
                                columns={columns}
                                hiddenCols={hiddenCols}
                                filterValue={filterValue}
                                extFilterValues={extFilterValues}
                                setExtFilterValues={setExtFilterValues}
                                extFiltersDefaultOpen={extFiltersDefaultOpen}
                                pageSize={pageSize}
                                sortBy={sortBy}
                                attributionData={attributionData}
                                striped={striped}
                                baseUrl={baseUrl}
                                // fetchData={fetchData}
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
                    <RenderBuildingsTable {...data} baseUrl={'/'}/>
            }
        </div>
    )
}


export default {
    "name": 'Table: Cenrep',
    "type": 'Table',
    "variables": [
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
            name: 'geoid',
            default: '36',
        },
        {
            name: 'disasterNumber',
            default: null,
        },
        {
            name: 'pageSize',
            hidden: true
        },
        {
            name: 'sortBy',
            hidden: true
        },
        {
            name: 'groupBy',
            hidden: true
        },
        {
            name: 'fn',
            hidden: true
        },
        {
            name: 'notNull',
            hidden: true
        },
        {
            name: 'showTotal',
            hidden: true
        },
        {
            name: 'colSizes',
            hidden: true
        },
        {
            name: 'filters',
            hidden: true
        },
        {
            name: 'filterValue',
            hidden: true
        },
        {
            name: 'visibleCols',
            hidden: true
        },
        {
            name: 'hiddenCols',
            hidden: true
        },
        {
            name: 'extFilterCols',
            hidden: true,
            default: []
        },
        {
            name: 'colJustify',
            hidden: true,
            default: {}
        },
        {
            name: 'striped',
            hidden: true,
            default: false
        },
        {
            name: 'extFiltersDefaultOpen',
            hidden: true,
            default: false
        },
        {
            name: 'customColName',
            hidden: true,
            default: {}
        },
        {
            name: 'linkCols',
            hidden: true,
            default: {}
        },
        {
            name: 'openOutCols',
            hidden: true,
            default: []
        },
        {
            name: 'extFilterValues',
            hidden: true,
            default: {}
        },
    ],
    getData,
    "EditComp": Edit,
    "ViewComp": View
}