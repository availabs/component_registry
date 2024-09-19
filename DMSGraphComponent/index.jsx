import React from "react"

import get from "lodash/get"
import set from "lodash/set"
import merge from "lodash/merge"
import isEqual from "lodash/isEqual"
import uniq from "lodash/uniq"

import { format as d3format } from "d3-format"

import {
  SourceSelector,
  ViewSelector,

  GraphTypeSelector,
  GraphOptionsEditor,
  GraphComponent,
  DefaultPalette,

  GraphFilters,
  FilterTable,
  ExternalFilters,
  CategorySelector,

  GraphTypes,

  XAxisSelector,
  YAxisSelector,

  useGetViewData,
  getNewGraphFormat,
  getColumnDisplay
} from "./components"

import { Button } from "./components/uicomponents"

import { Select } from "~/modules/avl-components/src"

const IntFormat = d3format(",d");

const parseJSON = (value) => {
  let json = {}
  try {
    json = JSON.parse(value)
  } catch (e) {
    console.log('no parse')
  }

  return json
}

const getInitialState = value => {
  const { state } = JSON.parse(value || "{}");
  return {
    activeSource: get(state, "activeSource", undefined),
    activeView: get(state, "activeView", undefined),
    activeGraphType: get(state, "activeGraphType", GraphTypes[0]),
    xAxisColumn: get(state, "xAxisColumn", undefined),
    yAxisColumns: get(state, "yAxisColumns", []),
    graphFormat: get(state, "graphFormat", getNewGraphFormat()),
    filters: get(state, "filters", []),
    externalFilters: get(state, "externalFilters", []),
    category: get(state, "category", null)
  }
}

const Reducer = (state, action) => {
  const { type, ...payload } = action;
  switch (type) {
    case "set-active-source":
      return {
        ...state,
        activeSource: payload.source,
        xAxisColumn: undefined,
        yAxisColumns: [],
        filters: [],
        category: null
      }
    case "set-active-view":
      return {
        ...state,
        activeView: payload.view
      }
    case "set-active-graph-type": {
      const nextState = {
        ...state,
        activeGraphType: payload.graph
      }
      if ((payload.graph.type === "Line Graph") && (nextState.graphFormat.colors.type !== "palette")) {
        nextState.graphFormat = {
          ...nextState.graphFormat,
          colors: {
            type: "palette",
            value: [...DefaultPalette]
          }
        }
      }
      return nextState;
    }
    case "set-x-axis-column":
      return {
        ...state,
        xAxisColumn: payload.column
      }
    case "update-x-axis-column": {
      const { update } = payload;
      return {
        ...state,
        xAxisColumn: { ...state.xAxisColumn, ...update }
      }
    }
    case "set-y-axis-columns":
      return {
        ...state,
        yAxisColumns: payload.columns
      }
    case "update-y-axis-column": {
      const { name, update } = payload;
      return {
        ...state,
        yAxisColumns: state.yAxisColumns.map(col => {
          if (col.name === name) {
            return { ...col, ...update };
          }
          return col;
        })
      }
    }
    case "edit-graph-format": {
      const merged = merge({}, state.graphFormat);
      payload.paths.forEach(([path, value]) => {
        set(merged, path, value);
      })
      return {
        ...state,
        graphFormat: merged
      }
    }
    case "add-filter":
      return {
        ...state,
        filters: [...state.filters, payload.filter]
      }
    case "remove-filter":
      return {
        ...state,
        filters: state.filters.filter(f => f !== payload.filter)
      }
    case "add-external-filter":
      return {
        ...state,
        externalFilters: [...state.externalFilters, payload.filter]
      }
    case "remove-external-filter":
      return {
        ...state,
        externalFilters: state.externalFilters.filter(f => f !== payload.filter)
      }
    case "set-category":
      return {
        ...state,
        category: payload.category
      }
    default:
      return state;
  }
}

const EditComp = ({ onChange, value, pgEnv = "hazmit_dama" }) => {

  const [state, dispatch] = React.useReducer(Reducer, value, getInitialState);

  const setActiveSource = React.useCallback(source => {
    dispatch({
      type: "set-active-source",
      source
    })
  }, []);
  const setActiveView = React.useCallback(view => {
    dispatch({
      type: "set-active-view",
      view
    })
  }, []);
  const setActiveGraphType = React.useCallback(graph => {
    dispatch({
      type: "set-active-graph-type",
      graph
    })
  }, []);
  const setXAxisColumn = React.useCallback(column => {
    dispatch({
      type: "set-x-axis-column",
      column
    })
  }, []);
  const updateXAxisColumn = React.useCallback(update => {
    dispatch({
      type: "update-x-axis-column",
      update
    })
  }, []);
  const setYAxisColumns = React.useCallback(columns => {
    dispatch({
      type: "set-y-axis-columns",
      columns
    })
  }, []);
  const updateYAxisColumn = React.useCallback((name, update) => {
    dispatch({
      type: "update-y-axis-column",
      name,
      update
    })
  }, []);

  const editGraphFormat = React.useCallback(paths => {
    dispatch({
      type: "edit-graph-format",
      paths
    })
  }, []);

  const addFilter = React.useCallback(filter => {
    dispatch({
      type: "add-filter",
      filter
    })
  }, []);
  const removeFilter = React.useCallback(filter => {
    dispatch({
      type: "remove-filter",
      filter
    })
  }, []);

  const addExternalFilter = React.useCallback(filter => {
    dispatch({
      type: "add-external-filter",
      filter
    })
  }, []);
  const removeExternalFilter = React.useCallback(filter => {
    dispatch({
      type: "remove-external-filter",
      filter
    })
  }, []);

  const setCategory = React.useCallback(category => {
    dispatch({
      type: "set-category",
      category
    })
  }, []);

  const {
    activeSource,
    activeView,
    activeGraphType,
    xAxisColumn,
    yAxisColumns,
    graphFormat,
    filters,
    externalFilters,
    category
  } = state;

  const columns = React.useMemo(() => {
    return get(state, ["activeSource", "metadata", "value", "columns"]) || [];
  }, [activeSource]);

  const [viewData, viewDataLength] = useGetViewData({ pgEnv, activeView, xAxisColumn, yAxisColumns, filters, externalFilters, category });

  const dataDomain = React.useMemo(() => {
    return viewData.map(vd => vd.value);
  }, [viewData]);

  const okToSave = React.useMemo(() => {
    const { state: savedState, viewData: savedData } = JSON.parse(value || "{}");
    return Boolean(viewData.length) && (!isEqual(savedState, state) || !isEqual(viewData, savedData));
  }, [state, viewData, value]);

  const doOnChange = React.useCallback(e => {
    if (!okToSave) return;
    onChange(JSON.stringify({ state, viewData }));
  }, [onChange, state, viewData, okToSave]);

  React.useEffect(() => {
    if (okToSave) {
      doOnChange();
    }
  }, [okToSave, doOnChange]);

  return (
    <div className="bg-gray-200 p-4 grid grid-cols-1 gap-2">

      <SourceSelector pgEnv={ pgEnv }
        activeSource={ activeSource }
        setActiveSource={ setActiveSource }/>

      <ViewSelector pgEnv={ pgEnv }
        activeSource={ activeSource }
        setActiveView={ setActiveView }
        activeView={ activeView }/>

      { !activeSource ? null :
        <div>
          <span className="font-bold">Amount of data:</span> { IntFormat(viewDataLength) } rows
        </div>
      }

      <GraphTypeSelector
        activeGraphType={ activeGraphType }
        setActiveGraphType={ setActiveGraphType }/>

      <XAxisSelector columns={ columns }
        xAxisColumn={ xAxisColumn }
        setXAxisColumn={ setXAxisColumn }
        updateXAxisColumn={ updateXAxisColumn }
        activeSource={ activeSource }/>

      <YAxisSelector columns={ columns }
        yAxisColumns={ yAxisColumns }
        setYAxisColumns={ setYAxisColumns }
        updateYAxisColumn={ updateYAxisColumn }
        activeSource={ activeSource }/>

      <GraphComponent
        graphFormat={ graphFormat }
        activeGraphType={ activeGraphType }
        viewData={ viewData }
        showCategories={ Boolean(category) || (yAxisColumns.length > 1) }
        xAxisColumn={ xAxisColumn }
        yAxisColumns={ yAxisColumns }/>

      <ExternalFilters
        columns={ columns }
        xAxisColumn={ xAxisColumn }
        viewData={ viewData }
        filters={ externalFilters }
        addFilter={ addExternalFilter }
        removeFilter={ removeExternalFilter }
        activeView={ activeView }
        pgEnv={ pgEnv }/>

      <GraphFilters
        columns={ columns }
        viewData={ viewData }
        filters={ filters }
        addFilter={ addFilter }
        removeFilter={ removeFilter }
        activeView={ activeView }
        pgEnv={ pgEnv }/>

      <CategorySelector
        columns={ columns }
        category={ category }
        setCategory={ setCategory }
        activeView={ activeView }
        pgEnv={ pgEnv }/>

      <GraphOptionsEditor
        format={ graphFormat }
        edit={ editGraphFormat }
        activeGraphType={ activeGraphType }
        dataDomain={ dataDomain }
        viewData={ viewData }/>

    </div>
  )
}

const useFilterViewData = ({ viewData, filters }) => {
  return React.useMemo(() => {
    if (!filters.length) return viewData;
    return viewData.filter(vd => {
      return filters.reduce((a, c) => {
        const col = c.column.name;
        const fValues = c.values;
        const vdValue = get(vd, ["externalData", col], null);
        return fValues.includes(vdValue);
      }, true);
    })
  }, [viewData, filters]);
}

const ViewComp = ({ value }) => {

  const { state, viewData } = React.useMemo(() => {
    return JSON.parse(value || "{}");
  }, [value]);

  if (!state) {
    return null;
  }

  const {
    graphFormat,
    activeGraphType,
    category,
    xAxisColumn,
    yAxisColumns,
    externalFilters = []
  } = state;

  if (!get(viewData, "length", 0)) {
    return null;
  }

  const [filters, setFilters] = React.useState([]);

  const addFilter = React.useCallback(f => {
    setFilters(filters => [...filters, f]);
  }, []);
  const removeFilter = React.useCallback(f => {
    setFilters(filters => filters.filter(filter => filter !== f));
  }, []);

  const colorMap = React.useMemo(() => {

    const colorType = get(graphFormat, ["colors", "type"]);

    const isPalette = ((colorType === "palette") || (colorType === "custom"));

    if (!isPalette) return {};

    const types = viewData.reduce((a, c) => {
      const type = c.type;
      if (!a.includes(type)) {
        a.push(type);
      }
      return a;
    }, []).sort((a, b) => a.localeCompare(b));

    const palette = get(graphFormat, ["colors", "value"], []);

    return types.reduce((a, c, i) => {
      a[c] = palette[i % palette.length];
      return a;
    }, {});
  }, [viewData, graphFormat])

  const filteredData = useFilterViewData({ viewData, filters });

  const updatedGraphFormat = React.useMemo(() => {

    const colorType = get(graphFormat, ["colors", "type"]);

    const isPalette = ((colorType === "palette") || (colorType === "custom"));

    if (!isPalette) return graphFormat;

    const types = filteredData.reduce((a, c) => {
      const type = c.type;
      if (!a.includes(type)) {
        a.push(type);
      }
      return a;
    }, []).sort((a, b) => a.localeCompare(b));

    const palette = types.map(type => colorMap[type]);

    return {
      ...graphFormat,
      colors: {
        ...graphFormat.colors,
        value: palette
      }
    }
  }, [colorMap, filteredData, graphFormat]);

  return (
    <div>
      <ExternalFilterSelector
        viewData={ viewData }
        externalFilters={ externalFilters }
        activeFilters={ filters }
        addFilter={ addFilter }
        removeFilter={ removeFilter }/>

      <GraphComponent
        graphFormat={ updatedGraphFormat }
        activeGraphType={ activeGraphType }
        viewData={ filteredData }
        showCategories={ Boolean(category) || (yAxisColumns.length > 1) }
        xAxisColumn={ xAxisColumn }
        yAxisColumns={ yAxisColumns }/>
    </div>
  )
}

const GraphComp = {
  name: "DMS Graph Component",
  type: "Graph",
  EditComp,
  ViewComp
}
export default GraphComp

const FilterTypes = [
  "equals",
  "includes"
]

const ExternalFilterSelector = ({ viewData, externalFilters, activeFilters, addFilter, removeFilter }) => {

  const filterableColumns = React.useMemo(() => {
    return externalFilters.map(f => f.column);
  }, [externalFilters]);

  const [selectedColumn, setSelectedcolumn] = React.useState(null);
  const [filterType, _setFilterType] = React.useState("equals");
  const isMulti = filterType === "includes";

  const filterDomain = React.useMemo(() => {
    if (!selectedColumn) return [];
    const domain = viewData.map(d => get(d, ["externalData", selectedColumn.name], null));
    return uniq(domain).sort((a, b) => a.localeCompare(b));
  }, [selectedColumn, viewData]);

  const [_filterValues, setFilterValues] = React.useState([]);

  const setFilterType = React.useCallback(fType => {
    if (fType === "equals") {
      setFilterValues(prev => prev.slice(0, 1));
    }
    _setFilterType(fType);
  }, [])

  const setEquals = React.useCallback(v => {
    setFilterValues([v]);
  }, []);
  const setIncludes = React.useCallback(v => {
    setFilterValues(v);
  }, []);

  const doOnChange = React.useCallback(v => {
    if (isMulti) {
      setIncludes(v);
    }
    else {
      setEquals(v);
    }
  }, [isMulti, setEquals, setIncludes]);

  const filterValues = React.useMemo(() => {
    if (isMulti) {
      return _filterValues;
    }
    return _filterValues[0];
  }, [_filterValues, isMulti]);

  const okToAdd = React.useMemo(() => {
    return Boolean(_filterValues.length);
  }, [_filterValues]);

  const doAddFilter = React.useCallback(e => {
    e.stopPropagation();
    addFilter({
      column: selectedColumn,
      type: filterType,
      values: _filterValues
    })
    setSelectedcolumn(null);
    _setFilterType("equals");
    setFilterValues([]);
  }, [selectedColumn, filterType, _filterValues, addFilter]);

  const doResetFilter = React.useCallback(e => {
    setSelectedcolumn(null);
    _setFilterType("equals");
    setFilterValues([]);
  }, []);

  if (!externalFilters.length) return null;

  return (
    <div className="grid grid-cols-2 gap-4 bg-gray-300 p-4">

      <div className="font-bold text-xl col-span-2">
        Filters
      </div>

      <div className="grid grid-cols-1 gap-4">

        <Select
          placeholder="Select a column..."
          options={ filterableColumns }
          accessor={ getColumnDisplay }
          value={ selectedColumn }
          onChange={ setSelectedcolumn }/>

        <Select
          placeholder="Select a filter type..."
          options={ FilterTypes }
          value={ filterType }
          onChange={ setFilterType }/>

      </div>

      <div className="grid grid-cols-1 gap-4">

        { !filterDomain.length || !filterType ? null :
          <Select multi={ isMulti } removable
            placeholder={ `Select filter ${ isMulti ? "values" : "value" }` }
            options={ filterDomain }
            accessor={ d => d }
            valueAccessor={ d => d }
            value={ filterValues }
            onChange={ doOnChange }/>
        }
      </div>

      <div className="col-span-2 grid grid-cols-2 gap-4">
        <Button onClick={ doResetFilter }>
          Reset Filter Settings
        </Button>
        <Button disabled={ !okToAdd }
          onClick={ doAddFilter }
        >
          Add Filter
        </Button>
      </div>

      { !activeFilters.length ? null :
        <div className="col-span-2">
          <FilterTable filters={ activeFilters }
            remove={ removeFilter }/>
        </div>
      }

    </div>
  )
}
