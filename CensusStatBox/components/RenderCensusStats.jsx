import React, {useMemo} from "react";
import {fnumIndex} from "~/utils/macros.jsx";
import {Link} from "react-router-dom";
import {Attribution} from "../../shared/attribution.jsx";
import {fnum} from "~/utils/macros.jsx";

const blockClass = `bg-slate-100 p-5 text-center flex flex-col border rounded-md`

export const RenderCensusStats = ({
    title, value, change, year, compareYear, invertColors, valuePrefix, valueSuffix, maximumFractionDigits=2
}) => {
   return (
       <div className={blockClass}>
           <label className={'text-sm'}>{title}</label>
           <label className={'text-3xl font-bold'}>
               { value && valuePrefix }
               { value ? value.toLocaleString('en-us',{maximumFractionDigits: maximumFractionDigits}) : "This census data variable is not available at this geography." }
               { value && valueSuffix }
               {/*{fnum(value)}*/}
           </label>
           <span className={`text-sm font-bold ${change > 0 && invertColors ? 'text-red-500' : 'text-green-500'}`}>{Math.abs(change)}% {change > 0 ? 'Growth' : 'Decline'}</span>
           <span className={`text-xs  justify-left`}>{year} vs {compareYear}</span>
       </div>
   )
};