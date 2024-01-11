import React, {useState} from "react";
import Multiselect from "~/component_registry/shared/MultiSelect.jsx";


const getNestedValue = (obj) => typeof obj?.value === 'object' ? getNestedValue(obj.value) : obj?.value || obj;

export const RenderExternalTableFilter = ({defaultOpen=false, data, columns, filters, setFilters, setExtFilterValues}) => {
    const [open, setOpen] = useState(defaultOpen);


    const uniqueValues = React.useMemo(() => columns.reduce((acc, column) => ({
        ...acc,
        [column.accessor]: [...new Set(
            data.reduce((acc, d) => {
            const originalValue = column.openOut ? d.expand?.find(c => c.accessor === column.accessor)?.originalValue : d[column.accessor];
            let value = getNestedValue(originalValue);

            return Array.isArray(value) ? [...acc, ...value] :
                typeof value === 'object' ? acc : [...acc, value]
        }, [])
        )]
    }), {}), [columns, data]);

    if(!columns.length) return null;

    return (
        <div className={'flex flex-col'}>
            <div className={`justify-end flex items-center px-2 ${open ? `text-red-300 hover:text-red-500` : `text-blue-300 hover:text-blue-600`} transition ease-in`}
                 title={open ? 'Close Filters' : 'Open Filters'}
                 onClick={e => setOpen(!open)}
            >
                <i className={open ? 'fa fa-close text-lg px-1' : 'fa fa-gear text-lg px-1'}/>
                <label className={'text-sm'}>{open ? 'Close Filters' : 'Open Filters'}</label>
            </div>

            <div className={open ? 'w-full flex flex-row flex-wrap bg-white border-2 border-blue-100 px-4 py-2' : 'hidden'}>
                <label className={'text-xs font-bold'}>Filter table:</label>
                {
                    columns.map(column => (
                        <div key={column.name} className={'w-full pt-2 mt-1 flex flex-row text-sm items-top'}>
                            <label
                                className={'shrink-0 pr-2 py-2 my-1 w-1/4 font-medium'}>{column.display_name || column.Header}</label>
                            <div className={'p-2 ml-0 my-1 bg-white rounded-md w-full shrink'}>
                                <Multiselect
                                    className={'flex-row-reverse border-2'}
                                    value={filters[column.accessor]}
                                    options={uniqueValues[column.accessor].map(uv => ({key: uv, label: uv}))}
                                    onChange={e => {
                                        if(setExtFilterValues) setExtFilterValues({...filters, [column.accessor]: e.map(e1 => e1.key)});

                                        setFilters({...filters, [column.accessor]: e.map(e1 => e1.key)})
                                    }}
                                    noLabel={true}
                                />
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}