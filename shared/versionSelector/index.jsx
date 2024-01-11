import React, {useEffect, useMemo} from "react"
import get from "lodash/get";
import { useFalcor } from '~/modules/avl-falcor';
import {pgEnv} from "~/utils/index.js";
import {getAttributes, SourceAttributes, ViewAttributes} from "~/utils/attributes.jsx";

export default function VersionSelector ({ source_id, view_id, onChange}) {
    const { falcor, falcorCache } = useFalcor();

    useEffect(() => {
        async function fetchData() {
            console.time("fetch data");
            const lengthPath = ["dama", pgEnv, "sources", "byId", source_id, "views", "length"];
            const resp = await falcor.get(lengthPath);
            let data = await falcor.get(
                [
                    "dama", pgEnv, "sources", "byId", source_id, "views", "byIndex",
                    { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
                    "attributes", Object.values(ViewAttributes)
                ],
                [
                    "dama", pgEnv, "sources", "byId", source_id,
                    "attributes", Object.values(SourceAttributes)
                ],
                [
                    "dama", pgEnv, "sources", "byId", source_id, "meta"
                ]
            );
            console.timeEnd("fetch data");
            return data;
        }

        fetchData();
    }, [source_id, falcor, pgEnv]);

    const views = useMemo(() => {
        return Object.values(get(falcorCache, ["dama", pgEnv, "sources", "byId", source_id, "views", "byIndex"], {}))
            .map(v => getAttributes(get(falcorCache, v.value, { "attributes": {} })["attributes"]));
    }, [falcorCache, source_id, pgEnv]);


    return (
        <div className="w-full">
            <div className="relative flex justify-between">
                <label className={'shrink-0 pr-2 py-1 my-1'}>Select a Version:</label>
                <div className={`flex w-full shrink my-1`}>
                    <select
                        className='bg-slate-100 p-2 w-full border-b'
                        value={view_id}
                        onChange={e => onChange(parseInt(e.target.value))}
                    >
                        <option key={'select a version'} selected="true" disabled="disabled" className="ml-2  truncate">Select a
                            Version
                        </option>
                        {
                            views
                                .sort((a, b) => b.view_id - a.view_id)
                                .map((v, i) => (
                                    <option key={i} value={v.view_id} className="ml-2  truncate">{v.version}</option>
                                ))
                        }
                    </select>
                </div>
            </div>
        </div>
    )
}
