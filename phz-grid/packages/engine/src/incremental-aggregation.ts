/**
 * @phozart/engine — Incremental Aggregation Engine
 *
 * Maintains running state for each aggregation function, allowing O(1) updates
 * on row insert/delete/update instead of full rescan.
 *
 * Uses Welford's online algorithm for variance/stddev.
 * Uses exact sorted array for median.
 * Uses reference-counted Map for countDistinct.
 */

import type { AggregationConfig, AggregationFunction } from '@phozart/core';
import type { AggregationResult } from './aggregation.js';

/** Running state for a single field + function combination */
interface AccumulatorState {
  fn: AggregationFunction;
  count: number;
  sum: number;
  min: number;
  max: number;
  // Welford's online algorithm for variance/stddev
  mean: number;
  m2: number;
  // For countDistinct
  distinctSet: Map<unknown, number>; // value -> count
  // For first/last tracking
  first: unknown;
  last: unknown;
  // For median (keeps all values — exact)
  values: number[];
}

export interface IncrementalAggregator {
  /** Initialize with a full dataset and aggregation config */
  initialize(rows: Record<string, unknown>[], config: AggregationConfig): void;
  /** Incrementally add a row */
  addRow(row: Record<string, unknown>): void;
  /** Incrementally remove a row */
  removeRow(row: Record<string, unknown>): void;
  /** Incrementally update a row (remove old, add new) */
  updateRow(oldRow: Record<string, unknown>, newRow: Record<string, unknown>): void;
  /** Get current aggregation result */
  getResult(): AggregationResult;
  /** Get current row count */
  getRowCount(): number;
}

function createAccumulator(fn: AggregationFunction): AccumulatorState {
  return {
    fn,
    count: 0,
    sum: 0,
    min: Infinity,
    max: -Infinity,
    mean: 0,
    m2: 0,
    distinctSet: new Map(),
    first: undefined,
    last: undefined,
    values: [],
  };
}

function isNumeric(v: unknown): v is number {
  return typeof v === 'number' && !Number.isNaN(v);
}

function addToAccumulator(acc: AccumulatorState, value: unknown): void {
  if (value === null || value === undefined) return;

  switch (acc.fn) {
    case 'count':
      acc.count++;
      break;

    case 'sum':
      if (isNumeric(value)) {
        acc.count++;
        acc.sum += value;
      }
      break;

    case 'avg':
      if (isNumeric(value)) {
        acc.count++;
        acc.sum += value;
      }
      break;

    case 'min':
      if (isNumeric(value)) {
        acc.count++;
        acc.values.push(value);
        if (value < acc.min) acc.min = value;
      }
      break;

    case 'max':
      if (isNumeric(value)) {
        acc.count++;
        acc.values.push(value);
        if (value > acc.max) acc.max = value;
      }
      break;

    case 'countDistinct': {
      acc.count++;
      const refCount = acc.distinctSet.get(value) ?? 0;
      acc.distinctSet.set(value, refCount + 1);
      break;
    }

    case 'variance':
    case 'stddev':
      if (isNumeric(value)) {
        acc.count++;
        // Welford's online algorithm
        const delta = value - acc.mean;
        acc.mean += delta / acc.count;
        const delta2 = value - acc.mean;
        acc.m2 += delta * delta2;
      }
      break;

    case 'median':
      if (isNumeric(value)) {
        acc.count++;
        // Insert into sorted position using binary search
        const idx = binarySearchInsert(acc.values, value);
        acc.values.splice(idx, 0, value);
      }
      break;

    case 'first':
      acc.count++;
      if (acc.count === 1) {
        acc.first = value;
      }
      acc.last = value; // Track last for ordering
      break;

    case 'last':
      acc.count++;
      acc.last = value;
      if (acc.count === 1) {
        acc.first = value;
      }
      break;
  }
}

function removeFromAccumulator(acc: AccumulatorState, value: unknown): void {
  if (value === null || value === undefined) return;

  switch (acc.fn) {
    case 'count':
      acc.count = Math.max(0, acc.count - 1);
      break;

    case 'sum':
      if (isNumeric(value)) {
        acc.count = Math.max(0, acc.count - 1);
        acc.sum -= value;
      }
      break;

    case 'avg':
      if (isNumeric(value)) {
        acc.count = Math.max(0, acc.count - 1);
        acc.sum -= value;
      }
      break;

    case 'min':
      if (isNumeric(value)) {
        // Remove from values array
        const minIdx = acc.values.indexOf(value);
        if (minIdx !== -1) {
          acc.values.splice(minIdx, 1);
          acc.count = Math.max(0, acc.count - 1);
        }
        // Rescan if we removed the current min
        if (value === acc.min) {
          if (acc.values.length === 0) {
            acc.min = Infinity;
          } else {
            acc.min = acc.values[0];
            for (let i = 1; i < acc.values.length; i++) {
              if (acc.values[i] < acc.min) acc.min = acc.values[i];
            }
          }
        }
      }
      break;

    case 'max':
      if (isNumeric(value)) {
        // Remove from values array
        const maxIdx = acc.values.indexOf(value);
        if (maxIdx !== -1) {
          acc.values.splice(maxIdx, 1);
          acc.count = Math.max(0, acc.count - 1);
        }
        // Rescan if we removed the current max
        if (value === acc.max) {
          if (acc.values.length === 0) {
            acc.max = -Infinity;
          } else {
            acc.max = acc.values[0];
            for (let i = 1; i < acc.values.length; i++) {
              if (acc.values[i] > acc.max) acc.max = acc.values[i];
            }
          }
        }
      }
      break;

    case 'countDistinct': {
      acc.count = Math.max(0, acc.count - 1);
      const refCount = acc.distinctSet.get(value) ?? 0;
      if (refCount <= 1) {
        acc.distinctSet.delete(value);
      } else {
        acc.distinctSet.set(value, refCount - 1);
      }
      break;
    }

    case 'variance':
    case 'stddev':
      if (isNumeric(value)) {
        if (acc.count <= 1) {
          // Reset when removing the last element
          acc.count = 0;
          acc.mean = 0;
          acc.m2 = 0;
        } else {
          // Reverse Welford
          const oldCount = acc.count;
          acc.count--;
          const delta = value - acc.mean;
          acc.mean = (acc.mean * oldCount - value) / acc.count;
          const delta2 = value - acc.mean;
          acc.m2 -= delta * delta2;
          // Guard against floating-point drift making m2 negative
          if (acc.m2 < 0) acc.m2 = 0;
        }
      }
      break;

    case 'median':
      if (isNumeric(value)) {
        // Binary search for the value in the sorted array
        const medIdx = binarySearch(acc.values, value);
        if (medIdx !== -1) {
          acc.values.splice(medIdx, 1);
          acc.count = Math.max(0, acc.count - 1);
        }
      }
      break;

    case 'first':
      acc.count = Math.max(0, acc.count - 1);
      // If the removed value was first, we'd need to rescan — but we don't have
      // the original row order. In practice, first/last are best used with initialize only.
      // For correctness: mark as needing rescan (handled by the aggregator's allRows tracking).
      break;

    case 'last':
      acc.count = Math.max(0, acc.count - 1);
      break;
  }
}

function getAccumulatorResult(acc: AccumulatorState): unknown {
  switch (acc.fn) {
    case 'count':
      return acc.count;

    case 'sum':
      return acc.count > 0 ? acc.sum : null;

    case 'avg':
      return acc.count > 0 ? acc.sum / acc.count : null;

    case 'min':
      return acc.count > 0 ? acc.min : null;

    case 'max':
      return acc.count > 0 ? acc.max : null;

    case 'countDistinct':
      return acc.distinctSet.size;

    case 'variance':
      if (acc.count < 2) return acc.count === 1 ? 0 : null;
      return acc.m2 / (acc.count - 1); // sample variance

    case 'stddev':
      if (acc.count < 2) return acc.count === 1 ? 0 : null;
      return Math.sqrt(acc.m2 / (acc.count - 1)); // sample stddev

    case 'median': {
      if (acc.values.length === 0) return null;
      const mid = Math.floor(acc.values.length / 2);
      return acc.values.length % 2 === 0
        ? (acc.values[mid - 1] + acc.values[mid]) / 2
        : acc.values[mid];
    }

    case 'first':
      return acc.count > 0 ? (acc.first ?? null) : null;

    case 'last':
      return acc.count > 0 ? (acc.last ?? null) : null;

    default:
      return null;
  }
}

/** Binary search for insertion index in a sorted array */
function binarySearchInsert(arr: number[], value: number): number {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid] < value) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}

/** Binary search for an exact value in a sorted array, returns index or -1 */
function binarySearch(arr: number[], value: number): number {
  let lo = 0;
  let hi = arr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid] === value) return mid;
    if (arr[mid] < value) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return -1;
}

export function createIncrementalAggregator(): IncrementalAggregator {
  // field -> fn -> AccumulatorState
  let accumulators: Map<string, Map<string, AccumulatorState>> = new Map();
  // Track all rows for first/last rescan
  let allRows: Record<string, unknown>[] = [];
  let config: AggregationConfig | null = null;
  let totalRowCount = 0;

  function needsFirstLast(field: string): boolean {
    const fieldAccs = accumulators.get(field);
    if (!fieldAccs) return false;
    return fieldAccs.has('first') || fieldAccs.has('last');
  }

  function rescanFirstLast(field: string): void {
    const fieldAccs = accumulators.get(field);
    if (!fieldAccs) return;

    const firstAcc = fieldAccs.get('first');
    const lastAcc = fieldAccs.get('last');

    if (firstAcc) {
      firstAcc.first = undefined;
      firstAcc.last = undefined;
      firstAcc.count = 0;
    }
    if (lastAcc) {
      lastAcc.first = undefined;
      lastAcc.last = undefined;
      lastAcc.count = 0;
    }

    for (const row of allRows) {
      const val = row[field];
      if (val !== null && val !== undefined) {
        if (firstAcc) {
          firstAcc.count++;
          if (firstAcc.first === undefined) firstAcc.first = val;
          firstAcc.last = val;
        }
        if (lastAcc) {
          lastAcc.count++;
          if (lastAcc.first === undefined) lastAcc.first = val;
          lastAcc.last = val;
        }
      }
    }
  }

  return {
    initialize(rows: Record<string, unknown>[], cfg: AggregationConfig): void {
      config = cfg;
      accumulators = new Map();
      allRows = [...rows];
      totalRowCount = rows.length;

      // Create accumulators for each field/function combo
      for (const fieldConfig of cfg.fields) {
        const fieldAccs = new Map<string, AccumulatorState>();
        for (const fn of fieldConfig.functions) {
          fieldAccs.set(fn, createAccumulator(fn));
        }
        accumulators.set(fieldConfig.field, fieldAccs);
      }

      // Process all rows
      for (const row of rows) {
        for (const fieldConfig of cfg.fields) {
          const value = row[fieldConfig.field];
          const fieldAccs = accumulators.get(fieldConfig.field)!;
          for (const fn of fieldConfig.functions) {
            addToAccumulator(fieldAccs.get(fn)!, value);
          }
        }
      }
    },

    addRow(row: Record<string, unknown>): void {
      if (!config) return;
      allRows.push(row);
      totalRowCount++;

      for (const fieldConfig of config.fields) {
        const value = row[fieldConfig.field];
        const fieldAccs = accumulators.get(fieldConfig.field);
        if (!fieldAccs) continue;
        for (const fn of fieldConfig.functions) {
          addToAccumulator(fieldAccs.get(fn)!, value);
        }
      }
    },

    removeRow(row: Record<string, unknown>): void {
      if (!config) return;

      // Remove from allRows tracking
      const idx = allRows.indexOf(row);
      if (idx !== -1) {
        allRows.splice(idx, 1);
      } else {
        // If exact reference not found, remove first matching row
        const matchIdx = allRows.findIndex(r => {
          for (const fieldConfig of config!.fields) {
            if (r[fieldConfig.field] !== row[fieldConfig.field]) return false;
          }
          return true;
        });
        if (matchIdx !== -1) allRows.splice(matchIdx, 1);
      }
      totalRowCount = Math.max(0, totalRowCount - 1);

      const fieldsNeedingRescan = new Set<string>();

      for (const fieldConfig of config.fields) {
        const value = row[fieldConfig.field];
        const fieldAccs = accumulators.get(fieldConfig.field);
        if (!fieldAccs) continue;
        for (const fn of fieldConfig.functions) {
          if (fn === 'first' || fn === 'last') {
            fieldsNeedingRescan.add(fieldConfig.field);
          } else {
            removeFromAccumulator(fieldAccs.get(fn)!, value);
          }
        }
      }

      // Rescan first/last for affected fields
      for (const field of fieldsNeedingRescan) {
        rescanFirstLast(field);
      }
    },

    updateRow(oldRow: Record<string, unknown>, newRow: Record<string, unknown>): void {
      this.removeRow(oldRow);
      this.addRow(newRow);
    },

    getResult(): AggregationResult {
      const fieldResults: Record<string, Record<string, unknown>> = {};

      for (const [field, fieldAccs] of accumulators) {
        const results: Record<string, unknown> = {};
        for (const [fn, acc] of fieldAccs) {
          results[fn] = getAccumulatorResult(acc);
        }
        fieldResults[field] = results;
      }

      return { fieldResults };
    },

    getRowCount(): number {
      return totalRowCount;
    },
  };
}
