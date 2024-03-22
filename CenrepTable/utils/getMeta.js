import get from "lodash/get.js";
import {cleanColName} from "./cleanColName.js";
import {parseJson} from "./parseJson.js";
import {pgEnv} from "~/utils";

export async function getMeta({
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
                           columns
                       }, falcor){
    const metadata = (dataSources || []).find(ds => ds.source_id === dataSource)?.metadata?.columns;
    const metaViewIdLookupCols =
        metadata?.filter(md => visibleCols.includes(md.name) && ['meta-variable', 'geoid-variable'].includes(md.display) && md.meta_lookup);

    if(metaViewIdLookupCols?.length){
        const falcorCache = falcor.getCache();
        const fetchedData = Object.values(get(falcorCache, dataPath(options({groupBy, notNull, geoAttribute, geoid, disasterNumber, disasterNumberCol})), {}));
        if(!fetchedData?.length) return {};

        const cachedUniqueValues = metaViewIdLookupCols.reduce((acc, curr) => {
            const currentColName = fn[curr.name] || curr.name;
            const {formatValuesToMap = 'none'} = parseJson(curr.meta_lookup);
            const mapFn = {
                parseInt: e => parseInt(e),
                none: e => e
            }

            acc[cleanColName(currentColName)] = [
                ...new Set(
                    fetchedData.map(fd => fd[currentColName])
                        .filter(fd => !(fd['$type'] === 'atom' && !fd.value)) // filtering nulls
                        .reduce((acc, fd) => {
                            return fd?.includes(',') ? [...acc, ...fd.split(',').map(f => mapFn[formatValuesToMap](f.trim()))] : [...acc, mapFn[formatValuesToMap](fd)]
                        } , [])
                ) // split on comma?
            ].filter(d => d);
            return acc

        }, {})
        // console.log('cd?', Object.keys(cachedUniqueValues), cachedUniqueValues)
        // console.log('getting meta', metaViewIdLookupCols, metaViewIdLookupCols.map(md => parseJson(md.meta_lookup)))
        const data =
            await metaViewIdLookupCols
                .filter(md => parseJson(md.meta_lookup)?.view_id)
                .reduce(async (acc, md) => {
                    // console.log('md', md)
                    const prev = await acc;

                    const currentColName = fn[md.name] || md.name;
                    const metaLookup = parseJson(md.meta_lookup);
                    // console.log('metaLookup', metaLookup)
                    const {
                        attributes, // to fetch from meta table
                        geoAttribute, // if passed, apply geoid filter on data
                        filterAttribute,  // if passed, use this column name instead of md.name to filtered using cached uniq data
                        formatValuesToMap, // format values before pulling meta for them. Mainly used for SBA Disaster numbers. 1335DR doesn't match to integer 1335
                        keyAttribute, // used to assign key for meta object to return
                        valueAttribute, // not used here, but if passed, use this column name to get labels of meta ids
                        view_id, // view id of the meta table
                        filter, // filter
                        aggregatedLen // if grouping by, true
                    } = metaLookup;

                    const options = JSON.stringify({
                        aggregatedLen,
                        filter: {
                            ...cachedUniqueValues?.[cleanColName(md.name)]?.length && {[filterAttribute || cleanColName(md.name)]: cachedUniqueValues?.[cleanColName(md.name)]}, // use md.name to fetch correct meta
                            ...geoAttribute && geoid?.toString()?.length && {[`substring(${geoAttribute}::text, 1, ${geoid?.toString()?.length})`]: [geoid]},
                            ...(filter || {})
                        }
                    });

                    const lenPath = ['dama', pgEnv, 'viewsbyId', view_id, 'options', options, 'length'];

                    const lenRes = await falcor.get(lenPath);
                    const len = get(lenRes, ['json', ...lenPath], 0);
                    // console.log('got len', lenPath)
                    if(!len) return Promise.resolve();

                    const dataPath = ['dama', pgEnv, 'viewsbyId', view_id, 'options', options, 'databyIndex'];
                    await falcor.chunk([...dataPath, {from: 0, to: len - 1}, attributes]);
                    // console.log('got data', Object.values(get(dataRes, ['json', ...dataPath], {})), keyAttribute)
                    const data = Object.values(get(falcor.getCache(), dataPath, {}))
                        .reduce((acc, d) => {
                            acc[d[keyAttribute]] = {...attributes.reduce((acc, attr) => ({...acc, ...{[attr]: d[attr]}}), {})}
                            return acc;
                        }, {})
                    // console.log('returning data', data)


                    prev[currentColName] = data;
                    return prev
                    // return {...prev, ...{[currentColName]: data}}; // use fn name to assign data properly in next step
                }, {});
        // setMetaLookupByViewId(data)
        // console.log('got meta', data)
        return data;
    }
    //console.log('<getMeta> returning {}')
    // console.log('<getMeta> returning {}')
    return {}
}