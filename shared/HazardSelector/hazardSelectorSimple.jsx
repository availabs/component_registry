import React from "react";
import {hazardsMeta} from "~/utils/colors.jsx";

export const HazardSelectorSimple = ({hazard, setHazard, showTotal=false}) => {
    return (
        <div className='flex flex-row flwx-wrap justify-between'>
            <label className={'shrink-0 pr-2 py-1 my-1 w-1/4'}>Hazard Type:</label>
            <select
                className='w-3/4 shrink my-1 p-1 bg-white rounded-md'
                onChange={e => {
                    setHazard(e.target.value)
                }}
                value={hazard}
            >
                {showTotal ? <option value='total'>Total</option> : <option value={null}>Select A Hazard Type</option>}
                {
                    Object.keys(hazardsMeta)
                        .sort((a,b) => hazardsMeta[a].name.localeCompare(hazardsMeta[b].name))
                        .map((k, i) => {
                        return <option value={k} key={k}>{hazardsMeta[k].name}</option>
                    })
                }
            </select>
        </div>
    )
}