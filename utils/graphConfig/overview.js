import {
  maleColor,
  femaleColor
} from "./utils.js"

export default [


    // { type: "CensusTreemap",
    //   title: "Occupations",
    //   layout:{
    //      w: 12,
    //      h: 12
    //   },
    //   tree: {
    //     title: "Occupations",
    //     children: [
    //       { title: "Agriculture, forestry, fishing and hunting, and mining",
    //         children: [
    //           { title: "Agriculture, forestry, fishing and hunting",
    //             censusKey: "S2403_C01_003E"
    //           },
    //           { title: "Mining, quarrying, and oil and gas extraction",
    //             censusKey: "S2403_C01_004E"
    //           },
    //         ],
    //       },
    //       { title: "Construction",
    //         children: [
    //           { title: "Construction",
    //             censusKey: "S2403_C01_005E"
    //           },
    //         ],
    //       },
    //       { title: "Manufacturing",
    //         children: [
    //           { title: "Manufacturing",
    //             censusKey: "S2403_C01_006E"
    //           },
    //         ],
    //       },
    //       { title: "Trade",
    //         children: [
    //           { title: "Wholesale trade",
    //             censusKey: "S2403_C01_007E"
    //           },
    //           { title: "Retail trade",
    //             censusKey: "S2403_C01_008E"
    //           },
    //         ],
    //       },
    //       { title: "Transportation and warehousing, and utilities",
    //         children: [
    //           { title: "Transportation and warehousing",
    //             censusKey: "S2403_C01_010E"
    //           },
    //           { title: "Utilities",
    //             censusKey: "S2403_C01_011E"
    //           },
    //         ],
    //       },
    //       { title: "Information",
    //         children: [
    //           { title: "Information",
    //             censusKey: "S2403_C01_012E"
    //           },
    //         ],
    //       },
    //       { title: "Finance and insurance, and real estate and rental and leasing",
    //         children: [
    //           { title: "Finance and insurance",
    //             censusKey: "S2403_C01_014E"
    //           },
    //           { title: "Real estate and rental and leasing",
    //             censusKey: "S2403_C01_015E"
    //           },
    //         ]
    //       },
    //       { title: "Professional, scientific, and management, and administrative and waste management services",
    //         children: [
    //           { title: "Professional, scientific, and technical services",
    //             censusKey: "S2403_C01_017E"
    //           },
    //           { title: "Management of companies and enterprises",
    //             censusKey: "S2403_C01_018E"
    //           },
    //           { title: "Administrative and support and waste management services",
    //             censusKey: "S2403_C01_019E"
    //           },
    //         ],
    //       },
    //       { title: "Educational services, and health care and social assistance",
    //         children: [
    //           { title: "Educational services",
    //             censusKey: "S2403_C01_021E"
    //           },
    //           { title: "Health care and social assistance",
    //             censusKey: "S2403_C01_022E"
    //           },
    //         ],
    //       },
    //       { title: "Arts, entertainment, and recreation, and accommodation and food services",
    //         children: [
    //           { title: "Arts, entertainment, and recreation",
    //             censusKey: "S2403_C01_024E"
    //           },
    //           { title: "Accommodation and food services",
    //             censusKey: "S2403_C01_025E"
    //           },
    //         ],
    //       },
    //       { title: "Other services",
    //         children: [
    //           { title: "Other services, except public administration",
    //             censusKey: "S2403_C01_026E"
    //           },
    //           { title: "Public administration",
    //             censusKey: "S2403_C01_027E"
    //           },
    //         ]
    //       },
    //     ],
    //   },
    // },

   {
      type:"CensusStatBox",
      censusKeys:["B01003_001E"],
      showCompareYear: true,
      title: "Population",
      layout:{
         w:3,
         h:6
      }
   },
   {
      id:"2",
      type:"CensusStatBox",
      title: "Median Age",
      showCompareYear: true,
      showColors: false,
      censusKeys:["B01002_001E"],
      maximumFractionDigits: 0,
      demographics:true,
      layout:{
         w:3,
         h:6,
         x: 0
      }
   },
     {
       type: "CensusMap",
       title: "Population",
       censusKeys: ["B01003_001E"],
       layout: {
         h: 12,
         w: 9,
         x: 3
       }
     },

   {
        type: 'CensusCompareBarChart',
        broadCensusKey: 'B01001',
        showCompareGeoid: false,
        left: { key: "Male", slice: [2, 25], color: maleColor },
        right: { key: "Female", slice: [26, 49], color: femaleColor },
        layout: { h: 12 },
        marginLeft: 115,
        labels: [
          'Under Age 5',
          'Ages 5-9',
          'Ages 10-14',
          'Ages 15-17',
          'Ages 18-19',
          'Ages 20',
          'Ages 21',
          'Ages 22-24',
          'Ages 25-29',
          'Ages 30-34',
          'Ages 35-39',
          'Ages 40-44',
          'Ages 45-49',
          'Ages 50-54',
          'Ages 55-59',
          'Ages 60-61',
          'Ages 62-64',
          'Ages 65-66',
          'Ages 67-69',
          'Ages 70-74',
          'Ages 75-79',
          'Ages 80-84',
          'Ages 85 and over'
        ]
    },



   {
      type:"CensusStatBox",
      title: "Median Household Income",
      valuePrefix:'$',
      showCompareYear: true,
      censusKeys:["B19013_001E"],
      layout:{
         w:3,
         h:9,
         x:0
      }
   },
   {
      type:"CensusLineChart",
      title: "Median Household Income",
      censusKeys:["B19013_001E"],
      marginLeft: 75,
      yFormat: "$,d",
      legendWidth: 175,
      censusKeyLabels: {
        B19013_001E: "Median Household Income"
      },
      layout:{
         w:9,
         h:9
      }
   },

   {
      type:"CensusStatBox",
      title:'Poverty Rate',
      sumType: 'pct',
      censusKeys:["B17001_002E"],
      divisorKey: "B17001_001E",
      showCompareYear: true,
      valueSuffix: '%',
      maximumFractionDigits: 1,
      invertColors: true,
      layout:{
         w:3,
         h:9
      }
   },
   {
      type:"CensusLineChart",
      title: "Pct of Population with Income in the Past 12 Months Below Poverty Level",
      censusKeys:["B17001_002E"],
      divisorKeys: ["B17001_001E"],
      sumType: 'pct',
      yFormat: ",.1%",
      legendWidth: 175,
      layout:{
         w:9,
         h:9
      },
   },

   {
      title: "Percent Vacant Housing Units",
      type:"CensusStatBox",
      sumType: 'pct',
      showCompareYear: true,
      invertColors: true,
      censusKeys:["B25002_003E"],
      divisorKey: 'B25002_001E',
      valueSuffix: '%',
      maximumFractionDigits: 1,
      layout:{
         w:3,
         h:6,
         x:0
      }
   },
   {
      title: "Vacant Housing Units",
      type:"CensusStatBox",
      showCompareYear: true,
      invertColors: true,
      censusKeys:["B25002_003E"],
      layout:{
         w:3,
         h:6,
         x:0
      },
   },

   {
      type:"CensusLineChart",
      title: "Percent Vacant Housing Units",
      legendWidth: 175,
      sumType: 'pct',
      yFormat: ",.1%",
      censusKeys:["B25002_003E"],
      divisorKeys:["B25002_001E"],
      layout:{
         w:9,
         h:12
      }
   },

       {
      type: 'CensusLineChart',
      title: 'Population by Race and Ethnicity',
      marginLeft: 75,
      censusKeys: [
        'B02008_001E',
        'B02009_001E',
        'B02011_001E',
        'B03002_012E'
      ],
      censusKeyLabels:{
        'B02008_001E': "White",
        'B02009_001E': "Black or African American",
        'B02011_001E': "Asian",
        'B03002_012E': "Hispanic or Latino"
      },
      layout: {
        w:12,
        h: 9

      }


    },

       {
      type: "CensusLineChart",
      title: "Per Capita Income By Race and Ethnicity",
      marginLeft: 75,
      yFormat: "$,d",
      censusKeys: [
        "B19301A_001E",
        "B19301B_001E",
        "B19301D_001E",
        "B19301I_001E"
      ],
      censusKeyLabels: {
        "B19301A_001E": "White",
        "B19301B_001E": "Black or African American Alone",
        "B19301D_001E": "Asian",
        "B19301I_001E": "Hispanic or Latino"      }
    },
    {
      type: "CensusRadarGraph",
      title: "Per Capita Income By Race and Ethnicity",
      format: "$,d",
      censusKeys: [
        "B19301A_001E",
        "B19301B_001E",
        "B19301C_001E",
        "B19301D_001E",
        "B19301E_001E",
        "B19301F_001E",
        "B19301H_001E",
        "B19301I_001E"
      ],
      censusKeyLabels: {
        "B19301A_001E": "White",
        "B19301B_001E": "Black or African American Alone",
        "B19301C_001E": "American Indian and Alaska Native",
        "B19301D_001E": "Asian",
        "B19301E_001E": "Native Hawaiian and Other Pacific Islander",
        "B19301F_001E": "Some Other Race Alone",
        "B19301H_001E": "White Alone, Not Hispanic or Latino",
        "B19301I_001E": "Hispanic or Latino"
      }
    },

    // { type: "CensusBarChart",
    //   title: "TEST",
    //   censusKeys: ["B19301A_001E...B19301I_001E"],
    //   censusKeyLabels: {
    //     "B19301A_001E": "White",
    //     "B19301B_001E": "Black or African American Alone",
    //     "B19301C_001E": "American Indian and Alaska Native",
    //     "B19301D_001E": "Asian",
    //     "B19301E_001E": "Native Hawaiian and Other Pacific Islander",
    //     "B19301F_001E": "Some Other Race Alone",
    //     "B19301G_001E": "Two or More Races",
    //     "B19301H_001E": "White Alone, Not Hispanic or Latino",
    //     "B19301I_001E": "Hispanic or Latino"      },
    //   groupBy: "geoids",
    //   groupMode: "stacked",
    //   yFormat: "$,d"
    // },

   // {
   //    "id":"12",
   //    "type":"CensusGroupedBarChart",
   //    "censusKey":[
   //       "B23008"
   //    ],
   //    "compareGeoid":[
   //       "36"
   //    ],
   //    "colorRange":[
   //
   //    ],
   //    "layout":{
   //       "w":12,
   //       "h":13,
   //       "x":0,
   //       "y":41,
   //       "i":"12"
   //    },
   //    "geoid":[
   //       "36001"
   //    ]
   // },
    {
      type: "TextBox",
      header: "ALICE from United Way",
      subheader: "Reports, Visualizations, and Data Downloads",
      body: "The ALICE (Asset Limited, Income Constrained, Employed) Project was initiated by United Way of Northern New Jersey several years ago to bring focus to the families and individuals who work but whose salaries do not provide sufficient resources to meet basic needs. The ALICE Project developed a methodology using publicly available census, employment, wage, cost of living and other data to help to understand the extent of ALICE in our communities, those who are above the federal poverty level, but below a sustainable wage.",
      link: "https://www.unitedforalice.org/new-york",
      layout: {
        h: 6
      }
     }
]
