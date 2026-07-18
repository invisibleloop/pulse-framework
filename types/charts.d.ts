/**
 * Pulse Charts — SVG chart components
 * @invisibleloop/pulse/charts
 *
 * All components are pure functions: (props?) => HTML string.
 * Import only what you need — no side effects on import.
 */

type ChartColor = 'accent' | 'success' | 'warning' | 'error' | 'blue' | 'muted'

export interface ChartDataPoint {
  label: string
  value: number
}
export interface DonutDataPoint {
  label:  string
  value:  number
  color?: string
}

export interface BarChartProps {
  data?:       ChartDataPoint[]
  height?:     number
  color?:      ChartColor
  showValues?: boolean
  showGrid?:   boolean
  gap?:        number
  class?:      string
}
export function barChart(props?: BarChartProps): string

export interface LineChartProps {
  data?:      ChartDataPoint[]
  height?:    number
  color?:     ChartColor
  area?:      boolean
  showDots?:  boolean
  showGrid?:  boolean
  class?:     string
}
export function lineChart(props?: LineChartProps): string

export interface DonutChartProps {
  data?:      DonutDataPoint[]
  size?:      number
  thickness?: number
  label?:     string
  sublabel?:  string
  class?:     string
}
export function donutChart(props?: DonutChartProps): string

export interface SparklineProps {
  data?:   number[]
  width?:  number
  height?: number
  color?:  ChartColor
  area?:   boolean
  class?:  string
}
export function sparkline(props?: SparklineProps): string
