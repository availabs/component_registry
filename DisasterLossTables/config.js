export const metaData = {
    ihp: {
        type: 'individuals_and_households_program_valid_registrations_v1',
        attributes: ({geoid}) => ({
            [geoid?.toString()?.length === 5 ? "Damaged City" : "County"]: geoid?.toString()?.length === 5 ? "damaged_city" : "county",
            "# Claims": "count(1) as num_claims",
            "Assessed Building Damage": "sum(rpfvl) as rpfvl",
            "Assessed Contents Damage": "sum(ppfvl) as ppfvl",
            "Housing Assistance": "sum(ha_amount) as ha_amount",
            "Total Amount": "sum(ihp_amount) as ihp_amount",
            "Other Needs Assistance": "sum(ona_amount) as ona_amount"
        }),
        options: ({disasterNumber, geoid}) => ({
            aggregatedLen: true,
            filter: {
                ...disasterNumber && {"disaster_number": [disasterNumber]},
                ...geoid && {[`substring(geoid, 1, ${geoid?.toString()?.length})`]: [geoid]}
            },
            groupBy: [geoid?.toString()?.length === 5 ? 'damaged_city' : 'county']
        }),
        textCols: ['County', 'Damaged City'],
        numCols: ['# Claims'],
        anchorCols: ['County', 'Damaged City']
    },
    pa: {
        type: 'public_assistance_funded_projects_details_v1',
        attributes: ({disasterNumber}) => ({
            ...!disasterNumber && {'Disaster Number': "disaster_number"},
            "County": "county",
            "Damage Category": "damage_category",
            "# Projects": "count(1) as num_projects",
            "Project Amount": "sum(project_amount) as project_amount",
            "Federal Share Obligated": "sum(federal_share_obligated) as federal_share_obligated",
            "Total Obligated": "sum(total_obligated) as total_obligated"
        }),
        options: ({disasterNumber, geoid}) => ({
            aggregatedLen: true,
            filter: {
                ...disasterNumber && {"disaster_number": [disasterNumber]},
                ...geoid && {[`substring(lpad(state_number_code::text, 2, '0') || lpad(county_code::text, 3, '0'), 1, ${geoid?.toString()?.length})`]: [geoid]}
            },
            exclude: {
                dcc: ["A", "B", "Z"]
            },
            groupBy: !disasterNumber ? ['disaster_number', "county", 'damage_category'] : ["county", 'damage_category']
        }),
        textCols: ["Disaster Number", "County", "Damage Category"],
        numCols: ["# Projects"],
        anchorCols: ['County']
    },
    sba: {
        type: 'sba_disaster_loan_data_new',
        attributes: ({geoid, disasterNumber}) => ({
            ...!disasterNumber && {'Disaster Number': "fema_disaster_number"},
            [geoid?.toString()?.length === 5 ? "City" : "County / Parish"]: geoid?.toString()?.length === 5 ? "damaged_property_city_name" : "damaged_property_county_or_parish_name",
            "# Loans": "count(1) as num_loans",
            "Verified Loss": "sum(total_verified_loss) as total_verified_loss",
            "Verified Loss Real Estate": "sum(verified_loss_real_estate) as verified_loss_real_estate",
            "Verified Loss Content": "sum(verified_loss_content) as verified_loss_content",
            "Loan Approved Total": "sum(total_approved_loan_amount) as total_approved_loan_amount",
            "Loan Approved Real Estate": "sum(approved_amount_real_estate) as approved_amount_real_estate",
            "Loan Approved Content": "sum(approved_amount_content) as approved_amount_content",
            "Loan approved Economic Injury (EIDL)": "sum(approved_amount_eidl) as approved_amount_eidl"
        }),
        options: ({disasterNumber, geoid}) => ({
            aggregatedLen: true,
            filter: {
                ...disasterNumber && {"fema_disaster_number": [disasterNumber]},
                ...geoid && {[`substring(geoid, 1, ${geoid?.toString()?.length})`]: [geoid]}
            },
            groupBy: [
                ...!disasterNumber ? ['fema_disaster_number'] : [],
                ...[geoid?.toString()?.length === 5 ? "damaged_property_city_name" : "damaged_property_county_or_parish_name"]
            ]
        }),
        textCols: ["Disaster Number", "City", "County / Parish"],
        numCols: ["# Loans"],
        anchorCols: ["City", "County / Parish"]
    },
    nfip: {
        type: 'fima_nfip_claims_v1_enhanced',
        mapGeoidToName: true,
        attributes: ({disasterNumber}) => ({
            ...!disasterNumber && {'Disaster Number': "disaster_number"},
            "County": "geoid",
            "# Claims": "count(1) as num_claims",
            "Amount Paid on Building Claim": "sum(amount_paid_on_building_claim) as amount_paid_on_building_claim",
            "Amount Paid on Contents Claim": "sum(amount_paid_on_contents_claim) as amount_paid_on_contents_claim",
            "Amount Paid on Increased Cost of Compliance": "sum(amount_paid_on_increased_cost_of_compliance_claim) as amount_paid_on_increased_cost_of_compliance_claim",
            "Total Amount Paid": "sum(total_amount_paid) as total_amount_paid"
        }),
        options: ({disasterNumber, geoid}) => ({
            aggregatedLen: true,
            filter: {
                ...disasterNumber && {"disaster_number": [disasterNumber]},
                ...geoid && {[`substring(geoid, 1, ${geoid?.toString()?.length})`]: [geoid]}
            },
            groupBy: !disasterNumber ? ['disaster_number', 'geoid'] : ['geoid']
        }),
        textCols: ["Disaster Number", "County"],
        numCols: ["# Claims"],
        anchorCols: ['County']
    },
    usda: {
        type: 'usda_crop_insurance_cause_of_loss_enhanced',
        attributes: ({disasterNumber}) => ({
            ...!disasterNumber && {'Disaster Number': "disaster_number"},
            "County": "county_name",
            "# Claims": "count(1) as num_claims",
            "Commodity Name": "ARRAY_AGG(distinct commodity_name order by commodity_name) as commodity_names",
            "Acres Planted": "sum(net_planted_acres) as net_planted_acres",
            "Acres Lost": "sum(net_determined_acres) as net_determined_acres",
            "Crop Value Lost": "sum(indemnity_amount) as indemnity_amount"
        }),
        options: ({disasterNumber, geoid}) => ({
            aggregatedLen: true,
            filter: {
                ...disasterNumber && {"disaster_number": [disasterNumber]},
                ...geoid && {[`substring(geoid, 1, ${geoid?.toString()?.length})`]: [geoid]}
            },
            groupBy: !disasterNumber ? ['disaster_number', 'county_name'] : ['county_name']
        }),
        textCols: ["Disaster Number", "County", 'Commodity Name'],
        numCols: ["# Claims"],
        anchorCols: ['County']
    },
    // 'hmgp summaries': {
    //     type: 'hazard_mitigation_grant_program_disaster_summaries_v2',
    //     attributes: () => ({
    //        'Disaster Number': 'disaster_number',
    //         'Disaster Type': 'disaster_type',
    //         'Incident Type': 'incident_type',
    //         'Title': 'title',
    //         'State': 'state',
    //         'Obligated Total Amount': 'obligated_total_amount',
    //     }),
    //     options: ({disasterNumber, geoid}) => ({
    //         filter: {
    //             ...disasterNumber && {"disaster_number": [disasterNumber]},
    //         },
    //     }),
    //     textCols: ['Disaster Number', 'Disaster Type', 'Incident Type', 'Title', 'State'],
    //     numCols: [],
    //     anchorCols: []
    // },
    'hmgp projects': {
        type: 'hazard_mitigation_assistance_projects_v3',
        mapGeoidToName: true,
        geoidCol: `LPAD(state_number_code, 2, '0') || LPAD(county_code, 3, '0') as geoid`,
        attributes: () => ({
            'Disaster Number': 'disaster_number',
            'County': `LPAD(state_number_code, 2, '0') || LPAD(county_code, 3, '0') as geoid`,
            'Project Type': `array_to_string(array_agg(distinct project_type), ', ') as project_type`,
            'Status': `array_to_string(array_agg(distinct status), ', ') as status`,
            // 'Recipients': `array_to_string(array_agg(distinct recipient), ', ') as recipients`,
            '# Final Properties': `sum(number_of_final_properties) as num_final_properties`,
            'Benefit Cost Ratio': `sum(benefit_cost_ratio) as benefit_cost_ratio`,
            'Project Amount': 'sum(project_amount) as project_amount',
            'Federal Share Obligated': 'sum(federal_share_obligated) as federal_share_obligated',
            'Net Value Benefits': 'sum(net_value_benefits) as net_value_benefits',
        }),
        options: ({disasterNumber, geoid}) => ({
            aggregatedLen: true,
            filter: {
                ...disasterNumber && {"disaster_number": [disasterNumber]},
                ...geoid && {[`substring(LPAD(state_number_code, 2, '0') || LPAD(county_code, 3, '0'), 1, ${geoid?.toString()?.length})`]: [geoid]}
            },
            groupBy: ['disaster_number', 'state_number_code', 'county_code']
        }),
        textCols: ['Disaster Number', 'County', 'Project Type', 'Recipients', 'Status'],
        numCols: ['# Final Properties', 'Benefit Cost Ratio'],
        anchorCols: []
    },
    // 'hmgp properties': {
    //     type: 'hazard_mitigation_assistance_mitigated_properties_v3',
    //     attributes: () => ({
    //         'Disaster Number': 'disaster_number',
    //         'State': 'ARRAY_AGG(distinct state) as state',
    //         'County': 'ARRAY_AGG(distinct county order by county) as county',
    //         'City': 'ARRAY_AGG(distinct city order by city) as city',
    //         'Actual Amount Paid': 'sum(actual_amount_paid) as actual_amount_paid'
    //     }),
    //     options: ({disasterNumber, geoid}) => ({
    //         aggregatedLen: true,
    //         filter: {
    //             ...disasterNumber && {"disaster_number": [disasterNumber]},
    //         },
    //         groupBy: ['disaster_number']
    //     }),
    //     textCols: ['Disaster Number', 'State', 'County', 'City'],
    //     numCols: [],
    //     anchorCols: []
    // },
};