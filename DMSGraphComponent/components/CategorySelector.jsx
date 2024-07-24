import React from "react"

import { Select } from "~/modules/avl-components/src"

import { getColumnDisplay } from "./XAxisSelector"

const NoData = () => {
  return (
    <div>
      You Must Add Data Columns to Graph Before Adding a Category
    </div>
  )
}

export const CategorySelector = props => {

  const {
    columns,
    activeView,
    category,
    setCategory
  } = props;

  return (
    <div className="grid grid-cols-2 gap-4">

      <div className="font-bold text-xl col-span-2">
        Category Selector
      </div>

      <div className="grid grid-cols-1 gap-4">

        { !columns.length ? <NoData /> :
          <Select removable
            placeholder="Select a column..."
            options={ columns }
            accessor={ getColumnDisplay }
            value={ category }
            onChange={ setCategory }/>
        }

      </div>

    </div>
  )
}
