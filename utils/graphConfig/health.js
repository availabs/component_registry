import {
  configLoader,
  maleColor,
  femaleColor
} from "./utils.js"

const year = 2017;

const BASE_CONFIG = [
  {
          type: "TextBox",
          header: "HEALTH",
          body: "This section takes a population-based approach to our region's health by exploring access to health care, and will one day include indicators measuring the prevalence of selected diseases, mortality rates and behavioral health.",
          layout: {
            h: 5,
            w: 12
             }
        },

       {
      type:"CensusStatBox",
      title:'Covered by Health Insurance',
      censusKeys:[
          "B27001_004E",
          "B27001_007E",
          "B27001_010E",
          "B27001_013E",
          "B27001_016E",
          "B27001_019E",
          "B27001_022E",
          "B27001_025E",
          "B27001_028E",
          "B27001_032E",
          "B27001_035E",
          "B27001_038E",
          "B27001_041E",
          "B27001_044E",
          "B27001_047E",
          "B27001_050E",
          "B27001_053E",
          "B27001_056E",
          ],
      showCompareYear: true,
      maximumFractionDigits: 1,
      layout:{
         w:3,
         h:6
      }
   },
  {
      type:"CensusStatBox",
      title:'Percent Health Coverage',
      sumType: 'pct',
      censusKeys:[
          "B27001_004E",
          "B27001_007E",
          "B27001_010E",
          "B27001_013E",
          "B27001_016E",
          "B27001_019E",
          "B27001_022E",
          "B27001_025E",
          "B27001_028E",
          "B27001_032E",
          "B27001_035E",
          "B27001_038E",
          "B27001_041E",
          "B27001_044E",
          "B27001_047E",
          "B27001_050E",
          "B27001_053E",
          "B27001_056E",

          ],
      divisorKey: "B27001_001E",
      showCompareYear: true,
      valueSuffix: '%',
      maximumFractionDigits: 1,
      layout:{
         w:3,
         h:6,
         x: 0
      }
   },
  {
    type: "CensusBarChart",
    title: "Age by Disability Status by Health Insurance Coverage Status",
    hideWhenCompact: true,
    censusKeys: [
      "B18135_004E",
      "B18135_005E",
      "B18135_006E",
      "B18135_007E",
      "B18135_009E",
      "B18135_010E",
      "B18135_011E",
      "B18135_012E",
      "B18135_015E",
      "B18135_016E",
      "B18135_017E",
      "B18135_018E",
      "B18135_020E",
      "B18135_021E",
      "B18135_022E",
      "B18135_023E",
      "B18135_026E",
      "B18135_027E",
      "B18135_028E",
      "B18135_029E",
      "B18135_031E",
      "B18135_032E",
      "B18135_033E",
      "B18135_034E"
      ],
    censusKeyLabels: {
      "B18135_004E" : '< 19 years, w/ disability, Total health insurance coverage',
      "B18135_005E" : '< 19 years, w/ disability, Private health insurance coverage',
      "B18135_006E" : '< 19 years, w/ disability, Public health insurance coverage',
      "B18135_007E" : '< 19 years, w/ disability, No health insurance coverage',
      "B18135_009E" : '< 19 years, No disability, Total insurance coverage',
      "B18135_010E" : '< 19 years, No disability, Private health insurance coverage',
      "B18135_011E" : '< 19 years, No disability, Public health insurance coverage',
      "B18135_012E" : '< 19 years, No disability, No health insurance coverage',
      "B18135_015E" : '19-64 years, w/ disability, Total health insurance coverage',
      "B18135_016E" : '19-64 years, w/ disability, Private health insurance coverage',
      "B18135_017E" : '19-64 years, w/ disability, Public health insurance coverage',
      "B18135_018E" : '19-64 years, w/ disability, No health insurance coverage',
      "B18135_020E" : '19-64 years, No disability, Total health insurance coverage',
      "B18135_021E" : '19-64 years, No disability, Private health insurance coverage',
      "B18135_022E" : '19-64 years, No disability, Public health insurance coverage',
      "B18135_023E" : '19-64 years, No disability, No health insurance coverage',
      "B18135_026E" : '65+, w/ disability, Total health insurance coverage',
      "B18135_027E" : '65+, w/ disability, Private health insurance coverage',
      "B18135_028E" : '65+, w/ disability, Public health insurance coverage',
      "B18135_029E" : '65+, w/ disability, No health insurance coverage',
      "B18135_031E" : '65+, No disability, Total health insurance coverage',
      "B18135_032E" : '65+, No disability, Private health insurance coverage',
      "B18135_033E" : '65+, No disability, Public health insurance coverage',
      "B18135_034E" : '65+, No disability, No health insurance coverage',
    },
    orientation: "horizontal",
    marginLeft: 350,
    layout: {
      w: 9,
      h: 12,

    }
  },

    {
      type:"CensusStatBox",
      title:'Veterans',
      censusKeys:['B21001_002E'],
      showCompareYear: true,
      showColors: false,
      maximumFractionDigits: 1,
      layout:{
         w:3,
         h:9,
      }
   },
    {
      type: "CensusCompareBarChart",
      title: "Civilian Population 18 Years and Over",
      showCompareGeoid: false,
      orientation: "horizontal",
      marginLeft: 175,
      layout:{
           w:9,
           h:9
        },
      left: {
        key: "Male", color: maleColor,
        keys: [
          "B21001_007E...B21001_021E",
        ]
      },
      right: {
        key: "Female", color: femaleColor,
        keys: [
          "B21001_025E...B21001_039E"
        ]
      },
      labels: [
          'Total 18-34',
          '18-34 years, veteran',
          '18-34 years, non-veteran',
          'Total 35-54 years',
          '35-54 years, veteran',
          '35-54 years, non-veteran',
          'Total 55-64 years',
          '55-64 years, veteran',
          '55-64 years, non-veteran',
          'Total 65-74 years',
          '65-74 years, veteran',
          '65-74 years, non-veteran',
          'Total 75 years and over',
          '75 years and over, veteran',
          '75 years and over, non-veteran',
        ]
    },
{
      type: "TextBox",
      header: "New York State Community Health Indicator Reports (CHIRS)",
      subheader: "Data, Reports, and Visualizations",
      body: "The New York State Community Health Indicator Reports (CHIRS) were developed in 2012, and are annually updated to consolidate and provide information regarding health indicators in the County Health Assessment Indicators (CHAI) for all communities in New York. Data previously provided in these reports have now been incorporated into the CHIRS Dashboard and are displayed in enhanced, more interactive data views. The CHIRS Dashboard tracks about 350 indicators organized by 15 health topics, and is updated annually to include the most recent year of data available for these indicators. Additionally, each of 62 counties in NYS has their own dashboard which allows for comparison of each county's data in relationship to that county's region and NYS totals, and includes at-a-glance comparisons of the two most recent data points. Visualizations include tables, maps, charts, and graphs at the state and county levels. This dashboard is a key resource for assessing county trends and can assist in tracking intervention progress.",
      link: "https://www.health.ny.gov/statistics/chac/indicators/",
      layout: {
            h: 9,
            w: 12
             }
    },
]

export default configLoader(BASE_CONFIG);
