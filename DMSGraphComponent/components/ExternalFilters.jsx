import React from "react"

import { format as d3format } from "d3-format"

import { Select } from "~/modules/avl-components/src"

import { Button } from "./uicomponents"
import { getColumnDisplay } from "./XAxisSelector"
import { strictNaN } from "./utils"

const NoData = () => {
  return (
    <div>
      You Must Add Data Columns to Graph Before Adding Filters
    </div>
  )
}

export const ExternalFilters = props => {

  const {
    columns,
    filters,
    addFilter,
    removeFilter
  } = props;

  const [selectedColumn, setSelectedcolumn] = React.useState(null);

  const okToAdd = React.useMemo(() => {
    return Boolean(selectedColumn);
  }, [selectedColumn]);

  const doAddFilter = React.useCallback(e => {
    e.stopPropagation();
    addFilter({
      column: selectedColumn,
      values: []
    })
    setSelectedcolumn(null);
  }, [selectedColumn, addFilter]);

  const doResetFilter = React.useCallback(e => {
    setSelectedcolumn(null);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4">

      <div className="font-bold text-xl col-span-2">
        External Filters
      </div>

      <div className="grid grid-cols-1 gap-4">

        { !columns.length ? <NoData /> :
          <Select
            placeholder="Select a column..."
            options={ columns }
            accessor={ getColumnDisplay }
            value={ selectedColumn }
            onChange={ setSelectedcolumn }/>
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

      { !filters.length ? null :
        <div className="col-span-2">
          <FilterTable filters={ filters }
            remove={ removeFilter }/>
        </div>
      }

    </div>
  )
}

const FilterRow = ({ filter, remove }) => {
  const doRemove = React.useCallback(e => {
    e.stopPropagation();
    remove(filter);
  }, [remove, filter]);
  return (
    <tr>
      <td className="py-1">
        { getColumnDisplay(filter.column) }
      </td>
      <td className="py-1">
        <button onClick={ doRemove }
          className={ `
            px-4 py-1 bg-white rounded
            outline-red-500 hover:outline hover:outline-2
            hover:text-red-500
          ` }
        >
          <span className="fa fa-trash"/>
        </button>
      </td>
    </tr>
  )
}

const FilterTable = ({ filters, remove }) => {
  return (
    <div>

      <div className="font-bold text-center">
        Current External Filters
      </div>

      <table className="w-full text-sm">

        <thead>
          <tr>
            <th className="py-1 border-b border-current">
              Column Name
            </th>
            <th className="py-1 border-b border-current">
              Remove Filter
            </th>
          </tr>
        </thead>

        <tbody className="text-center">
          { filters.map(f =>
              <FilterRow key={ f.column.name }
                filter={ f }
                remove={ remove }/>
            )
          }
        </tbody>

      </table>
    </div>
  )
}
