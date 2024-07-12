import React from "react"

import * as Plot from "@observablehq/plot";

import { TickFormatOptionsMap } from "../GraphOptionsEditor"
import { useAxisTicks } from "./utils"

const LineGraph = props => {

  const {
    data,
    margins,
    height,
    width,
    xAxis,
    yAxis,
    colors,
    bgColor,
    textColor,
  } = props

  const [ref, setRef] = React.useState(null);

  const xAxisTicks = useAxisTicks(data, xAxis.tickSpacing);

  const graphHeight = React.useMemo(() => {
    const { marginTop: mt, marginBottom: mb } = margins;
    if ((mt + mb) > height) {
      return mt + mb + 100;
    }
    return height;
  }, [height, margins]);

  React.useEffect(() => {
    if (!ref) return;
    if (!data.length) return;

    const plot = Plot.plot({
      x: {
        type: "point",
        label: xAxis.label,
        grid: xAxis.showGridLines,
        textAnchor: xAxis.rotateLabels ? "start" : "middle",
        tickRotate: xAxis.rotateLabels ? 45 : 0,
        axis: "bottom",
        ticks: xAxisTicks
      },
      y: {
        axis: "left",
        grid: yAxis.showGridLines,
        tickFormat: TickFormatOptionsMap[yAxis.tickFormat],
        label: yAxis.label
      },
      color: {
        legend: legend.show,
        width: legend.width,
        height: legend.height,
        label: legend.label,
        range: colors.value
      },
      height: graphHeight,
      width,
      ...margins,
      marks: [
        Plot.ruleY([0]),
        Plot.line(
          data,
          { x: "index",
            y: "value",
            stroke: "type",
            sort: { x: "x", order: null }
          }
        ),
        Plot.tip(data,
          Plot.pointerX({
            x: "index",
            y: "value",
            fill: bgColor
          })
        )
      ]
    });

    ref.append(plot);

    return () => plot.remove();

  }, [ref, data, margins, height, width, xAxisTicks, xAxis, yAxis, colors]);

  return (
    <div ref={ setRef }/>
  )
}
export const LineGraphOption = {
  type: "Line Graph",
  GraphComp: "LineGraph",
  Component: LineGraph
}
