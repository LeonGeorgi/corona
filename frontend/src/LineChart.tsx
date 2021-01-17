import React, { Component } from 'react';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridColumns, GridRows } from '@visx/grid';
import { AreaClosed, LinePath } from '@visx/shape';
import { curveCatmullRom } from '@visx/curve';
import { scaleLinear, scaleTime } from '@visx/scale';
import { ParentSize } from '@visx/responsive';

type Props = {
  data: { date: Date, value: number }[],
  margin: { left: number, right: number, top: number, bottom: number },
  areaColor: string,
  lineColor: string
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
    return scaleLinear<number>({
      range: [height - this.props.margin.bottom, this.props.margin.top],
      domain: [0, max],
      nice: true
    })
  }

  render() {
    const margin = this.props.margin
    return <ParentSize>
      {({ height, width }) => {
        const timeScale = this.getTimeScale(width);
        const valueScale = this.getValueScale(height)
        return <svg width={width} height={height}>
          <rect width={width - margin.left - margin.right}
                height={height - margin.top - margin.bottom}
                fill={"#ffffff0f"}
                x={margin.left}
                y={margin.top}/>
          <AxisLeft scale={valueScale}
                    left={this.props.margin.left}
                    numTicks={5}
                    stroke={"#ffffff00"}
                    tickStroke={"#ffffff00"}
                    tickLabelProps={() => ({
                      fill: "#ffffffee",
                      fontSize: 10,
                      textAnchor: 'end',
                      fontWeight: 300,
                      fontFamily: '"Roboto Mono", sans-serif',
                      dx: '0.0em',
                      dy: '0.33em',
                    })}/>
          <AxisBottom top={height - this.props.margin.bottom}
                      scale={timeScale}
                      numTicks={5}
                      stroke={"#ffffff00"}
                      tickStroke={"#ffffff00"}
                      tickLabelProps={() => ({
                        fill: "#ffffffee",
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
            stroke={"#ffffff"}
            strokeOpacity={0.05}
            pointerEvents="none"
          />
          <GridRows
            left={this.props.margin.left}
            scale={valueScale}
            numTicks={5}
            width={width - margin.left - margin.right}
            stroke={"#ffffff"}
            strokeOpacity={0.05}
            pointerEvents="none"
          />
          <AreaClosed data={this.props.data}
                      curve={curveCatmullRom}
                      x={(d) => timeScale(d.date)}
                      y={(d) => valueScale(d.value)}
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
    </ParentSize>;
  }
}

export default LineChart;