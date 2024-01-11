import React, {useEffect, useMemo, useState} from "react";
import { useFalcor } from '~/modules/avl-falcor';
import { isJson } from "~/utils/macros.jsx";
import { RenderCensusBarChart } from "./components/RenderCensusBarChart.jsx";
import GeographySearch from "../shared/geographySearch.jsx";
import { Loading } from "~/utils/loading.jsx";
import {getCensusKeyLabel, processBaseConfig} from "../utils/graphConfig/utils.js";
import BASE_GRAPH_CONFIG from '../utils/graphConfig/'
import {ButtonSelector} from "../shared/buttonSelector.jsx";
import {get} from "lodash";

function processConfig(geoid, category) {
    //get you census variables/keys you pass to the comp
    const CONFIG = { [category]: BASE_GRAPH_CONFIG[category] };
    return processBaseConfig(CONFIG, {geoid: {length: geoid?.toString()?.length}})[category];
}

const groupByCensusKeys = (state, props) =>
    props.censusKeys.reduce((a, c) => {
        a.push(
            [...props.geoids, props.compareGeoid].filter(geoid => Boolean(geoid))
                .reduce((aa, cc, ii) => {
                    const year = get(props, "year", 2017),
                        value = +get(state, ["acs", cc, year, c], -666666666);
                    if (value !== -666666666) {
                        aa[cc] = value;
                        ++aa.num;
                    }
                    return aa;
                }, { id: c, num: 0 })
        );
        return a;
    }, [])
        .filter(d => d.num > 0);
const groupByGeoids = (state, props) =>
    [...props.geoids, props.compareGeoid].filter(geoid => Boolean(geoid))
        .reduce((a, c) => {
            const divisorKeys = get(props, "divisorKeys", []),
                subtractKeys = get(props, "subtractKeys", []);
            if (divisorKeys.length || subtractKeys.length) {
                let value = props.censusKeys.reduce((aa, cc, ii) => {
                    const year = get(props, "year", 2017),
                        value = +get(state, ["acs", c, year, cc], 0);
                    if (value !== -666666666) {
                        aa += value;
                    }
                    return aa;
                }, 0);
                const sub = subtractKeys.reduce((aa, cc, ii) => {
                    const year = get(props, "year", 2017),
                        value = +get(state, ["acs", c, year, cc], 0);
                    if (value !== -666666666) {
                        aa += value;
                    }
                    return aa;
                }, 0);
                value -= sub;

                const divisor = divisorKeys.reduce((aa, cc, ii) => {
                    const year = get(props, "year", 2017),
                        value = +get(state, ["acs", c, year, cc], 0);
                    if (value !== -666666666) {
                        aa += value;
                    }
                    return aa;
                }, 0)
                a.push({
                    id: c,
                    value: divisor === 0 ? value : value / divisor,
                    num: 1,
                    geoid: c
                })
            }
            else {
                a.push(
                    props.censusKeys.reduce((aa, cc, ii) => {
                        const year = get(props, "year", 2017),
                            value = +get(state, ["acs", c, year, cc], 0);
                        if (value !== -666666666) {
                            aa[cc] = value;
                            ++aa.num;
                        }
                        return aa;
                    }, { id: c, num: 0, geoid: c })
                )
            }
            return a;
        }, [])
        .filter(d => d.num > 0);

const getBarData = (state, props) => {
    if (get(props, "groupBy", "censusKeys") === "censusKeys") {
        return groupByCensusKeys(state, props);
    }
    return groupByGeoids(state, props);
}
async function getData ({geoid, category, title}, falcor) {
    const graph_config = processConfig(geoid, category).filter(c => c.type === 'CensusBarChart').find(c => c.title === title);
    if(!graph_config) {
        console.log('config', title, processConfig(geoid, category))
        return {}
    }
    const {censusKeys=[], divisorKeys=[], subtractKeys=[], groupBy} = graph_config;
    const compareYear = 2016
    const year = 2021
    const years = [year, compareYear]
    let compareGeoid;
    
    await falcor.get(
        ['acs',
            [geoid, compareGeoid].filter(Boolean),
            years,
            [...censusKeys, ...divisorKeys, ...subtractKeys]
        ],
        ["acs", "meta", [...censusKeys, ...divisorKeys, ...subtractKeys], "label"]
    )


    const data = getBarData(falcor.getCache(), {...graph_config, geoids: [geoid], year})
    const acsGraph = falcor.getCache()?.acs;

    return {
        geoid,
        year,
        data: data.map(d => ({...d, id: graph_config?.censusKeyLabels?.[d.id.split('-')[1]] ||
                getCensusKeyLabel(d.id.includes('-') ? d.id.split('-')[1] : d.id, acsGraph) ||
                d.id})),
        title,
        category
        // labels: get(falcor.getCache(), ['acs', 'meta'], {})
    }
}

const Edit = ({value, onChange}) => {
    const { falcor, falcorCache } = useFalcor();

    let cachedData = value && isJson(value) ? JSON.parse(value) : {};
    const baseUrl = '/';

    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(cachedData?.status);
    const [geoid, setGeoid] = useState(cachedData?.geoid || '36');
    const [category, setCategory] = useState(cachedData.category || 'Housing');
    const [titles, setTitles] = useState([]);
    const [title, setTitle] = useState(cachedData.title || 'Percent Homeowners 65 and Older')

    useEffect(() => {
        const titles = processConfig(geoid, category).filter(c => c.type === 'CensusBarChart').map(c => c.title);
        setTitles(titles);
        setTitle(titles.includes(title) ? title : titles[0])
    }, [category, geoid]);

    useEffect( () => {
        async function load(){
            if(!geoid){
                setStatus('Please Select a Geography');
                return Promise.resolve();
            }else{
                setStatus(undefined)
            }
            setLoading(true);
            setStatus(undefined);
            const data = await getData({geoid, category, title}, falcor)
            onChange(JSON.stringify(data))
            setLoading(false);
        }

        load()
    }, [geoid, category, title]);

    return (
        <div className='w-full'>
            <div className='relative'>
                <div className={'border rounded-md border-blue-500 bg-blue-50 p-2 m-1'}>
                    Edit Controls
                    <GeographySearch value={geoid} onChange={setGeoid} className={'flex-row-reverse'} />
                    <ButtonSelector
                        label={'Category:'}
                        type={category}
                        setType={setCategory}
                        types={Object.keys(BASE_GRAPH_CONFIG).filter(configKey => BASE_GRAPH_CONFIG[configKey].find(c => c.type === 'CensusBarChart'))}
                    />
                    <div className={`flex justify-between`}>
                        <label
                            className={`shrink-0 pr-2 py-1 my-1 w-1/4`}
                        >
                            Attribute:
                        </label>
                        <select
                            className={`bg-white w-full pl-3 rounded-md my-1`}
                            onChange={e => setTitle(e.target.value)}
                            value={title}
                        >
                            {
                                titles.map(title => <option key={title} value={title}>{title}</option>)
                            }
                        </select>
                    </div>
                </div>
                {loading ? <Loading /> :
                    status ? <div className={'p-5 text-center'}>{status}</div> :
                    <RenderCensusBarChart
                        title={cachedData.title}
                        geoid={geoid}
                        data={cachedData.data}
                        year={cachedData.year}
                        compareYear={cachedData.compareYear}
                        // labels={cachedData.labels}
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
                    <RenderCensusBarChart {...data} baseUrl={'/'}/>
            }
        </div>
    )           
}


export default {
    "name": 'Graph: Census Bar',
    "type": 'Hero Stats',
    "variables": [
        {
            name: 'geoid',
            default: '36'
        },
        {
            name: 'category',
            default: 'Housing',
            hidden: true
        },
        {
            name: 'title',
            default: 'Percent Homeowners 65 and Older',
            hidden: true
        }
    ],
    getData,
    "EditComp": Edit,
    "ViewComp": View
}