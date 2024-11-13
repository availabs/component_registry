import React from "react"

import get from "lodash/get"
import uniq from "lodash/uniq"
import isEqual from "lodash/isEqual"
import { range as d3range } from "d3-array"
import colorbrewer from "colorbrewer"

import { useFalcor } from "@availabs/avl-falcor"

const ColorRanges = {}

for (const type in colorbrewer.schemeGroups) {
  colorbrewer.schemeGroups[type].forEach(name => {
    const group = colorbrewer[name];
    for (const length in group) {
      if (!(length in ColorRanges)) {
        ColorRanges[length] = [];
      }
      ColorRanges[length].push({
        type: `${ type[0].toUpperCase() }${ type.slice(1) }`,
        name,
        category: "Colorbrewer",
        colors: group[length]
      })
    }
  })
}

export { ColorRanges };

export const getColorRange = (size, name, reverse=false) => {
  let range = get(ColorRanges, [size], [])
    .reduce((a, c) => c.name === name ? c.colors : a, []).slice();
  if(reverse) {
    range.reverse()
  }
  return range
}

const NaNValues = ["", null]

export const strictNaN = v => {
  if (NaNValues.includes(v)) return true;
  return isNaN(v);
}

export const useRefreshState = (currentState, pgEnv, refreshState) => {
// console.log("useRefreshState::currentState", currentState);

  const checkForRefresh = currentState.checkForRefresh;

  const { falcor, falcorCache } = useFalcor();

  const { activeSource, activeView, xAxisColumn, yAxisColumns, filters, externalFilters } = currentState;

  const [updatedActiveSource, setUpdatedActiveSource] = React.useState(null);
  React.useEffect(() => {
    if (!checkForRefresh) return;

    if (activeSource?.source_id &&
        updatedActiveSource?.source_id &&
        (activeSource.source_id !== updatedActiveSource.source_id)
      ) {
        const path = ["dama", pgEnv, "sources", "byId", activeSource.source_id, "attributes"];
        falcor.get([
          ...path,
          ["source_id", "name", "metadata", "categories", "type"]
        ]);
        const updated = get(falcorCache, path, null);
        if (updated?.source_id === activeSource.source_id) {
          setUpdatedActiveSource(updated);
        }
      }
  }, [falcor, falcorCache, pgEnv, activeSource, updatedActiveSource, checkForRefresh]);

  const [updatedActiveView, setUpdatedActiveView] = React.useState(null);
  React.useEffect(() => {
    if (!checkForRefresh) return;

    if (activeView?.view_id &&
        updatedActiveView?.view_id &&
        (activeView.view_id !== updatedActiveView.view_id)
      ) {
        const path = ["dama", pgEnv, "views", "byId", activeView.view_id, "attributes"];
        falcor.get([
          ...path,
          ["view_id", "source_id", "version", "metadata"]
        ]);
        const updated = get(falcorCache, path, null);
        if (updated?.view_id === activeView.view_id) {
          setUpdatedActiveView(updated);
        }
      }
  }, [falcor, falcorCache, pgEnv, activeView, updatedActiveView, checkForRefresh]);

  const updatedColumns = React.useMemo(() => {
    return get(updatedActiveSource, ["metadata", "value", "columns"]) || [];
  }, [updatedActiveSource]);

  const refreshedState = React.useMemo(() => {

      if (!checkForRefresh) return currentState;

      const refreshedState = { ...currentState };

      if (updatedActiveSource?.source_id) {
        refreshedState.activeSource = updatedActiveSource;
      }

      if (updatedActiveView?.view_id) {
        refreshedState.activeView = updatedActiveView;
      }

      if (updatedColumns.length) {
        const xAxisCol = updatedColumns.find(col => col.name === xAxisColumn.name);
        if (xAxisCol) {
          refreshedState.xAxisColumn = {
            ...xAxisColumn,
            ...xAxisCol
          }
        }

        const yAxisCols = yAxisColumns.map(yAxisColumn => {
          const yAxisCol = updatedColumns.find(col => col.name === yAxisColumn.name);
          if (yAxisCol) {
            return {
              ...yAxisColumn,
              ...yAxisCol
            }
          }
        }).filter(Boolean);
        if (yAxisCols.length === yAxisColumns.length) {
          refreshedState.yAxisColumns = yAxisCols;
        }

        const updatedFilters = filters.map(filter => {
          return {
            ...filter,
            column: updatedColumns.find(col => col.name === filter.column.name)
          }
        }).filter(filter => Boolean(filter.column));
        if (updatedFilters.length === filters.length) {
          refreshedState.filters = updatedFilters;
        }

        const updatedExternalFilters = externalFilters.map(filter => {
          return {
            ...filter,
            column: updatedColumns.find(col => col.name === filter.column.name)
          }
        }).filter(filter => Boolean(filter.column));
        if (updatedExternalFilters.length === externalFilters.length) {
          refreshedState.externalFilters = updatedExternalFilters;
        }
      }
      return refreshedState;
    }, [currentState, updatedActiveSource, updatedActiveView,
        updatedColumns, xAxisColumn, yAxisColumns, checkForRefresh
      ]
  );

  React.useEffect(() => {
    if (checkForRefresh && !isEqual(currentState, refreshedState)) {
      refreshState(refreshedState);
    }
  }, [currentState, refreshedState, checkForRefresh, refreshState]);

  return refreshedState;
}

export const useGetSources = ({ pgEnv } = {}) => {
  const { falcor, falcorCache } = useFalcor();

  React.useEffect(() => {
    falcor.get(["dama", pgEnv, "sources", "length"]);
  }, [falcor, pgEnv]);

  React.useEffect(() => {
    const num = get(falcorCache, ["dama", pgEnv, "sources", "length"], 0);
    if (num) {
      falcor.get([
        "dama", pgEnv, "sources", "byIndex", { from: 0, to: num - 1 }, "attributes",
        ["source_id", "name", "metadata", "categories", "type"]
      ])
    }
  }, [falcor, falcorCache, pgEnv]);

  return React.useMemo(() => {
    const num = get(falcorCache, ["dama", pgEnv, "sources", "length"], 0);
    return d3range(num)
      .reduce((a, c) => {
        const ref = get(falcorCache, ["dama", pgEnv, "sources", "byIndex", c, "value"], null);
        if (ref?.length) {
          const source = get(falcorCache, [...ref, "attributes"]);
          a.push(source);
        }
        return a;
      }, [])
        .filter(src => {
          const cats = get(src, ["categories", "value"], []);
          if (!Array.isArray(cats)) return false;
          return cats.reduce((a, c) => {
            return a || c.includes("Cenrep");
          }, false);
        })
        .sort((a, b) => a.name.localeCompare(b.name));
  }, [falcorCache, pgEnv]);
}

export const useGetViews = ({ pgEnv, sourceId = null } = {}) => {
  const { falcor, falcorCache } = useFalcor();

  React.useEffect(() => {
    if (strictNaN(sourceId)) return;
    falcor.get(["dama", pgEnv, "sources", "byId", sourceId, "views", "length"]);
  }, [falcor, pgEnv, sourceId]);

  React.useEffect(() => {
    const num = get(falcorCache, ["dama", pgEnv, "sources", "byId", sourceId, "views", "length"], 0);
    if (num) {
      falcor.get([
        "dama", pgEnv, "sources", "byId", sourceId, "views",
        "byIndex", { from: 0, to: num - 1 }, "attributes",
        ["view_id", "source_id", "version", "metadata"]
      ])
    }
  }, [falcor, falcorCache, pgEnv, sourceId]);

  return React.useMemo(() => {
    const num = get(falcorCache, ["dama", pgEnv, "sources", "byId", sourceId, "views", "length"], 0);
    return d3range(num)
      .reduce((a, c) => {
        const ref = get(falcorCache, ["dama", pgEnv, "sources", "byId", sourceId, "views", "byIndex", c, "value"], null);
        if (ref?.length) {
          const view = get(falcorCache, [...ref, "attributes"]);
          a.push(view);
        }
        return a;
      }, [])
        .sort((a, b) => b.view_id - a.view_id);
  }, [falcorCache, pgEnv, sourceId]);
}

export const capitalize = string => {
  return string
          .split(/\s+/g)
          .map(word => {
            return word.split("")
                        .map((letter, i) => i === 0 ? letter.toUpperCase() : letter)
                        .join("")
          }).join(" ")
}

const splitColumnName = cn => cn.split(/\s(?:as|AS)\s/);
const cleanColumnName = cn => splitColumnName(cn)[0];

const FilterTypeMap = {
  "equals": "filter",
  "includes": "filter",
  "greater than": "gt",
  "greater than or equals": "gte",
  "less than": "lt",
  "less than or equals": "lte",
  "like": "like"
}

export const useGetViewData = args => {

  const {
    activeView,
    xAxisColumn,
    yAxisColumns,
    filters,
    externalFilters,
    pgEnv,
    category
  } = args;

  const { falcor, falcorCache } = useFalcor();

  const options = React.useMemo(() => {
    if (!xAxisColumn) return "{}";

    const filtersByType = filters.reduce((a, c) => {
      const type = FilterTypeMap[c.type];
      if (!(type in a)) {
        a[type] = {}
      }
      const ccn = cleanColumnName(c.column.name);
      a[type][ccn] = ["equals", "includes"].includes(c.type) ? c.values : c.values[0];
      return a;
    }, {});

// console.log(filters, filtersByType)

    return JSON.stringify({
      aggregatedLen: true,
      groupBy: uniq([
        cleanColumnName(xAxisColumn.name),
        cleanColumnName(get(category, "name", "")),
        ...externalFilters.map(f => cleanColumnName(f.column.name))
      ].filter(Boolean)),
      ...filtersByType
      // filter: filters.reduce((a, c) => {
      //   a[cleanColumnName(c.column.name)] = c.values
      //   return a;
      // }, {})
    });
  }, [xAxisColumn, filters, externalFilters, category]);

  const [yColumnsMap, yColumnsDisplayNames, aggMethods] = React.useMemo(() => {
    return yAxisColumns.reduce((a, c) => {
      const { name, aggMethod, display_name } = c;

      const [sql, cn] = splitColumnName(name);

      const key = `${ aggMethod }(${ sql }) AS ${ cn || sql }`;

      a[0][key] = cn || sql;
      a[1][key] = display_name || name;
      a[2][key] = aggMethod;

      return a;
    }, [{}, {}, {}]);
  }, [yAxisColumns]);

  React.useEffect(() => {
    if (!activeView) return;
    const vid = activeView.view_id;
    falcor.get(["dama", pgEnv, "viewsbyId", vid, "options", options, "length"]);
  }, [falcor, pgEnv, activeView, options]);

  React.useEffect(() => {
    if (!activeView) return;

    const vid = activeView.view_id;

    let length = get(falcorCache, ["dama", pgEnv, "viewsbyId", vid, "options", options, "length"], 0);
    // length = Math.min(length, 250);

    const columns = [
      get(xAxisColumn, "name", null),
      ...Object.keys(yColumnsMap),
      get(category, "name", null),
      ...externalFilters.map(f => f.column.name)
    ].filter(Boolean);

    if (length && !strictNaN(length) && columns.length) {
      falcor.get([
        "dama", pgEnv, "viewsbyId", vid, "options", options, "databyIndex", d3range(length), columns
      ])//.then(res => console.log("useGetViewData::res", res));
    }
  }, [falcor, falcorCache, pgEnv, activeView, xAxisColumn, options, yColumnsMap, externalFilters, category]);

  return React.useMemo(() => {
    if (!activeView) return [[], 0];
    if (!xAxisColumn) return [[], 0];

    const vid = activeView.view_id;

    let length = get(falcorCache, ["dama", pgEnv, "viewsbyId", vid, "options", options, "length"], 0);
    // length = Math.min(length, 250);

    const catName = get(category, "name", "");

    const data = d3range(length)
      .reduce((a, c) => {
        const data = get(falcorCache, ["dama", pgEnv, "viewsbyId", vid, "options", options, "databyIndex", c]);

        if (data) {
          for (const key in yColumnsMap) {

            let index = data[xAxisColumn.name];
            if ((typeof index === "object") && ("value" in index)) {
              index = index.value;
            }

            let value = data[key];
            if ((typeof value === "object") && ("value" in value)) {
              value = value.value;
            }

            let type = catName ? data[catName] : yColumnsDisplayNames[key];
            if ((typeof type === "object") && ("value" in type)) {
              type = type.value;
            }

            const aggMethod = aggMethods[key];

            if (index && !strictNaN(value) && type) {
              const viewData = { index, value: +value, type, aggMethod };

              if (externalFilters.length) {
                viewData.externalData = {};
              }

              externalFilters.forEach(f => {
                viewData.externalData[f.column.name] = data[f.column.name];
              })

              a.push(viewData);
            }
          }
        }

        return a;
      }, []);

// console.log("useGetViewData::data", data)

    const { sortMethod } = xAxisColumn;

    if (sortMethod !== "none") {
      data.sort((a, b) => {
        switch (sortMethod) {
          case "ascending":
            return String(a.index).localeCompare(String(b.index));
          case "descending":
            return String(b.index).localeCompare(String(a.index));
        }
      })
    }

    return [data, data.length];
  }, [falcorCache, pgEnv, activeView, options, xAxisColumn, yColumnsMap, yColumnsDisplayNames, externalFilters, category, aggMethods]);
}

export const useGetColumnDomain = ({ activeView, column, pgEnv, limit = 1000 }) => {
  const { falcor, falcorCache } = useFalcor();

  const options = React.useMemo(() => {
    if (!column) return "{}";
    return JSON.stringify({
      aggregatedLen: true,
      groupBy: [cleanColumnName(column.name)]
    })
  }, [column]);

  const columnMap = React.useMemo(() => {
    if (!column) return {};
    const [sql, cn] = splitColumnName(column.name);
    return {
      ["COUNT(1) AS count"]: cn || sql
    }
  }, [column]);

  React.useEffect(() => {
    if (!activeView) return;
    if (!column) return;
    const vid = activeView.view_id;
    falcor.get(["dama", pgEnv, "viewsbyId", vid, "options", options, "length"]);
  }, [falcor, pgEnv, activeView, options, column]);

  React.useEffect(() => {
    if (!activeView) return;
    if (!column) return;

    const vid = activeView.view_id;

    let length = get(falcorCache, ["dama", pgEnv, "viewsbyId", vid, "options", options, "length"], 0);
    length = Math.min(limit, length);

    const columns = [
      get(column, "name", null),
      ...Object.keys(columnMap)
    ].filter(Boolean)
    if (length && !strictNaN(length) && columns.length) {
      falcor.get([
        "dama", pgEnv, "viewsbyId", vid, "options", options, "databyIndex", d3range(length), columns
      ]);
    }
  }, [falcor, falcorCache, pgEnv, activeView, options, column, columnMap, limit]);

  return React.useMemo(() => {
    if (!activeView) return [];
    if (!column) return [];

    const vid = activeView.view_id;

    let length = get(falcorCache, ["dama", pgEnv, "viewsbyId", vid, "options", options, "length"], 0);
    length = Math.min(limit, length);

    return d3range(length)
      .reduce((a, c) => {
        const data = get(falcorCache, ["dama", pgEnv, "viewsbyId", vid, "options", options, "databyIndex", c]);
        if (data) {
          const value = get(data, [column.name, "value"], get(data, column.name))
          if (value) {
            a.push({
              value,
              count: +data["COUNT(1) AS count"]
            })
          }
        }
        return a;
      }, []).sort((a, b) => {
        if (!(strictNaN(a.value) || strictNaN(b.value))) {
          return +a.value - +b.value;
        }
        return String(a.value).localeCompare(String(b.value));
      });
  }, [falcorCache, pgEnv, activeView, options, column, columnMap, limit])
}
