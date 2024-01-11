import React, {useMemo} from "react";
import get from "lodash/get";
import {Link} from "react-router-dom";
import {Table} from "~/modules/avl-components/src";
import { fnum } from "~/utils/macros.jsx";
import {hazardsMeta} from "~/utils/colors.jsx";
import {Attribution} from "../../shared/attribution.jsx";

const colAccessNameMapping = {
    'disaster_number': 'distinct disaster_number as disaster_number',
}

const getNestedValue = (obj) => typeof obj?.value === 'object' ? getNestedValue(obj.value) : obj?.value || obj;

export const RenderBuildingsTable = ({
   data=[],
   columns=[],
   filterValue = {},
   pageSize,
   sortBy = {},
   baseUrl,
   attributionData,
    striped,
    fetchData
}) => {
    const updatedColumns = columns.map(c => {
        return {
            ...c,
            Cell: cell => {
                let value = getNestedValue(cell?.value);
                value = ['integer', 'number'].includes(cell?.column?.type) ?  fnum(value || 0, c?.isDollar) : value

                return( <div>{value}</div>);
            }
        }
    })
    const sortColRaw = updatedColumns.find(c => c.accessor === Object.keys(sortBy)?.[0])?.accessor;

    const filteredData = data.filter(row =>
        !Object.keys(filterValue || {}).length ||
        Object.keys(filterValue)
            .reduce((acc, col) => {
                const value = getNestedValue(row[col]);
                return acc && value?.toString().toLowerCase().includes(filterValue[col]?.toLowerCase())
            }, true)
    )
    return (
        <>
            <div className={'py-5'}>
                {
                    Object.values(filteredData[0] || {}).find(v => typeof v === 'object') ?
                        'Something went wrong. Please try changing the selection / settings.' :
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
                }
            </div>
            <Attribution baseUrl={baseUrl} attributionData={attributionData} />
        </>
    )
};