import get from "lodash/get.js";
import {getNestedValue} from "../../utils/getNestedValue.js";
import {parseJson} from "./parseJson.js";
import {handleExpandableRows} from "./handleExpandableRows.js";

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

