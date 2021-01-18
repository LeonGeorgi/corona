import React, { Component } from 'react';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridColumns, GridRows } from '@visx/grid';
import { AreaClosed, LinePath } from '@visx/shape';
import { curveCatmullRom } from '@visx/curve';
import { scaleLinear, scaleTime, scaleLog } from '@visx/scale';
import { AutoSizer } from 'react-virtualized'

type Props = {
  data: { date: Date, value: number }[],
  margin: { left: number, right: number, top: number, bottom: number },
  areaColor: string,
  lineColor: string,
  logScale: boolean
}
type State = {}

class LineChart extends Component<Props, State> {


  private getTimeScale(width: number) {
    const timeScale = scaleTime<number>({
      domain: [this.props.data[0].date, this.props.data[this.props.data.length - 1].date],
    });
    timeScale.range([this.props.margin.left, width - this.props.margin.right]);
    return timeScale;
  }

  private getValueScale(height: number) {
    let max = 0
    let min = 10_000_000_000
    for (let { value } of this.props.data) {
      if (value > max) {
        max = value
      }
      if (value < min) {
        min = value
      }
    }
    if (this.props.logScale) {
      return scaleLog<number>({
        range: [height - this.props.margin.bottom, this.props.margin.top],
        domain: [1, max],
        nice: true,
        base: 10,
        clamp: true
      })
    }
    return scaleLinear<number>({
      range: [height - this.props.margin.bottom, this.props.margin.top],
      domain: [1, max],
      nice: true,
      clamp: true
    })
  }

  render() {
    const margin = this.props.margin
    return <AutoSizer>
      {({ height, width }) => {
        const timeScale = this.getTimeScale(width);
        const valueScale = this.getValueScale(height)
        return <svg width={width} height={height}>
          <rect width={width - margin.left - margin.right}
                height={height - margin.top - margin.bottom}
                fill={"var(--chart-background)"}
                x={margin.left}
                y={margin.top}/>
          <AxisLeft scale={valueScale}
                    left={this.props.margin.left}
                    numTicks={5}
                    stroke={"var(--chart-axis-stroke)"}
                    tickStroke={"var(--chart-axis-tick-stroke)"}
                    tickLabelProps={() => ({
                      fill: "var(--chart-axis-tick-label)",
                      fontSize: 10,
                      textAnchor: 'end',
                      fontWeight: 300,
                      fontFamily: '"Roboto Mono", sans-serif',
                      dx: '0.0em',
                      dy: '0.33em',
                    })}
                    tickFormat={(value => value.toLocaleString())}/>
          <AxisBottom top={height - this.props.margin.bottom}
                      scale={timeScale}
                      numTicks={5}
                      stroke={"var(--chart-axis-stroke)"}
                      tickStroke={"var(--chart-axis-tick-stroke)"}
                      tickLabelProps={() => ({
                        fill: "var(--chart-axis-tick-label)",
                        fontSize: 10,
                        textAnchor: 'middle',
                        fontWeight: 300,
                        fontFamily: '"Roboto Mono", sans-serif',
                        dy: '0.0em',
                      })}/>

          <GridColumns
            top={margin.top}
            scale={timeScale}
            height={height - margin.bottom - margin.top}
            stroke={"var(--chart-grid-stroke)"}
            strokeOpacity={0.05}
            pointerEvents="none"
          />
          <GridRows
            left={this.props.margin.left}
            scale={valueScale}
            numTicks={5}
            width={width - margin.left - margin.right}
            stroke={"var(--chart-grid-stroke)"}
            strokeOpacity={0.05}
            pointerEvents="none"
          />
          <AreaClosed data={this.props.data}
                      curve={curveCatmullRom}
                      x={(d) => timeScale(d.date)}
                      y={(d) => {
                        return valueScale(d.value);
                      }}
                      shapeRendering="geometricPrecision"
                      fill={this.props.areaColor}
                      yScale={valueScale}/>

          <LinePath data={this.props.data}
                    curve={curveCatmullRom}
                    x={(d) => timeScale(d.date)}
                    y={(d) => valueScale(d.value)}
                    shapeRendering="geometricPrecision"
                    stroke={this.props.lineColor}
                    strokeWidth={1}
                    strokeOpacity={0.8}/>
        </svg>;
      }}
    </AutoSizer>;
  }
}

export default LineChart;