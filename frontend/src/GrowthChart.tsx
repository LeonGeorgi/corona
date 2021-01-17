import React, { Component } from 'react';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridColumns, GridRows } from '@visx/grid';
import { LinePath } from '@visx/shape';
import { curveCatmullRom } from '@visx/curve';
import { scaleLinear, scaleTime } from '@visx/scale';
import { ParentSize } from '@visx/responsive';
import { Threshold } from '@visx/threshold';

type Props = {
  data: { date: Date, value: number }[],
  margin: { left: number, right: number, top: number, bottom: number }
}
type State = {}

class GrowthChart extends Component<Props, State> {

  static MIN = -21
  static MAX = 21

  private getTimeScale(width: number) {
    const timeScale = scaleTime<number>({
      domain: [this.props.data[0].date, this.props.data[this.props.data.length - 1].date],
    });
    timeScale.range([this.props.margin.left, width - this.props.margin.right]);
    return timeScale;
  }

  private getValueScale(height: number) {
    return scaleLinear<number>({
      range: [height - this.props.margin.bottom, this.props.margin.top],
      domain: [GrowthChart.MIN, GrowthChart.MAX],
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
          <Threshold
            id={`${Math.random()}`}
            data={this.props.data}
            x={d => timeScale(d.date) ?? 0}
            y0={() => valueScale(0)}
            y1={d => valueScale(d.value)}
            clipAboveTo={valueScale(100)}
            clipBelowTo={valueScale(-100)}
            curve={curveCatmullRom}
            belowAreaProps={{
              fill: '#b3423b',
              fillOpacity: 1,
            }}
            aboveAreaProps={{
              fill: '#489f4c',
              fillOpacity: 1,
            }}
          />

          <LinePath data={this.props.data}
                    curve={curveCatmullRom}
                    x={(d) => timeScale(d.date)}
                    y={(d) => valueScale(d.value)}
                    shapeRendering="geometricPrecision"
                    stroke={'#ffffff'}
                    strokeWidth={1}
                    strokeOpacity={0.5}/>

          <rect width={width - margin.left - margin.right}
                height={margin.top}
                fill={"#333333"}
                x={margin.left}
                y={0}/>
          <rect width={width - margin.left - margin.right}
                height={margin.bottom}
                fill={"#333333"}
                x={margin.left}
                y={height - margin.bottom}/>

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
        </svg>;
      }}
    </ParentSize>;
  }
}

export default GrowthChart;