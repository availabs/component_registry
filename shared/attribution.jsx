import {Link} from "react-router-dom";
import {formatDate} from "~/utils/macros.jsx";
import React from "react";

export const Attribution = ({baseUrl = '/', attributionData}) => (
    <div className={'flex flex-row text-xs text-gray-700 p-1'}>
        <label>Attribution:</label>
        <div className={'flex flex-col pl-1'}>
            {
                (Array.isArray(attributionData) ? attributionData : [attributionData])
                    ?.map(d => (
                            <Link
                                to={`/${baseUrl}/cenrep/source/${d?.source_id}/versions/${d?.view_id}`.replace('///', '/')}
                                key={`link-${d?.view_id}`}
                            >
                                {d?.version} ({formatDate(d?._modified_timestamp?.value || d?._modified_timestamp)})
                            </Link>
                    ))
            }
        </div>
    </div>
)