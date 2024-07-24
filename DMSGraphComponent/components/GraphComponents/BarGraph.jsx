import React from "react"

import * as Plot from "@observablehq/plot";

import { TickFormatOptionsMap } from "../GraphOptionsEditor"
import { useAxisTicks } from "./utils"

const BarGraph = props => {

  const {
    data,
    margins,
    height,
    width,
    xAxis,
    yAxis,
    colors,
    bgColor,
    legend,
    tooltip,
    groupMode = "stacked",
    orientation = "vertical"
  } = props;

  const isPalette = colors.type === "palette";
  const isStacked = groupMode === "stacked";
  const isVertical = orientation === "vertical";

  const [ref, setRef] = React.useState(null);

  const xAxisTicks = useAxisTicks(data, xAxis.tickSpacing);

  const graphHeight = React.useMemo(() => {
    const { marginTop: mt, marginBottom: mb } = margins;
    if ((mt + mb) > height) {
      return mt + mb + 100;
    }
    return height;
  }, [height, margins]);

  const [bar, rule] = React.useMemo(() => {
    return isVertical ?
      [Plot.barY, Plot.ruleY] :
      [Plot.barX, Plot.ruleX];
  }, [isVertical]);

  const xOptions = React.useMemo(() => {
    return isVertical ? ({
      type: "band",
      axis: "bottom",
      label: isStacked ? xAxis.label : null,
      grid: xAxis.showGridLines,
      textAnchor: xAxis.rotateLabels ? "start" : "middle",
      tickRotate: xAxis.rotateLabels ? 45 : 0,
      ticks: isStacked ? xAxisTicks : undefined
    }) : ({
      axis: "bottom",
      grid: yAxis.showGridLines,
      tickFormat: TickFormatOptionsMap[yAxis.tickFormat],
      textAnchor: yAxis.rotateLabels ? "start" : "middle",
      tickRotate: yAxis.rotateLabels ? 45 : 0,
      label: isStacked ? yAxis.label : null
    })
  }, [isVertical, isStacked, xAxis, yAxis, xAxisTicks]);

  const yOptions = React.useMemo(() => {
    return isVertical ? ({
      axis: "left",
      grid: yAxis.showGridLines,
      textAnchor: yAxis.rotateLabels ? "start" : "middle",
      tickRotate: yAxis.rotateLabels ? 45 : 0,
      tickFormat: TickFormatOptionsMap[yAxis.tickFormat],
      label: isStacked ? yAxis.label : null
    }) : ({
      type: "band",
      axis: "left",
      label: isStacked ? xAxis.label : null,
      grid: xAxis.showGridLines,
      textAnchor: xAxis.rotateLabels ? "start" : "middle",
      tickRotate: xAxis.rotateLabels ? 45 : 0,
      ticks: isStacked ? xAxisTicks : undefined
    })
  }, [isVertical, isStacked, xAxis, yAxis, xAxisTicks]);

  const fxOptions = React.useMemo(() => {
    return isStacked || !isVertical ? undefined : {
      axis: "top",
      ticks: xAxisTicks,
      label: xAxis.label
    }
  }, [isStacked, isVertical, xAxisTicks, xAxis]);

  const fyOptions = React.useMemo(() => {
    return isStacked || isVertical ? undefined : {
      axis: "left",
      ticks: xAxisTicks,
      label: yAxis.label
    }
  }, [isStacked, isVertical, xAxisTicks, yAxis]);

  React.useEffect(() => {
    if (!ref) return;
    if (!data.length) return;

    const plot = Plot.plot({
      x: xOptions,
      fx: fxOptions,
      y: yOptions,
      fy: fyOptions,
      color: {
        legend: legend.show,
        width: legend.width,
        height: legend.height,
        label: legend.label,
        range: isPalette ? colors.value : colors.value.range,
        domain: colors.value.domain || undefined,
        type: isPalette ? undefined : colors.value.type,
        tickFormat: isPalette ? undefined : TickFormatOptionsMap[yAxis.tickFormat]
      },
      height: graphHeight,
      width,
      ...margins,
      marks: [
        rule([0]),
        bar(
          data,
          isStacked ? (
            { x: isVertical ? "index" : "value",
              y: isVertical ? "value" : "index",
              fill: isPalette ? "type" : "value",
              sort: isVertical ?
                      ({ x: "x", order: null }) :
                      ({ y: "y", order: null }),
            }
          ) : (
            { x: isVertical ? "type" : "value",
              fx: isVertical ? "index" : undefined,
              y: isVertical ? "value" : "type",
              fy: isVertical ? undefined : "index",
              fill: isPalette ? "type" : "value",
              sort: isVertical ?
                      ({ fx: "x", order: null }) :
                      ({ fy: "y", order: null }),
            }
          )
        ),
        // Plot.tip(
        //   data,
        //   Plot.pointerY({
        //     fill: bgColor,
        //     x: isVertical ? "index" : "value",
        //     y: isVertical ? "value" : "index",
        //   })
        // )
      ]
    });

    ref.append(plot);

    return () => plot.remove();

  }, [ref, data, margins, graphHeight, width, yAxis,
      colors, legend, isPalette, isStacked, isVertical,
      xOptions, yOptions, fxOptions, fyOptions]
  );

  return (
    <div ref={ setRef }/>
  )
}

export const BarGraphOption = {
  type: "Bar Graph",
  GraphComp: "BarGraph",
  Component: BarGraph,
  EditorOptions: [
    { label: "Orientation",
      type: "select",
      path: ["orientation"],
      options: ["vertical", "horizontal"],
      defaultValue: "vertical"
    },
    { label: "Group Mode",
      type: "select",
      path: ["groupMode"],
      options: ["stacked", "grouped"],
      defaultValue: "stacked"
    }
  ]
}
