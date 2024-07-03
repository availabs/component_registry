import React from "react"

import { Select } from "~/modules/avl-components/src"

import {
  ColumnOption,
  ColumnItem,
  getColumnDisplay,
  List
} from "./XAxisSelector"

const AggregationMethods = ["SUM", "AVG", "COUNT"];

const YAxisColumnItem = ({ column, update }) => {
  const [hover, setHover] = React.useState(false);
  const onMouseEnter = React.useCallback(e => {
    e.stopPropagation();
    setHover(true);
  }, []);
  const onMouseLeave = React.useCallback(e => {
    e.stopPropagation();
    setHover(false);
  }, []);
  const doUpdate = React.useCallback(u => {
    update(column.name, u);
  }, [update, column.name]);

  const disabledAggMethods = React.useMemo(() => {
    if (["integer", "number"].includes(column.type)) return [];
    return ["SUM", "AVG"];
  }, [column.type]);

  return (
    <div className="relative flex overflow-visible"
      onMouseEnter={ onMouseEnter }
      onMouseLeave={ onMouseLeave }
    >
      <ColumnItem column={ column }/>

      <div className={ `
          ${ hover ? "w-fit overflow-auto" : "w-0 h-0 overflow-hidden" }
          bg-white top-0 left-0 absolute z-10
        ` }
      >
        <div className="py-1 px-4 border-b-2">
          { getColumnDisplay(column) }
        </div>
        <div className="px-2 pb-2 whitespace-nowrap overflow-visible">
          <div className="flex">
            <span className="mr-2">Aggregation Method:</span>
            <List current={ column.aggMethod }
              options={ AggregationMethods }
              disabledOptions={ disabledAggMethods }
              colKey="aggMethod"
              update={ doUpdate }/>
          </div>
        </div>
      </div>

    </div>
  )
}

export const YAxisSelector = ({ columns, yAxisColumns, setYAxisColumns, updateYAxisColumn }) => {
  const [hover, setHover] = React.useState(false);
  const onMouseEnter = React.useCallback(e => {
    e.stopPropagation();
    setHover(true);
  }, []);
  const onMouseLeave = React.useCallback(e => {
    e.stopPropagation();
    setHover(false);
  }, []);

  const doSetYAxisColumns = React.useCallback(col => {
    const included = yAxisColumns.reduce((a, c) => {
      return a || c.name === col.name;
    }, false);
    if (included) {
      setYAxisColumns(yAxisColumns.filter(c => c.name !== col.name));
    }
    else {
      setYAxisColumns([
        ...yAxisColumns,
        { ...col,
          aggMethod: ["integer", "number"].includes(col.type) ? "SUM" : "COUNT"
        }
      ]);
    }
  }, [yAxisColumns, setYAxisColumns]);

  const removeYAxisColumn = React.useCallback(col => {
    setYAxisColumns(yAxisColumns.filter(c => c.name !== col.name));
  }, [yAxisColumns, setYAxisColumns]);

  return (
    <div className="flex">
      <div className="mr-4 font-bold py-1">Y Axis:</div>
      <div className="hover:bg-gray-300 rounded px-2 py-1 relative mr-2"
        onMouseEnter={ onMouseEnter }
        onMouseLeave={ onMouseLeave }
      >
        <span className="fa fa-list py-1 px-2"/>
        { yAxisColumns.length ? null :
          <span className="ml-2 py-1">Select a column...</span>
        }
        <div className={ `
            ${ hover ? "w-fit max-h-[300px] overflow-auto" : "w-0 h-0 overflow-hidden" }
            bg-white top-0 left-0 absolute z-10
          ` }
        >
          { columns.map(col => (
              <ColumnOption key={ col.name }
                column={ col }
                select={ doSetYAxisColumns }
                isActive={
                  yAxisColumns.reduce((a, c) => {
                    return a || c.name === col.name;
                  }, false)
                }/>
            ))
          }
        </div>
      </div>
      { yAxisColumns.map((col, i) => (
          <div key={ col.name }
            className={ `flex overflow-visible ${ i > 0 ? "ml-2" : "" }` }
          >
            <YAxisColumnItem key={ col.name }
              column={ col }
              update={ updateYAxisColumn }/>
          </div>
        ))
      }
    </div>
  )
}
