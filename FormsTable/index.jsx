import React, {useCallback, useEffect, useMemo, useState} from "react";
import {useFalcor} from '~/modules/avl-falcor';
import {pgEnv} from "~/utils/";
import {isJson} from "~/utils/macros.jsx";
import {FormsTable} from "./components/FormsTable.jsx";
import GeographySearch from "../shared/geographySearch.jsx";
import {Loading} from "~/utils/loading.jsx";
import {RenderColumnControls} from "../shared/columnControls.jsx";
import {ButtonSelector} from "../shared/buttonSelector.jsx";
import {dmsDataLoader} from "~/modules/dms/src";
import {getMeta, setMeta, getAccessor, getColAccessor, defaultOpenOutAttributes} from "./utils.js";
import {formsConfigFormat} from "~/sites/www/pages/forms/index.jsx";
import {Switch} from "@headlessui/react";

const isValid = ({groupBy, fn, columnsToFetch}) => {
    const fns = columnsToFetch.map(ctf => ctf.includes(' AS') ? ctf.split(' AS')[0] : ctf.split(' as')[0]);

    if (groupBy.length) {
        return fns.filter(ctf =>
            !ctf.includes('sum(') &&
            !ctf.includes('array_to_string') &&
            !ctf.includes('count(')
        ).length === groupBy.length
    } else {
        return fns.filter(ctf =>
            ctf.includes('sum(') ||
            ctf.includes('array_to_string') ||
            ctf.includes('count(')
        ).length === 0
    }
}

async function getData({   formsConfig, actionType, form,
                           geoAttribute, geoid, metaLookupByViewId,
                           pageSize, sortBy, groupBy, fn, notNull, colSizes,
                           filters, filterValue, visibleCols, hiddenCols, extFilterCols, extFilterValues, openOutCols,
                           colJustify, striped, extFiltersDefaultOpen, customColName
                       }, falcor) {
    const d = await dmsDataLoader(
        {
            format: formsConfig,
            children: [
                {
                    type: () => {
                    },
                    action: 'load',
                    path: '/0/250',
                    filter: {
                        // fromIndex: path => path.split('/')[1],
                        // toIndex: path => path.split('/')[2],
                        options: JSON.stringify({
                            aggregatedLen: groupBy?.length,
                            filter: {
                                ...form === 'Actions' && actionType && {[`data->>'idKey'`]: [actionType]}
                            },
                            exclude: {
                                ...notNull.length &&
                                notNull.reduce((acc, col) => (
                                    {...acc,
                                        [
                                            formsConfig?.attributes?.find(attr =>
                                                attr.name.toLowerCase().split(' as ')[0] === col.toLowerCase())?.origin === 'calculated-column' ? col :
                                                `${getAccessor(col, form)}'${col}'`
                                            ]:
                                            ['number', 'integer'].includes(formsConfig?.attributes?.find(attr => attr.name.toLowerCase().split(' as ')[0] === col.toLowerCase())?.type) ? ['null'] : ['null', '', ' ']}) , {}) // , '', ' ' error out for numeric columns.
                            },
                            groupBy: groupBy.map(gb => formsConfig?.attributes?.find(attr => attr.name.toLowerCase().split(' as ')[0] === gb.toLowerCase())?.origin === 'calculated-column' ? gb : `${getAccessor(gb, form)}'${gb}'`)
                        }),
                        attributes: [
                            ...[geoAttribute, ...visibleCols].map(vc => getColAccessor(fn, vc, formsConfig?.attributes?.find(attr => attr.name === vc)?.origin, form))
                        ]
                    },
                }
            ]
        },
        '/0/250'
    );

    const data = await setMeta({
        formsConfig: formsConfig,
        visibleCols,
        openOutCols,
        data: d,
        metaLookupByViewId,
        geoAttribute, geoid, actionType, fn, form
    })

    const columns = visibleCols
        .map(c => formsConfig?.attributes?.find(md => md.name === c))
        .filter(c => c)
        // .filter(c => c && !c.openOut && !defaultOpenOutAttributes.includes(c.name))
        .map(col => {
            const acc = getColAccessor(fn, col.name, col.origin, form);
            return {
                Header: customColName?.[col?.name] || col?.display_name,
                accessor: acc,
                align: colJustify?.[col?.name] || col?.align || 'right',
                width: colSizes?.[col?.name] || '15%',
                minWidth: colSizes?.[col?.name] || '15%',
                maxWidth: colSizes?.[col?.name] || '15%',
                filter: col?.filter || filters?.[col?.name],
                extFilter: extFilterCols.includes(col?.name),
                info: col?.desc,
                ...col,
                openOut: openOutCols?.includes(col?.name),
                type: fn?.[col?.display_name]?.includes('array_to_string') ? 'string' : col.type
            }
        });

    return {
        geoid,
        pageSize, sortBy, groupBy, fn, notNull, hiddenCols, colSizes, form, formsConfig,
        data, columns, metaLookupByViewId, filters, filterValue, visibleCols, geoAttribute, actionType,
        extFilterCols, extFilterValues, openOutCols, colJustify, striped, extFiltersDefaultOpen, customColName
    }
}

const Edit = ({value, onChange}) => {
    const {falcor, falcorCache} = useFalcor();

    let cachedData = value && isJson(value) ? JSON.parse(value) : {};
    const baseUrl = '/';
    const [form, setForm] = useState(cachedData?.form || 'Actions');
    const [geoAttribute, setGeoAttribute] = useState(cachedData?.geoAttribute);
    const [metaLookupByViewId, setMetaLookupByViewId] = useState(cachedData.metaLookupByViewId || {});
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(cachedData?.status);
    const [geoid, setGeoid] = useState(cachedData?.geoid || '36');
    const [filters, setFilters] = useState(cachedData?.filters || {});
    const [filterValue, setFilterValue] = useState(cachedData?.filterValue || {});
    const [visibleCols, setVisibleCols] = useState(cachedData?.visibleCols || []);
    const [pageSize, setPageSize] = useState(cachedData?.pageSize || 5);
    const [sortBy, setSortBy] = useState(cachedData?.sortBy || {});
    const [groupBy, setGroupBy] = useState(cachedData?.groupBy || []);
    const [notNull, setNotNull] = useState(cachedData?.notNull || []);
    const [fn, setFn] = useState(cachedData?.fn || []);
    const [actionType, setActionType] = useState(cachedData?.actionType || 'shmp')
    const [formsConfig, setFormsConfig] = useState(cachedData.formsConfig)
    const [hiddenCols, setHiddenCols] = useState(cachedData?.hiddenCols || []);
    const [colSizes, setColSizes] = useState(cachedData?.colSizes || {});
    const [extFilterCols, setExtFilterCols] = useState(cachedData?.extFilterCols || []);
    const [extFilterValues, setExtFilterValues] = useState(cachedData?.extFilterValues || {});
    const [openOutCols, setOpenOutCols] = useState(cachedData?.openOutCols || []);
    const [colJustify, setColJustify] = useState(cachedData?.colJustify || {});
    const [striped, setStriped] = useState(cachedData?.striped || false);
    const [extFiltersDefaultOpen, setExtFiltersDefaultOpen] = useState(cachedData?.extFiltersDefaultOpen || false);
    const [customColName, setCustomColName] = useState(cachedData?.customColName || {})

    useEffect(() => {
        async function getFormsConfig() {
            const formConfigs = await dmsDataLoader(
                {
                    format: formsConfigFormat,
                    children: [
                        {
                            type: () => {
                            },
                            action: 'list',
                            path: '/',
                        }
                    ]
                }, '/');
            const config = formConfigs.find(fc => fc.name === form)?.config;
            if(config) setFormsConfig(JSON.parse(config));
        }

        getFormsConfig();
    }, [form])

    useEffect(() => {
        if (!formsConfig) return;
        const geoAttribute = formsConfig.attributes.find(c => c.geoVariable);
        setGeoAttribute(geoAttribute?.name);
    }, [form, formsConfig]);

    useEffect(() => {
        if (!formsConfig) return;
        getMeta({
            formsConfig: formsConfig,
            metaLookupByViewId,
            setMetaLookupByViewId,
            visibleCols,
            pgEnv,
            falcor,
            geoid
        });
    }, [form, formsConfig, geoid, visibleCols]);

    useEffect(() => {
        onChange(JSON.stringify({
            ...cachedData,
            striped,
            extFiltersDefaultOpen,
            extFilterValues
        }))
    }, [striped, extFiltersDefaultOpen]);

    useEffect(() => {
        if (!formsConfig) return;

        async function load(){
            if (!visibleCols?.length) {
                !visibleCols?.length && setStatus('Please select columns.');

                setLoading(false);
                return;
            }

            if (!isValid({groupBy, fn, columnsToFetch: visibleCols.map(vc => fn[vc] ? fn[vc] : vc)})) {
                setStatus('Please make appropriate grouping selections.');
                setLoading(false);
                return;
            }

            setLoading(true);
            setStatus(undefined);

            const data = await getData({
                formsConfig, actionType, form,
                geoAttribute, geoid, metaLookupByViewId,
                pageSize, sortBy, groupBy, fn, notNull, colSizes,
                filters, filterValue, visibleCols, hiddenCols,
                extFilterCols, extFilterValues, openOutCols, colJustify, striped, extFiltersDefaultOpen,
                customColName
            }, falcor);

            onChange(JSON.stringify({
                ...data,
            }));

            setLoading(false);

        }

        load()
    }, [
        formsConfig, actionType, form,
        geoAttribute, geoid, metaLookupByViewId,
        pageSize, sortBy, groupBy, fn, notNull, colSizes,
        filters, filterValue, visibleCols, hiddenCols,
        extFilterCols, openOutCols, colJustify, striped, extFiltersDefaultOpen,
        customColName
    ]);

    return (
        <div className='w-full'>
            <div className='relative'>
                <div className={'border rounded-md border-blue-500 bg-blue-50 p-2 m-1'}>
                    Edit Controls
                    <ButtonSelector
                        label={'Type'}
                        types={[
                            {label: 'Actions', value: 'Actions'},
                            {label: 'Capabilities', value: 'Capabilities'},
                            {label: 'Mitigation Measures', value: 'Mitigation Measures'},
                            {label: 'R+V Matrix', value: 'R+V Matrix'},
                            {label: 'Policy Documents', value: 'Policy Documents'}
                        ]}
                        type={form}
                        setType={e => {
                            // setData([]);
                            setVisibleCols([]);
                            setActionType(undefined);
                            setGeoAttribute(undefined);
                            setForm(e)
                        }}
                        autoSelect={true}
                    />
                    {
                        form === 'Actions' ?
                            <GeographySearch value={geoid} onChange={setGeoid} className={'flex-row-reverse'}/> :
                            null
                    }
                    {form === 'Actions' ? <ButtonSelector
                        label={'Action Level'}
                        types={[
                            {label: 'State', value: 'shmp'},
                            {label: 'Local', value: 'lhmp'},
                            {label: 'NYRCR', value: 'nyrcr'}
                        ]}
                        type={actionType}
                        setType={setActionType}
                        autoSelect={true}
                    /> : ''}

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
                        cols={formsConfig?.attributes?.filter(c => ['data-variable', 'meta-variable', 'geoid-variable'].includes(c.display))?.map(c => c.name)}
                        metadata={formsConfig?.attributes}
                        stateNamePreferences={{
                            sortBy: 'original',
                            hideCols: 'original',
                            showTotal: 'original'
                        }}
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
                    />
                </div>
                {
                    loading ? <Loading/> :
                        status ? <div className={'p-5 text-center'}>{status}</div> :
                            <FormsTable
                                geoid={geoid}
                                data={cachedData.data}
                                columns={cachedData.columns}
                                hiddenCols={hiddenCols}
                                filterValue={filterValue}
                                extFilterValues={extFilterValues}
                                setExtFilterValues={setExtFilterValues}
                                pageSize={pageSize}
                                sortBy={sortBy}
                                striped={striped}
                                extFiltersDefaultOpen={extFiltersDefaultOpen}
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
                    <FormsTable {...data} baseUrl={'/'}/>
            }
        </div>
    )
}


export default {
    "name": 'Table: Forms',
    "type": 'Table',
    "variables": [
        {
            name: 'form',
            hidden: true
        },
        {
            name: 'formsConfig',
            hidden: true
        },
        {
            name: 'actionType',
            hidden: true
        },
        {
            name: 'metaLookupByViewId',
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
            name: 'extFilterValues',
            hidden: true,
            default: {}
        },
        {
            name: 'openOutCols',
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
    ],
    getData,
    "EditComp": Edit,
    "ViewComp": View
}