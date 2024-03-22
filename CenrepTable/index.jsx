import React, {useCallback, useEffect, useMemo, useState} from "react";
import get from "lodash/get";
import {isJson} from "~/utils/macros.jsx";
import {RenderBuildingsTable} from "./components/RenderBuildingsTable.jsx";
import VersionSelectorSearchable from "../shared/versionSelector/searchable.jsx";
import GeographySearch from "../shared/geographySearch.jsx";
import {Loading} from "~/utils/loading.jsx";
import {getDefaultJustify, RenderColumnControls} from "../shared/columnControls.jsx";
import {addTotalRow} from "../utils/addTotalRow.js";
import {Switch} from "@headlessui/react";
import {defaultOpenOutAttributes, getNestedValue} from "../FormsTable/utils.js";
import DisasterSearch from "../shared/disasterSearch.jsx";
import {RenderSwitch} from "./components/RenderSwitch.jsx";
import {RenderFilters} from "./components/RenderFilters.jsx";
import {variables} from "./constants/variables.js";
import {getData} from "./utils/getData.js";
import {Edit} from "./components/Edit.jsx";
import {View} from "./components/View.jsx";

export default {
    "name": 'Table: Cenrep',
    "type": 'Table',
    "variables": variables,
    getData,
    "EditComp": Edit,
    "ViewComp": View
}