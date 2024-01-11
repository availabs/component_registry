import React, {useEffect, useState} from "react";
import GeographySearch from "../shared/geographySearch.jsx";
import DisasterSearch from "../shared/disasterSearch.jsx";
import {ButtonSelector} from "../shared/buttonSelector.jsx";
import {isJson} from "~/utils/macros.jsx";

const className = 'flex-row-reverse border p-5 text-lg rounded-md';

const Edit = ({value, onChange}) => {
    let cachedData = value && isJson(value) ? JSON.parse(value) : {};
    const [type, setType] = useState(cachedData?.type || []);

    useEffect(() => {
        onChange(JSON.stringify({
            type
        }))
    }, [type]);
    return (
        <div className='w-full'>
            <div className='relative'>
                <ButtonSelector
                    type={type}
                    setType={setType}
                    types={['Geography', 'Disaster']}
                    multi={false}
                />

                {
                    type?.includes('Geography') ?
                        <GeographySearch className={className} showLabel={false}/> : null
                }

                {
                    type?.includes('Disaster') ?
                        <DisasterSearch
                            view_id={837}
                            className={className}
                            showLabel={false}
                        /> : null
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
    const type = isJson(value) ? JSON.parse(value)?.type : value;

    console.log('loads.', type)
    return (
        <div className='relative w-full p-6'>
            <div className='w-full'>
                <div className='relative'>
                    {
                        type?.includes('Geography') ?
                            <GeographySearch className={className} showLabel={false}/> : null
                    }

                    {
                        type?.includes('Disaster') ?
                            <DisasterSearch
                                view_id={837}
                                className={className}
                                showLabel={false}
                            /> : null
                    }
                </div>
            </div>
        </div>
    )
}


export default {
    "name": 'Search Bar',
    "type": 'Functionality',
    // "variables": [
    //     {
    //         name: 'geoid',
    //         default: '36',
    //     },
    //     {
    //         name: 'disasterNumber',
    //         default: null,
    //     }
    // ],
    // getData,
    "EditComp": Edit,
    "ViewComp": View
}