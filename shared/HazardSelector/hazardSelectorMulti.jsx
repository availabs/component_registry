import {Typeahead, Menu, MenuItem, Input, useToken} from 'react-bootstrap-typeahead';
import get from "lodash/get";
import React, {useEffect, useState} from "react";
import {hazardsMeta} from "~/utils/colors.jsx";

const handleSearch = (text, selected, setSelected) => {
    if (selected) setSelected([])
}

const onChangeFilter = (selected, setSelected, onChange, hazards) => {
    let value = selected.map(s => s.key);
    value = value.includes('all') ? hazards.map(h => h.key).filter(k => k && k !== 'all') : value.includes(null) ? [] : value;
    setSelected(value.includes('all') ? hazards.filter(h => h.key && h.key !== 'all') : value.includes(null) ? [] : selected);
    onChange && onChange(value);
}

const RenderToken = ({props, selected, setSelected, onChange}) => {
    return (
        <div className="w-fit inline-block ml-2">
            {props.label}
            <button
                className={'hover:text-red-300 animate ml-1 p-1 rounded-md rbt-token-remove-button'}
                onClick={e => {
                    const v = selected.filter(s => s.key !== props.key);
                    onChangeFilter(v, setSelected, onChange)
                }}
            >
                <i className={'fa fa-close'} />
            </button>
        </div>
    );
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
        </Menu>
    )
};

export default ({
                    className,
                    value,
                    onChange,
                    showAll = false
                }) => {
    const [selected, setSelected] = useState([]);


    const hazards = [
        ...showAll ? [{key: 'all', label: 'Select All'}, {key: null, label: 'Clear All'}] : [],
        ...Object.keys(hazardsMeta)
        .sort((a,b) => hazardsMeta[a].name.localeCompare(hazardsMeta[b].name))
        .map((k, i) => ({key: k, label: hazardsMeta[k].name}))
    ]

    useEffect(() => {
        if (!value) return;
        const s = hazards.filter(h => Array.isArray(value) && value.includes(h.key)) || [];
        setSelected(s)
    }, [value]);

    return (
        <div className={'flex justify-between'}>
            <label className={'shrink-0 pr-2 py-1 my-1 w-1/4'}>FEMA Disaster:</label>
            <div className={`flex flex row ${className} w-full shrink my-1 bg-white p-1 pl-3 rounded-l-md`}>
                <i className={`fa fa-search font-light text-xl bg-white rounded-r-md`}/>
                <Typeahead
                    className={'w-full'}
                    multiple={true}
                    onSearch={handleSearch}
                    minLength={0}
                    id="hazard-search"
                    key="hazard-search"
                    placeholder="Search for a FEMA Disaster..."
                    options={hazards}
                    labelKey={(option) => `${option?.label}`}
                    defaultSelected={selected}
                    onChange={(selected) => onChangeFilter(selected, setSelected, onChange, hazards)}
                    selected={selected}
                    inputProps={{className: 'flex flex-row flex-wrap'}}
                    renderMenu={renderMenu}
                    renderToken={(props) => <RenderToken props={props} selected={selected} setSelected={setSelected} onChange={onChange}/>}
                />
            </div>
        </div>
    )
}