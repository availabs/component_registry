import React, {useEffect, useMemo, useState} from "react";
import { useFalcor } from '~/modules/avl-falcor';
import { isJson } from "~/utils/macros.jsx";
import { RenderCensusLineChart } from "./components/RenderCensusLineChart.jsx";
import GeographySearch from "../shared/geographySearch.jsx";
import { Loading } from "~/utils/loading.jsx";
import {getCensusKeyLabel, processBaseConfig} from "../utils/graphConfig/utils.js";
import BASE_GRAPH_CONFIG from '../utils/graphConfig/'
import {ButtonSelector} from "../shared/buttonSelector.jsx";
import {get} from "lodash";
import {range} from '~/utils/macros'
function processConfig(geoid, category) {
    //get you census variables/keys you pass to the comp
    const CONFIG = { [category]: BASE_GRAPH_CONFIG[category] };
    return processBaseConfig(CONFIG, {geoid: {length: geoid?.toString()?.length}})[category];
}

function processGeoid(geoid, props) {
    const {censusKeys=[], divisorKeys=[], subtractKeys=[]} = props;

    return censusKeys.map((censusKey,index) => {
        return {
            "id": `${ geoid }-${ censusKey }`,
            geoid,
            censusKey,
            "title": props.title,
            "data" : props.years.reduce((accum, year) => {
                let value = get(props, `acs[${ geoid }][${ year }][${ censusKey }]`, -666666666);

                if (value === -666666666) return accum;

                let sub = 0;

                if (censusKeys.length === 1) {
                    sub = subtractKeys.reduce((a, c) => {
                        const v = get(props, ["acs", geoid, year, c], -666666666);
                        return v === -666666666 ? a : a + v;
                    }, 0)
                }
                else {
                    sub = get(props, `acs[${ geoid }][${year}][${subtractKeys[index]}]`, 0);
                }

                if (!isNaN(sub)) {
                    value -= +sub;
                }

                if (props.sumType === 'pct') {
                    const divisor = get(props, `acs[${ geoid }][${year}][${divisorKeys[index]}]`, 1);
                    if ((divisor !== null) && !isNaN(divisor)) {
                        value = value / divisor;
                    }
                }

                accum.push({
                    x: +year,
                    y: value
                })
                return accum;
            }, [])
        }
    })
}

async function getData ({geoid, category, title}, falcor) {
    const graph_config = processConfig(geoid, category).filter(c => c.type === 'CensusLineChart').find(c => c.title === title);

    if(!graph_config) {
        console.log('config', graph_config, title, processConfig(geoid, category))
        return {}
    }

    const {censusKeys=[], divisorKeys=[], subtractKeys=[], sumType} = graph_config;
    const compareYear = 2016
    const year = 2021
    const years = range(2010, 2021, 1)
    let compareGeoid;
    
    await falcor.get(
        ['acs',
            [geoid, compareGeoid].filter(Boolean),
            years,
            [...censusKeys, ...divisorKeys, ...subtractKeys]
        ],
        ["acs", "meta", [...censusKeys, ...divisorKeys, ...subtractKeys], "label"]
    )


    const data = processGeoid(geoid, {...graph_config, ...falcor.getCache(), geoids: [geoid], years})
    const acsGraph = falcor.getCache()?.acs;

    return {
        geoid,
        year,
        data: data.map(d => ({
                                    ...d,
                                    id: graph_config?.censusKeyLabels?.[d.id.split('-')[1]] ||
                                              getCensusKeyLabel(d.id.split('-')[1], acsGraph) ||
                                                d.id
                                    })),
        title,
        category,
        sumType
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
        const titles = processConfig(geoid, category).filter(c => c.type === 'CensusLineChart').map(c => c.title);
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
                        types={Object.keys(BASE_GRAPH_CONFIG).filter(configKey => BASE_GRAPH_CONFIG[configKey].find(c => c.type === 'CensusLineChart'))}
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
                    <RenderCensusLineChart
                        title={cachedData.title}
                        geoid={geoid}
                        data={cachedData.data}
                        year={cachedData.year}
                        compareYear={cachedData.compareYear}
                        sumType={cachedData.sumType}
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
                    <RenderCensusLineChart {...data} baseUrl={'/'}/>
            }
        </div>
    )           
}


export default {
    "name": 'Graph: Census Line',
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