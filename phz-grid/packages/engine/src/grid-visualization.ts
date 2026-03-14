/**
 * @phozart/engine — Grid Visualization Bridge
 *
 * Bridges grid/pivot data to chart-ready visualization structures.
 * Suggests chart types based on data shape and field heuristics,
 * converts flat row data and pivot results to chart series,
 * and scaffolds quick dashboards from field definitions.
 */

import type { PivotResult } from './pivot.js';
import type { AggregationFunction } from '@phozart/core';
import type { ChartDataSeries, PieSlice } from './chart-projection.js';
import { projectPieData } from './chart-projection.js';
import { computeAggregation } from './aggregation.js';
import type { EnhancedDashboardConfig } from './dashboard-enhanced.js';
import { createEnhancedDashboardConfig } from './dashboard-enhanced.js';
import type { DashboardId, WidgetId } from './types.js';
import { dashboardId, widgetId } from './types.js';
import type { EnhancedWidgetConfig } from './widget-config-enhanced.js';
import { SMART_DEFAULTS } from './widget-config-enhanced.js';

// --- Types ---

export interface SuggestedVisualization {
  chartType: string;       // 'bar' | 'line' | 'pie' | 'kpi' | 'table' | ...
  confidence: number;      // 0-1
  encoding: { x?: string; y?: string; color?: string };
  reason: string;
}

export interface GridVisualizationConfig {
  dimension: string;
  measures: { field: string; aggregation: AggregationFunction }[];
  chartType?: string;       // override suggestion
}

export interface ChartVisualizationResult {
  chartType: string;
  series: ChartDataSeries[];
  pieSlices?: PieSlice[];
  title?: string;
}

export interface QuickDashboardField {
  field: string;
  role: 'dimension' | 'measure' | 'filter';
  aggregation?: AggregationFunction;
}

export interface QuickDashboardOptions {
  name?: string;
  columns?: number;
}

// --- Date field heuristics ---

const DATE_PATTERNS = /(?:date|_at$|_on$|timestamp|_time$|month|year|quarter|week|day)/i;

function isDateField(fieldName: string): boolean {
  return DATE_PATTERNS.test(fieldName);
}

// --- suggestChartFromData ---

/**
 * Suggest a chart type based on data shape, dimension names, and measure count.
 *
 * Heuristics:
 * - 0 dimensions + measures -> 'kpi' (high confidence)
 * - 1 dimension + 1 measure -> 'line' (date dim) or 'bar' (categorical)
 * - 1 dimension + 1 measure with < 8 distinct values -> 'pie'
 * - 1 dimension + 2+ measures -> 'grouped-bar' or 'multi-line'
 * - 2 dimensions + 1 measure -> 'stacked-bar'
 * - 3+ dimensions -> 'table'
 */
export function suggestChartFromData(
  data: Record<string, unknown>[],
  dimensions: string[],
  measures: string[],
): SuggestedVisualization {
  const dimCount = dimensions.length;
  const measureCount = measures.length;

  // No dimensions, only measures -> KPI
  if (dimCount === 0 && measureCount > 0) {
    return {
      chartType: 'kpi',
      confidence: 0.95,
      encoding: { y: measures[0] },
      reason: 'No dimensions provided; displaying aggregate KPI values.',
    };
  }

  // 3+ dimensions -> table (too complex for a simple chart)
  if (dimCount >= 3) {
    return {
      chartType: 'table',
      confidence: 0.8,
      encoding: { x: dimensions[0], y: measures[0] },
      reason: `${dimCount} dimensions is too complex for a chart; table is recommended.`,
    };
  }

  // 2 dimensions + at least 1 measure -> stacked bar
  if (dimCount === 2 && measureCount >= 1) {
    return {
      chartType: 'stacked-bar',
      confidence: 0.8,
      encoding: { x: dimensions[0], y: measures[0], color: dimensions[1] },
      reason: 'Two dimensions with a measure maps well to a stacked bar chart.',
    };
  }

  // 1 dimension cases
  if (dimCount === 1) {
    const dim = dimensions[0];
    const hasDate = isDateField(dim);

    if (measureCount === 1) {
      // Check distinct value count for pie eligibility
      const distinctValues = new Set(data.map(row => row[dim]));
      if (distinctValues.size > 0 && distinctValues.size < 8) {
        return {
          chartType: 'pie',
          confidence: 0.75,
          encoding: { x: dim, y: measures[0] },
          reason: `Only ${distinctValues.size} distinct values in "${dim}"; pie chart is a good fit.`,
        };
      }

      if (hasDate) {
        return {
          chartType: 'line',
          confidence: 0.85,
          encoding: { x: dim, y: measures[0] },
          reason: `Dimension "${dim}" looks like a date field; line chart shows trend over time.`,
        };
      }

      return {
        chartType: 'bar',
        confidence: 0.85,
        encoding: { x: dim, y: measures[0] },
        reason: `Categorical dimension "${dim}" with one measure maps to a bar chart.`,
      };
    }

    // 1 dimension + 2+ measures
    if (hasDate) {
      return {
        chartType: 'multi-line',
        confidence: 0.8,
        encoding: { x: dim, y: measures[0], color: measures[1] },
        reason: `Date dimension with ${measureCount} measures; multi-line shows trends.`,
      };
    }

    return {
      chartType: 'grouped-bar',
      confidence: 0.8,
      encoding: { x: dim, y: measures[0], color: measures[1] },
      reason: `Categorical dimension with ${measureCount} measures; grouped bar compares them.`,
    };
  }

  // Fallback: no measures or unexpected combination
  return {
    chartType: 'table',
    confidence: 0.5,
    encoding: { x: dimensions[0] },
    reason: 'Unable to determine a specific chart type; defaulting to table.',
  };
}

// --- gridDataToChart ---

/**
 * Convert flat row data to a chart visualization result.
 *
 * Groups rows by the dimension field, aggregates each measure,
 * and produces chart series or pie slices.
 */
export function gridDataToChart(
  data: Record<string, unknown>[],
  config: GridVisualizationConfig,
): ChartVisualizationResult {
  if (data.length === 0) {
    return { chartType: config.chartType ?? 'bar', series: [] };
  }

  // Determine chart type: use override or suggest
  const suggestion = suggestChartFromData(
    data,
    [config.dimension],
    config.measures.map(m => m.field),
  );
  const chartType = config.chartType ?? suggestion.chartType;

  // If pie chart, use projectPieData for the first measure
  if (chartType === 'pie' && config.measures.length > 0) {
    const firstMeasure = config.measures[0];
    const pieSlices = projectPieData(
      data,
      config.dimension,
      firstMeasure.field,
      firstMeasure.aggregation === 'count' ? 'count' : 'sum',
    );

    return {
      chartType: 'pie',
      series: [],
      pieSlices,
      title: `${firstMeasure.field} by ${config.dimension}`,
    };
  }

  // Group data by dimension
  const groups = new Map<string, Record<string, unknown>[]>();
  for (const row of data) {
    const key = String(row[config.dimension] ?? '');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const sortedKeys = Array.from(groups.keys()).sort();

  // Build a series per measure
  const series: ChartDataSeries[] = config.measures.map(measure => ({
    field: measure.field,
    label: measure.field,
    data: sortedKeys.map(key => ({
      x: key,
      y: (computeAggregation(groups.get(key)!, measure.field, measure.aggregation) as number) ?? 0,
    })),
  }));

  return {
    chartType,
    series,
    title: config.measures.map(m => m.field).join(', ') + ` by ${config.dimension}`,
  };
}

// --- pivotToChart ---

/**
 * Convert a PivotResult to a chart visualization result.
 *
 * Row headers become x-axis categories, column headers become series,
 * and cell values become y values.
 */
export function pivotToChart(pivot: PivotResult): ChartVisualizationResult {
  if (pivot.rowHeaders.length === 0 || pivot.columnHeaders.length === 0) {
    return { chartType: 'bar', series: [] };
  }

  // X-axis categories from row headers (join multi-level headers)
  const categories = pivot.rowHeaders.map(rh => rh.join(' / '));

  // Suggest chart type: single row -> pie, multiple rows -> bar
  const chartType = pivot.rowHeaders.length === 1 ? 'pie' : 'bar';

  // Build one series per column header
  const series: ChartDataSeries[] = pivot.columnHeaders.map((colHeader, colIdx) => {
    const label = colHeader.join(' / ');
    return {
      field: label,
      label,
      data: categories.map((cat, rowIdx) => ({
        x: cat,
        y: (typeof pivot.cells[rowIdx][colIdx] === 'number'
          ? pivot.cells[rowIdx][colIdx]
          : 0) as number,
      })),
    };
  });

  // If single row (pie), also produce pie slices
  let pieSlices: PieSlice[] | undefined;
  if (chartType === 'pie') {
    const values = pivot.columnHeaders.map((colHeader, colIdx) => ({
      category: colHeader.join(' / '),
      value: (typeof pivot.cells[0][colIdx] === 'number' ? pivot.cells[0][colIdx] : 0) as number,
    }));

    const total = values.reduce((sum, v) => sum + v.value, 0);
    pieSlices = values
      .map(v => ({
        category: v.category,
        value: v.value,
        percentage: total > 0 ? (v.value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }

  return {
    chartType,
    series,
    pieSlices,
  };
}

// --- createQuickDashboard ---

/**
 * Scaffold an EnhancedDashboardConfig from a set of field definitions.
 *
 * - Measures with no associated dimension become KPI widgets.
 * - Dimension + measure combos become chart widgets (bar or trend-line).
 */
export function createQuickDashboard(
  fields: QuickDashboardField[],
  options?: QuickDashboardOptions,
): EnhancedDashboardConfig {
  const name = options?.name ?? 'Quick Dashboard';
  const columns = options?.columns ?? 3;
  const id = dashboardId(`quick-${Date.now()}`);

  const config = createEnhancedDashboardConfig(id, name);
  config.layout.columns = columns;

  const dimensions = fields.filter(f => f.role === 'dimension');
  const measures = fields.filter(f => f.role === 'measure');

  let widgetIndex = 0;

  // If no dimensions, create a KPI widget for each measure
  if (dimensions.length === 0) {
    for (const measure of measures) {
      const wId = widgetId(`w-${widgetIndex++}`);
      const defaults = SMART_DEFAULTS['kpi-card']();
      const widget: EnhancedWidgetConfig = {
        ...defaults,
        id: wId,
        name: measure.field,
        appearance: {
          ...defaults.appearance,
          titleBar: { ...defaults.appearance.titleBar, title: measure.field },
        },
      };
      config.widgets.push(widget);
      config.placements.push({
        widgetId: wId,
        column: widgetIndex % columns,
        order: Math.floor(widgetIndex / columns),
        colSpan: 1,
      });
    }
    return config;
  }

  // For each dimension + measure combo, create a chart widget
  for (const dim of dimensions) {
    for (const measure of measures) {
      const wId = widgetId(`w-${widgetIndex++}`);
      const hasDate = isDateField(dim.field);
      const widgetType = hasDate ? 'trend-line' : 'bar-chart';
      const defaults = SMART_DEFAULTS[widgetType]();
      const aggregation = measure.aggregation ?? 'sum';

      const widget: EnhancedWidgetConfig = {
        ...defaults,
        id: wId,
        name: `${measure.field} by ${dim.field}`,
        data: {
          ...defaults.data,
          bindings: {
            type: 'chart',
            category: { fieldKey: dim.field, label: dim.field },
            values: [{ fieldKey: measure.field, aggregation, label: measure.field }],
          },
        },
        appearance: {
          ...defaults.appearance,
          titleBar: { ...defaults.appearance.titleBar, title: `${measure.field} by ${dim.field}` },
        },
      };

      config.widgets.push(widget);
      config.placements.push({
        widgetId: wId,
        column: widgetIndex % columns,
        order: Math.floor(widgetIndex / columns),
        colSpan: 1,
      });
    }
  }

  // Also create standalone KPI widgets for measures without a dimension pairing
  // (only when there are also dimensions — purely additive summary cards)
  if (dimensions.length > 0 && measures.length > 0) {
    for (const measure of measures) {
      const wId = widgetId(`w-${widgetIndex++}`);
      const defaults = SMART_DEFAULTS['kpi-card']();
      const widget: EnhancedWidgetConfig = {
        ...defaults,
        id: wId,
        name: `${measure.field} Total`,
        appearance: {
          ...defaults.appearance,
          titleBar: { ...defaults.appearance.titleBar, title: `${measure.field} Total` },
        },
      };
      config.widgets.push(widget);
      config.placements.push({
        widgetId: wId,
        column: widgetIndex % columns,
        order: Math.floor(widgetIndex / columns),
        colSpan: 1,
      });
    }
  }

  return config;
}
