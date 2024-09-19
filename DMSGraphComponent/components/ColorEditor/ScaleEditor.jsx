import React from "react"

import { Palette, PaletteSelector } from "./components"

import { ThresholdEditor } from "./components"

const ScaleTypeOptions = [
  "quantize",
  "quantile",
  "linear",
  "threshold"
]

const ChevronsLeft = () => <>{ "<<<" }</>
const ChevronsRight = () => <>{ ">>>" }</>

const ScaleEditor = ({ current, edit, editAll, dataDomain }) => {

  const {
    type: scaleType,
    range: scaleRange,
    domain: thresholdDomain
  } = current;

  const [isOpen, setIsOpen] = React.useState(false);
  const toggle = React.useCallback(e => {
    setIsOpen(o => !o);
  }, []);
  const close = React.useCallback(e => {
    setIsOpen(false);
  }, []);

  const editScaleType = React.useCallback(e => {
    const type = e.target.value;
    const edit1 = [["colors", "value", "type"], type];
    const edit2 = [["colors", "value", "domain"], undefined];
    editAll([edit1, edit2]);
    if (type !== "threshold") {
      setIsOpen(false);
    }
  }, [editAll, dataDomain]);

  const editScaleRange = React.useCallback(range => {
    edit(["colors", "value", "range"], [...range]);
  }, [edit]);

  const editScaleDomain = React.useCallback(domain => {
    edit(["colors", "value", "domain"], domain);
  }, [edit]);

  return (
    <div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex border-b-2 border-gray-600 mb-1">
            <div className="flex items-center">
              <span className="mr-2 whitespace-nowrap w-32">Scale Type:</span>
              <select value={ scaleType }
                onChange={ editScaleType }
                className="text-xs font-medium px-2 py-1 bg-white"
              >
                { ScaleTypeOptions.map(o => (
                    <option key={ o }
                      value={ o }
                    >
                      { o }
                    </option>
                  ))
                }
              </select>
            </div>
            <div className="flex-1 flex items-center justify-end">
              { scaleType !== "threshold" ? null :
                <button onClick={ toggle }
                  className="px-2 py-1 text-xs font-medium rounded-none bg-white"
                  style={ { outline: "none", border: "none" } }
                >
                  <span className="mr-4">
                    { isOpen ? "Close" : "Open" } Threshold Editor
                  </span>
                  { isOpen ? <ChevronsLeft /> : <ChevronsRight /> }
                </button>
              }
            </div>
          </div>

          <div className="flex items-center border-b-2 border-gray-600 mb-1">
            <span className="mr-2 whitespace-nowrap w-32">
              Scale Range:
            </span>
            <Palette palette={ scaleRange } large/>
          </div>
        </div>
      </div>

      <PaletteSelector
        current={ scaleRange }
        select={ editScaleRange }/>

      <div className={ `
          w-1/2 absolute right-0 top-0 bottom-0 bg-gray-400
          ${ isOpen ? "block" : "hidden w-0 h-0 p-0 overflow-hidden" }
        ` }
      >
        <ThresholdEditor
          dataDomain={ dataDomain }
          domain={ thresholdDomain || [] }
          range={ scaleRange }
          edit={ editScaleDomain }
          type={ scaleType }
        >
          <button style={ { transform: "translate(-50%, -150%)" } }
            className={ `
              w-8 h-8 rounded absolute
              flex items-center justify-center
              bg-gray-400 hover:bg-gray-500
              top-0 right-0 border-0
            ` }
            onClick={ close }
          >
            <span className="fa fa-close"/>
          </button>
        </ThresholdEditor>
      </div>

    </div>
  )
}
export default ScaleEditor
