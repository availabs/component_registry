import React from "react";

function Bars({ data, height, radius, fontSizeOuter, fontSizeInner }) {
    const boolLabel = data.find(d => d.label);
    const y = boolLabel ? 12 : 0;
  return (
    <>
      <rect
        key={`bar-bg`}
        x={0}
        y={y}
        width={`100%`}
        height={height}
        rx={radius}
        fill={"rgba(159,159,159,0.7)"}
      />
      {data.map(({ value, showValue= true, valueFloat= 'left', valueCutoff = 0, label, color, width }, i) => {
        const x = i === 0 ? 0 : data.filter((d, dI) => dI < i).reduce((acc, d) => +acc + +d.width, 0)
        return (
          <React.Fragment key={i}>
            <rect
              key={`bar-${label}`}
              x={0}
              y={y}
              width={`${x + +width}%`}
              height={height}
              rx={radius}
              fill={color}
            />
            {
              label &&
              <text fill="black"
                    fillOpacity="1"
                    x={0} y={5}
                    textAnchor="left"
                    rotate="0" kerning="auto"
                    fontSize={fontSizeInner}
              > {label} </text>
            }
            {
              value && showValue &&
              (valueFloat === 'left' ||( valueFloat === 'right' && +width > valueCutoff)) &&
              <text fill="white"
                    fillOpacity="1"
                // stroke="white"
                // strokeOpacity="100"
                // strokeWidth="1"
                // strokeLinecap="butt"
                // strokeLinejoin="miter"
                // strokeMiterlimit="4"
                    x={valueFloat === 'left' ? 10 : `${x + +width - value.toString().length - 1}%`}
                    y={y + 4 + height / 2}
                    textAnchor="right"
                    textRendering="auto"
                    fontStyle="normal" fontVariant="normal" fontWeight="bold"
                    fontSize={fontSizeOuter} paintOrder="stroke"
              > {value} </text>
            }
          </React.Fragment>
        )
      }).reverse()
      }
    </>
  );
}

export const RenderSvgBar = ({
                               data,
                               height = 30,
                               radius = 15,
                               fontSizeOuter = "14.5px",
                               fontSizeInner = "12.5px",
                               margin = { left: 0, top: 5, right: 1, bottom: 1 }
                             }) => {
  return (
    <svg
      className={"w-full"}
      height={height + margin.top + margin.bottom + 10}
    >
      <g transform={`translate(${margin.left}, ${margin.top})`}>
        <Bars
          data={data}
          height={height}
          radius={radius}
          fontSizeOuter={fontSizeOuter}
          fontSizeInner={fontSizeInner}
        />
      </g>
    </svg>
  );
};
