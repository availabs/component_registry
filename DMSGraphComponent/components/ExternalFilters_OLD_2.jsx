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

const FilterTypes = [
  "equals",
  "includes"
]

const intFormat = d3format(",d");
const floatFormat = d3format(",.2f");
const displayFormat = v => {
  if (strictNaN(v)) return v;
  if (Math.floor(+v) === +v) {
    return intFormat(v);
  }
  return floatFormat(v);
}

export const ExternalFilters = props => {

  const {
    columns,
    filters,
    addFilter,
    updateFilter,
    removeFilter,
    activeView,
    pgEnv
  } = props;

  const [selectedColumn, setSelectedcolumn] = React.useState(null);
  const [filterType, _setFilterType] = React.useState("equals");
  const isMulti = filterType === "includes";
  const [filterLabel, _setFilterLabel] = React.useState("");

  const setFilterLabel = React.useCallback(e => {
    e.stopPropagation();
    _setFilterLabel(e.target.value);
  }, []);

  const domain = useGetColumnDomain({ activeView, column: selectedColumn, pgEnv });

  const [_filterValues, setFilterValues] = React.useState([]);

  const setFilterType = React.useCallback(fType => {
    if (fType === "equals") {
      setFilterValues(prev => prev.slice(0, 1));
    }
    _setFilterType(fType);
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

  const hasValues = React.useMemo(() => {
    return Boolean(_filterValues.length);
  }, [_filterValues]);

  const doResetFilter = React.useCallback(e => {
    setSelectedcolumn(null);
    _setFilterType("equals");
    setFilterValues([]);
    _setFilterLabel("");
  }, []);

  const okToAdd = React.useMemo(() => {
    return Boolean(_filterValues.length && filterLabel);
  }, [_filterValues, filterLabel]);

  const doAddFilter = React.useCallback(e => {
    e.stopPropagation();
    addFilter({
      column: selectedColumn,
      type: filterType,
      values: _filterValues,
      label: filterLabel,
      startActive: false
    })
    doResetFilter();
  }, [selectedColumn, filterType, _filterValues, addFilter, filterLabel, doResetFilter]);

// console.log("ExternalFilters::filters", filters);

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
        { !_filterValues.length ? null :
          <input
            className="px-4 py-2 bg-white w-full"
            value={ filterLabel }
            onChange={ setFilterLabel }
            placeholder="Set a filter label.."/>
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
          <ExternalFiltersTable
            filters={ filters }
            update={ updateFilter }
            remove={ removeFilter }/>
        </div>
      }

    </div>
  )
}

const FilterRow = ({ filter, update, remove }) => {
  const doRemove = React.useCallback(e => {
    e.stopPropagation();
    remove(filter);
  }, [remove, filter]);
  const doUpdateFilterLabel = React.useCallback(e => {
    e.stopPropagation();
    update(filter, { label: e.target.value });
  }, [update, filter]);
  const doUpdateStartActive = React.useCallback(e => {
    e.stopPropagation();
    update(filter, { startActive: Boolean(e.target.checked) });
  }, [update, filter]);
  return (
    <tr>
      <td>
        <input
          className="px-2 py-1"
          value={ filter.label }
          onChange={ doUpdateFilterLabel }/>
      </td>
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
        <input type="checkbox"
          className="cursor-pointer"
          checked={ filter.startActive }
          onChange={ doUpdateStartActive }/>
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

const ExternalFiltersTable = ({ filters, update, remove }) => {
  return (
    <div>

      <div className="font-bold text-center">
        Current External Filters
      </div>

      <table className="w-full text-sm">

        <thead>
          <tr>
            <th className="py-1 border-b border-current">
              Filter Label
            </th>
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
              Start Active
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
                update={ update }
                remove={ remove }/>
            )
          }
        </tbody>

      </table>

    </div>
  )
}
