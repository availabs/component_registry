import get from "lodash/get.js";
import {getNestedValue} from "../../FormsTable/utils.js";
import {parseJson} from "./parseJson.js";

const assign = (originalValue, newValue, keepId) => keepId ? `${newValue} (${originalValue})` : newValue;

export const assignMeta = ({
                        metadata,
                        visibleCols,
                        dataPath,
                        options,
                        groupBy,
                        fn,
                        notNull,
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
        //console.log('in if <assignMeta>',)
        return handleExpandableRows(
            Object.values(get(falcorCache, dataPath(options({groupBy, notNull})), {}))
                .map(row => {
                    metaLookupCols.forEach(mdC => {

                        const currentMetaLookup = parseJson(mdC.meta_lookup);
                        const currentColName = fn[mdC.name] || mdC.name;
                        const {keepId, valueAttribute = 'name'} = currentMetaLookup;
                        //console.log('assigning meta', mdC.name, currentColName, row, metaLookupByViewId)


                        if(currentMetaLookup?.view_id){
                            const currentViewIdLookup = metaLookupByViewId?.[currentColName] || [];
                            const currentKeys = row[currentColName];
                            if(typeof currentKeys === 'string' && currentKeys?.includes(',')){
                                row[currentColName] = currentKeys.split(',').map(ck => assign(ck.trim(), currentViewIdLookup[ck.trim()]?.[valueAttribute] || ck.trim(), keepId)).join(', ')
                            }else{
                                row[currentColName] = assign(currentKeys, currentViewIdLookup[currentKeys]?.[valueAttribute] || currentKeys, keepId);
                            }
                        }else{
                            const currentKeys = row[currentColName];
                            if(typeof currentKeys === 'string' && currentKeys?.includes(',')){
                                row[currentColName] = currentKeys.split(',').map(ck => assign(ck.trim(), currentMetaLookup[ck.trim()] || ck.trim(), keepId)).join(', ')
                            }else{
                                row[currentColName] = assign(row[currentColName], currentMetaLookup[row[currentColName]] || row[currentColName], keepId);
                            }

                        }
                    })
                    return row;
                }),
            columns,
            fn
        )
    }

    return handleExpandableRows(
        Object.values(get(falcorCache, dataPath(options({groupBy, notNull})), {})),
        columns,
        fn
    )

}

const handleExpandableRows = (data, columns, fn) => {
    const expandableColumns = columns.filter(c => c.openOut);
    if (expandableColumns?.length) {
        const newData = data.map(row => {
            const newRow = {...row}
            newRow.expand = []
            newRow.expand.push(
                ...expandableColumns
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
        return newData;
    } else {
        return data
    }
}