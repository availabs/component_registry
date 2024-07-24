import React from "react"

import { format as d3format } from "d3-format"

import { Select } from "~/modules/avl-components/src"

import { Button } from "./GraphOptionsEditor"
import { useGetColumnDomain } from "./utils"
import { getColumnDisplay } from "./XAxisSelector"

const NoData = () => {
  return (
    <div>
      You Must Add Data Columns to Graph Before Adding Filters
    </div>
  )
}

const columnName = c => c.name;

const FilterTypes = [
  "equals",
  "includes",
  "not equal"
]

const intFormat = d3format(",d");
const floatFormat = d3format(",.2f");
const displayFormat = v => {
  if (Math.floor(v) === v) {
    return intFormat(v);
  }
  return floatFormat(v);
}
export const GraphFilters = props => {

  const {
    columns,
    viewData,
    filters,
    addFilter,
    removeFilter,
    activeView,
    pgEnv
  } = props;

  const Columns = React.useMemo(() => {
    const filterSet = filters.reduce((a, c) => {
      a.add(c.column);
      return a;
    }, new Set());
    return columns.filter(f => !filterSet.has(f.name));
  }, [columns, filters]);

  const [selectedColumn, setSelectedcolumn] = React.useState(null);
  const [filterType, _setFilterType] = React.useState(null);
  const isMulti = filterType === "includes";

  const domain = useGetColumnDomain({ activeView, column: selectedColumn, pgEnv });

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
      column: selectedColumn.name,
      type: filterType,
      values: _filterValues
    })
    setSelectedcolumn(null);
    _setFilterType(null);
    setFilterValues([]);
  }, [selectedColumn, filterType, _filterValues, addFilter]);

  const doResetFilter = React.useCallback(e => {
    setSelectedcolumn(null);
    _setFilterType(null);
    setFilterValues([]);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4">

      <div className="font-bold text-xl col-span-2">
        Graph Filters
      </div>

      <div className="grid grid-cols-1 gap-4">

        { !columns.length ? <NoData /> :
          <Select
            placeholder="Select a column..."
            options={ Columns }
            accessor={ getColumnDisplay }
            value={ selectedColumn }
            onChange={ setSelectedcolumn }/>
        }

        { !selectedColumn ? null :
          <Select
            placeholder="Select a filter type..."
            options={ FilterTypes }
            value={ filterType }
            onChange={ setFilterType }/>
        }

      </div>

      <div className="grid grid-cols-1 gap-4">

        { !domain.length || !filterType ? null :
          <Select multi={ isMulti } removable
            placeholder={ `Select filter ${ isMulti ? "values" : "value" }` }
            options={ domain }
            accessor={ d => `${ d.value } (count ${ d.count })` }
            valueAccessor={ d => d.value }
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
        { filter.column }
      </td>
      <td className="py-1">
        { filter.type }
      </td>
      <td className="py-1">
        { filter.values.map(v => (
            <div key={ v }>
              { displayFormat(v) }
            </div>
          ))
        }
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
        Current Filters
      </div>

      <table className="w-full text-sm">

        <thead>
          <tr>
            <th className="py-1 border-b border-current">
              Column Name
            </th>
            <th className="py-1 border-b border-current">
              Filter Type
            </th>
            <th className="py-1 border-b border-current">
              Filter Value
            </th>
            <th className="py-1 border-b border-current">
              Remove Filter
            </th>
          </tr>
        </thead>

        <tbody className="text-center">
          { filters.map(f =>
              <FilterRow key={ f.column }
                filter={ f }
                remove={ remove }/>
            )
          }
        </tbody>

      </table>
    </div>
  )
}
