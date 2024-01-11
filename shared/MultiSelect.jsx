import {Typeahead, Menu, MenuItem} from 'react-bootstrap-typeahead';
import React, {useEffect, useState} from "react";

const handleSearch = (text, selected, setSelected) => {
    if (selected) setSelected([])
}

const onChangeFilter = (selected, setSelected, onChange, hazards) => {
    let value = selected.map(s => s.key);
    let isSelectAll = value.includes('all');
    let isClearAll = value.includes(null);

    setSelected(isSelectAll ? hazards.filter(h => h.key && h.key !== 'all') : isClearAll ? [] : selected);
    onChange && onChange(isSelectAll ? hazards.filter(h => h.key && h.key !== 'all') : isClearAll ? [] : selected);
}

const RenderToken = ({props, selected, setSelected, onChange}) => {
    return (
        <div key={props.label} className="w-fit inline-block ml-2">
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
                    label = 'Select',
                    noLabel=false,
                    value,
                    onChange,
                    showAll = false,
                    options = []
                }) => {
    const [selected, setSelected] = useState([]);


    const allOptions = [
        ...showAll ? [{key: 'all', label: 'Select All'}, {key: null, label: 'Clear All'}] : [],
        ...options
    ]

    useEffect(() => {
        if (!value) return;
        const s = options.filter(h => Array.isArray(value) && value.includes(h.key)) || [];
        setSelected(s)
    }, [value]);

    return (
        <div className={'flex justify-between'}>
            {
                !noLabel && <label className={'shrink-0 pr-2 py-1 my-1 w-1/4'}>{label}:</label>
            }
            <div className={`flex flex row ${className} w-full shrink my-1 bg-white p-1 pl-3 rounded-l-md`}>
                <i className={`fa fa-search font-light text-xl bg-white rounded-r-md`}/>
                <Typeahead
                    className={'w-full'}
                    multiple={true}
                    onSearch={handleSearch}
                    minLength={0}
                    id="multi-search"
                    key="multi-search"
                    placeholder="Search..."
                    options={allOptions}
                    labelKey={(option) => `${option?.label}`}
                    defaultSelected={selected}
                    onChange={(selected) => onChangeFilter(selected, setSelected, onChange, allOptions)}
                    selected={selected}
                    inputProps={{className: 'flex flex-row flex-wrap'}}
                    renderMenu={renderMenu}
                    renderToken={(props) => <RenderToken key={props.label} props={props} selected={selected} setSelected={setSelected} onChange={onChange}/>}
                />
            </div>
        </div>
    )
}