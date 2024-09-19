import React from "react"

export const Modal = ({ isOpen, children }) => {
  const stopPropagation = React.useCallback(e => {
    e.stopPropagation();
  }, []);
  return (
    <div className={ `
        pointer-events-none
        ${ isOpen ? "fixed inset-0 z-50" : "hidden h-0 w-0 overflow-hidden" }
      ` }
    >
      { children }
    </div>
  )
}

export const Button = ({ style = {}, ...props }) => {
  return (
    <button { ...props }
      style={ { outline: "none", ...style } }
      className={ `
        px-4 py-2 cursor-pointer w-full font-medium text-xs bg-white
        border-0 border-none outline-0 ring-0 rounded-none relative
        disabled:cursor-not-allowed disabled:opacity-50
      ` }/>
  )
}

export const BooleanInput = ({ value, onChange }) => {
  const doOnChange = React.useCallback(e => {
    onChange(!value);
  }, [onChange, value]);
  return (
    <div className="px-4 py-3 bg-white flex items-center cursor-pointer w-full"
      onClick={ doOnChange }
    >
      <div
        className={ `
          rounded-full w-full h-2 relative transition duration-500
          ${ value ? "bg-green-300" : "bg-gray-300" }
        ` }
      >
        <div style={ {
            transform: "translate(-50%, -25%)",
            transition: "left 500ms"
          } }
          className={ `
            w-4 h-4 rounded-full absolute transition duration-500
            ${ value ? "left-full bg-green-700" : "left-0 bg-gray-700" }
          ` }/>
      </div>
    </div>
  )
}

export const Input = ({ value, onChange, ...props }) => {
  const doOnChange = React.useCallback(e => {
    onChange(e.target.value);
  }, [onChange]);
  return (
    <div className="w-full">
      <input { ...props }
        className={ `
          px-4 py-2 bg-white cursor-pointer w-full font-medium text-xs
          outline-none
        ` }
        value={ value }
        onChange={ doOnChange }/>
    </div>
  )
}

export const Select = ({ value, onChange, options }) => {
  const doOnChange = React.useCallback(e => {
    onChange(e.target.value);
  }, [onChange]);
  return (
    <div className="w-60">
      <select value={ value }
        onChange={ doOnChange }
        className={ `
          px-4 py-2 bg-white cursor-pointer w-full font-medium text-xs
          border-0 border-none outline-0 ring-0 rounded-none
        ` }
      >
        { options.map(o => (
            <option key={ o } value={ o }>
              { o }
            </option>
          ))
        }
      </select>
    </div>
  )
}
