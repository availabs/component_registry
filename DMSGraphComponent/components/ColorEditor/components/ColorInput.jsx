import React from "react"

import { CustomPicker } from 'react-color'
import {
  Saturation,
  Hue
} from 'react-color/lib/components/common';

const Slider = React.memo(() => {
  return (
    <div className={ `
        h-3 mt-1 w-1 rounded pointer-events-none bg-gray-600
      ` }
      style={ {
        transform: "translate(-50%, -50%)"
      } }/>
  )
})

const ColorPicker = ({ onClick, color, ...props }) => {
  const doOnClick = React.useCallback(e => {
    onClick(color);
  }, [onClick, color]);
  const [hovering, setHovering] = React.useState(false);
  const onMouseEnter = React.useCallback(e => {
    setHovering(true);
  }, []);
  const onMouseLeave = React.useCallback(e => {
    setHovering(false);
  }, []);
  return (
    <div>
      <div className="h-16 grid grid-cols-12 gap-1">
        <div className="col-span-10 relative cursor-pointer">
          <Saturation { ...props }
            color={ color }/>
        </div>
        <div className="col-span-2 p-1">
          <div onClick={ doOnClick }
            className="w-full h-full cursor-pointer outline"
            onMouseEnter={ onMouseEnter }
            onMouseLeave={ onMouseLeave }
            style={ {
              backgroundColor: color,
              outlineWidth: "0.25rem",
              outlineColor: hovering ? color : "transparent"
            } }/>
        </div>
      </div>
      <div className="h-2 relative mt-1 cursor-pointer">
        <Hue { ...props }
          color={ color }
          pointer={ Slider }/>
      </div>
    </div>
  )
}

const WrappedColorPicker = CustomPicker(ColorPicker);

export const ColorInput = ({ onChange, value = "", ...props }) => {
  const doOnChange = React.useCallback(({ hex }) => {
    onChange(hex);
  }, [onChange]);
  return (
    <WrappedColorPicker { ...props }
      color={ value }
      onChange={ doOnChange }/>
  )
}
