import React, {useEffect, useId, useState} from "react"
import {Select} from '~/modules/avl-components/src'
import {isJson} from "~/utils/macros.jsx";
import {RenderCalloutBox} from "./components/RenderCalloutBox.jsx";
import {ButtonSelector} from "../shared/buttonSelector.jsx";
import { dmsDataTypes } from "~/modules/dms/src"
import get from "lodash/get.js";
import {pgEnv} from "~/utils/";
import {useFalcor} from "~/modules/avl-falcor/index.jsx";
import {Loading} from "~/utils/loading.jsx";
import VersionSelectorSearchable from "../shared/versionSelector/searchable.jsx";
import {RenderColumnControls} from "../shared/columnControls.jsx";
import GeographySearch from "../shared/geographySearch.jsx";

async function getData({pgEnv, geoid, dataSource, version, geoAttribute, visibleCols, id, bgColor,
                           columnHeader, columnColors}, falcor) {
    const lenPath = options => ['dama', pgEnv, 'viewsbyId', version, 'options', options, 'length'];
    const dataPath = options => ['dama', pgEnv, 'viewsbyId', version, 'options', options, 'databyIndex'];
    const attributionPath = ['dama', pgEnv, 'views', 'byId', version, 'attributes'],
        attributionAttributes = ['source_id', 'view_id', 'version', '_modified_timestamp'];
    const options = ({geoAttribute, geoid}) => JSON.stringify({
        filter: {
            ...geoAttribute && {[geoAttribute]: [geoid]},
        }
    });
    
    await falcor.get(lenPath(options({geoAttribute, geoid})));
    // const len = Math.min(
    //     get(falcor.getCache(), lenPath(options({geoAttribute, geoid})), 0),
    //     1);
    const len = 1 // can only display one

    await falcor.get(
        [...dataPath(options({geoAttribute, geoid})),
            {from: 0, to: len - 1}, visibleCols]);
    await falcor.get([...attributionPath, attributionAttributes]);

    const textToSave = visibleCols.map(vc =>{
        let val = Object.values(
            get(falcor.getCache(), dataPath(options({geoAttribute, geoid})), {})
        )[0]?.[vc] || ''
        return {
            text: val,
            header: columnHeader?.[vc],
            color: columnColors?.[vc]
        }
    }).filter(val => val.text && val?.text?.trim()?.toLowerCase() !== 'null');

    return {
        id: id + 1,
        bgColor,
        text: convertToEditorText(textToSave),
        hideSection: !textToSave?.length,
        geoAttribute,
        geoid,
        visibleCols,
        pgEnv,
        dataSource,
        version,
        columnHeader,
        columnColors
    }
}
const convertToEditorText = text => ({
    root: {
        "children": text.map(t => ({
            "children": [
                {
                    "detail": 0,
                    "format": 0,
                    "mode": "normal",
                    ...t?.color && {"style": `color: ${t.color?.text};background-color: ${t.color?.bg};padding: 4px 12px;border: 1px solid;border-color: #60a5fa;border-radius: 8px;`},
                    "text": t.text,
                    "type": 'text',
                    "version": 1
                },
                {
                    "detail": 0,
                    "format": 0,
                    "mode": "normal",
                    "text": '\n\n',
                    "type": 'text',
                    "version": 1
                }
            ],
            "direction": "ltr",
            "format": "",
            "indent": 0,
            "type": t.header ? 'heading' : "paragraph",
            "tag": t.header ? t.header : '',
            "version": 1
        })),
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "type": "root",
        "version": 1
    }
})
const RenderColorPicker = ({title, className, color, setColor}) => (
    <div className={className}>
        <label className={'shrink-0 pr-2 w-1/4'}>{title}</label>
        <input id={'background'} list="colors"
               className={'rounded-md shrink'}
               type={'color'} value={color} onChange={e => setColor(e.target.value)}/>
        <datalist id="colors">
            {
                [
                    // blues
                    '#1e3a8a', '#1e40af', '#1d4ed8', '#2563eb', '#3b82f6','#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff',

                    // yellows
                    '#713f12', '#854d0e', '#a16207', '#ca8a04', '#eab308', '#facc15', '#fde047', '#fef08a', '#fef9c3', '#fefce8',


                ].map(c => <option>{c}</option>)
            }
        </datalist>
    </div>
)

const Edit = ({value, onChange}) => {
    const {falcor, falcorCache} = useFalcor();
    const [id, setId] = useState(1);
    const cachedData = value && isJson(value) ? JSON.parse(value) : {}
    const emptyTextBlock = {text: '', size: '4xl', color: '000000'};
    const [bgColor, setBgColor] = useState(cachedData?.bgColor || 'rgba(0,0,0,0)');
    const [text, setText] = useState(cachedData?.text || value || emptyTextBlock);

    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(cachedData?.status);
    const [dataSources, setDataSources] = useState(cachedData?.dataSources || []);
    const [dataSource, setDataSource] = useState(cachedData?.dataSource);
    const [version, setVersion] = useState(cachedData?.version || 857);
    const [geoAttribute, setGeoAttribute] = useState(cachedData?.geoAttribute || 'county');
    const [geoid, setGeoid] = useState(cachedData?.geoid || '36001');
    const [visibleCols, setVisibleCols] = useState(cachedData?.visibleCols || []);
    const [columnHeader, setColumnHeader] = useState(cachedData?.columnHeader || {});
    const [columnColors, setColumnColors] = useState(cachedData?.columnColors || {});

    useEffect(() => {
        async function getData() {
            setLoading(true);
            setStatus(undefined);

            const category = 'Cenrep';
            const dataSourceByCategoryPath = ['dama', pgEnv, 'sources', 'byCategory', category];

            // fetch data sources from categories that match passed prop
            await falcor.get(dataSourceByCategoryPath);
            setDataSources(get(falcor.getCache(), [...dataSourceByCategoryPath, 'value'], []))
            // fetch columns, data

            setLoading(false);

        }

        getData()
    }, []);

    useEffect(() => {
        const geoAttribute =
            (dataSources
                .find(ds => ds.source_id === dataSource)?.metadata?.columns || [])
                .find(c => c.display === 'geoid-variable');
        geoAttribute?.name && setGeoAttribute(geoAttribute?.name);
    }, [dataSources, dataSource]);

    const LexicalComp = dmsDataTypes.lexical.EditComp;

    useEffect(() => {
        async function load(){
            if(!version || !dataSource) {
                !dataSource && setStatus('Please select a Datasource.');
                !version && setStatus('Please select a version.');

                setLoading(false);
                return;
            }

            setLoading(true);
            setStatus(undefined);

            const data = await getData({
                pgEnv, geoid, dataSource, version, geoAttribute, visibleCols, id, bgColor,
                columnHeader, columnColors
            }, falcor);

            setId(data.id);
            setText(data.text);
            onChange(JSON.stringify({
                ...data,
            }));

            setLoading(false);
        }

        load()
    }, [dataSource, version, geoid, geoAttribute, visibleCols, bgColor, columnHeader, columnColors]);

    return (
        <div className='w-full'>
            <div className='relative'>
                <div className={'border rounded-md border-blue-500 bg-blue-50 p-2 m-1'}>
                    Edit Controls
                    <div className={`flex justify-between`}>
                        <label
                            className={`shrink-0 pr-2 py-1 my-1 w-1/4`}
                        >
                            Data Source:
                        </label>
                        <select
                            className={`bg-white w-full pl-3 rounded-md my-1`}
                            value={dataSource}
                            onChange={e => {
                                setVisibleCols([])
                                setGeoAttribute(undefined)
                                setDataSource(+e.target.value);
                            } }
                        >
                            <option key={'undefined'} value={undefined} selected disabled>Please select a data source</option>
                            {
                                dataSources.map(ds => <option key={ds.source_id} value={ds.source_id}> {ds.name} </option>)
                            }
                        </select>
                    </div>
                    <VersionSelectorSearchable
                        source_id={dataSource}
                        view_id={version}
                        onChange={setVersion}
                        className={'flex-row-reverse'}
                    />
                    <GeographySearch value={geoid} onChange={setGeoid} className={'flex-row-reverse'}/>

                    <RenderColorPicker title={'Background: '}
                                       className={'w-full flex flex-row text-sm items-center'}
                                       color={bgColor} setColor={setBgColor}/>

                    <RenderColumnControls
                        cols={
                            (dataSources.find(ds => ds.source_id === dataSource)?.metadata?.columns || [])
                                .filter(c => ['data-variable', 'meta-variable', 'geoid-variable'].includes(c.display))
                                .map(c => c.name)
                        }
                        metadata={dataSources.find(ds => ds.source_id === dataSource)?.metadata?.columns || []}
                        // anchorCols={anchorCols}
                        visibleCols={visibleCols}
                        setVisibleCols={setVisibleCols}
                        columnHeader={columnHeader}
                        setColumnHeader={setColumnHeader}
                        columnColors={columnColors}
                        setColumnColors={setColumnColors}
                    />
                </div>
                {
                    loading ? <Loading/> :
                        status ? status :
                            <LexicalComp value={text}
                                         onChange={onChange}
                                         bgColor={bgColor}
                                         id={id}
                                         key={id}
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
    if (!value) return ''
    let data = typeof value === 'object' ?
        value['element-data'] :
        JSON.parse(value)
    const dataOrValue = data?.text || value;

    if(!dataOrValue ||
        (dataOrValue?.root?.children?.length === 1 && dataOrValue?.root?.children?.[0]?.children?.length === 0) ||
        (dataOrValue?.root?.children?.length === 0)
    ) return null;

    const LexicalComp = dmsDataTypes.lexical.ViewComp;
    return (
        <div>
            <LexicalComp value={dataOrValue} bgColor={data?.bgColor} />
        </div>
    )
}


export default {
    "name": 'Data Text Box',
    "variables": [
        // pgEnv, geoid, version, geoAttribute, visibleCols, id, bgColor
        {
            name: 'pgEnv',
            default: 'hazmit_dms',
            hidden: true
        },
        {
            name: 'geoid',
            default: '36001',
        },
        {
            name: 'dataSource',
            hidden: true
        },
        {
            name: 'version',
            hidden: true
        },
        {
            name: 'geoAttribute',
            hidden: true
        },
        {
            name: 'visibleCols',
            default: [],
            hidden: true
        },
        {
            name: 'columnHeader',
            default: [],
            hidden: true
        },
        {
            name: 'columnColors',
            default: [],
            hidden: true
        },
        {
            name: 'bgColor',
            default: 'rgba(0,0,0,0)',
            hidden: true
        },
    ],
    getData,
    "EditComp": Edit,
    "ViewComp": View
}