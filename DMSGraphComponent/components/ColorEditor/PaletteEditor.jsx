import React from "react"

import { Palette, PaletteSelector } from "./components"

const PaletteEditor = ({ current, edit }) => {

  const doEdit = React.useCallback(palette => {
    edit(["colors", "value"], [...palette]);
  }, [edit]);

  return (
    <div>

      <div className="flex items-center border-b-2 border-gray-600 mb-1 w-1/2">
        <span className="mr-2 whitespace-nowrap w-32">
          Current Palette:
        </span>
        <Palette palette={ current } large/>
      </div>

      <PaletteSelector
        current={ current }
        select={ doEdit }/>

    </div>
  )
}
export default PaletteEditor
