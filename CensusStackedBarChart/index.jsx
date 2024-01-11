import React, {useEffect, useMemo, useState} from "react";
import { useFalcor } from '~/modules/avl-falcor';
import { isJson } from "~/utils/macros.jsx";
import { RenderCensusStackedBarChart } from "./components/RenderCensusStackedBarChart.jsx";
import GeographySearch from "../shared/geographySearch.jsx";
import { Loading } from "~/utils/loading.jsx";
import {getCensusKeyLabel, processBaseConfig} from "../utils/graphConfig/utils.js";
import BASE_GRAPH_CONFIG from '../utils/graphConfig/'
import {ButtonSelector} from "../shared/buttonSelector.jsx";
import {get} from "lodash";
import {range} from "~/utils/macros"
function processConfig(geoid, category) {
    //get you census variables/keys you pass to the comp
    const CONFIG = { [category]: BASE_GRAPH_CONFIG[category] };
    return processBaseConfig(CONFIG, {geoid: {length: geoid?.toString()?.length}})[category];
}
const getBarData = (state, props) => {

    const [geoid] = props.geoids;

    let barData = [], keys = [];
    if (props.stackByYear && props.stacks) {
        const years = props.years;

        keys = props.stacks.map((s, i) => `key-${ i }`);

        barData = years.map(year => {
            const bar = {
                index: String(year),
                keyMap: {},
                ckMap: {},
                colorMap: {}
            }
            return props.stacks.reduce((a, c, i) => {
                const value = +get(state, ["acs", geoid, year, c.censusKey], -666666666);

                if (value !== -666666666) {
                    const key = `key-${ i }`;
                    a[key] = value;
                    a.keyMap[key] = c.title;
                    a.ckMap[key] = c.censusKey;
                    a.colorMap[key] = c.color || DEFAULT_COLORS[i]
                }
                return a;
            }, bar)
        })
    }
    else {
        const year = get(props, "year", 2017);

        let numKeys = 0;

        barData = get(props, "bars", [])
            .map(bar => {
                numKeys = Math.max(numKeys, bar.stacks.length);

                const data = {
                    index: bar.title,
                    keyMap: {},
                    ckMap: {},
                    colorMap: {}
                }
                return bar.stacks.reduce((a, c, i) => {
                    const value = +get(state, ["acs", geoid, year, c.censusKey], -666666666);

                    if (value !== -666666666) {
                        const key = `key-${ i }`;
                        a[key] = value;
                        a.keyMap[key] = c.title;
                        a.ckMap[key] = c.censusKey;
                        a.colorMap[key] = c.color || bar.color || DEFAULT_COLORS[i]
                    }
                    return a;
                }, data);
            });

        for (let n = 0; n < numKeys; ++n) {
            keys.push(`key-${ n }`);
        }

        barData.sort((a, b) => {
            const [aTotal, bTotal] = keys.reduce((aa, c) => {
                return [
                    aa[0] + get(a, c, 0),
                    aa[1] + get(b, c, 0)
                ]
            }, [0, 0]);
            return aTotal - bTotal;
        })

    }

    return { barData, keys };
}
async function getData ({geoid, category, title}, falcor) {
    const graph_config = processConfig(geoid, category).filter(c => c.type === 'CensusStackedBarChart').find(c => c.title === title);
    if(!graph_config) {
        console.log('config', title, processConfig(geoid, category))
        return {}
    }
    const {
        censusKeys=[],
        censusKeysMoE=[],
        divisorKeys=[],
        divisorKeysMoE=[],
        subtractKeys=[],
        groupBy
    } = graph_config;

    const years = range(2010, 2021, 1);

    let compareGeoid;
    
    await falcor.get(
        ['acs',
            [geoid, compareGeoid].filter(Boolean),
            years,
            [...censusKeys, ...censusKeysMoE, ...divisorKeys, ...divisorKeysMoE, ...subtractKeys]
        ],

        ["acs", "meta", [...censusKeys, ...divisorKeys], "label"]

    )


    const {barData, keys} = getBarData(falcor.getCache(), {...graph_config, geoids: [geoid], years})

    const acsGraph = falcor.getCache()?.acs;

    return {
        geoid,
        data: barData,
            // .map(d => ({...d, id: graph_config?.censusKeyLabels?.[d.id.split('-')[1]] ||
            //     getCensusKeyLabel(d.id.split('-')[1], acsGraph) ||
            //     d.id})),
        keys,
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
    const [category, setCategory] = useState(cachedData.category || 'Economy');
    const [titles, setTitles] = useState([]);
    const [title, setTitle] = useState(cachedData.title || 'Industries by civilian employed population 16 years and over')

    useEffect(() => {
        const titles = processConfig(geoid, category).filter(c => c.type === 'CensusStackedBarChart').map(c => c.title);
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
                        types={Object.keys(BASE_GRAPH_CONFIG).filter(configKey => BASE_GRAPH_CONFIG[configKey].find(c => c.type === 'CensusStackedBarChart'))}
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
                    <RenderCensusStackedBarChart
                        title={cachedData.title}
                        geoid={geoid}
                        data={cachedData.data}
                        keys={cachedData.keys}
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
                    <RenderCensusStackedBarChart {...data} baseUrl={'/'}/>
            }
        </div>
    )           
}


export default {
    "name": 'Graph: Census Stacked Bar',
    "type": 'Graph',
    "variables": [
        {
            name: 'geoid',
            default: '36'
        },
        {
            name: 'category',
            default: 'Economy',
            hidden: true
        },
        {
            name: 'title',
            default: 'Industries by civilian employed population 16 years and over',
            hidden: true
        }
    ],
    getData,
    "EditComp": Edit,
    "ViewComp": View
}