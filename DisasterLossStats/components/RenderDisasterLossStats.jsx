import React, {useMemo} from "react";
import {fnumIndex} from "../../utils/macros.jsx";
import {Link} from "react-router";
import {Attribution} from "../../shared/attribution.jsx";

const blockClass = `w-full h-[90px] bg-white p-1 text-center flex flex-col`,
    blockLabelClass = `border-b-2`,
    blockValueClass = `font-medium text-xl pt-2`

const RenderLoss = ({totalLoss, ihpLoss, paLoss, sbaLoss, nfipLoss, usdaLoss}) => (
    <>
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
    </>
)

const RenderFunding = ({totalFunding, ihpFunding, paFunding, sbaFunding, hmgpFunding}) => (
    <>
        <div className={blockClass}>
            <label className={blockLabelClass}>Total Funding</label>
            <span className={blockValueClass}>{
                fnumIndex(totalFunding, 2, true)
            }</span>
        </div>
        <div className={blockClass}>
            <label className={blockLabelClass}>IHP Funding</label>
            <span className={blockValueClass}>{
                fnumIndex(ihpFunding, 2, true)
            }</span>
        </div>
        <div className={blockClass}>
            <label className={blockLabelClass}>PA Funding</label>
            <span className={blockValueClass}>{
                fnumIndex(paFunding, 2, true)
            }</span>
        </div>
        <div className={blockClass}>
            <label className={blockLabelClass}>SBA Funding</label>
            <span className={blockValueClass}>{
                fnumIndex(sbaFunding, 2, true)
            }</span>
        </div>
        <div className={blockClass}>
            <label className={blockLabelClass}>HMGP Funding</label>
            <span className={blockValueClass}>{
                fnumIndex(hmgpFunding, 2, true)
            }</span>
        </div>
    </>
)
export const RenderDisasterLossStats = ({
                                            type, 
                                            totalLoss, ihpLoss, paLoss, sbaLoss, nfipLoss, usdaLoss,
                                            totalFunding, ihpFunding, paFunding, sbaFunding, hmgpFunding,
                                            attributionData, baseUrl
                                        }) => {
    const colsByType = {
        'loss': 6,
        'funding': 5
    }
    return (
        <React.Fragment>
            <div className={`w-full grid grid-cols-${colsByType[type]} gap-4 place-content-stretch mt-5`}>
                {
                    type === 'loss' ? 
                        <RenderLoss 
                            totalLoss={totalLoss} 
                            ihpLoss={ihpLoss}
                            paLoss={paLoss}
                            sbaLoss={sbaLoss}
                            nfipLoss={nfipLoss} 
                            usdaLoss={usdaLoss} 
                        /> :
                        <RenderFunding
                            totalFunding={totalFunding}
                            ihpFunding={ihpFunding}
                            paFunding={paFunding}
                            sbaFunding={sbaFunding}
                            hmgpFunding={hmgpFunding}
                        />
                }
            </div>
            <Attribution baseUrl={baseUrl} attributionData={attributionData}/>
        </React.Fragment>
    )
};