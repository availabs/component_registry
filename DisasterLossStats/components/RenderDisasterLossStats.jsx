import React, {useMemo} from "react";
import {fnumIndex} from "~/utils/macros.jsx";
import {Link} from "react-router-dom";
import {Attribution} from "../../shared/attribution.jsx";

const blockClass = `w-full h-[90px] bg-white p-1 text-center flex flex-col`,
    blockLabelClass = `border-b-2`,
    blockValueClass = `font-medium text-xl pt-2`

export const RenderDisasterLossStats = ({
                                            totalLoss, ihpLoss, paLoss, sbaLoss,
                                            nfipLoss, usdaLoss, hmgpFunding,
                                            attributionData, baseUrl
}) => {
   return (
       <React.Fragment>
           <div className={"w-full grid grid-cols-7 gap-4 place-content-stretch mt-5"}>
               <div className={blockClass}>
                   <label className={blockLabelClass}>Total Loss</label>
                   <span className={blockValueClass}>{
                       fnumIndex(totalLoss, 2, true)
                   }</span>
               </div>
               <div className={blockClass}>
                   <label className={blockLabelClass}>IHP Loss</label>
                   <span className={blockValueClass}>{
                       fnumIndex(ihpLoss, 2, true)
                   }</span>
               </div>
               <div className={blockClass}>
                   <label className={blockLabelClass}>PA Loss</label>
                   <span className={blockValueClass}>{
                       fnumIndex(paLoss, 2, true)
                   }</span>
               </div>
               <div className={blockClass}>
                   <label className={blockLabelClass}>SBA Loss</label>
                   <span className={blockValueClass}>{
                       fnumIndex(sbaLoss, 2, true)
                   }</span>
               </div>
               <div className={blockClass}>
                   <label className={blockLabelClass}>NFIP Loss</label>
                   <span className={blockValueClass}>{
                       fnumIndex(nfipLoss, 2, true)
                   }</span>
               </div>
               <div className={blockClass}>
                   <label className={blockLabelClass}>USDA Loss</label>
                   <span className={blockValueClass}>{
                       fnumIndex(usdaLoss, 2, true)
                   }</span>
               </div>
               <div className={blockClass}>
                   <label className={`${blockLabelClass}`}>HMGP Funding</label>
                   <span className={blockValueClass}>{
                       fnumIndex(hmgpFunding, 2, true)
                   }</span>
               </div>
           </div>
           <Attribution baseUrl={baseUrl} attributionData={attributionData} />
       </React.Fragment>
   )
};