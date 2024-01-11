import {AsyncTypeahead, Menu, MenuItem} from 'react-bootstrap-typeahead';
import {Link, useNavigate} from "react-router-dom";
import get from "lodash/get";
import {useEffect, useMemo, useState} from "react";
import {useFalcor} from '~/modules/avl-falcor';
import {pgEnv} from "~/utils/";
import {range} from "~/utils/macros.jsx";


const handleSearch = (text, selected, setSelected) => {
    if (selected) setSelected([])
}

const onChangeFilter = (selected, setSelected, view_id, views, navigate, onChange) => {
    const id = get(selected, [0, 'key']);
    console.log('changed', id)
    // if (id) {
        setSelected(selected);
        onChange && onChange(id)
    // } else {
    //     setSelected([])
    // }
}

const renderMenu = (results, menuProps, labelKey, ...props) => {
    return (
        <Menu className={'bg-slate-100  overflow-hidden z-10'} {...menuProps}>
            {results.map((result, index) => (
                <MenuItem className={"block hover:bg-slate-200 text-xl tracking-wide pl-1"} option={result}
                          position={index}>
                    {result.label}
                </MenuItem>
            ))}
            {/*{results.map((result, idx) => menuItemsLinks(result))}*/}
        </Menu>
    )
};

export default ({
                    className,
                    view_id,
                    value,
                    geoid,
                    onChange,
                    showAll = false
                }) => {
    const navigate = useNavigate();
    const {falcor, falcorCache} = useFalcor();
    const [ddsView, setDdsView] = useState();
    const [selected, setSelected] = useState([]);

    const dependencyPath = (view_id) => ["dama", pgEnv, "viewDependencySubgraphs", "byViewId", view_id];
    const disasterDetailsAttributes = [
            "distinct disaster_number as disaster_number",
            "declaration_title",
            "declaration_date",
            "incident_type",
        ],
        disasterDetailsOptions = JSON.stringify({
            filter: {
                [geoid?.length === 2 ? 'fips_state_code' :
                        'fips_state_code || fips_county_code' ]: [geoid]
            },
            exclude: {
                'disaster_number': range(3000, 3999)
            }
        }),
        disasterDetailsPath = (view_id) => ["dama", pgEnv, "viewsbyId", view_id, "options", disasterDetailsOptions];

    useEffect(() => {
        async function fetchData() {
                        const depsRes = await falcor.get(dependencyPath(view_id));
            const deps = get(depsRes, ["json", ...dependencyPath(view_id), "dependencies"]);
            const ddsDeps = deps.find(d => d.type === "disaster_declarations_summaries_v2");
            if (!ddsDeps) return;
            setDdsView(ddsDeps.view_id);

            const lenRes = await falcor.get([...disasterDetailsPath(ddsDeps.view_id), 'length']);
            const len = get(lenRes, ['json', ...disasterDetailsPath(ddsDeps.view_id), 'length'], 0);
            await falcor.get([...disasterDetailsPath(ddsDeps.view_id), 'databyIndex', { from: 0, to: len - 1 }, disasterDetailsAttributes]);
        }
        fetchData();
    }, [falcor, view_id, geoid, pgEnv]);

    const disasters = useMemo(() => {
        return  [
            ...showAll ? [{key: undefined, label: 'All Disasters'}] : [],
            ...Object.values(get(falcorCache, [...disasterDetailsPath(ddsView), 'databyIndex'], {}))
            .filter(d => typeof d['distinct disaster_number as disaster_number'] !== 'object')
            .map(d => (
                {
                    key: d['distinct disaster_number as disaster_number'],
                    label:`${d.declaration_title} (${d['distinct disaster_number as disaster_number']})`
                }))
        ]
    }, [falcorCache, view_id, geoid, ddsView, pgEnv]);

    useEffect(() => {
        setSelected(disasters.filter(gd => value && gd.key === value))
    }, [disasters, value]);

    return (
        <div className={'flex justify-between'}>
            <label className={'shrink-0 pr-2 py-1 my-1 w-1/4'}>FEMA Disaster:</label>
            <div className={`flex flex row ${className} w-full shrink my-1`}>
                <i className={`fa fa-search font-light text-xl bg-white pr-2 pt-1 rounded-r-md`}/>
                <AsyncTypeahead
                    className={'w-full'}
                    isLoading={false}
                    onSearch={handleSearch}
                    minLength={0}
                    id="geography-search"
                    key="geography-search"
                    placeholder="Search for a FEMA Disaster..."
                    options={disasters}
                    labelKey={(option) => `${option?.label}`}
                    defaultSelected={selected}
                    onChange={(selected) => onChangeFilter(selected, setSelected, view_id, disasters, navigate, onChange)}
                    selected={selected}
                    inputProps={{className: 'bg-white w-full p-1 pl-3 rounded-l-md'}}
                    renderMenu={renderMenu}
                />
            </div>
        </div>
    )
}