import React, {useMemo} from "react";
import get from "lodash/get";
import {Link} from "react-router-dom";
import {Table} from "~/modules/avl-components/src";
import { fnum } from "~/utils/macros.jsx";
import {formatDate} from "~/utils/macros.jsx";
import {Attribution} from "../../shared/attribution.jsx";

const blockLabelClass = `border-b-2`,
    blockValueClass = `font-medium pt-2 text-xl`;

export const RenderDisasterInfoStats = ({ disasterNumber, title, incidentType, declarationDate, endDate, attributionData, baseUrl }) => {
   return (
       <React.Fragment>
           <div className={"w-full shrink-1 flex flex-col mr-5"}>

               <div className={"w-full h-[70px] font-bold flex items-center text-3xl"}>
                   {title} { disasterNumber ? `(${disasterNumber})` : null}
               </div>

               <div className={"w-full  text-center flex flex-row "}>

                   <div className={"w-full h-[90px] bg-white p-3 mt-5 flex flex-col"}>
                       <label className={blockLabelClass}>Category</label>
                       <span
                           className={blockValueClass}>{incidentType}</span>
                   </div>

                   <div className={"w-full h-[90px] bg-white p-3 mt-5 ml-5 flex flex-col"}>
                       <label className={blockLabelClass}>Incident Date</label>
                       <span
                           className={blockValueClass}>{formatDate(declarationDate)} {endDate && formatDate(declarationDate) !== formatDate(endDate) ? `- ${formatDate(endDate)}` : '' }</span>
                   </div>

               </div>
           </div>
           <Attribution baseUrl={baseUrl} attributionData={attributionData} />
       </React.Fragment>
   )
};