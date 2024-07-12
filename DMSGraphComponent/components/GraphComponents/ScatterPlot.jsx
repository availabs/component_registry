import React from "react"

import * as Plot from "@observablehq/plot";

import { TickFormatOptionsMap } from "../GraphOptionsEditor"
import { useAxisTicks } from "./utils"

const ScatterPlot = props => {

  const {
    data,
    margins,
    height,
    width,
    title,
    xAxis,
    yAxis,
    colors
  } = props

  const [ref, setRef] = React.useState(null);

  const xAxisTicks = useAxisTicks(data, xAxis.tickSpacing);

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
        legend: true,
        range: colors.value
      },
      height,
      width,
      title,
      ...margins,
      marks: [
        Plot.ruleY([0]),
        Plot.dot(
          data,
          { x: "index",
            y: "value",
            stroke: "type",
            sort: { x: "x", order: null },
            tip: true
          }
        ),
        Plot.tip(data,
          Plot.pointer({
            x: "index",
            y: "value"
          })
        ),
        Plot.crosshair(data,
          Plot.pointer({
            x: "index",
            y: "value"
          })
        )
      ]
    });

    ref.append(plot);

    return () => plot.remove();

  }, [ref, data, margins, height, width, title, xAxisTicks, xAxis, yAxis, colors]);

  return (
    <div ref={ setRef }/>
  )
}
export const ScatterPlotOption = {
  type: "Scatter Plot",
  GraphComp: "ScatterPlot",
  Component: ScatterPlot
}
