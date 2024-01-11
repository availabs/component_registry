import VersionSelectorSearchable from "./searchable.jsx";
import React, {useState} from "react";
import {DisplayToggle} from "./components/displayToggle.jsx";

export const VersionSelectorMulti = ({
                                    className,
                                    versions = {}, // {srcId1: versionId, srcId2: versionId,...}
                                    onChange
                                }) => {
    const dataSources = Object.keys(versions) || [];
    const [showSelector, setShowSelector] = useState(false);

    return (
        <>
            <DisplayToggle showSelector={showSelector} setShowSelector={setShowSelector} hide={false}/>
            {
                dataSources.map(ds => (
                    <VersionSelectorSearchable
                        controlDisplay={true}
                        showSelectorControl={showSelector}
                        source_id={ds}
                        view_id={versions?.[ds]}
                        onChange={v => onChange({...(versions || {}), [ds]: v})}
                        // label={} // pass source names to better explain which source the selector belongs to
                        className={className}
                    />
                ))
            }
        </>
    )
}