/**
 * @phozart/engine — AI Chart Recommendation
 *
 * Extends the existing suggestChartType() from chart-suggest.ts with full
 * ChartSpec generation. Analyzes data fields to recommend chart type,
 * encoding channels, and annotations.
 */

import type {
  ChartSpec,
  ChartSeriesSpec,
  FieldDataType,
  ChartAnnotationSpec,
} from './chart-spec.js';

// ========================================================================
// Field Analysis
// ========================================================================

interface FieldAnalysis {
  name: string;
  type: FieldDataType;
  uniqueCount: number;
  isNumeric: boolean;
  isTemporal: boolean;
  min?: number;
  max?: number;
  mean?: number;
  variance?: number;
}

function analyzeFields(data: Record<string, unknown>[]): FieldAnalysis[] {
  if (data.length === 0) return [];

  const fields = Object.keys(data[0]);
  return fields.map(name => analyzeField(name, data));
}

function analyzeField(name: string, data: Record<string, unknown>[]): FieldAnalysis {
  const values = data.map(row => row[name]);
  const uniqueCount = new Set(values.map(v => String(v))).size;

  const nums = values.filter((v): v is number => typeof v === 'number');
  const isNumeric = nums.length > data.length * 0.8;

  // Check temporal
  const isTemporal = !isNumeric && isLikelyDate(name, values);

  let type: FieldDataType;
  if (isNumeric) type = 'quantitative';
  else if (isTemporal) type = 'temporal';
  else if (uniqueCount <= 20) type = 'nominal';
  else type = 'ordinal';

  const result: FieldAnalysis = { name, type, uniqueCount, isNumeric, isTemporal };

  if (isNumeric && nums.length > 0) {
    result.min = Math.min(...nums);
    result.max = Math.max(...nums);
    result.mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    if (nums.length > 1) {
      const mean = result.mean;
      result.variance = nums.reduce((sum, v) => sum + (v - mean) ** 2, 0) / nums.length;
    }
  }

  return result;
}

const DATE_FIELD_PATTERNS = /date|_at|_on|timestamp|month|year|quarter|week|day|time|period/i;

function isLikelyDate(name: string, values: unknown[]): boolean {
  if (DATE_FIELD_PATTERNS.test(name)) return true;

  // Sample first non-null value
  const sample = values.find(v => v != null);
  if (typeof sample === 'string') {
    const d = new Date(sample);
    return !isNaN(d.getTime()) && sample.length >= 8;
  }

  return false;
}

// ========================================================================
// Recommendation Options
// ========================================================================

export interface RecommendOptions {
  /** Preferred chart type (overrides auto-detection). */
  preferredType?: 'bar' | 'line' | 'area' | 'point';
  /** Maximum number of series to suggest. Default: 3. */
  maxSeries?: number;
  /** Whether to suggest annotations. Default: true. */
  suggestAnnotations?: boolean;
  /** Explicit x-field override. */
  xField?: string;
  /** Explicit y-field(s) override. */
  yFields?: string[];
}

// ========================================================================
// Main Recommendation Function
// ========================================================================

/**
 * Recommend a ChartSpec based on data analysis.
 *
 * Extends `suggestChartType()` from chart-suggest.ts with full spec generation:
 * - Encoding channel suggestions based on field type inference
 * - Chart type selection based on data characteristics
 * - Annotation suggestions (average line when variance is high)
 */
export function recommendChartSpec(
  data: Record<string, unknown>[],
  options?: RecommendOptions,
): Partial<ChartSpec> {
  if (data.length === 0) return { data: { values: [] }, series: [] };

  const fields = analyzeFields(data);
  const maxSeries = options?.maxSeries ?? 3;

  // Identify dimension and measure fields
  const dimensions = fields.filter(f => !f.isNumeric);
  const measures = fields.filter(f => f.isNumeric);

  if (measures.length === 0) {
    return { data: { values: data }, series: [] };
  }

  // Select x-field
  const xField = options?.xField
    ? fields.find(f => f.name === options.xField) ?? dimensions[0] ?? measures[0]
    : selectXField(dimensions, measures);

  // Select y-fields
  const yFields = options?.yFields
    ? measures.filter(f => options.yFields!.includes(f.name))
    : selectYFields(measures, xField, maxSeries);

  // Determine chart type
  const chartType = options?.preferredType ?? inferChartType(xField, yFields, data.length);

  // Build series
  const series: ChartSeriesSpec[] = yFields.map(yField => ({
    type: chartType,
    x: { field: xField.name, type: xField.type },
    y: { field: yField.name, type: 'quantitative' as const },
    name: yField.name,
  }));

  // Suggest annotations
  const annotations: ChartAnnotationSpec[] = [];
  if (options?.suggestAnnotations !== false) {
    for (const yField of yFields) {
      if (yField.mean !== undefined && yField.variance !== undefined) {
        const cv = Math.sqrt(yField.variance) / Math.abs(yField.mean || 1);
        if (cv > 0.3) {
          annotations.push({
            type: 'reference-line',
            axis: 'y',
            value: Math.round(yField.mean * 100) / 100,
            label: `Avg ${yField.name}`,
            dashStyle: 'dashed',
          });
        }
      }
    }
  }

  return {
    data: { values: data },
    series,
    annotations: annotations.length > 0 ? annotations : undefined,
    xAxis: { label: xField.name },
    yAxis: { label: yFields.length === 1 ? yFields[0].name : undefined },
  };
}

// ========================================================================
// Inference Helpers
// ========================================================================

function selectXField(
  dimensions: FieldAnalysis[],
  measures: FieldAnalysis[],
): FieldAnalysis {
  // Prefer temporal dimensions
  const temporal = dimensions.find(f => f.isTemporal);
  if (temporal) return temporal;

  // Then any categorical dimension
  if (dimensions.length > 0) return dimensions[0];

  // Fallback to first field
  return measures[0];
}

function selectYFields(
  measures: FieldAnalysis[],
  xField: FieldAnalysis,
  maxSeries: number,
): FieldAnalysis[] {
  return measures
    .filter(f => f.name !== xField.name)
    .slice(0, maxSeries);
}

function inferChartType(
  xField: FieldAnalysis,
  yFields: FieldAnalysis[],
  rowCount: number,
): 'bar' | 'line' | 'area' | 'point' {
  // Temporal x-axis → line chart
  if (xField.isTemporal) return 'line';

  // Many categories → bar chart
  if (xField.type === 'nominal' && xField.uniqueCount <= 20) return 'bar';

  // Two quantitative fields → scatter
  if (xField.isNumeric && yFields.length === 1) return 'point';

  // Large dataset with temporal feel → area
  if (rowCount > 50 && xField.type === 'ordinal') return 'area';

  // Default
  return 'bar';
}
