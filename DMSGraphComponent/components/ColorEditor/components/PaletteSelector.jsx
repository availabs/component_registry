import React from "react"

import { groups as d3groups } from "d3-array"
import isEqual from "lodash/isEqual"

import { BooleanInput } from "../../uicomponents"
import { ColorRanges } from "../../utils"

export const Palette = ({ palette, large = false }) => {
  return (
    <div className="flex">
      { palette.map((c, i) => (
          <div key={ `${ c }-${ i }` }
            style={ { backgroundColor: c } }
            className={ `
              first:rounded-l last:rounded-r h-3 ${ large ? "w-6" : "w-5" }
            ` }/>
        ))
      }
    </div>
  )
}

const PaletteOption = ({ select, palette, isActive }) => {
  const doSelect = React.useCallback(e => {
    select(palette);
  }, [select, palette]);
  return (
    <div onClick={ doSelect }
      className={ `
        first:mt-0 mt-1 w-fit rounded-lg
        ${ isActive ? "outline outline-2" : "cursor-pointer" }
      ` }
    >
      <Palette palette={ palette }/>
    </div>
  )
}

export const PaletteSelector = ({ select, current }) => {
  const [size, _setSize] = React.useState(current.length);
  const setSize = React.useCallback(e => {
    _setSize(e.target.value);
  }, []);
  const sizes = React.useMemo(() => {
    return Object.keys(ColorRanges).map(Number);
  }, []);

  const [reverse, setReverse] = React.useState(false);

  const palettes = React.useMemo(() => {
    return d3groups(ColorRanges[size], p => p.type)
      .map(([t, ps]) => {
        return reverse ?
          [t, ps.map(c => ({ ...c, colors: [...c.colors].reverse() }))] :
          [t, ps.map(c => ({ ...c, colors: [...c.colors] }))];
      }).sort((a, b) => a[0].localeCompare(b[0]));
  }, [size, reverse]);

  return (
    <>
      <div className="grid grid-cols-4 gap-4">

        <div className="col-span-2 grid grid-cols-2 gap-4 border-b-2 border-gray-500 pb-1">
          <div className="flex items-center">
            <span className="mr-2 w-48">
              Palette Lengths:
            </span>
            <div className="w-64">
              <select value={ size }
                onChange={ setSize }
                className="text-xs font-medium px-2 py-1 bg-white w-full"
                style={ { outline: "none", border: "none" } }
              >
                { sizes.map(o => (
                    <option key={ o } value={ o }>
                      { o }
                    </option>
                  ))
                }
              </select>
            </div>
          </div>

          <div className="flex items-center">
            <span className="mr-2 w-48">
              Reverse Palettes:
            </span>
            <div className="w-64">
              <BooleanInput
                value={ reverse }
                onChange={ setReverse }/>
            </div>
          </div>
        </div>

      </div>

      <div className="grid gap-4 grid-cols-4">
        { palettes.map(([type, palettes]) => (
            <div key={ type }>
              <div className="border-b-2 border-gray-400">{ type }</div>
              <div className="h-fit max-h-[12.5rem] overflow-auto p-1">
                { palettes.map((p, i) => (
                    <PaletteOption key={ p.colors.join("-") }
                      palette={ p.colors }
                      isActive={ isEqual(p.colors, current) }
                      select={ select }/>
                  ))
                }
              </div>
            </div>
          ))
        }
      </div>
    </>
  )
}
