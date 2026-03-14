/**
 * @phozart/engine — Unified Chart Specification
 *
 * Vega-Lite-inspired JSON-serializable chart spec that drives the unified
 * `<phz-chart>` component. No function values — fully serializable for
 * AI generation, storage, and cross-context transfer.
 *
 * Aligns with existing ChartAppearance/ChartBinding in widget-config-enhanced.ts.
 */

// ========================================================================
// Encoding Channels
// ========================================================================

/** Field data type — determines scale type and formatting. */
export type FieldDataType = 'quantitative' | 'ordinal' | 'nominal' | 'temporal';

/** Aggregation applied to a field within encoding. */
export type EncodingAggregate =
  | 'sum' | 'count' | 'mean' | 'min' | 'max'
  | 'median' | 'distinct';

/** Time unit bucketing for temporal fields. */
export type TimeUnit =
  | 'year' | 'quarter' | 'month' | 'week' | 'day'
  | 'hour' | 'minute' | 'yearmonth' | 'yearquarter' | 'monthday';

/** Scale override on a per-channel basis. */
export interface ScaleOverride {
  domain?: [number, number];
  zero?: boolean;
  nice?: boolean;
}

/** A single encoding channel: maps a data field to a visual property. */
export interface EncodingChannel {
  field: string;
  type: FieldDataType;
  aggregate?: EncodingAggregate;
  timeUnit?: TimeUnit;
  scale?: ScaleOverride;
  title?: string;
  format?: string;
}

// ========================================================================
// Mark Configuration
// ========================================================================

export type BarOrientation = 'horizontal' | 'vertical';

export interface BarMarkConfig {
  orientation?: BarOrientation;
  /** Bar width as ratio of band (0-1). Default: 0.8. */
  width?: number;
  /** Gap between grouped bars in pixels. Default: 1. */
  gap?: number;
  /** Corner radius in pixels. Default: 2. */
  cornerRadius?: number;
}

export type CurveType = 'linear' | 'monotone' | 'step' | 'step-before' | 'step-after';

export interface LineMarkConfig {
  curve?: CurveType;
  strokeWidth?: number;
  strokeDash?: number[];
}

export interface PointMarkConfig {
  /** Radius in pixels. Default: 4. */
  size?: number;
  filled?: boolean;
}

export interface AreaMarkConfig {
  curve?: CurveType;
  opacity?: number;
  /** Line stroke width on top of area fill. Default: 2. */
  strokeWidth?: number;
}

// ========================================================================
// Series Specification
// ========================================================================

export type SeriesType = 'bar' | 'line' | 'area' | 'point';

export interface ChartSeriesSpec {
  type: SeriesType;
  x: EncodingChannel;
  y: EncodingChannel;
  color?: string;
  /** Enable pattern fill for colorblind safety. */
  patternFill?: boolean;
  name?: string;
  bar?: BarMarkConfig;
  line?: LineMarkConfig;
  point?: PointMarkConfig;
  area?: AreaMarkConfig;
  /** Stack mode: true = stacked, 'normalize' = 100% stacked, false/undefined = overlaid. */
  stack?: boolean | 'normalize';
}

// ========================================================================
// Data Specification
// ========================================================================

export interface ChartDataSpec {
  values: Record<string, unknown>[];
  /** Optional field type hints — inferred from data if not provided. */
  fields?: Record<string, FieldDataType>;
}

// ========================================================================
// Data Transforms
// ========================================================================

export interface FilterTransform {
  type: 'filter';
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in';
  value: unknown;
}

export interface SortTransform {
  type: 'sort';
  field: string;
  order: 'asc' | 'desc';
}

export interface AggregateTransform {
  type: 'aggregate';
  groupBy: string[];
  ops: { field: string; op: EncodingAggregate; as: string }[];
}

export interface StackTransform {
  type: 'stack';
  field: string;
  groupBy: string[];
  sort?: { field: string; order: 'asc' | 'desc' };
  as: [string, string];
}

export interface BinTransform {
  type: 'bin';
  field: string;
  maxBins?: number;
  as: string;
}

export interface TimeUnitTransform {
  type: 'timeUnit';
  field: string;
  timeUnit: TimeUnit;
  as: string;
}

export interface NormalizeTransform {
  type: 'normalize';
  field: string;
  groupBy: string[];
  as: string;
}

export interface CalculateTransform {
  type: 'calculate';
  as: string;
  /** Simple expression string: 'datum.revenue / datum.count'. */
  expr: string;
}

export type DataTransform =
  | FilterTransform
  | SortTransform
  | AggregateTransform
  | StackTransform
  | BinTransform
  | TimeUnitTransform
  | NormalizeTransform
  | CalculateTransform;

// ========================================================================
// Axis Specification
// ========================================================================

export interface ChartAxisSpec {
  show?: boolean;
  label?: string;
  gridLines?: boolean;
  tickCount?: number;
  format?: string;
  /** Axis position. Default: 'bottom' for x, 'left' for y. */
  position?: 'top' | 'bottom' | 'left' | 'right';
  min?: number;
  max?: number;
}

// ========================================================================
// Annotation Specification
// ========================================================================

export type AnnotationType = 'reference-line' | 'threshold-band' | 'target-line' | 'text';

export interface BaseAnnotationSpec {
  type: AnnotationType;
  label?: string;
  color?: string;
}

export interface ReferenceLineAnnotation extends BaseAnnotationSpec {
  type: 'reference-line';
  axis: 'x' | 'y';
  value: number;
  dashStyle?: 'solid' | 'dashed' | 'dotted';
}

export interface ThresholdBandAnnotation extends BaseAnnotationSpec {
  type: 'threshold-band';
  axis: 'y';
  min: number;
  max: number;
  fillColor?: string;
  fillOpacity?: number;
}

export interface TargetLineAnnotation extends BaseAnnotationSpec {
  type: 'target-line';
  axis: 'y';
  value: number;
  dashStyle?: 'solid' | 'dashed' | 'dotted';
}

export interface TextAnnotation extends BaseAnnotationSpec {
  type: 'text';
  x: number | string;
  y: number;
  text: string;
  anchor?: 'start' | 'middle' | 'end';
}

export type ChartAnnotationSpec =
  | ReferenceLineAnnotation
  | ThresholdBandAnnotation
  | TargetLineAnnotation
  | TextAnnotation;

// ========================================================================
// Legend, Tooltip, Interaction, Appearance
// ========================================================================

export interface ChartLegendSpec {
  show?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  interactive?: boolean;
}

export type TooltipMode = 'hover' | 'crosshair';

export interface ChartTooltipSpec {
  enabled?: boolean;
  mode?: TooltipMode;
  /** WCAG 1.4.13: tooltip stays visible when hovered. */
  persistent?: boolean;
}

export type BrushDirection = 'x' | 'y' | 'xy';

export interface ChartInteractionSpec {
  brush?: {
    enabled: boolean;
    direction?: BrushDirection;
    minSpan?: number;
    syncGroup?: string;
  };
  crosshair?: {
    enabled: boolean;
    direction?: 'x' | 'y' | 'xy';
  };
}

export type ChartRenderer = 'svg' | 'canvas' | 'hybrid' | 'auto';

export interface ChartAppearanceSpec {
  height?: number;
  padding?: { top?: number; right?: number; bottom?: number; left?: number };
  palette?: string;
  colors?: string[];
  animated?: boolean;
  renderer?: ChartRenderer;
}

// ========================================================================
// Top-Level Chart Spec
// ========================================================================

export interface ChartSpec {
  data: ChartDataSpec;
  transforms?: DataTransform[];
  series: ChartSeriesSpec[];
  xAxis?: ChartAxisSpec;
  yAxis?: ChartAxisSpec;
  annotations?: ChartAnnotationSpec[];
  legend?: ChartLegendSpec;
  tooltip?: ChartTooltipSpec;
  interaction?: ChartInteractionSpec;
  appearance?: ChartAppearanceSpec;
  title?: string;
}

// ========================================================================
// Smart Defaults
// ========================================================================

export const CHART_SPEC_DEFAULTS: Partial<ChartSpec> = {
  xAxis: { show: true, gridLines: false },
  yAxis: { show: true, gridLines: true },
  legend: { show: true, position: 'top', interactive: true },
  tooltip: { enabled: true, mode: 'hover', persistent: true },
  appearance: {
    palette: 'phz-default',
    animated: true,
    renderer: 'svg',
  },
};

/**
 * Apply smart defaults to a partial chart spec.
 * Merges top-level spec defaults but does not override user-provided values.
 */
export function applyChartDefaults(spec: ChartSpec): ChartSpec {
  return {
    ...spec,
    xAxis: { ...CHART_SPEC_DEFAULTS.xAxis, ...spec.xAxis },
    yAxis: { ...CHART_SPEC_DEFAULTS.yAxis, ...spec.yAxis },
    legend: { ...CHART_SPEC_DEFAULTS.legend, ...spec.legend },
    tooltip: { ...CHART_SPEC_DEFAULTS.tooltip, ...spec.tooltip },
    appearance: { ...CHART_SPEC_DEFAULTS.appearance, ...spec.appearance },
  };
}

/**
 * Validate a ChartSpec for basic structural correctness.
 * Returns an array of error messages (empty = valid).
 */
export function validateChartSpec(spec: ChartSpec): string[] {
  const errors: string[] = [];

  if (!spec.data) {
    errors.push('ChartSpec.data is required');
  } else if (!Array.isArray(spec.data.values)) {
    errors.push('ChartSpec.data.values must be an array');
  }

  if (!spec.series || spec.series.length === 0) {
    errors.push('ChartSpec.series must contain at least one series');
  } else {
    for (let i = 0; i < spec.series.length; i++) {
      const s = spec.series[i];
      if (!s.x?.field) errors.push(`series[${i}].x.field is required`);
      if (!s.y?.field) errors.push(`series[${i}].y.field is required`);
      if (!['bar', 'line', 'area', 'point'].includes(s.type)) {
        errors.push(`series[${i}].type must be bar, line, area, or point`);
      }
    }
  }

  return errors;
}
