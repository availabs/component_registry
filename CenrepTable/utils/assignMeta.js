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
                        geoAttribute,
                        geoid, disasterNumber, disasterNumberCol,
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
            Object.values(get(falcorCache, dataPath(options({groupBy, notNull, geoAttribute, geoid, disasterNumber, disasterNumberCol})), {}))
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
            fn,
            disasterNumber,
            disasterNumberCol
        )
    }

    return handleExpandableRows(
        Object.values(get(falcorCache, dataPath(options({groupBy, notNull, geoAttribute, geoid, disasterNumber, disasterNumberCol})), {})),
        columns,
        fn,
        disasterNumber,
        disasterNumberCol
    )

}

const handleExpandableRows = (data, columns, fn, disasterNumber, disasterNumberCol) => {
    const expandableColumns = columns.filter(c => c.openOut);
    // if disaster number is being used to filter data, it should be in visible columns. Hide it if not needed.
    // console.log('handling exp rows')
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
                (disasterNumber && row[disasterNumberCol] && typeof row[disasterNumberCol] !== 'object' &&
                    row[disasterNumberCol]?.toString()?.includes(disasterNumber))
            );
        return newData;
    } else {
        return data.filter(row => {
                return !disasterNumber || !row[disasterNumberCol] ||
                    (disasterNumber && row[disasterNumberCol] && typeof row[disasterNumberCol] !== 'object' &&
                        row[disasterNumberCol]?.toString()?.includes(disasterNumber))
            }
        )
    }
}