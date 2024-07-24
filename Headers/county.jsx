import React, { useMemo, useState, useEffect }from 'react'
import {ButtonSelector} from "../shared/buttonSelector.jsx";
import {isJson} from "../utils/macros.jsx";
import GeographySearch from "../shared/geographySearch.jsx";
import {EditMap,ViewMap} from "../shared/TemplateMap";


export function Header ({  title = '', bgClass='', subTitle='County Profile', link='#', mapLayer={},}) {
  
  return (
    <div className={`h-[300px] bg-cover bg-center w-full flex border-2 border-blue-500 bg-gradient-to-tl rounded-lg from-blue-400 to-blue-700`}>
      <div className='p-2 h-full w-[250px] pl-8'>
        <ViewMap
            layerProps={{ccl: mapLayer}}
            legend={{show:false}}
        />
      </div>
      <div className='flex-1 flex flex-col  items-center p-4'>
        <div className='flex-1'/>
        <div className='text-3xl sm:text-7xl font-bold text-[#f2a91a] text-right w-full text-display'>
          {title && <div>{title}</div>}
        </div>
        <div className='text-lg tracking-wider pt-2 sm:text-3xl font-bold text-slate-200 text-right w-full uppercase'>
          {subTitle && <div>{subTitle}</div>}
        </div>
        <div className='text-sm tracking-wider sm:text-sm font-bold text-slate-200 text-right w-full uppercase'>
          <i  className='fa fa-arrow-up-right-from-square text-xl' /> <a href={link} target="_blank" className='border-b'>  Local Hazard Mitigation Plan <i  className='fa fa-book' /></a>
        </div>
        <div className='flex-1'/>
      </div>
    </div>
  )
}

function getMapLayer(geoid) {
  geoid = ('' + geoid) // because typescript is for suckers :p
  return {
         sources : [{
          id: "counties",
          source: {
            "type": "vector",
            "url": "https://tiles.availabs.org/data/tiger_carto.json"
          },
        }],
        layers:[{
            "id": "counties",
            "source": "counties",
            "source-layer": "s365_v778",
            "type": "fill",
            "filter" :  ['in', geoid.substring(0,2), ['string', ['get', 'geoid']]],
            
            "paint": {
              "fill-color": [
                'case',
                [
                  'has',
                  ['to-string', ['get', 'geoid']],
                  [
                    'literal',
                    {[geoid]: '#f2a91a'}
                  ]
                ],
                [
                  'get',
                  ['to-string', ['get', 'geoid']],
                  [
                    'literal',
                    {[geoid]: '#f2a91a'}
                  ]
                ],
                '#e1e1e1'
              ]

              // '#ddd', //["get", ["get", "geoid"], ["literal", {[geoid]: 'blue'}]],
            }
          },
          {
            "id": "counties-line",
            "source": "counties",
            "source-layer": "s365_v778",
            "type": "line",
            "filter" :  ['in', geoid.substring(0,2), ['string', ['get', 'geoid']]],
            "paint": {
              "line-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                5, 0.5,
                22, 1
              ],
              "line-color": "#7e7e7e",
              "line-opacity": 0.5
            }
        }],
        mapFocus: [-79.761313,40.477399,-71.777491,45.01084]
      }
}

const getData = ({geoid, title, subTitle, link='2023 Update'}) =>{
  
  console.log('county header getData', title)
  return new Promise((resolve, reject) => {
    resolve({
      title,
      subTitle,
      link,
      mapLayer: getMapLayer(geoid)
    })
  })
}

const Edit = ({value, onChange, size}) => {
    
    let cachedData = useMemo(() => {
        return value && isJson(value) ? JSON.parse(value) : {}
    }, [value]);

    //console.log('Edit: value,', size)
   
    const baseUrl = '/';

    const ealSourceId = 343;
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');
    const [compData, setCompData] = useState({
        geoid: cachedData.geoid || '36001',
        title: cachedData.title || '', 
        subTitle: cachedData.subTitle || 'County Profile', 
        link: cachedData.link || '2023 Update',
        mapLayer: cachedData.mapLayer || getMapLayer(cachedData.geoid || '36001')
    })

    useEffect(() => {
      if(value !== JSON.stringify(compData)) {
        onChange(JSON.stringify(compData))
      }
    },[compData])

    return (
      <div className='w-full'>
        <div className='relative'>
          <div className={'border rounded-md border-blue-500 bg-blue-50 p-2 m-1'}>
            <div className={'flex flex-row flex-wrap justify-between'}>
              <label className={'shrink-0 pr-2 py-1 my-1 w-1/4'}>Title:</label>
              <div className={`flex flex row w-3/4 shrink my-1`}>
                <input type='text' value={compData.title} onChange={(e) => setCompData({...compData, title: e.target.value})} />
              </div>
            </div>
            <GeographySearch value={compData.geoid} 
                onChange={(v) => setCompData({...compData, "geoid": v})} 
                className={'flex-row-reverse'}
            />

            <div className={'flex flex-row flex-wrap justify-between'}>
              <label className={'shrink-0 pr-2 py-1 my-1 w-1/4'}>subTitle:</label>
              <div className={`flex flex row w-3/4 shrink my-1`}>
                <input type='text' value={compData.subTitle} onChange={(e) => setCompData({...compData, subTitle: e.target.value})} />
              </div>
            </div>

            <div className={'flex flex-row flex-wrap justify-between'}>
              <label className={'shrink-0 pr-2 py-1 my-1 w-1/4'}>Note:</label>
              <div className={`flex flex row w-3/4 shrink my-1`}>
                <input type='text' value={compData.note} onChange={(e) => setCompData({...compData, note: e.target.value})} />
              </div>
            </div>

            <div className={'flex flex-row flex-wrap justify-between'}>
              <label className={'shrink-0 pr-2 py-1 my-1 w-1/4'}>Bg Class:</label>
              <div className={`flex flex row w-3/4 shrink my-1`}>
                <input type='text' value={compData.bgClass} onChange={(e) => setCompData({...compData, bgClass: e.target.value})} />
              </div>
            </div>
          </div>
          <Header {...compData}/>
        </div>
      </div>
    ) 

}

const View = ({value}) => {
    if(!value) return ''
    let data = typeof value === 'object' ?
        value['element-data'] : 
        JSON.parse(value)
    
    return <Header {...data} />
             
}

Edit.settings = {
    hasControls: true,
    name: 'ElementEdit'
}


export default {
    "name": 'Header: County',
    "type": 'Header',
    "variables": [
        { 
          name:'geoid',
          default: '36001',
        },
        { 
          name:'title',
          default: 'MitigateNY',
        },
        { 
          name: 'subTitle',
          default: 'New York State Hazard Mitigation Plan',
        },
        { 
          name:'link',
          default: '2023 Update',
        }
    ],
    getData,
    "EditComp": Edit,
    "ViewComp": View
}