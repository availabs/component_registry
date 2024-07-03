import React from "react"

import { Select } from "~/modules/avl-components/src"

import { GraphTypes } from "./GraphComponents"

export const GraphTypeSelector = ({ activeGraphType, setActiveGraphType }) => {
  return (
    <div>
      <div className="font-bold">Graphs</div>
      <Select options={ GraphTypes }
        accessor={ o => o.type }
        value={ activeGraphType }
        onChange={ setActiveGraphType }
        placeholder="Select a graph..."/>
    </div>
  )
}
