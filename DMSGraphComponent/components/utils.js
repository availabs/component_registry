import React from "react"

import get from "lodash/get"
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

const splitColumnName = cn => cn.split(/\s(?:as|AS)\s/);
const cleanColumnName = cn => splitColumnName(cn)[0];

export const useGetViewData = ({ activeView, xAxisColumn, yAxisColumns, filters, pgEnv, category }) => {

  const { falcor, falcorCache } = useFalcor();

  const options = React.useMemo(() => {
    if (!xAxisColumn) return "{}";

    return JSON.stringify({
      aggregatedLen: true,
      groupBy: [cleanColumnName(xAxisColumn.name), cleanColumnName(get(category, "name", ""))].filter(Boolean),
      filter: filters.reduce((a, c) => {
        a[cleanColumnName(c.column.name)] = c.values
        return a;
      }, {})
    });
  }, [xAxisColumn, filters, category]);

  const yColumnsMap = React.useMemo(() => {
    return yAxisColumns.reduce((a, c) => {
      const { name, aggMethod } = c;

      const [sql, cn] = splitColumnName(name);

      a[`${ aggMethod }(${ sql }) AS ${ cn || sql }`] = cn || sql;
      return a;
    }, {});
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
    length = Math.min(length, 250);

    const columns = [
      get(xAxisColumn, "name", null),
      ...Object.keys(yColumnsMap),
      get(category, "name", null)
    ].filter(Boolean);

    if (length && !strictNaN(length) && columns.length) {
      falcor.get([
        "dama", pgEnv, "viewsbyId", vid, "options", options, "databyIndex", d3range(length), columns
      ]);
    }
  }, [falcor, falcorCache, pgEnv, activeView, xAxisColumn, options, yColumnsMap, category]);

  return React.useMemo(() => {
    if (!activeView) return [[], 0];
    if (!xAxisColumn) return [[], 0];

console.log("???????????????", xAxisColumn, yAxisColumns)

    const vid = activeView.view_id;

    let length = get(falcorCache, ["dama", pgEnv, "viewsbyId", vid, "options", options, "length"], 0);
    length = Math.min(length, 250);

    const catName = cleanColumnName(get(category, "name", ""));

    const data = d3range(length)
      .reduce((a, c) => {
        const data = get(falcorCache, ["dama", pgEnv, "viewsbyId", vid, "options", options, "databyIndex", c]);

console.log("?????????????????????", data);

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

            let type = catName ? data[catName] : yColumnsMap[key];
            if ((typeof type === "object") && ("value" in type)) {
              type = type.value;
            }

            if (index && !strictNaN(value) && type) {
              a.push({ index, value: +value, type });
            }
          }
        }
        return a;
      }, []);

console.log("useGetViewData::data", data)

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

    return [data, length];
  }, [falcorCache, pgEnv, activeView, options, xAxisColumn, yColumnsMap, category]);
}

export const useGetColumnDomain = ({ activeView, column, pgEnv }) => {
  const { falcor, falcorCache } = useFalcor();

  const [dataLength, setDataLength] = React.useState(0);
  const [data, setData] = React.useState([]);

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
    length = Math.min(1000, length);

    const columns = [
      get(column, "name", null),
      ...Object.keys(columnMap)
    ].filter(Boolean)
    if (length && !strictNaN(length) && columns.length) {
      falcor.get([
        "dama", pgEnv, "viewsbyId", vid, "options", options, "databyIndex", d3range(length), columns
      ]);
    }
  }, [falcor, falcorCache, pgEnv, activeView, options, column, columnMap]);

  return React.useMemo(() => {
    if (!activeView) return [];
    if (!column) return [];

    const vid = activeView.view_id;

    let length = get(falcorCache, ["dama", pgEnv, "viewsbyId", vid, "options", options, "length"], 0);
    length = Math.min(1000, length);

    return d3range(length)
      .reduce((a, c) => {
        const data = get(falcorCache, ["dama", pgEnv, "viewsbyId", vid, "options", options, "databyIndex", c]);
        if (data) {
          a.push({
            value: data[column.name],
            count: +data["COUNT(1) AS count"]
          })
        }
        return a;
      }, []).sort((a, b) => {
        if (!(strictNaN(a.value) || strictNaN(b.value))) {
          return +a.value - +b.value;
        }
        return String(a.value).localeCompare(String(b.value));
      });
  }, [falcorCache, pgEnv, activeView, options, column, columnMap])
}
