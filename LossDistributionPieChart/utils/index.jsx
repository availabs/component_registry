import React from "react";
import get from "lodash/get.js";

export const ProcessDataForMap = (data=[], disasterNames) =>  {
    const years = [...new Set(data.map(d => d.year))];
    const swdTotal = {swd_tpd: 0, swd_tcd: 0, swd_ttd: 0};
    const ofdTotal = {ofd_tpd: 0, ofd_tcd: 0, ofd_ttd: 0};

    years.map(year => {
        data
            .filter(d => d.year === year)
            .reduce((acc, d) => {
                const nri_category = d.nri_category;
                const tmpDn = d.disaster_number === 'SWD' ? 'Non-declared Disasters' :
                    get(disasterNames, [d.disaster_number], 'No Title') + ` (${d.disaster_number} - ${nri_category})`;
                const tmpPd = +d.fusion_property_damage || 0,
                    tmpCd =  +d.fusion_crop_damage || 0,
                    tmptd = tmpPd + tmpCd + (+d.swd_population_damage || 0);

                if(tmpDn.includes('Non-declared Disasters')){
                    swdTotal.swd_tpd += tmpPd;
                    swdTotal.swd_tcd += tmpCd;
                    swdTotal.swd_ttd += tmptd;
                }else{
                    ofdTotal.ofd_tpd += tmpPd;
                    ofdTotal.ofd_tcd += tmpCd;
                    ofdTotal.ofd_ttd += tmptd;
                }
            }, {});
    });

    return { total: [{...swdTotal, ...ofdTotal, ...{ "year": "Loss Distribution" }}] };
};

