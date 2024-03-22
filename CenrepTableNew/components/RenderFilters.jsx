import React, {useEffect, useState} from "react";
import get from "lodash/get";


const sampleFilterObject = {
    name: '<col_name"',
    type: '', // simple, multi, range AND include/exclude the selected values
    defaultValue: '<user selected value from dropdown'
}


const cleanColName = colName => colName.includes(' AS') ? colName.split(' AS')[0] : colName.split(' as')[0];

const parseJson = str => {
    try {
        return JSON.parse(str);
    }catch (e){
        return {}
    }
}

const getFilterMeta = async ({column, meta, values, pgEnv, falcor}) => {
    // if view_id

    // else


    const metaLookup = parseJson(meta);
    // console.log('metaLookup', metaLookup)
    const {
        attributes, // to fetch from meta table
        geoAttribute, // if passed, apply geoid filter on data
        filterAttribute,  // if passed, use this column name instead of md.name to filtered using cached uniq data
        formatValuesToMap, // format values before pulling meta for them. Mainly used for SBA Disaster numbers. 1335DR doesn't match to integer 1335
        keyAttribute, // used to assign key for meta object to return
        valueAttribute = 'name', // not used here, but if passed, use this column name to get labels of meta ids,
        keepId = true, // keeps id.
        view_id, // view id of the meta table
        filter, // filter
        aggregatedLen // if grouping by, true
    } = metaLookup;

    if (!view_id) return {};
    const options = JSON.stringify({
        aggregatedLen,
        filter: {
            ...values?.[cleanColName(column.name)]?.length && {[filterAttribute || cleanColName(column.name)]: values?.[cleanColName(column.name)]}, // use md.name to fetch correct meta
            ...(filter || {})
        }
    });

    const lenPath = ['dama', pgEnv, 'viewsbyId', view_id, 'options', options, 'length'];

    const lenRes = await falcor.get(lenPath);
    const len = get(lenRes, ['json', ...lenPath], 0);

    if (!len) return {};

    const dataPath = ['dama', pgEnv, 'viewsbyId', view_id, 'options', options, 'databyIndex'];

    // console.time('meta api request')
    await falcor.chunk([...dataPath, {from: 0, to: len - 1}, attributes]);
    // console.timeEnd('meta api request')

    // console.time('getting cache')
    const dataRes = Object.values(get(falcor.getCache(), dataPath, {}));
    // console.timeEnd('getting cache')

    // console.time('processing meta')
    const data = dataRes
        .reduce((acc, d) => {
            acc[d[keyAttribute]] = keepId ? `${d[valueAttribute]} (${d[keyAttribute]})` : d[valueAttribute];
            return acc;
        }, {});
    // console.timeEnd('processing meta')

    console.log('returning meta', dataRes, data)
    return data;
}
const getFilterData = async ({falcor, filter, pgEnv, version, setFilterData, metadata, setIsLoadingData}) => {
    if (!filter.name) return;
    setIsLoadingData(true);

    const options =
        JSON.stringify({
            aggregatedLen: true,
            groupBy: [cleanColName(filter.name)]
        });

    const lenPath = ['dama', pgEnv, 'viewsbyId', version, 'options', options, 'length'];
    const dataPath = ['dama', pgEnv, 'viewsbyId', version, 'options', options, 'databyIndex'];
    const attributes = [filter.name]

    await falcor.get(lenPath);
    const len = get(falcor.getCache(), lenPath, 0);

    if (!len) return Promise.resolve();

    await falcor.chunk([...dataPath, {from: 0, to: len - 1}, attributes]);
    const data = Object.values(get(falcor.getCache(), dataPath, {}))
        .map(r => r[filter.name])
        .sort((a, b) => typeof a === 'string' ? a.localeCompare(b) : a - b);
    const meta_lookup = metadata.find(m => m.name === filter.name)?.meta_lookup;

    // if data has meta, fetch meta.
    const meta = await getFilterMeta({column: filter, meta: meta_lookup, values: data, pgEnv, falcor});
    // console.log('meta', meta)
    const dataWithMeta = data.map(d => ({value: d, label: meta?.[d] || d}))
    setFilterData(dataWithMeta);
    setIsLoadingData(false)
}
export const RenderFilters = ({filters, setFilters, columns, metadata, falcor, pgEnv, version}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [tmpFilter, setTmpFilter] = useState({name: '', type: 'simple', action: 'include', 'defaultValue': ''});
    const [filterData, setFilterData] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    useEffect(() => {
        getFilterData({falcor, filter: tmpFilter, pgEnv, version, setFilterData, metadata, setIsLoadingData})
    }, [tmpFilter]);

    return (
        <>
            <div className={'w-full flex flex-col items-center'}>
                <div className={'w-full flex flex-col sm:flex-row justify-between'}>
                    <label className={'shrink-0 pr-2 py-1 my-1 w-1/4'}>Filters: </label>
                    <button
                        className={`rounded-md shrink-0
                    ${isOpen ? `bg-green-600 hover:bg-green-500` : `bg-blue-600 hover:bg-blue-500`} 
                    text-white p-1.5 h-fit text-xs transition ease-in-out`}
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <><i className={'fa fa-check'}/> Done</> : `+ Add filters`}
                    </button>
                </div>

                <div
                    className={`flex ${isOpen ? "opacity-100" : "opacity-0"} transition-opacity ease-in-out delay-150 duration-300 w-full mt-2`}>
                    <select
                        className={'appearance-auto align-bottom shrink-0 px-1 my-1 w-1/4 bg-white rounded-md'}
                        value={tmpFilter.name}
                        onChange={e =>
                            setTmpFilter({
                                name: e.target.value,
                                type: 'simple',
                                action: 'include',
                                defaultValue: '',
                                displayName: columns.find(c => c.name === e.target.value)?.display_name || e.target.value
                            })
                        }
                    >
                        <option key={0} defaultValue={undefined}>Please select column</option>
                        {
                            columns.map((column, i) => <option key={i}
                                                               value={column.name}>{column.display_name || column.name}</option>)
                        }
                    </select>

                    <div className={'w-full flex justify-between pr-2'}>
                        <select
                            className={'appearance-auto align-bottom shrink-0 px-1 my-1 bg-white rounded-md mx-1'}
                            value={tmpFilter.action}
                            onChange={e => setTmpFilter({...tmpFilter, action: e.target.value})}
                        >
                            {
                                [{label: 'Include', value: 'include'}, {label: 'Exclude', value: 'exclude'}]
                                    .map((column, i) => <option key={i}
                                                                value={column.value}>{column.label}</option>)
                            }
                        </select>

                        <select
                            className={'appearance-auto w-1/2 align-bottom shrink-0 px-1 my-1 bg-white rounded-md mx-1'}
                            value={tmpFilter.defaultValue}
                            onChange={e => setTmpFilter({...tmpFilter, defaultValue: e.target.value})}
                        >
                            <option key={0}
                                    defaultValue={undefined}>{isLoadingData ? 'Loading...' : 'Please select'}</option>
                            {
                                filterData.map((row, i) => <option key={i}
                                                                   value={row.value || row}>{
                                    typeof (row.label || row) === 'string' ? row.label || row :
                                        JSON.stringify(row.label || row)
                                }</option>)
                            }
                        </select>

                        <button
                            className={'bg-blue-600 hover:bg-blue-500 text-white rounded-md p-1.5 my-1 transition ease-in-out'}
                            onClick={() => {
                                setFilters([...filters, tmpFilter])
                            }}>
                            Add
                        </button>
                    </div>
                </div>

            </div>


            <div
                className={'w-full flex flex-col sm:flex-row items-center border-y hover:bg-blue-100 rounded-md'}>
                <div className={'shrink-0 p-2 my-1 w-full sm:w-1/4'}>Column</div>
                <div className={'flex w-full justify-between pr-2'}>
                    <div className={'shrink-0 p-2 my-1'}>Action</div>
                    <div className={'shrink-0 p-2 my-1'}>Value</div>
                    <div></div>
                </div>
            </div>
            {
                filters.map(filter => (
                    <div
                        className={'w-full flex flex-col sm:flex-row items-center border-y hover:bg-blue-100 rounded-md'}>
                        <div className={'shrink-0 p-2 my-1 w-full sm:w-1/4'}>{filter.displayName || filter.name}</div>
                        <div className={'flex w-full justify-between pr-2'}>
                            <div className={'shrink-0 p-2 my-1'}>{filter.action}</div>
                            <div className={'shrink-0 p-2 my-1'}>{
                                filterData.find(fd => fd.value === filter.defaultValue)?.label || filter.defaultValue
                            }</div>
                            <button
                                className={'h-fit rounded-md p-1 my-1'}
                                onClick={() => {
                                    setFilters(filters.filter(f => !(
                                        f.name === filter.name &&
                                        f.defaultValue === filter.defaultValue &&
                                        f.action === filter.action
                                    )))
                                }}>
                                <i className={'fa fa-trash text-red-300 hover:text-red-500 transition ease-in-out'}/>
                            </button>
                        </div>
                    </div>
                ))
            }
        </>
    )
}