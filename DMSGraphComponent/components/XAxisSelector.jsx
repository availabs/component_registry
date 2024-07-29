import React from "react"

import isEqual from "lodash/isEqual"

export const getColumnDisplay = c => `${ c.display_name || c.name } (${ c.type })`;

export const ColumnOption = ({ column, select, isActive }) => {
  const doSelect = React.useCallback(e => {
    e.stopPropagation();
    select(column);
  }, [select, column]);
  return (
    <div onClick={ doSelect }
      className={ `
        w-full min-w-fit whitespace-nowrap px-2 py-1 pr-4
        ${ isActive ? "bg-gray-300 hover:bg-gray-400" : "hover:bg-gray-300" } cursor-pointer
      ` }
    >
      { !isActive ? null : <span className="fa fa-check px-1 py-1"/> }
      { getColumnDisplay(column) }
    </div>
  )
}

export const List = ({ current, options, disabledOptions = [], colKey, update }) => {
  const doUpdate = React.useCallback(e => {
    update({ [colKey]: e.target.id });
  }, [update, colKey]);
  return (
    <div className="inline-block flex">
      { options.map((o, i)=> (
          <div key={ o } id={ o }
            onClick={ disabledOptions.includes(o) ? null : doUpdate }
            className={ `
              ${ i > 0 ? "ml-2" : "" } border-current
              ${ o === current ?
                  "font-bold  border-b-2" :
                disabledOptions.includes(o) ?
                  "cursor-not-allowed opacity-50" :
                  "cursor-pointer opacity-50 hover:border-b hover:opacity-100"
              }
            ` }
          >
            { o }
          </div>
        ))
      }
    </div>
  )
}

export const ColumnItem = ({ column }) => {
  return (
    <span className="py-1 px-4 hover:bg-gray-300 rounded">
      { getColumnDisplay(column) }
    </span>
  )
}

const SortMethods = ["none", "ascending", "descending"];

const XAxisColumnItem = ({ column, update }) => {
  const [hover, setHover] = React.useState(false);
  const onMouseEnter = React.useCallback(e => {
    e.stopPropagation();
    setHover(true);
  }, []);
  const onMouseLeave = React.useCallback(e => {
    e.stopPropagation();
    setHover(false);
  }, []);
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
            <span className="mr-2">Sort Method:</span>
            <List current={ column.sortMethod }
              options={ SortMethods }
              colKey="sortMethod"
              update={ update }/>
          </div>
        </div>
      </div>

    </div>
  )
}

export const XAxisSelector = props => {

  const {
    columns,
    xAxisColumn,
    setXAxisColumn,
    updateXAxisColumn,
    activeSource
  } = props;

  const [hover, setHover] = React.useState(false);
  const onMouseEnter = React.useCallback(e => {
    e.stopPropagation();
    setHover(true);
  }, []);
  const onMouseLeave = React.useCallback(e => {
    e.stopPropagation();
    setHover(false);
  }, []);

  const xAxisName = React.useMemo(() => {
    if (!xAxisColumn) return null;
    return getColumnDisplay(xAxisColumn);
  }, [xAxisColumn]);

  const doSetXAxisColumn = React.useCallback(col => {
    setXAxisColumn({ ...col, sortMethod: "none" });
    setHover(false);
  }, [xAxisColumn, setXAxisColumn]);

  return (
    <div className="flex">
      <div className="mr-4 font-bold py-1">X Axis:</div>
      <div className="hover:bg-gray-300 rounded px-2 py-1 relative mr-2"
        onMouseEnter={ onMouseEnter }
        onMouseLeave={ onMouseLeave }
      >
        <span className="fa fa-list py-1 px-2"/>
        { xAxisColumn ? null :
          !activeSource ?
          <span className="ml-2 py-1">Select a source...</span> :
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
                select={ doSetXAxisColumn }
                isActive={ col.name === xAxisColumn?.name }/>
            ))
          }
        </div>
      </div>
      { !xAxisColumn ? null :
        <XAxisColumnItem
          column={ xAxisColumn }
          update={ updateXAxisColumn }/>
      }
    </div>
  )
}
