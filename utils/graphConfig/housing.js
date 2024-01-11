import {
  maleColor,
  femaleColor
} from "./utils.js"

export default [
  // { "type":"CensusMultiStackedLineChart",
  //   "censusKey":["B25004"],
  //   "VacantHousing":true,
  //   "colorRange":[],
  //   "layout": {
  //     "w":4,"h":14,"x":0,"y":72,"i":"27","static":false
  //   }
  // },
  // { "type":"CensusCompareBarChart",
  //   "censusKey":["B25118"],
  //   "layout": {
  //     "w":11,"h":17,"x":0,"y":17,"i":"28","static":true
  //   }
  // },
  {
          type: "TextBox",
          header: "HOUSING",
          body: "Housing is an important asset to our region. Old and new developments offer a diverse mix of styles, materials and landscapes that make the region an attractive place to call home. ",
          layout: {
            h: 3,
            w: 12
          }

        },

    {
      title: "Total Housing Units",
      type:"CensusStatBox",
      yearPosition: "block",
      censusKeys:["B25002_001E"],
      showCompareYear: true,
      layout:{
         w:3,
         h:8
      },

   },
    {
      title: "Total Housing Units",
      type:"CensusLineChart",
      sumType: 'sum',
      showCompare: true,
      marginLeft: 100,
      censusKeys:["B25002_001E"],
      groupBy: "geoids",
      layout:{
         w:9,
         h:8
      },

   },

     {
      title: "Vacant Housing Units - Includes For Sale Vacant, Sold Vacant, and Other Vacant",
      type:"CensusStatBox",
      censusKeys:["B25004_004E", "B25004_005E", "B25004_008E"],
      showCompareYear: true,
      invertColors: true,
      layout:{
         w:3,
         h:6,
      },
   },

    {
      title:"Percent Vacant Housing Units - Includes All Vacancy Types",
      type: "CensusLineChart",
      sumType: 'pct',
      censusKeys:["B25002_003E"],
      divisorKey: 'B25002_001E',
      marginLeft: 100,
       layout:{
         w:9,
         h:9,
      },
    },

   {
      title: "Percent Vacant Housing Units - Includes For Sale Vacant, Sold Vacant, and Other Vacant",
      type:"CensusStatBox",
      sumType: 'pct',

      censusKeys:["B25004_004E", "B25004_005E", "B25004_008E"],
      divisorKey: 'B25002_001E',
      valueSuffix: '%',
      showCompareYear: true,
      invertColors: true,
      maximumFractionDigits: 1,
      layout:{
         w:3,
         h:6,
         x:0
      }
   },



   {
      title: "Units for Rent",
      type:"CensusStatBox",
      censusKeys:["B25004_002E",],
      showCompareYear: true,
      showColors: false,
      layout:{
         w:3,
         h:6,
         x:0
      }
   },

   {
    type: "CensusLineChart",
    title: "Vacancy Status",
    showCompare: false,
    censusKeys: [
      "B25004_002E",
      "B25004_003E",
      "B25004_004E",
      "B25004_005E",
      "B25004_006E",
      "B25004_007E",
      "B25004_008E"
    ],
    layout:{
         w:9,
         h:9,
      },
    legendWidth: 325,
  },


  // { "type": "CensusLineChart",
  //   title: "Housing Units With and Without Mortgages",
  //   marginLeft: 140,
  //   // "broadCensusKey": "B25087",
  //    censusKeys: [
  //     "B25087_002E",
  //     "B25087_020E",
  //   ],
  //   showCompare: false,
  //   labels: [
  //     "Housing units with a mortgage",
  //     "Housing units without a mortgage"
  //   ]
  // },

     {
      title: "Percent Homeowners 65 and Older",
      type:"CensusStatBox",
      sumType: 'pct',
      censusKeys:["B25007_009E", "B25007_010E", "B25007_011E"],
      divisorKey: 'B25007_001E',
      valueSuffix: '%',
      showCompareYear: true,
      showColors: false,
      maximumFractionDigits: 1,
      layout:{
         w:3,
         h:6,
         x:0
      }
   },

    {
      title:"Percent Homeowners 65 and Older",
      type: "CensusBarChart",
      censusKeys:["B25007_009E", "B25007_010E", "B25007_011E"],
       layout:{
         w:9,
         h:12,
      },
    },

     {
      title: "Homeowners 65 and Older",
      type:"CensusStatBox",
      censusKeys:["B25007_009E", "B25007_010E", "B25007_011E"],
      showCompareYear: true,
      showColors: false,
      layout:{
         w:3,
         h:6,
      },
   },

   {
      type:"CensusStatBox",
      title:'Number of Mortgages with Monthly Owner Costs Above 30%',
      censusKeys:["B25091_008E", "B25091_009E", "B25091_010E", "B25091_011E", "B25091_019E", "B25091_020E", "B25091_021E", "B25091_022E"],
      showCompareYear: true,
      invertColors: true,
      layout:{
         w:3,
         h:9,
         x:0
      }
   },

  { type:"CensusCompareBarChart",
    title: 'Homeowner Cost by % of Monthly Income',
    showCompareGeoid: false,
    orientation: 'horizontal',
    marginLeft: 140,
    left: { key: "With Mortgage",
      keys: [
        'B25091_003E',
        'B25091_004E',
        'B25091_005E',
        'B25091_006E',
        'B25091_007E',
        'B25091_008E',
        'B25091_009E',
        'B25091_010E',
        'B25091_011E',
      ]},
    right: { key: "Without Mortgage",
      keys: [
        'B25091_014E',
        'B25091_015E',
        'B25091_016E',
        'B25091_017E',
        'B25091_018E',
        'B25091_019E',
        'B25091_020E',
        'B25091_021E',
        'B25091_022E',
      ]},
    labels: [
      'Less than 10.0 percent',
      '10.0 to 14.9 percent',
      '15.0 to 19.9 percent',
      '20.0 to 24.9 percent',
      '25.0 to 29.9 percent',
      '30.0 to 34.9 percent',
      '35.0 to 39.9 percent',
      '40.0 to 49.9 percent',
      '50.0 percent or more',
    ],
    layout:{
      w:9,
      h:9,
    }
  },

  { type: "CensusCompareBarChart",
    title: "Tenure by Household Income in the Past 12 Months",
    showCompareGeoid: false,
    marginLeft: 140,
    left: { key: "Owner Occupied",
      keys: [
        "B25118_003E",
        "B25118_004E",
        "B25118_005E",
        "B25118_006E",
        "B25118_007E",
        "B25118_008E",
        "B25118_009E",
        "B25118_010E",
        "B25118_011E",
        "B25118_012E",
        "B25118_013E"
      ] },
    right: { key: "Renter Occupied",
      keys: [
        "B25118_015E",
        "B25118_016E",
        "B25118_017E",
        "B25118_018E",
        "B25118_019E",
        "B25118_020E",
        "B25118_021E",
        "B25118_022E",
        "B25118_023E",
        "B25118_024E",
        "B25118_025E"
      ] },
    labels: [
      "Less Than $5,000",
      "$5,000 to $9,999",
      "$10,000 to $14,999",
      "$15,000 to $19,999",
      "$20,000 to $24,999",
      "$25,000 to $34,999",
      "$35,000 to $49,999",
      "$50,000 to $74,999",
      "$75,000 to $99,999",
      "$100,000 to $149,999",
      "$150,000 or more"
    ]
  },

 { type: "CensusBarChart",
    title: "Mortgate Status and Selected Monthly Owner Costs",
    orientation: "horizontal",
    hideWhenCompact: true,
    marginLeft: 260,
    censusKeys: [
      "B25087_003E",
      "B25087_004E",
      "B25087_005E",
      "B25087_006E",
      "B25087_007E",
      "B25087_008E",
      "B25087_009E",
      "B25087_010E",
      "B25087_011E",
      "B25087_012E",
      "B25087_013E",
      "B25087_014E",
      "B25087_015E",
      "B25087_016E",
      "B25087_017E",
      "B25087_018E",
      "B25087_019E"
    ]
  },
{
      type: "TextBox",
      header: "US Census Building Permits Survey",
      subheader: "Data Downloads",
      body: "This page provides data on the number of new housing units authorized by building permits. Data are available monthly, year- to- date, and annually at the national, state, selected metropolitan area, county and place levels. The data are from the Building Permits Survey.",
      link: "https://www.census.gov/construction/bps/",
      layout: {
            h: 7,
            w: 12
             }
    }
]
