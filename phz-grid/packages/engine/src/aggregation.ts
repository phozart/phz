/**
 * @phozart/engine — Aggregation Engine
 *
 * Compute aggregations over row data: sum, avg, min, max, count, first, last.
 */

import type { AggregationConfig, AggregationFunction } from '@phozart/core';
import type { RowGroup } from '@phozart/core';

export interface AggregationResult {
  fieldResults: Record<string, Record<string, unknown>>;
}

/**
 * Compute a single aggregation over a set of rows for a given field.
 */
export function computeAggregation(
  rows: Record<string, unknown>[],
  field: string,
  fn: AggregationFunction,
): unknown {
  if (rows.length === 0) return null;

  const values = rows
    .map(r => r[field])
    .filter(v => v !== null && v !== undefined);

  if (values.length === 0) return null;

  switch (fn) {
    case 'count':
      return values.length;

    case 'sum': {
      const nums = values.filter(v => typeof v === 'number') as number[];
      return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) : null;
    }

    case 'avg': {
      const nums = values.filter(v => typeof v === 'number') as number[];
      return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
    }

    case 'min': {
      const nums = values.filter(v => typeof v === 'number') as number[];
      if (nums.length === 0) return null;
      let min = nums[0];
      for (let i = 1; i < nums.length; i++) {
        if (nums[i] < min) min = nums[i];
      }
      return min;
    }

    case 'max': {
      const nums = values.filter(v => typeof v === 'number') as number[];
      if (nums.length === 0) return null;
      let max = nums[0];
      for (let i = 1; i < nums.length; i++) {
        if (nums[i] > max) max = nums[i];
      }
      return max;
    }

    case 'first':
      return values[0] ?? null;

    case 'last':
      return values[values.length - 1] ?? null;

    case 'countDistinct':
      return new Set(values).size;

    case 'median': {
      const nums = values.filter(v => typeof v === 'number') as number[];
      if (nums.length === 0) return null;
      const sorted = [...nums].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
    }

    case 'stddev': {
      const nums = values.filter(v => typeof v === 'number') as number[];
      if (nums.length === 0) return null;
      const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      const sumSqDiff = nums.reduce((acc, v) => acc + (v - mean) ** 2, 0);
      return Math.sqrt(sumSqDiff / nums.length);
    }

    case 'variance': {
      const nums = values.filter(v => typeof v === 'number') as number[];
      if (nums.length === 0) return null;
      const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      return nums.reduce((acc, v) => acc + (v - mean) ** 2, 0) / nums.length;
    }

    default:
      return null;
  }
}

/**
 * Compute aggregations for multiple fields and functions.
 */
export function computeAggregations(
  rows: Record<string, unknown>[],
  config: AggregationConfig,
): AggregationResult {
  const fieldResults: Record<string, Record<string, unknown>> = {};

  for (const fieldConfig of config.fields) {
    const results: Record<string, unknown> = {};
    for (const fn of fieldConfig.functions) {
      results[fn] = computeAggregation(rows, fieldConfig.field, fn);
    }
    fieldResults[fieldConfig.field] = results;
  }

  return { fieldResults };
}

/**
 * Compute aggregations for each group in a grouped row model.
 */
export function computeGroupAggregations(
  groups: RowGroup[],
  config: AggregationConfig,
): RowGroup[] {
  return groups.map(group => {
    const result = computeAggregations(group.rows as Record<string, unknown>[], config);
    const aggregations: Record<string, unknown> = {};

    for (const [field, fns] of Object.entries(result.fieldResults)) {
      for (const [fn, value] of Object.entries(fns)) {
        aggregations[`${field}_${fn}`] = value;
      }
    }

    return {
      ...group,
      aggregations,
      subGroups: group.subGroups
        ? computeGroupAggregations(group.subGroups, config)
        : undefined,
    };
  });
}
