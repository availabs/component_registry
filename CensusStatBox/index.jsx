import React, {useEffect, useMemo, useState} from "react";
import { useFalcor } from '~/modules/avl-falcor';
import { isJson } from "~/utils/macros.jsx";
import { RenderCensusStats } from "./components/RenderCensusStats.jsx";
import GeographySearch from "../shared/geographySearch.jsx";
import { Loading } from "~/utils/loading.jsx";
import {processBaseConfig} from "../utils/graphConfig/utils.js";
import BASE_GRAPH_CONFIG from '../utils/graphConfig/'
import {ButtonSelector} from "../shared/buttonSelector.jsx";
import {get} from "lodash";

function processConfig(geoid, category) {
    //get you census variables/keys you pass to the comp
    const CONFIG = { [category]: BASE_GRAPH_CONFIG[category] };
    return processBaseConfig(CONFIG, {geoid: {length: geoid?.toString()?.length}})[category];
}

function calculateValues(graph, censusKeys, subtractKeys, sumType, divisorKeys, year, compareYear, geoids){
    const getValue = (g, y, c) => {
        const v = get(graph, ["acs", g, y, c], -666666666);
        return v === -666666666 ? 0 : v;
    }

    let value = geoids.reduce((a, c) =>
            a + censusKeys.reduce((aa, cc) =>
                    aa + getValue(c, year, cc)
                , 0)
        , 0)
    const sub = geoids.reduce((a, c) =>
            a + subtractKeys.reduce((aa, cc) =>
                    aa + getValue(c, year, cc)
                , 0)
        , 0)

    value -= sub;

    if(sumType === 'avg') {
        value /= geoids.length
    } else if (sumType === 'pct') {
        let divisorValue = geoids.reduce((a, c) =>
                a + divisorKeys.reduce((aa, cc) =>
                        aa + getValue(c, year, cc)
                    , 0)
            , 0)

        value /= divisorValue
        value *= 100
    }


    if(!value) {
        return {value: '', change: ''}
    }

    let change = 0
    if(compareYear) {
        let compareValue = geoids.reduce((a, c) =>
                a + censusKeys.reduce((aa, cc) =>
                        aa + getValue(c, compareYear, cc)
                    , 0)
            , 0)
        let sub = geoids.reduce((a, c) =>
                a + subtractKeys.reduce((aa, cc) =>
                        aa + getValue(c, compareYear, cc)
                    , 0)
            , 0)
        compareValue -= sub;

        if (sumType === 'pct') {
            let divisorValue = geoids.reduce((a, c) =>
                    a + divisorKeys.reduce((aa, cc) =>
                            aa + getValue(c, year, cc)
                        , 0)
                , 0)

            compareValue /= divisorValue
            compareValue *= 100
        }

        change = (((value - compareValue) / compareValue) * 100)
        change = isNaN(change) ? 0 : +change.toFixed(2);
    }

    return {
        value,
        change
    }
}

async function getData ({geoid, category, title}, falcor) {
    const graph_config = processConfig(geoid, category).filter(c => c.type === 'CensusStatBox').find(c => c.title === title);
    if(!graph_config) {
        console.log('config', title, processConfig(geoid, category).filter(c => c.type === 'CensusStatBox'))
        return {}
    }
    const {
        censusKeys=[],
        divisorKeys=[],
        subtractKeys=[],
        sumType,
        invertColors,
        valuePrefix,
        valueSuffix,
        maximumFractionDigits
    } = graph_config;

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

    const {value, change} = calculateValues(falcor.getCache(), censusKeys, subtractKeys, sumType, divisorKeys, year, compareYear, [geoid]);

    return {
        geoid,
        value,
        change,
        year,
        compareYear,
        title,
        category,
        invertColors,
        valuePrefix,
        valueSuffix,
        maximumFractionDigits
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
    const [title, setTitle] = useState(cachedData.title || 'Total Housing Units')

    useEffect(() => {
        const titles = processConfig(geoid, category).filter(c => c.type === 'CensusStatBox').map(c => c.title);
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
                        types={Object.keys(BASE_GRAPH_CONFIG).filter(configKey => BASE_GRAPH_CONFIG[configKey].find(c => c.type === 'CensusStatBox'))}
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
                    <RenderCensusStats
                        title={title}
                        value={cachedData.value}
                        change={cachedData.change}
                        year={cachedData.year}
                        compareYear={cachedData.compareYear}
                        invertColors={cachedData.invertColors}
                        valuePrefix={cachedData.valuePrefix}
                        valueSuffix={cachedData.valueSuffix}
                        maximumFractionDigits={cachedData.maximumFractionDigits}
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
                    <RenderCensusStats {...data} baseUrl={'/'}/>
            }
        </div>
    )           
}


export default {
    "name": 'Card: Census',
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
            default: 'Total Housing Units',
            hidden: true
        }
    ],
    getData,
    "EditComp": Edit,
    "ViewComp": View
}