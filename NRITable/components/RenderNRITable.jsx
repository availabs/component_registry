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

export const RenderNRITable = ({ data=[], columns=[], nriAttributes, filterValue = {}, pageSize, sortBy = {}, baseUrl, attributionData, geoid, striped }) => {
    const updatedColumns = columns.map(c => {
        const Header = c.Header;
        return {
            ...c,
            Cell: cell => {
                let value = getNestedValue(cell.value);
                value = c.isText ? value : fnum(value || 0, c.isDollar)

                return( <div>{value}</div>);
            }
        }
    })
    const sortColRaw = updatedColumns.find(c => c.Header === Object.keys(sortBy)?.[0])?.accessor;

    const filteredData = data.filter(row =>
        !Object.keys(filterValue || {}).length ||
        Object.keys(filterValue)
            .reduce((acc, col) => {
                const rawColName = nriAttributes.find(c => c.label === col)?.value;
                const value = getNestedValue(row[rawColName]);
                return acc && value?.toString().toLowerCase().includes(filterValue[col]?.toLowerCase())
            }, true)
    )
    return (
        <>
            <div className={'py-5'}>
                {
                    data?.length > 0 && columns?.length > 0 && (
                        <Table
                            columns={updatedColumns}
                            data={filteredData}
                            initialPageSize={pageSize}
                            pageSize={pageSize}
                            striped={striped}
                            sortBy={sortColRaw}
                            sortOrder={Object.values(sortBy)?.[0] || 'asc'}
                        />
                    )
                }
            </div>
            <Attribution baseUrl={baseUrl} attributionData={attributionData} />
        </>
    )
};