/**
 * @phozart/widgets — Chart Data Resolution
 *
 * Pure function pipeline: ChartSpec → ResolvedChartData
 *
 * Resolves series from the spec by applying transforms, computing stacking,
 * assigning colors and patterns, and producing the scale parameters that
 * the layout engine needs.
 */

import type {
  ChartSpec,
  ChartSeriesSpec,
  FieldDataType,
} from '@phozart/engine';
import { applyTransforms } from '@phozart/engine';
import { getPaletteColors } from '@phozart/engine';
import { computeNiceScale, computeBandScale, computeTimeScale } from './chart-scales.js';
import type { LinearScaleResult, BandScaleResult, TimeScaleResult } from './chart-scales.js';

// ========================================================================
// Resolved Types
// ========================================================================

export interface ResolvedDataPoint {
  x: string | number;
  y: number;
  /** For stacked series: the baseline y position. */
  y0?: number;
  /** Original row data for tooltip access. */
  datum: Record<string, unknown>;
}

export interface ResolvedSeries {
  index: number;
  type: 'bar' | 'line' | 'area' | 'point';
  name: string;
  color: string;
  patternId?: string;
  points: ResolvedDataPoint[];
  markConfig: ChartSeriesSpec;
}

export type XScaleType = 'band' | 'linear' | 'time';

export interface ResolvedXScale {
  type: XScaleType;
  band?: BandScaleResult;
  linear?: LinearScaleResult;
  time?: TimeScaleResult;
}

export interface ResolvedChartData {
  series: ResolvedSeries[];
  xScale: ResolvedXScale;
  yScale: LinearScaleResult;
  xTitle: string;
  yTitle: string;
  colors: string[];
}

// ========================================================================
// Pattern IDs for Colorblind Safety
// ========================================================================

const PATTERN_NAMES = [
  'diagonal-stripe',
  'dots',
  'crosshatch',
  'horizontal-stripe',
  'vertical-stripe',
  'diagonal-reverse',
  'diamond',
  'zigzag',
];

// ========================================================================
// Main Resolution Function
// ========================================================================

/**
 * Resolve a ChartSpec into computed data ready for layout.
 * Applies transforms, extracts series data, computes scales.
 *
 * @param spec - The chart specification
 * @param plotWidth - Available plot area width in pixels (after axis/padding)
 * @param plotHeight - Available plot area height in pixels
 */
export function resolveChartData(
  spec: ChartSpec,
  plotWidth: number,
  plotHeight: number,
): ResolvedChartData {
  // 1. Apply data transforms
  const transformedRows = spec.transforms
    ? applyTransforms(spec.data.values, spec.transforms)
    : spec.data.values;

  // 2. Resolve palette colors
  const paletteId = spec.appearance?.palette ?? 'phz-default';
  const customColors = spec.appearance?.colors;
  const paletteColors = customColors ?? getPaletteColors(paletteId);

  // 3. Determine x-axis data type
  const xFieldType = inferXFieldType(spec);

  // 4. Resolve each series
  const resolvedSeries: ResolvedSeries[] = [];

  // For stacking, group by series type and accumulate
  const stackGroups = new Map<string, { series: ChartSeriesSpec; index: number }[]>();

  for (let i = 0; i < spec.series.length; i++) {
    const s = spec.series[i];
    const stackKey = s.stack ? `stack-${s.x.field}` : `no-stack-${i}`;
    const group = stackGroups.get(stackKey);
    if (group) {
      group.push({ series: s, index: i });
    } else {
      stackGroups.set(stackKey, [{ series: s, index: i }]);
    }
  }

  // Track stacking baselines per x-value
  const stackBaselines = new Map<string, number>();

  for (const [, group] of stackGroups) {
    const isStacked = group[0].series.stack;

    if (isStacked) {
      stackBaselines.clear();
    }

    for (const { series: seriesSpec, index: origIndex } of group) {
      const points = extractSeriesPoints(transformedRows, seriesSpec);

      // Apply stacking
      if (isStacked) {
        for (const point of points) {
          const key = String(point.x);
          const baseline = stackBaselines.get(key) ?? 0;
          point.y0 = baseline;
          const newTop = baseline + point.y;
          point.y = newTop;
          stackBaselines.set(key, newTop);
        }
      }

      const color = seriesSpec.color ?? paletteColors[origIndex % paletteColors.length];
      const needsPattern = seriesSpec.patternFill === true;

      resolvedSeries.push({
        index: origIndex,
        type: seriesSpec.type,
        name: seriesSpec.name ?? seriesSpec.y.title ?? seriesSpec.y.field,
        color,
        patternId: needsPattern ? PATTERN_NAMES[origIndex % PATTERN_NAMES.length] : undefined,
        points,
        markConfig: seriesSpec,
      });
    }
  }

  // 5. Compute scales
  const xScale = computeXScale(resolvedSeries, xFieldType, plotWidth);
  const yScale = computeYScale(resolvedSeries, spec, plotHeight);
  const colors = resolvedSeries.map(s => s.color);

  return {
    series: resolvedSeries,
    xScale,
    yScale,
    xTitle: spec.xAxis?.label ?? spec.series[0]?.x.title ?? spec.series[0]?.x.field ?? '',
    yTitle: spec.yAxis?.label ?? spec.series[0]?.y.title ?? spec.series[0]?.y.field ?? '',
    colors,
  };
}

// ========================================================================
// Helper Functions
// ========================================================================

function extractSeriesPoints(
  rows: Record<string, unknown>[],
  seriesSpec: ChartSeriesSpec,
): ResolvedDataPoint[] {
  return rows.map(row => ({
    x: row[seriesSpec.x.field] as string | number,
    y: (row[seriesSpec.y.field] as number) ?? 0,
    datum: row,
  }));
}

function inferXFieldType(spec: ChartSpec): FieldDataType {
  // Check explicit type on first series
  if (spec.series[0]?.x.type) return spec.series[0].x.type;

  // Check field type hints
  const xField = spec.series[0]?.x.field;
  if (xField && spec.data.fields?.[xField]) return spec.data.fields[xField];

  // Infer from data
  if (spec.data.values.length > 0 && xField) {
    const sample = spec.data.values[0][xField];
    if (typeof sample === 'number') return 'quantitative';
    if (sample instanceof Date) return 'temporal';
    if (typeof sample === 'string') {
      // Check if it looks like a date
      const d = new Date(sample);
      if (!isNaN(d.getTime()) && sample.length >= 8) return 'temporal';
    }
  }

  return 'nominal';
}

function computeXScale(
  series: ResolvedSeries[],
  fieldType: FieldDataType,
  plotWidth: number,
): ResolvedXScale {
  const allX = series.flatMap(s => s.points.map(p => p.x));

  if (fieldType === 'quantitative') {
    const nums = allX.filter((v): v is number => typeof v === 'number');
    const min = nums.length > 0 ? Math.min(...nums) : 0;
    const max = nums.length > 0 ? Math.max(...nums) : 1;
    return {
      type: 'linear',
      linear: computeNiceScale(min, max),
    };
  }

  if (fieldType === 'temporal') {
    const timestamps = allX.map(v => {
      if (typeof v === 'number') return v;
      const d = new Date(String(v));
      return isNaN(d.getTime()) ? 0 : d.getTime();
    }).filter(t => t > 0);

    return {
      type: 'time',
      time: computeTimeScale(timestamps, 0, plotWidth),
    };
  }

  // Nominal/Ordinal → band scale
  const unique = [...new Set(allX.map(v => String(v)))];
  return {
    type: 'band',
    band: computeBandScale(unique, 0, plotWidth),
  };
}

function computeYScale(
  series: ResolvedSeries[],
  spec: ChartSpec,
  plotHeight: number,
): LinearScaleResult {
  const allY = series.flatMap(s => s.points.flatMap(p => {
    const values = [p.y];
    if (p.y0 !== undefined) values.push(p.y0);
    return values;
  }));

  let min = allY.length > 0 ? Math.min(...allY) : 0;
  let max = allY.length > 0 ? Math.max(...allY) : 1;

  // Apply axis overrides
  if (spec.yAxis?.min !== undefined) min = spec.yAxis.min;
  if (spec.yAxis?.max !== undefined) max = spec.yAxis.max;

  // Include zero for bar charts
  const hasBar = series.some(s => s.type === 'bar');
  if (hasBar && min > 0) min = 0;

  const tickCount = Math.max(2, Math.floor(plotHeight / 60));
  return computeNiceScale(min, max, tickCount);
}
