/**
 * @phozart/widgets — Bar Chart Backward Compatibility
 *
 * Pure function: converts existing PhzBarChart properties into a ChartSpec.
 * Used by the legacy <phz-bar-chart> wrapper to delegate to <phz-chart>.
 */

import type { ChartSpec } from '@phozart/engine';
import type { ChartDataSeries } from '@phozart/engine';
import type { MultiSeriesDataPoint } from '../components/phz-bar-chart.js';

export interface BarChartProps {
  data?: ChartDataSeries;
  multiSeriesData?: MultiSeriesDataPoint[];
  mode: 'simple' | 'stacked' | 'grouped';
  seriesNames?: string[];
  chartTitle?: string;
  rankOrder: 'asc' | 'desc';
  maxBars: number;
  colors: string[];
}

/**
 * Convert legacy bar chart props to a unified ChartSpec.
 */
export function convertBarChartPropsToSpec(props: BarChartProps): ChartSpec | null {
  if (props.mode !== 'simple' && props.multiSeriesData && props.multiSeriesData.length > 0) {
    return convertMultiSeriesBarChart(props);
  }

  if (props.data && props.data.data.length > 0) {
    return convertSimpleBarChart(props);
  }

  return null;
}

function convertSimpleBarChart(props: BarChartProps): ChartSpec {
  const data = props.data!;

  // Sort and limit
  const sorted = [...data.data].sort((a, b) =>
    props.rankOrder === 'desc' ? b.y - a.y : a.y - b.y,
  ).slice(0, props.maxBars);

  const values = sorted.map(point => ({
    x: point.label ?? point.x,
    y: point.y,
  }));

  return {
    data: { values },
    series: [{
      type: 'bar',
      x: { field: 'x', type: 'nominal' },
      y: { field: 'y', type: 'quantitative' },
      bar: { orientation: 'horizontal' },
    }],
    title: data.label,
    appearance: {
      colors: props.colors.length > 0 ? props.colors : undefined,
    },
  };
}

function convertMultiSeriesBarChart(props: BarChartProps): ChartSpec {
  const seriesNames = props.seriesNames
    ?? (props.multiSeriesData!.length > 0
      ? Object.keys(props.multiSeriesData![0].values)
      : []);

  // Sort by total value and limit
  const sorted = [...props.multiSeriesData!].sort((a, b) => {
    const totalA = Object.values(a.values).reduce((s, v) => s + v, 0);
    const totalB = Object.values(b.values).reduce((s, v) => s + v, 0);
    return props.rankOrder === 'desc' ? totalB - totalA : totalA - totalB;
  }).slice(0, props.maxBars);

  // Flatten to rows: one row per (category, series) combination
  const values: Record<string, unknown>[] = sorted.map(point => {
    const row: Record<string, unknown> = { category: point.label };
    for (const name of seriesNames) {
      row[name] = point.values[name] ?? 0;
    }
    return row;
  });

  const isStacked = props.mode === 'stacked';

  const series = seriesNames.map(name => ({
    type: 'bar' as const,
    x: { field: 'category', type: 'nominal' as const },
    y: { field: name, type: 'quantitative' as const },
    name,
    bar: { orientation: 'horizontal' as const },
    stack: isStacked ? true as const : undefined,
  }));

  return {
    data: { values },
    series,
    title: props.chartTitle,
    appearance: {
      colors: props.colors.length > 0 ? props.colors : undefined,
    },
  };
}
