import React, {useState} from "react";
import {Table} from "~/modules/avl-components/src";
import { fnum } from "~/utils/macros.jsx";
import {getNestedValue, mapColName} from "../utils.js";
import {RenderExternalTableFilter} from "../../shared/externalTableFilter.jsx";


export const FormsTable = ({
    data=[],
    columns=[],
    hiddenCols=[],
    filterValue = {},
    pageSize,
    sortBy = {},
    baseUrl,
    attributionData,
    striped,
    fetchData,
    extFiltersDefaultOpen,
    extFilterValues = {},
    setExtFilterValues,
}) => {
    const [filters, setFilters] = useState(extFilterValues);

    const updatedColumns =
        columns
            .filter(c => !hiddenCols.includes(c.name) && !c.openOut)
            .map(c => {
        return {
            ...c,
            Cell: cell => {
                let value = getNestedValue(cell.value);
                value =
                    ['integer', 'number'].includes(cell.column.type) ?
                        fnum(value || 0, c.isDollar) :
                        Array.isArray(value) ? value.join(', ') : value
                if(typeof value === 'object') return  <div></div>
                return( <div>{value}</div>);
            }
        }
    })
    const sortColRaw = updatedColumns.find(c => c.name === Object.keys(sortBy)?.[0])?.accessor;

    const filteredData = data.filter(row =>
        !Object.keys(filterValue || {}).length ||
        Object.keys(filterValue)
            .reduce((acc, col) => {
                const mappedName = mapColName(columns, col)
                const value = getNestedValue(row[mappedName]);
                return acc && value?.toString().toLowerCase().includes(filterValue[col]?.toLowerCase())
            }, true))
        .filter(row => !Object.keys(filters)?.length ||
            Object.keys(filters)
                .filter(f => filters[f].length)
                .reduce((acc, col) => {
                    const currentCol = columns.find(c => c.accessor === col);
                    const originalValue = currentCol.openOut ? row.expand?.find(r => r.accessor === col).originalValue : row[col];
                    const value = getNestedValue(originalValue);
                    return acc && (
                        filters[col].includes(value) ||
                            (
                                Array.isArray(value) &&
                                    value.find(v => filters[col].includes(v))
                            )
                    );
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
            <div className={'py-5'}>
                <Table
                    columns={updatedColumns}
                    data={filteredData}
                    initialPageSize={pageSize}
                    pageSize={pageSize}
                    striped={striped}
                    sortBy={sortColRaw}
                    sortOrder={Object.values(sortBy)?.[0] || 'asc'}
                    fetchData={fetchData}
                />
            </div>
            {/*<Attribution baseUrl={baseUrl} attributionData={attributionData} />*/}
        </>
    )
};