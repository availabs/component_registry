import React from "react"

import get from "lodash/get"
import { format as d3format } from "d3-format"

import { EditorOptionsMap } from "./GraphComponents"

import { ColorEditor } from "./ColorEditor"
import { ColorSelector } from "./ColorSelector"

import {
  Modal,
  Button,
  BooleanInput,
  Input,
  Select
} from "./uicomponents"

const OptionInput = ({ path, type, value, onChange, ...props }) => {
  const doOnChange = React.useCallback(v => {
    onChange(path, type === "number" ? +v : v);
  }, [path, onChange, type]);
  return (
    <div className="w-60">
      { type === "boolean" ? (
          <BooleanInput
            value={ value }
            onChange={ doOnChange }/>
        ) : type === "select" ? (
          <Select { ...props }
            value={ value }
            onChange={ doOnChange }/>
        ) : (
          <Input type={ type } { ...props }
            value={ value }
            onChange={ doOnChange }/>
        )
      }
    </div>
  )
}

const TitlePositionOptions = ["start", "center", "end"];

const FontWeightOptions = ["lighter", "normal", "bold"];

const illionsFormat = d3format(".2r")

const getIllionsFormat = (divisor, suffix) => d => {
  return `${ illionsFormat(d / divisor) }${ suffix }`;
}

export const TickFormatOptionsMap = {
  "Integer": ",d",
  "Fixed Point - 2 deciamls": ",.2f",
  "Fixed Point - 1 deciaml": ",.1f",
  "SI-suffix - 3 significant digits": ".3s",
  "SI-suffix - 2 significant digits": ".2s",
  "Millions": getIllionsFormat(1000000, "m"),
  "Billions": getIllionsFormat(1000000000, "bn"),
  "Trillions": getIllionsFormat(1000000000000, "tr")
}
const TickFormatOptions = Object.keys(TickFormatOptionsMap);

export const GraphOptionsEditor = ({ format, edit, activeGraphType, dataDomain, viewData }) => {

  const doEdit = React.useCallback((path, value) => {
    edit([[path, value]]);
  }, [edit]);

  const doEditMultiple = React.useCallback(paths => {
    edit(paths);
  }, [edit]);

  const [paletteEditorIsOpen, setPaletteEditorIsOpen] = React.useState(false);
  const openPaletteEditor = React.useCallback(e => {
    e.stopPropagation();
    setPaletteEditorIsOpen(true);
  }, []);
  const closePaletteEditor = React.useCallback(e => {
    e.stopPropagation();
    setPaletteEditorIsOpen(false);
  }, []);

  const [colorSelectorIsOpen, setColorSelectorIsOpen] = React.useState(null);
  const openColorSelector = React.useCallback((e, key) => {
    e.stopPropagation();
    setColorSelectorIsOpen(key);
  }, []);
  const closeColorSelector = React.useCallback((e, key) => {
    e.stopPropagation();
    setColorSelectorIsOpen(null);
  }, []);

  const graphSpecificOptions = React.useMemo(() => {
    return EditorOptionsMap[activeGraphType.GraphComp];
  }, [activeGraphType]);

  const textColor = React.useMemo(() => {
    return get(format, "textColor");
  }, [format]);
  const bgColor = React.useMemo(() => {
    return get(format, "bgColor");
  }, [format]);
  const palette = React.useMemo(() => {
    const { type, value } = format.colors;
    if (type === "palette" || type === "custom") {
      return value;
    }
    return value.range;
  }, [format]);

  const orientation = React.useMemo(() => {
    return get(format, "orientation", "vertical")
  }, [format]);

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2">

      <div className="font-bold text-xl col-span-2">
        Graph Options
      </div>

      <div>
        <div className="font-bold">
          General
        </div>
        <div className="pl-4 text-sm">

          <div className="flex">
            <div className="w-1/3 flex items-center">
              Height
            </div>
            <OptionInput type="number"
              path={ ["height"] }
              value={ get(format, ["height"], 0) }
              onChange={ doEdit }/>
          </div>

          <div className="flex">
            <div className="w-1/3 flex items-center">
              Background Color
            </div>
            <div className="w-60">
              <Button onClick={ e => openColorSelector(e, "bgColor") }
                style={ {
                  backgroundImage: `linear-gradient(to right, ${ bgColor }, ${ textColor }, ${ bgColor })`,
                  color: bgColor
                } }
              >
                Open Color Selector
              </Button>
            </div>
          </div>

          <div className="flex">
            <div className="w-1/3 flex items-center">
              Grid / Text Color
            </div>
            <div className="w-60">
              <Button onClick={ e => openColorSelector(e, "textColor") }
                style={ {
                  backgroundImage: `linear-gradient(to right, ${ textColor }, ${ bgColor }, ${ textColor })`,
                  color: textColor
                } }
              >
                Open Color Selector
              </Button>
            </div>
          </div>

          <Modal isOpen={ Boolean(colorSelectorIsOpen) }>
            <div className={ `
                h-[42.5vh] bg-gray-300 absolute bottom-0 left-0 right-0
                pointer-events-auto
              `}
            >
              <button style={ { transform: "translate(50%, -150%)" } }
                className={ `
                  w-8 h-8 rounded absolute
                  flex items-center justify-center
                  bg-gray-300 hover:bg-gray-400
                  top-0 left-0 border-0
                ` }
                onClick={ closeColorSelector }
              >
                <span className="fa fa-close"/>
              </button>
              <ColorSelector
                editKey={ colorSelectorIsOpen }
                edit={ doEdit }
                current={ get(format, colorSelectorIsOpen) }/>
            </div>
          </Modal>

        </div>
      </div>

      <div>
        <div className="font-bold">
          { activeGraphType.type } Options
        </div>
        <div className="pl-4 text-sm">

          <div className="flex">
            <div className="w-1/3 flex items-center">
              Palette
            </div>
            <div className="w-60">
              <Button onClick={ openPaletteEditor }
                style={ {
                  backgroundImage: `linear-gradient(to right, ${ palette })`,
                  color: bgColor
                } }
              >
                Open Palette Editor
              </Button>
            </div>
          </div>

          <Modal isOpen={ paletteEditorIsOpen }>
            <div className={ `
                h-[42.5vh] bg-gray-300 absolute bottom-0 left-0 right-0
                pointer-events-auto
              `}
            >
              <button style={ { transform: "translate(50%, -150%)" } }
                className={ `
                  w-8 h-8 rounded absolute
                  flex items-center justify-center
                  bg-gray-300 hover:bg-gray-400
                  top-0 left-0 border-0
                ` }
                onClick={ closePaletteEditor }
              >
                <span className="fa fa-close"/>
              </button>
              <ColorEditor
                edit={ doEdit }
                editAll={ doEditMultiple }
                format={ format }
                graphType={ activeGraphType.type }
                dataDomain={ dataDomain }
                viewData={ viewData }/>
            </div>
          </Modal>

          { graphSpecificOptions.map(({ label, path, defaultValue, ...rest }) => (
              <div key={ label } className="flex">
                <div className="w-1/3 flex items-center">
                  { label }
                </div>
                <OptionInput { ...rest }
                  path={ path }
                  value={ get(format, path, defaultValue) }
                  onChange={ doEdit }/>
              </div>
            ))
          }

        </div>
      </div>

      <div>
        <div className="font-bold">
          Margins
        </div>
        <div className="pl-4 text-sm">

          <div className="flex">
            <div className="w-1/3 flex items-center">
              Top
            </div>
            <OptionInput type="number"
              path={ ["margins", "marginTop"] }
              value={ get(format, ["margins", "marginTop"], 0) }
              onChange={ doEdit }/>
          </div>

          <div className="flex">
            <div className="w-1/3 flex items-center">
              Right
            </div>
            <OptionInput type="number"
              path={ ["margins", "marginRight"] }
              value={ get(format, ["margins", "marginRight"], 0) }
              onChange={ doEdit }/>
          </div>

          <div className="flex">
            <div className="w-1/3 flex items-center">
              Bottom
            </div>
            <OptionInput type="number"
              path={ ["margins", "marginBottom"] }
              value={ get(format, ["margins", "marginBottom"], 0) }
              onChange={ doEdit }/>
          </div>

          <div className="flex">
            <div className="w-1/3 flex items-center">
              Left
            </div>
            <OptionInput type="number"
              path={ ["margins", "marginLeft"] }
              value={ get(format, ["margins", "marginLeft"], 0) }
              onChange={ doEdit }/>
          </div>

        </div>
      </div>

      <div>
        <div className="font-bold">
          Title
        </div>
        <div className="pl-4 text-sm">

          <div className="flex">
            <div className="w-1/3 flex items-center">
              Title
            </div>
            <OptionInput type="text"
              path={ ["title", "title"] }
              value={ get(format, ["title", "title"], "") }
              placeholder="Enter a title..."
              onChange={ doEdit }/>
          </div>

          <div className="flex">
            <div className="w-1/3 flex items-center">
              Position
            </div>
            <OptionInput type="select"
              options={ TitlePositionOptions }
              path={ ["title", "position"] }
              value={ get(format, ["title", "position"], "") }
              onChange={ doEdit }/>
          </div>

          <div className="flex">
            <div className="w-1/3 flex items-center">
              Font Size
            </div>
            <OptionInput type="number" min={ 10 }
              path={ ["title", "fontSize"] }
              value={ get(format, ["title", "fontSize"], "") }
              onChange={ doEdit }/>
          </div>

          <div className="flex">
            <div className="w-1/3 flex items-center">
              Font Weight
            </div>
            <OptionInput type="select"
              options={ FontWeightOptions }
              path={ ["title", "fontWeight"] }
              value={ get(format, ["title", "fontWeight"], "") }
              onChange={ doEdit }/>
          </div>

        </div>
      </div>

      <div>
        <div className="font-bold">
          Legend
        </div>
        <div className="pl-4 text-sm">

          <div className="flex">
            <div className="w-1/3 flex items-center">
              Show Legend
            </div>
            <OptionInput type="boolean"
              path={ ["legend", "show"] }
              value={ get(format, ["legend", "show"], true) }
              onChange={ doEdit }/>
          </div>

          <div className="flex">
            <div className="w-1/3 flex items-center">
              Width
            </div>
            <OptionInput type="number" min={ 50 }
              path={ ["legend", "width"] }
              value={ get(format, ["legend", "width"], "") }
              onChange={ doEdit }/>
          </div>

          <div className="flex">
            <div className="w-1/3 flex items-center">
              Height
            </div>
            <OptionInput type="number" min={ 50 }
              path={ ["legend", "height"] }
              value={ get(format, ["legend", "height"], "") }
              onChange={ doEdit }/>
          </div>

          <div className="flex">
            <div className="w-1/3 flex items-center">
              Label
            </div>
            <OptionInput type="text"
              path={ ["legend", "label"] }
              value={ get(format, ["legend", "label"], "") }
              onChange={ doEdit }/>
          </div>

        </div>
      </div>

      <div>
        <div className="font-bold">
          Tooltip
        </div>
        <div className="pl-4 text-sm">

          <div className="flex">
            <div className="w-1/3 flex items-center">
              Show Tooltip
            </div>
            <OptionInput type="boolean"
              path={ ["tooltip", "show"] }
              value={ get(format, ["tooltip", "show"], true) }
              onChange={ doEdit }/>
          </div>

          <div className="flex">
            <div className="w-1/3 flex items-center">
              Font Size
            </div>
            <OptionInput type="number" min={ 10 }
              path={ ["tooltip", "fontSize"] }
              value={ get(format, ["tooltip", "fontSize"], true) }
              onChange={ doEdit }/>
          </div>

        </div>
      </div>

      <div>
        <div className="font-bold">
          X Axis ({ orientation === "vertical" ? "bottom axis" : "left axis" })
        </div>
        <div className="pl-4 text-sm">

          <div className="flex">
            <div className="w-1/3 flex items-center">
              Label
            </div>
            <OptionInput type="text"
              path={ ["xAxis", "label"] }
              value={ get(format, ["xAxis", "label"], "") }
              placeholder="Enter a label..."
              onChange={ doEdit }/>
          </div>

          <div className="flex">
            <div className="w-1/3 flex items-center">
              Show Grid Lines
            </div>
            <OptionInput type="boolean"
              path={ ["xAxis", "showGridLines"] }
              value={ get(format, ["xAxis", "showGridLines"], "") }
              onChange={ doEdit }/>
          </div>

          <div className="flex">
            <div className="w-1/3 flex items-center">
              Tick Spacing
            </div>
            <OptionInput type="number" min={ 1 }
              path={ ["xAxis", "tickSpacing"] }
              value={ get(format, ["xAxis", "tickSpacing"]) }
              onChange={ doEdit }/>
          </div>

          <div className="flex">
            <div className="w-1/3 flex items-center">
              Rotate Labels
            </div>
            <OptionInput type="boolean"
              path={ ["xAxis", "rotateLabels"] }
              value={ get(format, ["xAxis", "rotateLabels"], false) }
              onChange={ doEdit }/>
          </div>

        </div>
      </div>

      <div>
        <div className="font-bold">
          Y Axis ({ orientation === "vertical" ? "left axis" : "bottom axis" })
        </div>
        <div className="pl-4 text-sm">

          <div className="flex">
            <div className="w-1/3 flex items-center">
              Label
            </div>
            <OptionInput type="text"
              path={ ["yAxis", "label"] }
              value={ get(format, ["yAxis", "label"], "") }
              placeholder="Enter a label..."
              onChange={ doEdit }/>
          </div>

          <div className="flex">
            <div className="w-1/3 flex items-center">
              Show Grid Lines
            </div>
            <OptionInput type="boolean"
              path={ ["yAxis", "showGridLines"] }
              value={ get(format, ["yAxis", "showGridLines"], "") }
              onChange={ doEdit }/>
          </div>

          <div className="flex">
            <div className="w-1/3 flex items-center">
              Value Format
            </div>
            <OptionInput type="select"
              options={ TickFormatOptions }
              path={ ["yAxis", "tickFormat"] }
              value={ get(format, ["yAxis", "tickFormat"], "") }
              onChange={ doEdit }/>
          </div>

          <div className="flex">
            <div className="w-1/3 flex items-center">
              Rotate Labels
            </div>
            <OptionInput type="boolean"
              path={ ["yAxis", "rotateLabels"] }
              value={ get(format, ["yAxis", "rotateLabels"], false) }
              onChange={ doEdit }/>
          </div>

        </div>
      </div>

    </div>
  )
}
