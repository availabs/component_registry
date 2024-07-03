import React from "react"

import uniq from "lodash/uniq"

export const useAxisTicks = (data, tickSpacing, key = "index") => {
  return React.useMemo(() => {
    const indexes = uniq(data.map(d => d[key]));
    return indexes.reduce((a, c, i) => {
      if ((i % tickSpacing) === 0) {
        a.push(c);
      }
      return a;
    }, [])
  }, [data, tickSpacing])
}
