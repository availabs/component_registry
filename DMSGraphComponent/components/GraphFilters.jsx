import React from "react"

import { format as d3format } from "d3-format"

import { Select } from "~/modules/avl-components/src"

import { Button } from "./uicomponents"
import { useGetColumnDomain } from "./utils"
import { getColumnDisplay } from "./XAxisSelector"
import { strictNaN } from "./utils"

const NoData = () => {
  return (
    <div>
      You Must Add Data Columns to Graph Before Adding Filters
    </div>
  )
}

// const FilterTypes = [
//   "equals",
//   "includes"
// ]
const NumericTypes = [
  "integer",
  "number"
]
const NumericFilterTypes = [
  "equals",
  "includes",
  "greater than",
  "greater than or equals",
  "less than",
  "less than or equals"
]
const StringFilterTypes = [
  "equals",
  "includes",
  "like"
]
const InputTypes = [
  "greater than",
  "greater than or equals",
  "less than",
  "less than or equals",
  "like"
]

const coerceFilterValues = type => NumericTypes.includes(type) ? Number : String;

const intFormat = d3format(",d");
const floatFormat = d3format(",.2f");
const displayFormat = v => {
  if (strictNaN(v)) return v;
  if (Math.floor(+v) === +v) {
    return intFormat(v);
  }
  return floatFormat(v);
}

export const hasValue = value => {
  if ((value === null) || (value === undefined)) return false;
  if ((typeof value === "string") && !value.length) return false;
  if (Array.isArray(value)) return value.reduce((a, c) => a || hasValue(c), false);
  if ((typeof value === "number") && isNaN(value)) return false;
  if ((typeof value === "object")) return Object.values(value).reduce((a, c) => a || hasValue(c), false);
  return true;
}

export const GraphFilters = props => {

  const {
    columns,
    filters,
    addFilter,
    removeFilter,
    activeView,
    pgEnv
  } = props;

  const [selectedColumn, _setSelectedcolumn] = React.useState(null);
  const [filterType, _setFilterType] = React.useState("equals");
  const isMulti = filterType === "includes";

  const domain = useGetColumnDomain({ activeView, column: selectedColumn, pgEnv });

  const [_filterValues, setFilterValues] = React.useState([]);

  const [inputValue, setInputValue] = React.useState("");
  const handleInputChange = React.useCallback(e => {
    const value = coerceFilterValues(filterType)(e.target.value);
    setInputValue(value);
    if (hasValue(value)) {
      setFilterValues([]);
    }
  }, [filterType]);

  const setSelectedcolumn = React.useCallback(col => {
    _setSelectedcolumn(col);
    _setFilterType("equals");
    setFilterValues([]);
    setInputValue("");
  }, []);

  const setFilterType = React.useCallback(fType => {
    _setFilterType(fType);
    setFilterValues([]);
    if (InputTypes.includes(fType)) {
      setInputValue("");
    }
  }, []);

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

  const doResetFilter = React.useCallback(e => {
    _setSelectedcolumn(null);
    _setFilterType("equals");
    setFilterValues([]);
    setInputValue("");
  }, []);

  const okToAdd = React.useMemo(() => {
    return Boolean(_filterValues.length) || hasValue(inputValue);
  }, [_filterValues, inputValue]);

  const doAddFilter = React.useCallback(e => {
    e.stopPropagation();
    addFilter({
      column: selectedColumn,
      type: filterType,
      values: hasValue(inputValue) ?
                [inputValue] :
                _filterValues.map(coerceFilterValues(selectedColumn.type))
    })
    doResetFilter();
  }, [selectedColumn, filterType, _filterValues, inputValue, addFilter, doResetFilter]);

  const FilterTypes = React.useMemo(() => {
    if (!selectedColumn) return [];
    const type = selectedColumn.type;
    return NumericTypes.includes(type) ? NumericFilterTypes : StringFilterTypes;
  }, [selectedColumn]);

  const disableValueSelector = React.useMemo(() => {
    return hasValue(inputValue);
  }, [inputValue]);

  return (
    <div className="grid grid-cols-2 gap-4">

      <div className="font-bold text-xl col-span-2">
        Graph Filters
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
          <div className={ disableValueSelector ? "cursor-not-allowed opacity-50" : null }>
            <div className={ disableValueSelector ? "pointer-events-none" : null }>
              <Select multi={ isMulti } removable
                placeholder={ `Select filter ${ isMulti ? "values" : "value" }` }
                options={ domain }
                accessor={ d => `${ d.value } (count ${ d.count })` }
                valueAccessor={ d => d.value }
                value={ filterValues }
                onChange={ doOnChange }
                diabled={ disableValueSelector }/>
            </div>
          </div>
        }
        { !InputTypes.includes(filterType) ? null :
          <input type={ NumericTypes.includes(filterType) ? "number" : "text" }
            className="px-4 py-2"
            value={ inputValue }
            onChange={ handleInputChange }
            placeholder="Enter a custom value..."/>
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

export const FilterTable = ({ filters, remove }) => {
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
