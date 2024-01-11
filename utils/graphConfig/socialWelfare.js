import {
  maleColor,
  femaleColor
} from "./utils.js"

export default [
    {
          type: "TextBox",
          header: "SOCIAL WELFARE",
          body: "Metrics related to the individual and collective social well-being of the Capital Region and it’s communities.",
          layout: {
            h: 5,
            w: 12
             }
        },

        {
      type:"CensusStatBox",
      title: "Median Household Income, White",
      valuePrefix:'$',
      censusKeys:["B19013A_001E"],
      showCompareYear: true,
      maximumFractionDigits: 1,
      layout:{
         w:3,
         h:6,
      }
   },

     {
      type:"CensusStatBox",
      title: "Median Household Income, Black",
      valuePrefix:'$',
      censusKeys:["B19013B_001E"],
      showCompareYear: true,
      maximumFractionDigits: 1,
      layout:{
         w:3,
         h:6,
         x:0,
      }
   },

  {
      type: "CensusBarChart",
      title: "Median Household Income by Race and Ethnicity",
      censusKeys: [
        "B19013A_001E",
        "B19013B_001E",
        "B19013D_001E",
        "B19013I_001E"],
      yFormat: "$,d",
      censusKeyLabels: {
          "B19013A_001E": "White",
          "B19013B_001E": "Black or African American Alone",
          "B19013D_001E": "Asian",
          "B19013I_001E": "Hispanic or Latino"      },
        layout:{
           w:9,
           h:12,
        }

    },

       {
      type:"CensusStatBox",
      title: "Median Household Income, Hispanic or Latino",
      valuePrefix:'$',
      censusKeys:["B19013I_001E"],
      showCompareYear: true,
      maximumFractionDigits: 1,
      layout:{
         w:3,
         h:6,
      }
   },

     {
      type:"CensusStatBox",
      title: "Median Household Income, Asian",
      valuePrefix:'$',
      censusKeys:["B19013D_001E"],
      showCompareYear: true,
      maximumFractionDigits: 1,
      layout:{
         w:3,
         h:6,
         x:0,
      }
   },

      {
    type: "CensusLineChart",
    title: "Median Household Income by Race and Ethnicity",
    censusKeys: [
      "B19013A_001E",
      "B19013B_001E",
      "B19013D_001E",
      "B19013I_001E"],
    marginLeft: 75,
    yFormat: "$,d",
    censusKeyLabels: {
        "B19013A_001E": "White",
        "B19013B_001E": "Black or African American Alone",
        "B19013D_001E": "Asian",
        "B19013I_001E": "Hispanic or Latino"      },
      layout:{
         w:9,
         h:12,
      }

  },


        {
        type:'CensusCompareBarChart',
        broadCensusKey: 'B17001',
        left: { key: "Below Poverty Level", slice: [0, 26] },
        right: { key: "Above Poverty Level", slice: [26, 52] },
        showCompare: false,
        showCompareGeoid: false,
        marginLeft: 150,
        layout: { h: 12 },
        labels: [
          'Male Under age 5',
          'Male age 5',
          'Male ages 6-11',
          'Male ages 12-14',
          'Male ages 15',
          'Male ages 16-17',
          'Male ages 18-24',
          'Male ages 25-34',
          'Male ages 35-44',
          'Male ages 45-54',
          'Male ages 55-64',
          'Male ages 65-74',
          'Male ages 75 and over',
          'Female Under age 5',
          'Female age 5',
          'Female ages 6-11',
          'Female ages 12-14',
          'Female ages 15',
          'Female ages 16-17',
          'Female ages 18-24',
          'Female ages 25-34',
          'Female ages 35-44',
          'Female ages 45-54',
          'Female ages 55-64',
          'Female ages 65-74',
          'Female ages 75 and over',
        ]
    },

      {
        type: 'CensusBarChart',
        title: "Median Family Income by Family Size",
        censusKeys: ['B19119_001E...B19119_007E'],
        years: ['2017'],
        yFormat: "$,d"
    },

    {
      type:"CensusStatBox",
      censusKeys:[
        "B22001_002E",
        ],
        showCompareYear: true,
        invertColors: true,
      title: "Households that Received Food Stamps/SNAP in the Past 12 Months",
      layout:{
         w:3,
         h:6,
      }
   },

      {
      type:"CensusStatBox",
      censusKeys:[
        "B09010_002E",
        ],
        showCompareYear: true,
        invertColors: true,
      title: "Households with Children Under Age 18 Receiving Public Assistance (e.g., Food Stamps/SNAP)",
      layout:{
         w:3,
         h:6,
         x:0,
      }
   },

    {

      type: "CensusBarChart",
      title: "Receipt of SNAP by Race and Ethnicity",
      marginLeft: 75,
      showCompare: false,
      marginLeft: 250,
      orientation: 'horizontal',
      layout: { h: 12 },
      censusKeys: [
        "B22005A_002E",
        "B22005B_002E",
        "B22005C_002E",
        "B22005D_002E",
        "B22005E_002E",
        "B22005F_002E",
        "B22005G_002E",
        "B22005H_002E",
        "B22005I_002E"
      ],
      censusKeyLabels: {
        "B22005A_002E": "White",
        "B22005B_002E": "Black or African American Alone",
        "B22005C_002E": "American Indian and Alaska Native",
        "B22005D_002E": "Asian",
        "B22005E_002E": "Native Hawaiian and Other Pacific Islander",
        "B22005F_002E": "Some Other Race Alone",
        "B22005G_002E": "Two or More Races",
        "B22005H_002E": "White Alone, Not Hispanic or Latino",
       "B22005I_002E": "Hispanic or Latino"
      },
        layout:{
         w:9,
         h:12,
      }
    },

    {
        type: 'CensusBarChart',
        title: "Language Spoken at Home by Ability to Speak English",
        hideWhenCompact: true,
        censusKeys: [
          'C16001_005E',
          'C16001_008E',
          'C16001_011E',
          'C16001_014E',
          'C16001_017E',
          'C16001_020E',
          'C16001_023E',
          // 'C16001_095E',
          'C16001_029E',
          'C16001_035E',
          'C16001_038E',
          // 'C16001_041E',
          // 'C16001_044E',
          // 'C16001_092E',
          // 'C16001_050E',
          // 'C16001_053E',
          // 'C16001_056E',
          // 'C16001_059E',
          // 'C16001_062E',
          // 'C16001_065E',
          // 'C16001_068E',
          // 'C16001_071E',
          // 'C16001_074E',
          // 'C16001_077E',
        ],
        orientation: 'horizontal',
        marginLeft: 400,
        sorted: true,
        layout: { h: 12 }
    },

      {
      type: "TextBox",
      header: "Food Access Research Atlas by the United States Department of Agriculture",
      subheader: "Data Visualization",
      body: "Map of Food Insecure Areas",
      link: "https://www.ers.usda.gov/data-products/food-access-research-atlas/go-to-the-atlas/",
      layout: {
            h: 5,
            w: 12
             }

    },
    {
      type: "TextBox",
      header: "Child Care Regulated Programs",
      subheader: "Data",
      body: "Information on OCFS regulated child care programs, which includes program overview information and violation history.",
      link: "https://data.ny.gov/Human-Services/Child-Care-Regulated-Programs/cb42-qumz/data",
      layout: {
            h: 5,
            w: 12
             }
    },
    {
      type: "TextBox",
      header: "New York State Division of Criminal Justice Services" ,
      subheader: "Data Downloads and Report Publications" ,
      body: "Criminal justice data by county from New York State Division of Criminal Justice Services including Violent Crimes, Domestic Violence Victims, Arrests, Dispositions, Youth Justice Data, and more",
      link: "https://www.criminaljustice.ny.gov/crimnet/ojsa/stats.htm",
      layout: {
            h: 5,
            w: 12
             }
    }

]
