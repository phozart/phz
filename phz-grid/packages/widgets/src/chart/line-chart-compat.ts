/**
 * @phozart/widgets — Line Chart Backward Compatibility
 *
 * Pure function: converts existing PhzLineChart properties into a ChartSpec.
 * Used by the legacy <phz-line-chart> wrapper to delegate to <phz-chart>.
 */

import type { ChartSpec } from '@phozart/engine';
import type { LineChartSeries } from '../components/phz-line-chart.js';

export interface LineChartProps {
  data: LineChartSeries[];
  showGrid: boolean;
  showAxis: boolean;
  showLegend: boolean;
  xAxisType: 'time' | 'linear' | 'category';
  title: string;
}

/**
 * Convert legacy line chart props to a unified ChartSpec.
 */
export function convertLineChartPropsToSpec(props: LineChartProps): ChartSpec | null {
  if (props.data.length === 0) return null;

  const allPoints = props.data.flatMap(s => s.points);
  if (allPoints.length === 0) return null;

  // Build unified data: flatten all series points into rows
  // Each row has: x, and one field per series
  const xValues = props.data.reduce<(string | number)[]>((acc, s) => {
    for (const p of s.points) {
      if (!acc.includes(p.x)) acc.push(p.x);
    }
    return acc;
  }, []);

  const values = xValues.map(x => {
    const row: Record<string, unknown> = { x };
    for (const series of props.data) {
      const point = series.points.find(p => p.x === x);
      row[series.label] = point?.y ?? null;
    }
    return row;
  });

  const xFieldType = props.xAxisType === 'time' ? 'temporal' as const
    : props.xAxisType === 'linear' ? 'quantitative' as const
    : 'nominal' as const;

  const series = props.data.map(s => ({
    type: 'line' as const,
    x: { field: 'x', type: xFieldType },
    y: { field: s.label, type: 'quantitative' as const },
    name: s.label,
    color: s.color,
    line: { curve: 'linear' as const, strokeWidth: 2 },
  }));

  return {
    data: { values },
    series,
    title: props.title || undefined,
    xAxis: {
      show: props.showAxis,
      gridLines: false,
    },
    yAxis: {
      show: props.showAxis,
      gridLines: props.showGrid,
    },
    legend: {
      show: props.showLegend,
      position: 'top',
      interactive: true,
    },
  };
}
