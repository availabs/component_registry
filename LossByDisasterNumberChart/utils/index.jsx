import React from "react";
import get from "lodash/get.js";
import {hazardsMeta} from "~/utils/colors.jsx";

export const ProcessDataForMap = (data=[], disasterNames) => {
    const years = [...new Set(data.map(d => d.year))];
    const disaster_numbers = new Set(['Non-declared Disasters']);
    const event_ids = new Set();
    const swdTotal = {swd_tpd: 0, swd_tcd: 0, swd_ttd: 0};
    const ofdTotal = {ofd_tpd: 0, ofd_tcd: 0, ofd_ttd: 0};

    const processed_data = years.map(year => {
        const swdTotalPerYear = {swd_pd: 0, swd_cd: 0, swd_td: 0};
        const ofdTotalPerYear = {ofd_pd: 0, ofd_cd: 0, ofd_td: 0};

        const lossData = data
            .filter(d => d.year === year)
            .reduce((acc, d) => {
                const nri_category = d.nri_category;
                const tmpDn = d.disaster_number === 'SWD' ? 'Non-declared Disasters' :
                    get(disasterNames, [d.disaster_number], 'No Title') + ` (${d.disaster_number} - ${hazardsMeta[nri_category]?.name || nri_category})`;
                const tmpPd = +d.fusion_property_damage || 0,
                    tmpCd =  +d.fusion_crop_damage || 0,
                    tmptd = tmpPd + tmpCd + (+d.swd_population_damage || 0);

                if(tmpDn.includes('Non-declared Disasters')){
                    event_ids.add(tmpDn.split('_')[1]);
                    swdTotalPerYear.swd_pd += tmpPd;
                    swdTotalPerYear.swd_cd += tmpCd;
                    swdTotalPerYear.swd_td += tmptd;

                    swdTotal.swd_tpd += tmpPd;
                    swdTotal.swd_tcd += tmpCd;
                    swdTotal.swd_ttd += tmptd;
                }else{
                    disaster_numbers.add(tmpDn);
                    ofdTotalPerYear.ofd_pd += tmpPd;
                    ofdTotalPerYear.ofd_cd += tmpCd;
                    ofdTotalPerYear.ofd_td += tmptd;

                    ofdTotal.ofd_tpd += tmpPd;
                    ofdTotal.ofd_tcd += tmpCd;
                    ofdTotal.ofd_ttd += tmptd;
                }

                return {
                    ...acc, ...{
                        [`${tmpDn}_pd`]: (acc[[`${tmpDn}_pd`]] || 0) + tmpPd,
                        [`${tmpDn}_cd`]: (acc[`${tmpDn}_cd`] || 0) + tmpCd,
                        [`${tmpDn}_td`]: (acc[`${tmpDn}_td`] || 0) + tmptd,
                        [`${tmpDn}_nri_category`]: nri_category
                    }
                };
            }, {});
        return { year, ...lossData, ...swdTotalPerYear, ...ofdTotalPerYear };
    });

    return { processed_data, total: [{...swdTotal, ...ofdTotal, ...{ "year": "Loss Distribution" }}], disaster_numbers: [...disaster_numbers], event_ids: [...event_ids] };
};

