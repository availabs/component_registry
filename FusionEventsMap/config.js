export const metaData = {
    fusion: {
        title: 'Fusion Losses',
        type: 'fusion',
        columns: {
            'Property Loss': 'sum(fusion_property_damage) as property_damage',
            'Crop Loss': 'sum(fusion_crop_damage) as crop_damage',
            'Population Loss': 'sum(swd_population_damage) * 11000000 as population_damage',
            'Deaths, Injuries': 'sum(COALESCE(deaths_direct, 0) + COALESCE(deaths_indirect, 0) + COALESCE(injuries_direct, 0) + COALESCE(injuries_indirect, 0)) as deaths_injuries',
            'Total Loss': 'sum(COALESCE(fusion_property_damage, 0) + COALESCE(fusion_crop_damage, 0)) as total_loss',
            'Total Loss (incl Population)': 'sum(COALESCE(fusion_property_damage, 0) + COALESCE(fusion_crop_damage, 0) + (COALESCE(swd_population_damage, 0) * 11000000)) as total_loss_with_pop',
        },
        rawColumns: {
            'Property Loss': 'fusion_property_damage',
            'Crop Loss': 'fusion_crop_damage',
            'Population Loss': 'swd_population_damage',
            'Deaths, Injuries': 'COALESCE(deaths_direct, 0) + COALESCE(deaths_indirect, 0) + COALESCE(injuries_direct, 0) + COALESCE(injuries_indirect, 0)',
            'Total Loss': 'COALESCE(fusion_property_damage, 0) + COALESCE(fusion_crop_damage, 0)',
            'Total Loss (incl Population)': 'COALESCE(fusion_property_damage, 0) + COALESCE(fusion_crop_damage, 0) + COALESCE(swd_population_damage, 0)',
        },
        // paintFn: (d) => d && +d.ihp_loss + +d.pa_loss + +d.sba_loss + +d.nfip_loss + +d.fema_crop_damage
    }
};