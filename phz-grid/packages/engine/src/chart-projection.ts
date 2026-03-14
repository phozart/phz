/**
 * @phozart/engine — Chart Data Projection
 *
 * Projects row data into chart-ready data series.
 */

import type { ChartConfig } from '@phozart/core';
import { computeAggregation } from './aggregation.js';

export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
}

export interface ChartDataSeries {
  field: string;
  label: string;
  data: ChartDataPoint[];
}

export interface PieSlice {
  category: string;
  value: number;
  percentage: number;
}

/**
 * Project rows into chart data series based on config.
 * One series per config.options.series entry.
 */
export function projectChartData(
  rows: Record<string, unknown>[],
  config: ChartConfig,
): ChartDataSeries[] {
  if (rows.length === 0) return [];

  const xField = config.options.xAxis?.field;
  if (!xField) return [];

  return config.options.series.map(s => ({
    field: s.field,
    label: s.label ?? s.field,
    data: rows.map(row => ({
      x: row[xField] as string | number,
      y: (row[s.field] as number) ?? 0,
    })),
  }));
}

/**
 * Project rows grouped by a dimension, aggregating a value field.
 * Useful for bar charts by category.
 */
export function projectAggregatedChartData(
  rows: Record<string, unknown>[],
  config: ChartConfig,
  groupField: string,
): ChartDataSeries[] {
  if (rows.length === 0 || config.options.series.length === 0) return [];

  // Group rows by groupField
  const groups = new Map<string, Record<string, unknown>[]>();
  for (const row of rows) {
    const key = String(row[groupField] ?? '');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const sortedKeys = Array.from(groups.keys()).sort();

  return config.options.series.map(s => ({
    field: s.field,
    label: s.label ?? s.field,
    data: sortedKeys.map(key => ({
      x: key,
      y: (computeAggregation(groups.get(key)!, s.field, 'sum') as number) ?? 0,
      label: key,
    })),
  }));
}

/**
 * Project rows into pie chart slices.
 */
export function projectPieData(
  rows: Record<string, unknown>[],
  categoryField: string,
  valueField: string,
  aggregation: 'sum' | 'count' = 'sum',
): PieSlice[] {
  if (rows.length === 0) return [];

  // Group by category
  const groups = new Map<string, Record<string, unknown>[]>();
  for (const row of rows) {
    const key = String(row[categoryField] ?? 'Other');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const slices: PieSlice[] = [];
  let total = 0;

  for (const [category, groupRows] of groups) {
    const value = (computeAggregation(groupRows, valueField, aggregation) as number) ?? 0;
    slices.push({ category, value, percentage: 0 });
    total += value;
  }

  // Calculate percentages
  if (total > 0) {
    for (const slice of slices) {
      slice.percentage = (slice.value / total) * 100;
    }
  }

  return slices.sort((a, b) => b.value - a.value);
}
