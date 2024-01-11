import {AsyncTypeahead, Menu, MenuItem} from 'react-bootstrap-typeahead';
import {Link, useNavigate} from "react-router-dom";
import get from "lodash/get";
import {useEffect, useMemo, useState} from "react";
import {useFalcor} from '~/modules/avl-falcor';
import {pgEnv} from "~/utils/";
import {getAttributes, SourceAttributes, ViewAttributes} from "~/utils/attributes.jsx";
import {setVersion} from "falcor/lib/support/currentCacheVersion.js";
import {DisplayToggle} from "./components/displayToggle.jsx";


const handleSearch = (text, selected, setSelected) => {
    if (selected) setSelected([])
}

const onChangeFilter = (selected, setSelected, view_id, views, navigate, onChange) => {
    const id = get(selected, [0, 'view_id']);
    if (id) {
        setSelected(selected);
        onChange && onChange(id)
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
                    {result.version}
                </MenuItem>
            ))}
            {/*{results.map((result, idx) => menuItemsLinks(result))}*/}
        </Menu>
    )
};

export default ({
                    className,
                    source_id,
                    view_id,
                    label = 'Data Source',
                    controlDisplay= false,
                    showSelectorControl = false,
                    onChange
                }) => {
    const navigate = useNavigate();
    const {falcor, falcorCache} = useFalcor();
    const [selected, setSelected] = useState([]);
    const [showSelector, setShowSelector] = useState(false);
    useEffect(() => {
        async function fetchData() {
            const lengthPath = ["dama", pgEnv, "sources", "byId", source_id, "views", "length"];
            const resp = await falcor.get(lengthPath);
            let data = await falcor.get(
                [
                    "dama", pgEnv, "sources", "byId", source_id, "views", "byIndex",
                    {from: 0, to: get(resp.json, lengthPath, 0) - 1},
                    "attributes", Object.values(ViewAttributes)
                ],
                [
                    "dama", pgEnv, "sources", "byId", source_id,
                    "attributes", Object.values(SourceAttributes)
                ],
                [
                    "dama", pgEnv, "sources", "byId", source_id, "meta"
                ]
            );
            return data;
        }

        fetchData();
    }, [source_id, falcor, pgEnv]);

    const views = useMemo(() => {
        return Object.values(get(falcorCache, ["dama", pgEnv, "sources", "byId", source_id, "views", "byIndex"], {}))
            .map(v => getAttributes(get(falcorCache, v.value, {"attributes": {}})["attributes"]))
            .sort((a,b) => +b?.view_id - +a?.view_id);
    }, [falcorCache, source_id, pgEnv]);

    useEffect(() => {
        setSelected(views.filter(gd => view_id && gd.view_id === view_id))
    }, [views, view_id]);

    useEffect(() => {
        !view_id && views && onChange && onChange(views[0]?.view_id)
    }, [views]);

    return (
        <>
            <DisplayToggle showSelector={showSelector} setShowSelector={setShowSelector} hide={controlDisplay}/>

            <div className={`flex flex-row flex-wrap justify-between ${showSelector || showSelectorControl ? `` : `hidden`}`}>
                <label className={'shrink-0 pr-2 py-1 my-1 w-1/4'}>{label} Version:</label>
                <div className={`flex flex row ${className} w-3/4 shrink my-1`}>
                    <i className={`fa fa-search font-light text-xl bg-white pr-2 pt-1 rounded-r-md`}/>
                    <AsyncTypeahead
                        className={'w-full'}
                        isLoading={false}
                        onSearch={handleSearch}
                        minLength={0}
                        id="geography-search"
                        key="geography-search"
                        placeholder="Search for a Data Source..."
                        options={views}
                        labelKey={(option) => `${option?.version}`}
                        defaultSelected={selected}
                        onChange={(selected) => onChangeFilter(selected, setSelected, view_id, views, navigate, onChange)}
                        selected={selected}
                        inputProps={{className: 'bg-white w-full p-1 pl-3 rounded-l-md'}}
                        renderMenu={renderMenu}
                    />
                </div>
            </div></>
    )
}