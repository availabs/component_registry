import {AsyncTypeahead, Menu, MenuItem} from 'react-bootstrap-typeahead';
import {Link, useNavigate} from "react-router-dom";
import get from "lodash/get";
import {useEffect, useMemo, useState} from "react";
import {useFalcor} from '~/modules/avl-falcor';
import {range} from "~/utils/macros.jsx";
import {pgEnv} from "~/utils/";

const stateViewId = 285;
const countyViewId = 286;
const disasterViewId = 837;

const handleSearch = (text, selected, setSelected) => {
    if (selected) setSelected([])
}

const onChangeFilter = (selected, setSelected, value, geoData, disastersData, navigate, onChange) => {
    const geoid = get(selected, [0, 'geoid']);
    const disasterNumber = get(selected, [0, 'disasterNumber']);
    if (geoid || geoid === '') {
        setSelected(selected);
        onChange ? onChange(geoid) : navigate(`/geoid//${geoid}`)
    } else if (disasterNumber) {
        setSelected(selected);
        onChange ? onChange(disasterNumber) : navigate(`/disaster/${disasterNumber}`)
    } else {
        setSelected([])
    }
}

const renderMenu = (results, menuProps, labelKey, ...props) => {
    return (
        <Menu className={'bg-slate-100  overflow-hidden z-10'} {...menuProps}>
            {results.map((result, index) => (
                <MenuItem className={"block hover:bg-slate-200 text-xl tracking-wide pl-1"} option={result}
                          position={index}>
                    {result.name}
                </MenuItem>
            ))}
        </Menu>
    )
};

const getStateData = async ({falcor, pgEnv}) => {

    const geoAttributes = ['geoid', 'stusps', 'name'],
        geoOptions = JSON.stringify({}),
        geoRoute = ['dama', pgEnv, 'viewsbyId', stateViewId, 'options', geoOptions]
    const lenRes = await falcor.get([...geoRoute, 'length']);
    const len = get(lenRes, ['json', ...geoRoute, 'length']);
    if (len > 0) {
        const geoRouteIndices = {from: 0, to: len - 1}
        const indexRes = await falcor.get([...geoRoute, 'databyIndex', geoRouteIndices, geoAttributes]);
        return Object.values(get(indexRes, ['json', ...geoRoute, 'databyIndex'], {}));
    }
}
const getCountyData = async ({falcor, pgEnv, statesData, setGeoData}) => {

    const geoAttributesMapping = {'geoid': 'geoid', 'name': 'namelsad as name'},
        geoAttributes = Object.values(geoAttributesMapping),
        geoOptions = JSON.stringify({}),
        geoRoute = ['dama', pgEnv, 'viewsbyId', countyViewId, 'options', geoOptions]

    const lenRes = await falcor.get([...geoRoute, 'length']);
    const len = get(lenRes, ['json', ...geoRoute, 'length']);

    if (len > 0) {
        const geoRouteIndices = {from: 0, to: len - 1}
        const indexRes = await falcor.get([...geoRoute, 'databyIndex', geoRouteIndices, geoAttributes]);

        const geoData = Object.values(get(indexRes, ['json', ...geoRoute, 'databyIndex'], {}))
            .filter(county => county.geoid)
            .map(county => {
                const state = get(statesData.find(sd => sd.geoid === county.geoid.substring(0, 2)), 'stusps', '');
                return {geoid: county.geoid, name: `${county[geoAttributesMapping.name]}, ${state}`};
            })

        geoData.push(...statesData.map(sd => ({geoid: sd.geoid, name: `${sd.name} State`})))
        geoData.push({geoid: '', name: `United States`})
        setGeoData(geoData)
    }
}

const getDisastersData = async ({falcor, pgEnv, setDisastersData, statesData}) => {
    const dependencyPath = (view_id) => ["dama", pgEnv, "viewDependencySubgraphs", "byViewId", view_id];
    const disasterDetailsAttributes = [
            "disaster_number",
            "declaration_title",
            "fips_state_code"
        ],
        disasterDetailsOptions = JSON.stringify({
            aggregatedLen: true,
            exclude: {
                'disaster_number': range(3000, 3999)
            },
            groupBy: disasterDetailsAttributes
        }),
        disasterDetailsPath = (view_id) => ["dama", pgEnv, "viewsbyId", view_id, "options", disasterDetailsOptions];

    const depsRes = await falcor.get(dependencyPath(disasterViewId));
    const deps = get(depsRes, ["json", ...dependencyPath(disasterViewId), "dependencies"]);
    const ddsDeps = deps.find(d => d.type === "disaster_declarations_summaries_v2");
    const ddsView = ddsDeps.view_id;
    if (!ddsDeps) return;

    const lenRes = await falcor.get([...disasterDetailsPath(ddsView), 'length']);
    const len = get(lenRes, ['json', ...disasterDetailsPath(ddsView), 'length'], 0);
    await falcor.chunk([...disasterDetailsPath(ddsView), 'databyIndex', {
        from: 0,
        to: len - 1
    }, disasterDetailsAttributes]);

    const disasters = [
        ...Object.values(get(falcor.getCache(), [...disasterDetailsPath(ddsView), 'databyIndex'], {}))
            .filter(d => typeof d['disaster_number'] !== 'object')
            .map(d => {
                const state = get(statesData.find(sd => sd.geoid === d.fips_state_code), 'stusps', '');
                    return ({
                            disasterNumber: d['disaster_number'],
                            name: `${d.declaration_title} (${d['disaster_number']}), ${state}`
                        })
                }
            )
    ];

    setDisastersData(disasters);
}

export default ({
                    showLabel=true,
                    className,
                    value,
                    onChange // if not passed, navigate to geography page
                }) => {
    const navigate = useNavigate();
    const {falcor, falcorCache} = useFalcor();
    const [geoData, setGeoData] = useState([]);
    const [disastersData, setDisastersData] = useState([]);
    const [selected, setSelected] = useState([]);

    useEffect(() => {
        async function getData() {
            const statesData = await getStateData({falcor, pgEnv});
            await getCountyData({falcor, pgEnv, statesData, setGeoData});
            await getDisastersData({falcor, pgEnv, setDisastersData, statesData});
        }

        getData();
    }, [pgEnv, falcor]);

    const Search = () => (
        <>
            <i className={`fa fa-search font-light text-xl bg-white pr-2 pt-1 rounded-r-md`}/>
            <AsyncTypeahead
                className={'w-full'}
                isLoading={false}
                onSearch={handleSearch}
                minLength={2}
                id="geography-search"
                key="geography-search"
                placeholder="Search for a Disaster or a Geography..."
                options={[...geoData, ...disastersData]}
                labelKey={(option) => `${option.name}`}
                defaultSelected={selected}
                onChange={(selected) => onChangeFilter(selected, setSelected, value, geoData, disastersData, navigate, onChange)}
                selected={selected}
                inputProps={{className: 'bg-white  w-full p-1 pl-3 rounded-l-md'}}
                renderMenu={renderMenu}
            />
        </>
    )
    return (
        showLabel ?
            <div className={'flex flex-row flex-wrap justify-between'}>
                <label className={'shrink-0 pr-2 py-1 my-1 w-1/4'}>Geography:</label>
                <div className={`flex flex row ${className} w-3/4 shrink my-1`}>
                    <Search/>
                </div>
            </div> :
            <div className={`flex w-full ${className}`}>
                <Search />
            </div>
    )
}