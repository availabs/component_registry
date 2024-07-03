import React from "react"

import { ColorInput } from "~/modules/avl-components/src"

export const ColorSelector = ({ editKey, edit, current }) => {

  const onChange = React.useCallback(v => {
    edit([editKey], v)
  }, [editKey, edit]);

  return (
    <div>
      <ColorInput value={ current }
        onChange={ onChange }/>
    </div>
  )
}
