import { fnum } from "~/utils/macros.jsx";
import React from "react";
import get from "lodash/get";
import {Link} from "react-router-dom";
import {Attribution} from "../../shared/attribution.jsx";

export const RenderStatBoxes = ({ total, numDeclaredEvents, numNonDeclaredEvents, attributionData, baseUrl }) => {
    const blockClass = `w-full bg-slate-100 p-5 text-center flex flex-col`,
        blockLabelClass = `border-b-2`,
        blockValueClass = `font-medium text-xl pt-2`;
    return (
        <React.Fragment>
            <div className={"w-full my-1 grid grid-cols-1 md:grid-cols-2 gap-10 place-content-stretch content-center "}>
                <div className={blockClass}>
                    <label className={`${ blockLabelClass } border-blue-300`}>
                        # FEMA Declared Disasters
                    </label>
                    <span className={blockValueClass}>
            {get(total, [0, "ofd_ttd"], 0) === 0 ? 0 : fnum(numDeclaredEvents)}
          </span>
                </div>

                <div className={blockClass}>
                    <label className={`${ blockLabelClass } border-blue-300`}>
                        FEMA Declared Loss
                    </label>
                    <span className={blockValueClass}>
            {fnum(get(total, [0, "ofd_ttd"], 0), true)}
          </span>
                </div>

                <div className={blockClass}>
                    <label className={`${ blockLabelClass } border-red-300`}>
                        # Non Declared Events
                    </label>
                    <span className={blockValueClass}>
            {fnum(numNonDeclaredEvents)}
          </span>
                </div>

                <div className={blockClass}>
                    <label className={`${ blockLabelClass } border-red-300`}>
                        Non Declared Loss
                    </label>
                    <span className={blockValueClass}>
              {fnum(get(total, [0, "swd_ttd"], 0), true)}
          </span>
                </div>

            </div>
            <Attribution baseUrl={baseUrl} attributionData={attributionData} />
        </React.Fragment>
    );
};