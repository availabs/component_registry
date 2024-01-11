

// import ColorBox from "../colorbox";
import LossByDisasterNumberChart from "./LossByDisasterNumberChart";
import LossDistributionPieChart from "./LossDistributionPieChart";
import LossByHazardTypeChart from "./LossByHazardTypeChart";
import LossDistributionHeroStats from "./LossDistributionHeroStats";
import DisastersTable from "./DisastersTable/index.jsx";
import DisasterInfoStats from "./DisasterInfoStats/index.jsx";
import DisasterLossStats from "./DisasterLossStats/index.jsx";
import DisasterLossTables from "./DisasterLossTables/index.jsx";
import DisasterLossMap from "./DisasterLossMap/index.jsx";
import NRIMap from "./NRIMap/index.jsx";
import DFIRMMap from "./DFIRMMap/index.jsx";
import BuildingsMap from "./BuildingsMap/index.jsx";
import SocialVulnerabilityTable from "./SocialVulnerabilityTable/index.jsx"
import SocialVulnerabilitySummaryTable from "./SocialVulnerabilitySummaryTable/index.jsx"
import BuildingsTable from "./BuildingsTable/index.jsx";
import SocialVulnerabilityMap from "./SocialVulnerabilityMap/index.jsx"
import HazardStatBox from './HazardStatBox';
import NRITable from "./NRITable/index.jsx";
import CalloutBox from "./CalloutBox/";
import FusionEventsMap from "./FusionEventsMap/index.jsx";
import OpenFemaDataTable from "./OpenFemaDataTable/index.jsx";
import CenrepTable from "./CenrepTable/index.jsx";
import DataTextBox from "./DataTextBox/index.jsx";
import FormsTable from "./FormsTable/index.jsx";
import CensusStatBox from "./CensusStatBox/index.jsx"
import CensusBarChart from "./CensusBarChart/index.jsx";
import CensusStackedBarChart from "./CensusStackedBarChart/index.jsx";
import CensusLineChart from "./CensusLineChart/index.jsx";
import CountyStatusMap from "./CountyStatusMap/index.jsx";
import CountyHighlightMap from "./CountyHighlightMap/index.jsx";

const ComponentRegistry = {
    // "ColorBox": ColorBox,
    "Card: Callout": CalloutBox,
    "Card: Hazard Risk": HazardStatBox,
    "Card: Declared vs Non-Declared Loss": LossDistributionHeroStats,
    "Card: FEMA Disaster Info": DisasterInfoStats,
    "Card: FEMA Disaster Loss Summary": DisasterLossStats,
    "Card: Census": CensusStatBox,
    "Table: Disasters": DisastersTable,
    "Table: FEMA Disaster Loss by Program": DisasterLossTables,
    "Table: NRI": NRITable,
    "Table: Social Vulnerability": SocialVulnerabilityTable, // deprecated
    "Table: Social Vulnerability Summary": SocialVulnerabilitySummaryTable,
    "Table: Buildings": BuildingsTable, // deprecated
    "Table: Open Fema Data": OpenFemaDataTable, // deprecated
    "Table: Forms": FormsTable,
    "Table: Cenrep": CenrepTable,
    "Graph: Historic Loss by Disaster Number": LossByDisasterNumberChart,
    "Graph: Historic Loss by Hazard Type": LossByHazardTypeChart,
    "Graph: Declared vs Non-Declared Loss": LossDistributionPieChart,
    "Graph: Census Bar": CensusBarChart,
    "Graph: Census Stacked Bar": CensusStackedBarChart,
    "Graph: Census Line": CensusLineChart,
    "Map: Fusion Events Map": FusionEventsMap,
    "Map: FEMA Disaster Loss": DisasterLossMap,
    "Map: NRI": NRIMap,
    "Map: Social Vulnerability": SocialVulnerabilityMap,
    "Map: Buildings": BuildingsMap,
    "Map: Floodplains": DFIRMMap,
    "Map: County Status": CountyStatusMap,
    "Map: County Highlight": CountyHighlightMap,
    "lexical": {
        ...CalloutBox,
        name: 'Rich Text',
        hideInSelector: false
    },
    "Data Text Box": DataTextBox
}


export default ComponentRegistry