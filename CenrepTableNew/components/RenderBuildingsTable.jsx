import React, {useState} from "react";
import {Table} from "~/modules/avl-components/src";
import {fnum} from "../../utils/macros.jsx";
import {Attribution} from "../../shared/attribution.jsx";
import {RenderExternalTableFilter} from "../../shared/externalTableFilter.jsx";
import {Link} from "react-router";
import {formatFunctions} from "../../shared/formatFunctions.js";

const colAccessNameMapping = {
    'disaster_number': 'distinct disaster_number as disaster_number',
}

const getNestedValue = (obj) => typeof obj?.value === 'object' ? getNestedValue(obj.value) : obj?.value || obj;
const getNestedRawValue = (obj) =>
        obj.originalValue ? obj.originalValue :
            obj.value ? getNestedRawValue(obj.value) : obj;

const formatNameForURL = name =>
    name?.toString()?.toLowerCase()?.replace(' (county)', '')?.replace('.', '')?.replace(/ /g, '_');

export const RenderBuildingsTable = ({
                                         data = [],
                                         columns = [],
                                         filterValue = {},
                                         extFilterValues = {},
                                         setExtFilterValues,
                                         pageSize,
                                         sortBy = {},
                                         baseUrl,
                                         attributionData,
                                         striped,
                                         fetchData,
                                         extFiltersDefaultOpen,
                                         hiddenCols,
                                         showCsvDownload
                                     }) => {
    const [filters, setFilters] = useState(extFilterValues);

    const updatedColumns = columns
        .filter(c => !hiddenCols.includes(c.name) && !c.openOut)
        .map(c => {
        return {
            ...c,
            Cell: cell => {
                const originalValue = getNestedValue(cell.value);
                const urlSuffix = cell.column.name === 'geoid' ? formatNameForURL(originalValue) : originalValue;
                // const rawValue = getNestedRawValue(cell.value);

                let value =
                    cell.column.formatFn && formatFunctions[cell.column.formatFn] ?
                        formatFunctions[cell.column.formatFn](originalValue, c.isDollar) :
                            Array.isArray(originalValue) ? originalValue.join(', ') : originalValue;

                if (typeof value === 'object') return <div></div>
                return (c.link?.isLink ? <Link to={`${c.link?.location || ''}${urlSuffix}`}>{c.link?.linkText || value}</Link> : <div>{value}</div>);
            }
        }
    })
    const sortColRaw = updatedColumns.find(c => c.accessor === Object.keys(sortBy)?.[0])?.accessor;

    const filteredData =
        data
    //         .filter(row =>
    //     !Object.keys(filterValue || {}).length ||
    //     Object.keys(filterValue)
    //         .reduce((acc, col) => {
    //             const value = getNestedValue(row[col]);
    //             return acc && value?.toString().toLowerCase().includes(filterValue[col]?.toLowerCase())
    //         }, true)
    // )
        .filter(row => !Object.keys(filters)?.length ||
            Object.keys(filters)
                .filter(f => filters[f].length)
                .reduce((acc, col) => {
                    const currentCol = columns.find(c => c.accessor === col);
                    const originalValue = currentCol.openOut ? row.expand?.find(r => r.accessor === col) : row[col];
                    const value = getNestedValue(originalValue);
                    return acc && filters[col].includes(value);
                }, true)
        )
    return (
        <>
            <RenderExternalTableFilter
                defaultOpen={extFiltersDefaultOpen}
                columns={columns.filter(c => c.extFilter)}
                data={data}
                filters={filters}
                setFilters={setFilters}
                setExtFilterValues={setExtFilterValues}
            />
            <div className={'py-1'}>
                <Table
                    columns={updatedColumns}
                    data={filteredData}
                    initialPageSize={pageSize}
                    pageSize={pageSize}
                    striped={striped}
                    sortBy={Object.keys(sortBy)[0]}
                    sortOrder={Object.values(sortBy)?.[0] || 'asc'}
                    csvDownload={showCsvDownload}
                    fetchData={fetchData}
                />
            </div>
            <Attribution baseUrl={baseUrl} attributionData={attributionData}/>
        </>
    )
};