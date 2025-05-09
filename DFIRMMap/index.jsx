import React, {useEffect, useMemo, useState} from "react";
import get from "lodash/get";
import {useFalcor} from '~/modules/avl-falcor';
import {pgEnv} from "../utils";
import VersionSelectorSearchable from "../shared/versionSelector/searchable.jsx";
import GeographySearch from "../shared/geographySearch.jsx";
import {Loading} from "../utils/loading.jsx";
import {Link} from "react-router";
import {ButtonSelector} from "../shared/buttonSelector.jsx";
import {scaleThreshold} from "d3-scale";
import {EditMap,ViewMap} from "../shared/TemplateMap";
import {Attribution} from "../shared/attribution.jsx";
import {isJson} from "../utils/macros.jsx";


const geoids = ["36000","36001","36002","36003","36004","36005","36006","36007","36008","36009","36010","36011","36012","36013","36014","36015","36016","36017","36018","36019","36020","36021","36022","36023","36024","36025","36026","36027","36028","36029","36030","36031","36032","36033","36034","36035","36036","36037","36038","36039","36040","36041","36042","36043","36044","36045","36046","36047","36048","36049","36050","36051","36052","36053","36054","36055","36056","36057","36058","36059","36060","36061","36062","36063","36064","36065","36066","36067","36068","36069","36070","36071","36072","36073","36074","36075","36076","36077","36078","36079","36080","36081","36082","36083","36084","36085","36086","36087","36088","36089","36090","36091","36092","36093","36094","36095","36096","36097","36098","36099","36100","36101","36102","36103","36104","36105","36106","36107","36108","36109","36110","36111","36112","36113","36114","36115","36116","36117","36118","36119","36120","36121","36122","36123","36124","36125","36126","36127","36128","36129","36130","36131","36132","36133","36134","36135","36136","36137","36138","36139","36140","36141","36142","36143","36144","36145","36146","36147","36148","36149","36150","36151","36152","36153","36154","36155","36156","36157","36158","36159","36160","36161","36162","36163","36164","36165","36166","36167","36168","36169","36170","36171","36172","36173","36174","36175","36176","36177","36178","36179","36180","36181","36182","36183","36184","36185","36186","36187","36188","36189","36190","36191","36192","36193","36194","36195","36196","36197","36198","36199","36200","36201","36202","36203","36204","36205","36206","36207","36208","36209","36210","36211","36212","36213","36214","36215","36216","36217","36218","36219","36220","36221","36222","36223","36224","36225","36226","36227","36228","36229","36230","36231","36232","36233","36234","36235","36236","36237","36238","36239","36240","36241","36242","36243","36244","36245","36246","36247","36248","36249","36250","36251","36252","36253","36254","36255","36256","36257","36258","36259","36260","36261","36262","36263","36264","36265","36266","36267","36268","36269","36270","36271","36272","36273","36274","36275","36276","36277","36278","36279","36280","36281","36282","36283","36284","36285","36286","36287","36288","36289","36290","36291","36292","36293","36294","36295","36296","36297","36298","36299","36300","36301","36302","36303","36304","36305","36306","36307","36308","36309","36310","36311","36312","36313","36314","36315","36316","36317","36318","36319","36320","36321","36322","36323","36324","36325","36326","36327","36328","36329","36330","36331","36332","36333","36334","36335","36336","36337","36338","36339","36340","36341","36342","36343","36344","36345","36346","36347","36348","36349","36350","36351","36352","36353","36354","36355","36356","36357","36358","36359","36360","36361","36362","36363","36364","36365","36366","36367","36368","36369","36370","36371","36372","36373","36374","36375","36376","36377","36378","36379","36380","36381","36382","36383","36384","36385","36386","36387","36388","36389","36390","36391","36392","36393","36394","36395","36396","36397","36398","36399","36400","36401","36402","36403","36404","36405","36406","36407","36408","36409","36410","36411","36412","36413","36414","36415","36416","36417","36418","36419","36420","36421","36422","36423","36424","36425","36426","36427","36428","36429","36430","36431","36432","36433","36434","36435","36436","36437","36438","36439","36440","36441","36442","36443","36444","36445","36446","36447","36448","36449","36450","36451","36452","36453","36454","36455","36456","36457","36458","36459","36460","36461","36462","36463","36464","36465","36466","36467","36468","36469","36470","36471","36472","36473","36474","36475","36476","36477","36478","36479","36480","36481","36482","36483","36484","36485","36486","36487","36488","36489","36490","36491","36492","36493","36494","36495","36496","36497","36498","36499","36500","36501","36502","36503","36504","36505","36506","36507","36508","36509","36510","36511","36512","36513","36514","36515","36516","36517","36518","36519","36520","36521","36522","36523","36524","36525","36526","36527","36528","36529","36530","36531","36532","36533","36534","36535","36536","36537","36538","36539","36540","36541","36542","36543","36544","36545","36546","36547","36548","36549","36550","36551","36552","36553","36554","36555","36556","36557","36558","36559","36560","36561","36562","36563","36564","36565","36566","36567","36568","36569","36570","36571","36572","36573","36574","36575","36576","36577","36578","36579","36580","36581","36582","36583","36584","36585","36586","36587","36588","36589","36590","36591","36592","36593","36594","36595","36596","36597","36598","36599","36600","36601","36602","36603","36604","36605","36606","36607","36608","36609","36610","36611","36612","36613","36614","36615","36616","36617","36618","36619","36620","36621","36622","36623","36624","36625","36626","36627","36628","36629","36630","36631","36632","36633","36634","36635","36636","36637","36638","36639","36640","36641","36642","36643","36644","36645","36646","36647","36648","36649","36650","36651","36652","36653","36654","36655","36656","36657","36658","36659","36660","36661","36662","36663","36664","36665","36666","36667","36668","36669","36670","36671","36672","36673","36674","36675","36676","36677","36678","36679","36680","36681","36682","36683","36684","36685","36686","36687","36688","36689","36690","36691","36692","36693","36694","36695","36696","36697","36698","36699","36700","36701","36702","36703","36704","36705","36706","36707","36708","36709","36710","36711","36712","36713","36714","36715","36716","36717","36718","36719","36720","36721","36722","36723","36724","36725","36726","36727","36728","36729","36730","36731","36732","36733","36734","36735","36736","36737","36738","36739","36740","36741","36742","36743","36744","36745","36746","36747","36748","36749","36750","36751","36752","36753","36754","36755","36756","36757","36758","36759","36760","36761","36762","36763","36764","36765","36766","36767","36768","36769","36770","36771","36772","36773","36774","36775","36776","36777","36778","36779","36780","36781","36782","36783","36784","36785","36786","36787","36788","36789","36790","36791","36792","36793","36794","36795","36796","36797","36798","36799","36800","36801","36802","36803","36804","36805","36806","36807","36808","36809","36810","36811","36812","36813","36814","36815","36816","36817","36818","36819","36820","36821","36822","36823","36824","36825","36826","36827","36828","36829","36830","36831","36832","36833","36834","36835","36836","36837","36838","36839","36840","36841","36842","36843","36844","36845","36846","36847","36848","36849","36850","36851","36852","36853","36854","36855","36856","36857","36858","36859","36860","36861","36862","36863","36864","36865","36866","36867","36868","36869","36870","36871","36872","36873","36874","36875","36876","36877","36878","36879","36880","36881","36882","36883","36884","36885","36886","36887","36888","36889","36890","36891","36892","36893","36894","36895","36896","36897","36898","36899","36900","36901","36902","36903","36904","36905","36906","36907","36908","36909","36910","36911","36912","36913","36914","36915","36916","36917","36918","36919","36920","36921","36922","36923","36924","36925","36926","36927","36928","36929","36930","36931","36932","36933","36934","36935","36936","36937","36938","36939","36940","36941","36942","36943","36944","36945","36946","36947","36948","36949","36950","36951","36952","36953","36954","36955","36956","36957","36958","36959","36960","36961","36962","36963","36964","36965","36966","36967","36968","36969","36970","36971","36972","36973","36974","36975","36976","36977","36978","36979","36980","36981","36982","36983","36984","36985","36986","36987","36988","36989","36990","36991","36992","36993","36994","36995","36996","36997","36998","36999"]
//const defaultColors = getColorRange(5, "Oranges", false);


async function getData({geoid='36',ealViewId, size="1", height=500}, falcor) {
    //return {}
    
    const sources = [{
      "id": "hazmit_dama_s379_v841_1695834411623",
      "source": {
         "url": "pmtiles://graph.availabs.org/tiles/hazmit_dama_s379_v841_1695834411623.pmtiles",
         "type": "vector"
      },
      "protocol": "pmtiles"
    },
    {
      id: "counties",
      source: {
        "type": "vector",
        "url": "https://tiles.availabs.org/data/tiger_carto.json"
      }
    }]

    const layers = [
    {
      "id": "counties",
      "source": "counties",
      "source-layer": "s365_v778",
      "type": "fill",
      "filter" :  ["in", ['get', "geoid"], ['literal', geoids]],
      "paint": {
        "fill-color": "#d0d0ce"
      }
    },
    {
      "id": "counties-line",
      "source": "counties",
      "source-layer": "s365_v778",
      "type": "line",
      "filter" :  ["in", ['get', "geoid"], ['literal', geoids]],
      "paint": {
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5, 0.5,
          22, 2
        ],
        "line-color": "#efefef",
        "line-opacity": 0.5
      }
    },
    {
          "id": "q3_500",
          "type": "fill",
          "filter": ["all", ["in", "q3", ["get", "gfid"]], ["==", "X", ["get", "fld_zone"]]],
          "paint": {
             "fill-color": "DodgerBlue",
             "fill-opacity": 1
          },
          "source": "hazmit_dama_s379_v841_1695834411623",
          "source-layer": "s379_v841"
    },
    {
          "id": "q3_100",
          "type": "fill",
          "filter": ["all", ["in", "q3", ["get", "gfid"]], ["!=", "X", ["get", "fld_zone"]]],
          "paint": {
             "fill-color": "DodgerBlue",
             "fill-opacity": 0.3
          },
          "source": "hazmit_dama_s379_v841_1695834411623",
          "source-layer": "s379_v841"
    },
    {
          "id": "NFHL_500",
          "type": "fill",
          "filter": ["all", ["in", "NHFL", ["get", "gfid"]], ["==", "X", ["get", "fld_zone"]]],
          "paint": {
             "fill-color": "Orange",
             "fill-opacity": 1
          },
          "source": "hazmit_dama_s379_v841_1695834411623",
          "source-layer": "s379_v841"
    },
     {
          "id": "NFHL_100",
          "type": "fill",
          "filter": ["all", ["in", "NHFL", ["get", "gfid"]], ["!=", "X", ["get", "fld_zone"]]],
          "paint": {
             "fill-color": "Orange",
             "fill-opacity": 0.3
          },
          "source": "hazmit_dama_s379_v841_1695834411623",
          "source-layer": "s379_v841"
    },
    {
          "id": "ble_500",
          "type": "fill",
          "filter": ["all", ["in", "BLE", ["get", "gfid"]], ["==", "X", ["get", "fld_zone"]]],
          "paint": {
             "fill-color": "green",
             "fill-opacity": 0.5
          },
          "source": "hazmit_dama_s379_v841_1695834411623",
          "source-layer": "s379_v841"
    },
    {
          "id": "ble_100",
          "type": "fill",
          "filter": ["all", ["in", "BLE", ["get", "gfid"]], ["!=", "X", ["get", "fld_zone"]]],    
          "paint": {
             "fill-color": "green",
             "fill-opacity": 0.3
          },
          "source": "hazmit_dama_s379_v841_1695834411623",
          "source-layer": "s379_v841"
    },
    {
          "id": "PRELIMINARY_500",
          "type": "fill",
          "filter": ["all", ["in", "PRELIMINARY", ["get", "gfid"]], ["==", "X", ["get", "fld_zone"]]],    
          "paint": {
             "fill-color": "magenta",
             "fill-opacity": 1
          },
          "source": "hazmit_dama_s379_v841_1695834411623",
          "source-layer": "s379_v841"
    },
    {
          "id": "PRELIMINARY_100",
          "type": "fill",
          "filter": ["all", ["in", "PRELIMINARY", ["get", "gfid"]], ["!=", "X", ["get", "fld_zone"]]],    
          "paint": {
             "fill-color": "magenta",
             "fill-opacity": 0.3
          },
          "source": "hazmit_dama_s379_v841_1695834411623",
          "source-layer": "s379_v841"
    }


    ]

    


            
    return {
        ealViewId,
        geoid,
        title: 'Flood Plain Map',
        sources,
        layers,
        attributionData: {source_id: 379, view_id: 841, version: 'AVAIL NYS Floodplains Merged - September 2024'},
        size,
        height,
        domain: ['FEMA Preliminary Maps','FEMA DFIRM','BLE','FEMA Q3 Map'],
        colors: ['Magenta', 'Orange',   'Green', 'DodgerBlue'],
        mapFocus: [-79.761313, 40.477399, -71.777491, 45.01084],
        showLegend:  true
    }
}


const Edit = ({value, onChange, size}) => {
    const {falcor, falcorCache} = useFalcor();

    let cachedData = useMemo(() => {
        return value && isJson(value) ? JSON.parse(value) : {}
    }, [value]);

    //console.log('Edit: value,', size)
   
    const baseUrl = '/';

    const ealSourceId = 343;
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');
    const [compData, setCompData] = useState({
        ealViewId: cachedData?.ealViewId || 837,
        geoid: cachedData?.geoid || '36',
        type: cachedData?.type || 'total_losses',
        data: cachedData?.data,
        mapFocus: cachedData.mapFocus,
        title: cachedData?.title,
        height: cachedData?.height || 500
    })

    useEffect(() => {
        // if data is set outside map delete image
        delete compData.img;
        setCompData({...compData, ...cachedData})   
    },[cachedData])

    
    useEffect(() => {
        const load = async () => {
            const {
                geoid, ealViewId, type ,colors, height
            } = compData
            //console.log(geoid, disasterNumber)
            

            setStatus(undefined);
            setLoading(true);
            //console.log('EDIT: get data',geoid,disasterNumber,ealViewId, type)
    
            let data = await getData({
                geoid,
                ealViewId,
                size,
                height
            }, falcor)
            console.log(
                'testing got data', value === JSON.stringify({...cachedData, ...data}), 
                'args', )
            if(value !== JSON.stringify({...cachedData, ...data})) {
                onChange(JSON.stringify({...cachedData, ...data}))
            }
            setLoading(false)
            
        }
        load();
    }, [compData]);

    
    const layerProps = useMemo(() => { 
        console.log('setting Layer Props', cachedData)
        return {
            ccl: {
                ...cachedData,
                // change: e => {
                    
                //     if(value !== JSON.stringify({...cachedData, ...e})){
                //         //console.log('change from map')
                //         onChange(JSON.stringify({...cachedData,...e}))
                //     }
                // }
            }
        }
    },[cachedData])

    //console.log('layerProps', layerProps)

    return (
        <div className='w-full'>
            <div className='relative'>
                <div className={'border rounded-md border-blue-500 bg-blue-50 p-2 m-1'}>
                    Edit Controls
                    <VersionSelectorSearchable
                        source_id={ealSourceId}
                        view_id={compData.ealViewId}
                        onChange={(v) => setCompData({...compData, "ealViewId": v})}
                        className={'flex-row-reverse'}
                    />
                    
                    <ButtonSelector
                        label={'Size:'}
                        types={[{label: 'X Small', value: 200},{label: 'Small', value: 500},{label: 'Medium', value: 700},{label: 'Large', value: 900}]}
                        type={compData.height}
                        setType={v => setCompData({...compData, "height": v})}
                    />
                </div>
                {
                    loading ? <Loading/> :
                        status ? <div className={'p-5 text-center'}>{status}</div> :
                            <React.Fragment>
                                <div className={`flex-none w-full p-1`} style={{height: `${compData.height}px`}}>
                                    <EditMap
                                        falcor={falcor}
                                        layerProps={layerProps}
                                        legend={{
                                            size,
                                            domain: compData?.domain || [], 
                                            range: compData.colors, 
                                            title: compData.title, 
                                            show: compData.showLegend,
                                            format: (d) => d,
                                            hideNA: true
                                        }}
                                    />
                                </div>
                                <Attribution baseUrl={baseUrl} attributionData={compData.attributionData} />
                            </React.Fragment>
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
    const baseUrl = '/';
    const attributionData = data?.attributionData;
    const layerProps =  {ccl: {...data }}
    console.log('render view', data)

    return (
        <div className='relative w-full p-6'>
            {
               data.img  ?
                    <div className='h-80vh flex-1 flex flex-col'>
                        <img alt='Choroplath Map' src={get(data, ['img'])}/>
                        
                    </div> : 
                    <div className={`flex-none w-full p-1`} style={{height: `${data.height}px`}}>
                        <ViewMap
                            layerProps={layerProps}
                            legend={{
                                size: data.size,
                                domain: data?.domain || [], 
                                range: data.colors, 
                                title: data.title,
                                format: (d) => d,
                                show: data.showLegend
                            }}
                        />
                    </div> 
                    
            }
            <Attribution baseUrl={baseUrl} attributionData={attributionData} />
        </div>
    )
}


export default {
    "name": 'Map: Floodplains',
    "type": 'Map',
    "variables": 
    [       
        {
            name: 'geoid',
            default: '36'
        },
        {
            name: 'ealViewId',
            default: 837,
            hidden: true
        }
        
    ],
    getData,

    "EditComp": Edit,
    "ViewComp": View
}