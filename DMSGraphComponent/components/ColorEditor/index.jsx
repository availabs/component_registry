import React from "react"

import * as Plot from "@observablehq/plot";

import { DefaultPalette, DefaultScaleRange } from "../GraphComponent"

import PaletteEditor from "./PaletteEditor"
import ScaleEditor from "./ScaleEditor"
import CustomEditor from "./CustomEditor"

const Radios = ({ value, onChange, disableScale = false }) => {
  const doOnChange = React.useCallback(e => {
    onChange(e.target.value);
  }, [onChange]);
  return (
    <div className="grid grid-cols-3 gap-4 border-b-2 border-current text-lg">

      <div className="flex items-center mr-3 cursor-pointer">
        <label htmlFor="palette"
          className="flex items-center cursor-pointer font-bold">
          Select a color palette
          <input type="radio" name="radio-group"
            value="palette" id="palette"
            className="ml-2 cursor-pointer"
            checked={ value === "palette" }
            onChange={ doOnChange }/>
        </label>
      </div>

      <div className="flex items-center ml-3 cursor-pointer">
        <label htmlFor="scale"
          className={ `
            flex items-center cursor-pointer font-bold
            ${ disableScale ? "opacity-50" : "" }
          ` }
        >
          Create a color scale
          <input type="radio" name="radio-group"
            value="scale" id="scale"
            className="ml-2 cursor-pointer"
            checked={ value === "scale" }
            onChange={ doOnChange }
            disabled={ disableScale }/>
        </label>
      </div>

      <div className="flex items-center ml-3 cursor-pointer">
        <label htmlFor="custom"
          className={ `
            flex items-center cursor-pointer font-bold
            ${ disableScale ? "opacity-50" : "" }
          ` }
        >
          Custom qualitative palette
          <input type="radio" name="radio-group"
            value="custom" id="custom"
            className="ml-2 cursor-pointer"
            checked={ value === "custom" }
            onChange={ doOnChange }/>
        </label>
      </div>

    </div>
  )
}

export const ColorEditor = ({ graphType, format, edit, editAll, dataDomain, viewData }) => {

  const editColorType = React.useCallback(v => {
    const edit1 = [["colors", "type"], v]
    const edit2 = [];
    if (v === "palette") {
      edit2.push(["colors", "value"], [...DefaultPalette]);
    }
    else if (v === "scale") {
      edit2.push(["colors", "value"], { type: "quantize", range: [...DefaultScaleRange] });
    }
    else if (v === "custom") {
      edit2.push(["colors", "value"], [...DefaultPalette]);
    }
    editAll([edit1, edit2]);
  }, [editAll]);

  return (
    <div className="px-6 py-2 relative h-full">

      <div className="font-bold text-xl">
        Color Editor
      </div>

      <Radios disableScale={ graphType !== "Bar Graph" }
        value={ format.colors.type }
        onChange={ editColorType }/>

      { format?.colors?.type === "palette" ?
          <PaletteEditor
            current={ format.colors.value }
            edit={ edit }/> :
        format?.colors?.type === "scale" ?
          <ScaleEditor
            current={ format.colors.value }
            edit={ edit }
            editAll={ editAll }
            dataDomain={ dataDomain }/> :
        format?.colors?.type === "custom" ?
          <CustomEditor
            current={ format.colors.value }
            legend={ format.legend }
            edit={ edit }
            editAll={ editAll }
            viewData={ viewData }/> :
        null
      }
    </div>
  )
}
