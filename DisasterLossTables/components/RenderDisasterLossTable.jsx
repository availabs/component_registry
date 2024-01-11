import React, {useMemo} from "react";
import {fnumIndex} from "~/utils/macros.jsx";
import {Table} from "~/modules/avl-components/src/index.js";
import {Link} from "react-router-dom";
import {formatDate} from "~/utils/macros.jsx";
import {cellFormat} from '../utils.jsx'
import {Attribution} from "../../shared/attribution.jsx";
import {metaData} from "../config.js";

const getNestedValue = (obj) => typeof obj?.value === 'object' ? getNestedValue(obj.value) : obj?.value || obj;

export const RenderDisasterLossTable = ({ geoid, data=[], columns=[], pageSize, sortBy={}, filterValue = {}, striped, attributionData, baseUrl, type }) => {
    const sortColRaw = columns.find(c => c.Header === Object.keys(sortBy)?.[0])?.accessor;
    const filteredData = data.filter(row => {
        return  !Object.keys(filterValue || {}).length ||
            Object.keys(filterValue)
                .reduce((acc, col) => {
                    const rawCol = metaData[type]?.attributes(geoid)[col];
                    const value = getNestedValue(row[rawCol]);
                    return acc && value?.toString().toLowerCase().includes(filterValue[col]?.toLowerCase())
                }, true)
    })
   return (
       <div className={'py-5 flex flex-col'}>
               {
                   data?.length > 0 && columns?.length > 0 && (
                       <Table
                           columns={
                               columns.map(c =>( {...c, ...{Cell: cell => cellFormat(cell, type, c.Header)}}))
                       }
                           data={filteredData}
                           initialPageSize={pageSize}
                           pageSize={pageSize}
                           striped={striped}
                           sortBy={sortColRaw}
                           sortOrder={Object.values(sortBy)?.[0] || 'asc'}
                       />
                   )
               }
           <Attribution baseUrl={baseUrl} attributionData={attributionData} />
       </div>
   )
};