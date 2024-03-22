import {getDefaultJustify} from "../../shared/columnControls.jsx";
import get from "lodash/get.js";
import {pgEnv} from "~/utils";
import {getNestedValue} from "../../FormsTable/utils.js";
import {addTotalRow} from "../../utils/addTotalRow.js";
import {cleanColName} from "./cleanColName.js";
import {assignMeta} from "./assignMeta.js";
import {getMeta} from "./getMeta.js";
export async function getData({
                                  // settings that require data fetching
                                  dataSources, dataSource, version, geoid, geoAttribute, disasterNumber,
                                  groupBy, fn, visibleCols,
                                  fetchData = true, // when setting that don't require data fetching change, call getData with fetchData = false
                                  data, columns, // if fetchData is false, provide these

                                  // settings that change appearance
                                  pageSize, sortBy,  notNull,  colSizes,
                                  filters, filterValue, hiddenCols, showTotal,
                                  extFilterCols, extFilterValues, openOutCols, colJustify, striped,
                                  extFiltersDefaultOpen, customColName, linkCols, showCsvDownload, additionalVariables = []
                              }, falcor) {
    // console.log('getData called. fetchData:', fetchData, dataSource, version)
    //console.log('getData called. fetchData:', fetchData)

    //console.time(`getData ${version}`)
    console.log('additional variables', additionalVariables)
    const additionalFilters = additionalVariables.filter(f => f.action === 'include').reduce((acc, curr) => ({
        ...acc,
        [cleanColName(curr.name)]: acc[curr.name] ?
            [...acc[curr.name], curr.defaultValue] :
            [curr.defaultValue]}), {});

    const additionalExcludes = additionalVariables.filter(f => f.action === 'exclude').reduce((acc, curr) => ({
        ...acc,
        [cleanColName(curr.name)]: acc[curr.name] ?
            [...acc[curr.name], curr.defaultValue] :
            [curr.defaultValue]}), {});

    const options = ({groupBy, notNull, geoAttribute, geoid, disasterNumber, disasterNumberCol}) => {
        return JSON.stringify({
            aggregatedLen: Boolean(groupBy?.length),
            filter: {
                ...geoAttribute && geoid?.toString()?.length && {[`substring(${geoAttribute}::text, 1, ${geoid?.toString()?.length})`]: [geoid]},
                ...disasterNumber && disasterNumberCol && {[cleanColName(disasterNumberCol)]: [disasterNumber]}, // assumes disasterNumber to be single value
                ...additionalFilters
            },
            exclude: {
                ...notNull?.length && notNull.reduce((acc, col) => ({...acc, [col]: ['null']}), {}), // , '', ' ' error out for numeric columns.
                ...additionalExcludes
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
        // console.log('creating columns')
        tmpColumns = (visibleCols || [])
            .map(c => metadata.find(md => md.name === c))
            .filter(c => c)
            .map(col => {
                // console.log('map col Header', customColName?.[col.name] || col?.display_name || col?.name)
                return {
                    Header: customColName?.[col.name] || col?.display_name || col?.name,
                    accessor: fn?.[col?.name] || col?.name,
                    align: colJustify?.[col?.name] || col?.align || getDefaultJustify(col?.type),
                    width: colSizes?.[col.name] || '15%',
                    minWidth: colSizes?.[col.name] || '15%',
                    maxWidth: colSizes?.[col.name] || '15%',
                    filter: col?.filter || filters?.[col?.name],
                    extFilter: extFilterCols?.includes(fn?.[col?.name] || col?.name),
                    info: col.desc,
                    openOut: (openOutCols || [])?.includes(col?.name),
                    link: linkCols?.[col?.name],
                    ...col,
                    type: fn?.[col?.name]?.includes('array_to_string') ? 'string' : col?.type
                }
            });

        const disasterNumberOriginalCol = tmpColumns.find(c => c.name?.includes('disaster_number') && !c.name?.toLowerCase().includes('case'))?.name || 'disaster_number'
        const disasterNumberCol = (fn?.[disasterNumberOriginalCol] || disasterNumberOriginalCol);

        // console.log('columns created')


        console.time(`getData falcor calls ${version}`)
        await falcor.get(lenPath(options({groupBy, notNull, geoAttribute, geoid, disasterNumber, disasterNumberCol})));
        const len = Math.min(
            get(falcor.getCache(), lenPath(options({groupBy, notNull, geoAttribute, geoid, disasterNumber, disasterNumberCol})), 0),
            100);

        await falcor.get(
            [...dataPath(options({groupBy, notNull, geoAttribute, geoid, disasterNumber, disasterNumberCol})),
                {from: 0, to: len - 1}, (visibleCols || []).map(vc => fn[vc] ? fn[vc] : vc)]);

        await falcor.get([...attributionPath, attributionAttributes]);
        const metaLookupByViewId = await getMeta({
            dataSources,
            dataSource,
            visibleCols,
            geoid,
            dataPath,
            options,
            groupBy,
            fn,
            notNull,
            geoAttribute,
            disasterNumber,
            disasterNumberCol,
            columns: tmpColumns
        }, falcor);

        //console.log('got meta:', metaLookupByViewId)
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
            disasterNumberCol,
            metaLookupByViewId,
            columns: tmpColumns
        }, falcor);

        tmpData = (tmpData || data).filter(row =>
            row.totalRow ||
            !Object.keys(filterValue || {}).length ||
            Object.keys(filterValue)
                .reduce((acc, col) => {
                    const value = getNestedValue(row[col]);
                    return acc && value?.toString().toLowerCase().includes(filterValue[col]?.toLowerCase())
                }, true)
        );
        // console.log('data?', showTotal, tmpData, filterValue)
        addTotalRow({
            showTotal,
            data: tmpData,
            columns: tmpColumns,
            filterValue,
            setLoading: () => {}});
    } else{
        tmpColumns = visibleCols
            .map(c => metadata.find(md => md.name === c))
            .filter(c => c)
            .map(col => {
                return {
                    Header: customColName?.[col.name] || col?.display_name || col?.name,
                    accessor: fn?.[col?.name] || col?.name,
                    align: colJustify?.[col?.name] || col?.align || getDefaultJustify(col?.type),
                    width: colSizes?.[col.name] || '15%',
                    minWidth: colSizes?.[col.name] || '15%',
                    maxWidth: colSizes?.[col.name] || '15%',
                    filter: col?.filter || filters?.[col?.name],
                    extFilter: extFilterCols?.includes(fn?.[col?.name] || col?.name),
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
        customColName, linkCols, openOutCols, showCsvDownload, additionalVariables
    }
}