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

  useRefreshState,
  useGetViewData,
  getNewGraphFormat,
  getColumnDisplay,
  capitalize
} from "./components"

import { Button } from "./components/uicomponents"

import { Select } from "~/modules/avl-components/src"
import { MultiLevelSelect } from "~/modules/avl-map-2/src/uicomponents"

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
    category: get(state, "category", null),
    checkForRefresh: Boolean(value)
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
      return {
        ...state,
        activeGraphType: payload.graph,
        graphFormat: {
          ...state.graphFormat,
          colors: {
            type: "palette",
            value: [...DefaultPalette]
          }
        }
      }
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
    case "update-external-filter": {
      const { filter, update } = payload;
      return {
        ...state,
        externalFilters: state.externalFilters.map(f => {
          if (f === filter) {
            return { ...f, ...update };
          }
          return f;
        })
      }
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
    case "refresh-state":
      return { ...state, ...payload.state };
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
  const updateExternalFilter = React.useCallback((filter, update) => {
    dispatch({
      type: "update-external-filter",
      filter,
      update
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

  const refreshState = React.useCallback(state => {
    dispatch({
      type: "refresh-state",
      state
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
  } = useRefreshState(state, pgEnv, refreshState);

  const columns = React.useMemo(() => {
    return get(state, ["activeSource", "metadata", "value", "columns"]) || [];
  }, [activeSource]);

  const [viewData, viewDataLength] = useGetViewData({ pgEnv,
                                                      activeView,
                                                      xAxisColumn,
                                                      yAxisColumns,
                                                      filters,
                                                      externalFilters,
                                                      category
                                                    });

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
  }, [viewData, graphFormat]);

  const filteredData = useFilterViewData({ viewData, filters: externalFilters });

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

      <div>
        <ExternalFiltersControls editMode
          filters={ externalFilters }
          updateFilter={ updateExternalFilter }
          viewData={ viewData }
          bgColor={ updatedGraphFormat.bgColor }
          textColor={ updatedGraphFormat.textColor }/>

        <GraphComponent
          graphFormat={ updatedGraphFormat }
          activeGraphType={ activeGraphType }
          viewData={ filteredData }
          showCategories={ Boolean(category) || (yAxisColumns.length > 1) }
          xAxisColumn={ xAxisColumn }
          yAxisColumns={ yAxisColumns }/>
      </div>

      <ExternalFilters
        columns={ columns }
        filters={ externalFilters }
        addFilter={ addExternalFilter }
        removeFilter={ removeExternalFilter }/>

      <GraphFilters
        columns={ columns }
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

const FilterSelect = ({ options, value, onChange }) => {
  return (
    <div>
    </div>
  )
}

const ExternalFilterSelect = ({ filter, update, viewData, textColor, editMode }) => {

  const domain = React.useMemo(() => {
    const domain = viewData.map(d => get(d, ["externalData", filter.column.name], null));
    return uniq(domain)
            .sort((a, b) => a < b ? -1 : a > b ? 1 : 0)
            .map(d => ({ name: d, value: d }));
  }, [filter, viewData]);

  const domainOptions = React.useMemo(() => {
    return [
      { name: "Add All",
        value: "add-all"
      },
      { name: "Remove All",
        value: "remove-all"
      },
      ...domain
    ]
  }, [domain]);

  const [selected, setSelected] = React.useState([]);

  const onChange = React.useCallback(v => {
    const addAll = v.reduce((a, c) => {
      return a || (c === "add-all");
    }, false);
    if (addAll) {
      return update(filter, { values: domain.map(d => d.value) });
    }

    const removeAll = v.reduce((a, c) => {
      return a || (c === "remove-all");
    }, false);
    if (removeAll) {
      return update(filter, { values: [] });
    }

    update(filter, { values: v });
  }, [filter, update, domain]);

  const placeholder = React.useMemo(() => {
    return editMode ?
            "Set default filter values..." :
            "Set filter values..."
  }, [editMode]);

  return (
    <div>
      <div className="font-bold"
        style={ { color: textColor } }
      >
        { capitalize(filter.column.name) } Filter
      </div>
      <MultiLevelSelect isMulti removable
        placeholder={ placeholder }
        options={ domainOptions }
        value={ filter.values }
        onChange={ onChange }
        displayAccessor={ o => o.name }
        valueAccessor={ o => o.value }/>
    </div>
  )
}

const ExternalFiltersControls = props => {
  const {
    filters,
    updateFilter,
    viewData,
    bgColor,
    textColor,
    editMode = false
  } = props;

  if (!filters.length) return null;

  return (
    <div className="grid grid-cols-3 gap-4 p-4"
      style={ { backgroundColor: bgColor } }
    >
      { filters.map(f => (
          <ExternalFilterSelect key={ f.column.name }
            filter={ f }
            update={ updateFilter }
            viewData={ viewData }
            textColor={ textColor }
            editMode={ editMode }/>
        ))
      }
    </div>
  )
}

const useFilterViewData = ({ viewData, filters }) => {
  return React.useMemo(() => {
    const activefilters = filters.filter(f => f.values.length);
    if (!activefilters.length) return viewData;
    return viewData.filter(vd => {
      return activefilters
        .reduce((a, c) => {
          const fValues = c.values;
          const col = c.column.name;
          const vdValue = get(vd, ["externalData", col], null);
          return a || fValues.includes(vdValue);
        }, false);
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
    externalFilters
  } = state;

  if (!get(viewData, "length", 0)) {
    return null;
  }

  const [filters, setFilters] = React.useState([]);

  React.useEffect(() => {
    setFilters([...externalFilters]);
  }, [externalFilters]);

  const updateFilter = React.useCallback((filter, update) => {
    setFilters(filters => {
      return filters.map(f => {
        if (f === filter) {
          return { ...f, ...update };
        }
        return f;
      })
    })
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
  }, [viewData, graphFormat]);

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
      <ExternalFiltersControls
        filters={ filters }
        updateFilter={ updateFilter }
        viewData={ viewData }
        bgColor={ graphFormat.bgColor }
        textColor={ graphFormat.textColor }/>

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
