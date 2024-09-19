import React from "react"

import uniq from "lodash/uniq"

import { legend as PlotLegend } from "@observablehq/plot";

import { ColorRanges } from "../utils"
import { Palette, ColorInput } from "./components"

const ColorOptions = uniq(Object.values(ColorRanges)
  .reduce((a, c) => {
    const colors = c.filter(clr => clr.type === "Qualitative")
      .reduce((aa, cc) => {
        aa.push(...cc.colors);
        return aa;
      }, []);
    a.push(...colors);
    return a;
  }, [])).sort((a, b) => a.localeCompare(b));

const CustomEditor = ({ current, edit, legend, viewData }) => {

  const [active, setActive] = React.useState(null);

  const updatePalette = React.useCallback(color => {
    if (active === null) return;

    const palette = [...current];
    const addingNew = active === palette.length;
    palette[active] = color;
    edit(["colors", "value"], palette);
    if (addingNew) {
      setActive(null);
    }
  }, [edit, current, active]);

  const typeDomain = React.useMemo(() => {
    return uniq(viewData.map(d => d.type))
      .sort((a, b) => a.localeCompare(b));
  }, [viewData]);

  const selectNew = React.useCallback(e => {
    setActive(current.length);
  }, [current.length]);

  const canAddNew = React.useMemo(() => {
    return typeDomain.length > current.length;
  }, [typeDomain.length, current.length])

  return (
    <div className="grid grid-cols-2 gap-4">

      <div>
{/*
        <div className="flex items-center border-b-2 border-gray-600 mb-1">
          <span className="mr-2 whitespace-nowrap w-32">
            Current Palette:
          </span>
          <Palette palette={ current } large/>
        </div>
*/}
        <div className="font-bold mt-2">Select a Color</div>
        <div className="flex flex-wrap">
          { ColorOptions.map(color => (
              <ColorOption key={ color }
                color={ color }
                update={ updatePalette }/>
            ))
          }
        </div>
        <div>
          <div className="grid grid-cols-12 gap-1">
            <div className="col-span-10 font-bold">
              Create a Custom Color
            </div>
            <div className="col-span-2 text-center font-bold">
              Select
            </div>
          </div>
          <ColorPick
            update={ updatePalette }/>
        </div>
      </div>

      <div>
        <div className="font-bold mt-2">Current Legend</div>
        <div className="flex flex-wrap max-h-48 overflow-auto">
          { typeDomain.map((d, i) => (
              <DomainItem key={ d }
                value={ d }
                color={ current[i % current.length] }
                index={ i % current.length }
                update={ updatePalette }
                isActive={ active === i % current.length }
                setActive={ setActive }/>
            ))
          }
        </div>
        { !canAddNew ? null :
          <div onClick={ selectNew }
            className={ `
              w-20 h-20 mt-1 p-1
              border-2 rounded font-bold text-center cursor-pointer
              ${ active === current.length ? "border-current" :
                                            "border-transparent hover:border-gray-400" }
            ` }
          >
            <div className={ `
                bg-white h-full w-full
                flex items-center justify-center
              ` }
            >
              Add new color
            </div>
          </div>
        }
      </div>

    </div>
  )
}
export default CustomEditor;

const ColorPick = ({ update }) => {
  const [color, setColor] = React.useState("#000000");
  const doUpdate = React.useCallback(e => {
    update(color);
  }, [update, color]);
  return (
    <ColorInput value={ color }
      onChange={ setColor }
      onClick={ doUpdate }/>
  )
}

const ColorOption = ({ color, update }) => {
  const doUpdate = React.useCallback(e => {
    e.stopPropagation();
    update(color);
  }, [update, color]);
  const [hovering, setHovering] = React.useState(false);
  const onMouseEnter = React.useCallback(e => {
    setHovering(true);
  }, []);
  const onMouseLeave = React.useCallback(e => {
    setHovering(false);
  }, []);
  return (
    <div onClick={ doUpdate }
      onMouseEnter={ onMouseEnter }
      onMouseLeave={ onMouseLeave }
      className={ `
        w-4 h-4 mb-2 mr-2 cursor-pointer outline
      ` }
      style={ {
        backgroundColor: color,
        outlineColor: hovering ? color : "transparent",
        outlineWidth: "0.125rem"
      } }/>
  )
}

const DomainItem = ({ value, color, index, update, isActive, setActive }) => {
  const doSetActive = React.useCallback(e => {
    e.stopPropagation();
    setActive(index);
  }, [setActive, index]);
  return (
    <div className={ `
        flex items-center p-1 rounded cursor-pointer
        border border-2
        ${ isActive ? "border-current" :
                      "border-transparent hover:border-gray-400"
        }

      ` }
      onClick={ doSetActive }
    >
      <div className="w-4 h-4 mr-1"
        style={ {
          backgroundColor: color
        } }/>
      { value }
    </div>
  )
}
