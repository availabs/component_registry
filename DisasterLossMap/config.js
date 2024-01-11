export const metaData = {
    total_losses: {
        title: 'Total Losses',
        type: 'disaster_loss_summary',
        columns: {
            'IHP Loss': 'ihp_loss',
            'PA Loss': 'pa_loss',
            'SBA Loss': 'sba_loss',
            'NFIP Loss': 'nfip_loss',
            'USDA Loss': 'fema_crop_damage'
        },
        paintFn: (d) => d && +d.ihp_loss + +d.pa_loss + +d.sba_loss + +d.nfip_loss + +d.fema_crop_damage
    },
    ihp: {
        title: 'IHP Losses',
        type: 'individuals_and_households_program_valid_registrations_v1',
        columns: ['rpfvl', 'ppfvl'],
        paintFn: (d) => d && d.rpfvl + d.ppfvl
    },
    pa: {
        title: 'Project Amount',
        type: 'public_assistance_funded_projects_details_v1',
        geoColumn: `lpad(state_number_code::text, 2, '0') || lpad(county_code::text, 3, '0')`,
        columns: {
            'Project Amount': 'project_amount'
        }
    },
    sba: {
        title: 'SBA Verified Loss',
        type: 'sba_disaster_loan_data_new',
        disasterNumberColumn: 'fema_disaster_number',
        columns: {
            'Total Verified Loss': 'total_verified_loss'
        }
    },
    nfip: {
        title: 'NFIP Amount Paid',
        type: 'fima_nfip_claims_v1_enhanced',
        mapGeoidToName: true,
        columns: {
            'Total Amount Paid': 'total_amount_paid'
        }
    },
    usda: {
        title: 'USDA Indemnity Amount',
        type: 'usda_crop_insurance_cause_of_loss_enhanced',
        columns: {
            'Indemnity Amount': 'indemnity_amount'
        }
    },
    declared: {
        title: '',
        type: 'disaster_declarations_summaries_v2',
        geoColumn: 'fips_state_code || fips_county_code',
        columns: {},
        paintFn: d => d.geoid ? 1 : 0,
        legend: false,
        colors: ['#fba819']
    },
};