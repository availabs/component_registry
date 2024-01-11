import {
  maleColor,
  femaleColor
} from "./utils.js"

export default [
  {
          type: "TextBox",
          header: "TRANSPORTATION",
          body: "This section provides indicators on how the labor force in our region commutes to work and on car ownership.",
          layout: {
            h: 3,
            w: 12
             }
        },

   {
      type:"CensusStatBox",
      title:'Total Bike-Ped ',
      censusKeys:["B08006_014E", "B08006_015E"],
      amount:true,
      showCompareYear: true,
      // yearPosition: "block",
      maximumFractionDigits: 1,
      layout:{
         w:3,
         h:6
      }
   },
  {
      type:"CensusStatBox",
      title:'Bike-Ped as a Percent of Total Commuters',
      sumType: 'pct',
      // yearPosition: "block",
      showCompareYear: true,
      censusKeys:["B08006_014E", "B08006_015E"],
      divisorKey: "B23025_001E",
      valueSuffix: '%',
      maximumFractionDigits: 1,
      layout:{
         w:3,
         h:6,
         x:0
      }
   },


  {
    type: "CensusBarChart",
    title: "Means of Transportation to Work",
    hideWhenCompact: true,
    censusKeys: [
      "B08006_002E",
      "B08006_003E",
      "B08006_004E",
      "B08006_005E",
      "B08006_006E",
      "B08006_007E",
      "B08006_008E",
      "B08006_009E",
      "B08006_014E",
      "B08006_015E",
      "B08006_016E",
      "B08006_017E"
      ],
    orientation: "horizontal",
    marginLeft: 300,
    layout:{
         w:9,
         h:12,
      }
  },


   {
      type:"CensusStatBox",
      title:'Total Public Transportation ',
      censusKeys:["B08006_008E"],
      showCompareYear: true,
      // yearPosition: "block",
      amount:true,
      maximumFractionDigits: 1,
      layout:{
         w:3,
         h:6
      }
   },

  {
      type:"CensusStatBox",
      title:'Public Transportation as a Percent of Total Commuters',
      sumType: 'pct',
      showCompareYear: true,
      censusKeys:["B08006_008E"],
      divisorKey: "B23025_001E",
      valueSuffix: '%',
      // yearPosition: "block",
      maximumFractionDigits: 1,
      layout:{
         w:3,
         h:6,
         x:0
      }
   },

  {
    title: "Means of Transportation to Work by Sex",
    hideWhenCompact: true,
    type: "CensusCompareBarChart",
    showCompareGeoid: false,
    marginLeft: 340,
    left: {
      key: "Male", color: maleColor,
      keys: [
       "B08006_019E",
       "B08006_020E",
       "B08006_021E",
       "B08006_022E",
       "B08006_023E",
       "B08006_024E",
       "B08006_025E",
       "B08006_016E",
       "B08006_031E",
       "B08006_032E",
       "B08006_033E",
       "B08006_034E"
       ]
    },
    right: {
      key: "Female", color: femaleColor,
      keys: [
        "B08006_036E",
       "B08006_037E",
       "B08006_038E",
       "B08006_039E",
       "B08006_040E",
       "B08006_041E",
       "B08006_042E",
       "B08006_043E",
       "B08006_048E",
       "B08006_049E",
       "B08006_050E",
        "B08006_051E"
        ]
    },
    labels: [
      "Car, Truck or Van",
      "Car, Truck or Van, Drove Alone",
      "Car, Truck or Van, Carpooled",
      "Car, Truck or Van, 2-Person Carpool",
      "Car, Truck or Van, 3-Person Carpool",
      "Car, Truck or Van, 4-Person Carpool",
      "Public Transportation (Excluding Taxi)",
      "Public Transportation (Excluding Taxi), Bus or Trolley Bus",
      "Bicycle",
      "Walked",
      "Taxicab, Motorcycle, or Other",
      "Worked at Home"
    ],
    layout:{
         w:9,
         h:12,

      }
  },
  {
      type:"CensusStatBox",
      title:'Total No Vehicle Available',
      censusKeys:[ "B08541_002E",],
      showCompareYear: true,
      // yearPosition: "block",
      amount:true,
      maximumFractionDigits: 1,
      layout:{
         w:3,
         h:6
      }
   },



  {
    type: "CensusBarChart",
    title: "Vehicle Availability",
    censusKeys: [
    "B08541_002E",
    "B08541_003E",
    "B08541_004E",
    "B08541_005E"
    ],
    layout:{
      w:9,
      h:6
    }
  },

   {
      type:"CensusStatBox",
      title:'Total Worked at Home ',
      censusKeys:[ "B08006_017E"],
      showCompareYear: true,
      // yearPosition: "block",
      amount:true,
      maximumFractionDigits: 1,
      layout:{
         w:3,
         h:6
      }
   },

  {
      type:"CensusStatBox",
      title:'Work at Home as a Percent of Total Commuters',
      sumType: 'pct',
      // yearPosition: "block",
      showCompareYear: true,
      censusKeys:["B08006_017E"],
      divisorKey: "B08006_001E",
      valueSuffix: '%',
      maximumFractionDigits: 1,
      layout:{
         w:3,
         h:6,
         x:0
      }
   },



  {
    type: "CensusLineChart",
    title: "Means of Transportation to Work",
    censusKeys: [
      "B08006_003E",
      "B08006_004E",
      "B08006_008E",
      "B08006_014E",
      "B08006_015E",
      "B08006_017E"
      ],
    marginLeft: 100,
    layout:{
         w:9,
         h:12,
      }
  },

  {
      type:"CensusStatBox",
      title:'Total Drove Alone ',
      censusKeys:[ "B08006_003E"],
      showCompareYear: true,
      // yearPosition: "block",
      amount:true,
      maximumFractionDigits: 1,
      layout:{
         w:3,
         h:6
      }
   },

  {
      type:"CensusStatBox",
      title:'Drove Alone as a Percent of Total Commuters',
      sumType: 'pct',
      // yearPosition: "block",
      showCompareYear: true,
      censusKeys:["B08006_003E"],
      divisorKey: "B23025_001E",
      valueSuffix: '%',
      maximumFractionDigits: 1,
      layout:{
         w:3,
         h:6,
         x:0
      }
   },

  {
    type: "CensusBarChart",
    title: "Travel Time to Work",
    censusKeys: ["B08303_002E...B08303_013E"],
    orientation: "horizontal",
    marginLeft: 130,
     layout:{
         w:9,
         h:12,
      }
  },

  {
    type: "CensusBarChart",
    title: "Travel Time to Work by Mode",
    hideWhenCompact: true,
    censusKeys: [
    "B08134_012E",
    "B08134_013E",
    "B08134_014E",
    "B08134_015E",
    "B08134_016E",
    "B08134_017E",
    "B08134_018E",
    "B08134_019E",
    "B08134_020E",
    "B08134_022E",
    "B08134_023E",
    "B08134_024E",
    "B08134_025E",
    "B08134_026E",
    "B08134_027E",
    "B08134_028E",
    "B08134_029E",
    "B08134_030E",
    "B08134_032E",
    "B08134_033E",
    "B08134_034E",
    "B08134_035E",
    "B08134_036E",
    "B08134_037E",
    "B08134_038E",
    "B08134_039E",
    "B08134_062E",
    "B08134_063E",
    "B08134_064E",
    "B08134_065E",
    "B08134_066E",
    "B08134_067E",
    "B08134_068E",
    "B08134_069E",
    "B08134_070E",
    "B08134_102E",
    "B08134_103E",
    "B08134_104E",
    "B08134_105E",
    "B08134_106E",
    "B08134_107E",
    "B08134_108E",
    "B08134_109E",
    "B08134_110E",
    "B08134_112E",
    "B08134_113E",
    "B08134_114E",
    "B08134_115E",
    "B08134_116E",
    "B08134_117E",
    "B08134_118E",
    "B08134_119E",
    "B08134_120E",
    ],

    labels: [
      "Car, Truck, or Van: Less than 10 minutes",
      "Car, Truck, or Van: 15 to 19 minutes",
      "Car, Truck, or Van: 20 to 24 minutes",
      "Car, Truck, or Van: 25 to 29 minutes",
      "Car, Truck, or Van: 30 to 34 minutes",
      "Car, Truck, or Van: 35 to 44 minutes ",
      "Car, Truck, or Van: 45 to 59 minutes",
      "Car, Truck, or Van: 60 or more minutes",
      "Drove Alone: Less than 10 minutes",
      "Drove Alone: 15 to 19 minutes",
      "Drove Alone: 20 to 24 minutes",
      "Drove Alone: 25 to 29 minutes",
      "Drove Alone: 30 to 34 minutes",
      "Drove Alone: 35 to 44 minutes ",
      "Drove Alone: 45 to 59 minutes",
      "Drove Alone: 60 or more minutes",
      "Carpooled: Less than 10 minutes",
      "Carpooled: 15 to 19 minutes",
      "Carpooled: 20 to 24 minutes",
      "Carpooled: 25 to 29 minutes",
      "Carpooled: 30 to 34 minutes",
      "Carpooled: 35 to 44 minutes ",
      "Carpooled: 45 to 59 minutes",
      "Carpooled: 60 or more minutes",
      "Public Transportation: Less than 10 minutes",
      "Public Transportation: 15 to 19 minutes",
      "Public Transportation: 20 to 24 minutes",
      "Public Transportation: 25 to 29 minutes",
      "Public Transportation: 30 to 34 minutes",
      "Public Transportation: 35 to 44 minutes ",
      "Public Transportation: 45 to 59 minutes",
      "Public Transportation: 60 or more minutes",
      "Walked: Less than 10 minutes",
      "Walked: 15 to 19 minutes",
      "Walked: 20 to 24 minutes",
      "Walked: 25 to 29 minutes",
      "Walked: 30 to 34 minutes",
      "Walked: 35 to 44 minutes ",
      "Walked: 45 to 59 minutes",
      "Walked: 60 or more minutes",
      "Taxicab, motorcycle, bicycle, or other means: Less than 10 minutes",
      "Taxicab, motorcycle, bicycle, or other means: 15 to 19 minutes",
      "Taxicab, motorcycle, bicycle, or other means: 20 to 24 minutes",
      "Taxicab, motorcycle, bicycle, or other means: 25 to 29 minutes",
      "Taxicab, motorcycle, bicycle, or other means: 30 to 34 minutes",
      "Taxicab, motorcycle, bicycle, or other means: 35 to 44 minutes ",
      "Taxicab, motorcycle, bicycle, or other means: 45 to 59 minutes",
      "Taxicab, motorcycle, bicycle, or other means: 60 or more minutes",
    ],
    orientation: "horizontal",
    marginLeft: 350,
     layout:{
         w:12,
         h:18,
      },
  },


  {
    type: "CensusCompareBarChart",
    title: "Travel Time to Work by Sex",
    showCompareGeoid: false,
    left: {
      key: "Male", color: maleColor,
      keys: ["B08412_015E...B08412_026E"]
    },
    right: {
      key: "Female", color: femaleColor,
      keys: ["B08412_028E...B08412_039E"]
    },
    marginLeft: 130,
    labels: [
      "Less Than 5 Minutes",
      "5 to 9 Minutes",
      "10 to 14 Minutes",
      "15 to 19 Minutes",
      "20 to 24 Minutes",
      "25 to 29 Minutes",
      "30 to 34 Minutes",
      "35 to 39 Minutes",
      "40 to 44 Minutes",
      "45 to 59 Minutes",
      "60 to 89 Minutes",
      "90 or More Minutes"
    ]
  },


  {
    type: "CensusBarChart",
    title: "Travelled by Public Transportation to Work by Earnings",
    censusKeys: ["B08119_028E...B08119_036E"],
    orientation: "horizontal",
    marginLeft: 330
  },
  {
    type: "CensusBarChart",
    title: "Walked to Work by Earnings",
    censusKeys: ["B08119_037E...B08119_045E"],
    orientation: "horizontal",
    marginLeft: 175
  },
  {
    type: "CensusBarChart",
    title: "Walked to Work by Age",
    censusKeys: ["B08101_033E...B08101_040E"],
    orientation: "horizontal",
    marginLeft: 175
  },

]
