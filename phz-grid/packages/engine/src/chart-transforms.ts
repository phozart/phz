/**
 * @phozart/engine — Chart Data Transform Pipeline
 *
 * Pure functions that transform raw data rows according to a sequence of
 * DataTransform operations. Composable pipeline: each transform receives
 * rows and returns rows.
 *
 * Tier 1 (shipped first): filter, sort, aggregate, timeUnit, stack.
 * Tier 2 (follow-up): bin, calculate, normalize.
 */

import type {
  DataTransform,
  FilterTransform,
  SortTransform,
  AggregateTransform,
  StackTransform,
  TimeUnitTransform,
  BinTransform,
  NormalizeTransform,
  CalculateTransform,
  EncodingAggregate,
} from './chart-spec.js';

type Row = Record<string, unknown>;

// ========================================================================
// Pipeline Entry Point
// ========================================================================

/**
 * Apply a sequence of transforms to data rows.
 * Each transform is applied in order, piping the output of one into the next.
 */
export function applyTransforms(rows: Row[], transforms: DataTransform[]): Row[] {
  let result = rows;
  for (const transform of transforms) {
    result = applySingleTransform(result, transform);
  }
  return result;
}

function applySingleTransform(rows: Row[], transform: DataTransform): Row[] {
  switch (transform.type) {
    case 'filter': return applyFilter(rows, transform);
    case 'sort': return applySort(rows, transform);
    case 'aggregate': return applyAggregate(rows, transform);
    case 'stack': return applyStack(rows, transform);
    case 'timeUnit': return applyTimeUnit(rows, transform);
    case 'bin': return applyBin(rows, transform);
    case 'normalize': return applyNormalize(rows, transform);
    case 'calculate': return applyCalculate(rows, transform);
    default: return rows;
  }
}

// ========================================================================
// Filter
// ========================================================================

export function applyFilter(rows: Row[], transform: FilterTransform): Row[] {
  return rows.filter(row => {
    const val = row[transform.field];
    const target = transform.value;

    switch (transform.operator) {
      case 'eq': return val === target;
      case 'neq': return val !== target;
      case 'gt': return (val as number) > (target as number);
      case 'gte': return (val as number) >= (target as number);
      case 'lt': return (val as number) < (target as number);
      case 'lte': return (val as number) <= (target as number);
      case 'in': return Array.isArray(target) && target.includes(val);
      case 'not_in': return Array.isArray(target) && !target.includes(val);
      default: return true;
    }
  });
}

// ========================================================================
// Sort
// ========================================================================

export function applySort(rows: Row[], transform: SortTransform): Row[] {
  const sorted = [...rows];
  sorted.sort((a, b) => {
    const aVal = a[transform.field];
    const bVal = b[transform.field];

    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    let cmp: number;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      cmp = aVal - bVal;
    } else {
      cmp = String(aVal).localeCompare(String(bVal));
    }

    return transform.order === 'desc' ? -cmp : cmp;
  });
  return sorted;
}

// ========================================================================
// Aggregate
// ========================================================================

function computeAggregate(values: unknown[], op: EncodingAggregate): number {
  // count and distinct operate on all values (not just numbers)
  if (op === 'count') return values.length;
  if (op === 'distinct') return new Set(values.map(v => String(v))).size;

  const nums = values.filter((v): v is number => typeof v === 'number');
  if (nums.length === 0) return 0;

  switch (op) {
    case 'sum': return nums.reduce((a, b) => a + b, 0);
    case 'mean': return nums.reduce((a, b) => a + b, 0) / nums.length;
    case 'min': return Math.min(...nums);
    case 'max': return Math.max(...nums);
    case 'median': {
      const sorted = [...nums].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    default:
      return 0;
  }
}

export function applyAggregate(rows: Row[], transform: AggregateTransform): Row[] {
  const groups = new Map<string, Row[]>();

  for (const row of rows) {
    const key = transform.groupBy.map(f => String(row[f] ?? '')).join('|');
    const group = groups.get(key);
    if (group) {
      group.push(row);
    } else {
      groups.set(key, [row]);
    }
  }

  const result: Row[] = [];
  for (const [, groupRows] of groups) {
    const out: Row = {};

    // Carry over group-by fields from the first row
    for (const field of transform.groupBy) {
      out[field] = groupRows[0][field];
    }

    // Compute each aggregate operation
    for (const agg of transform.ops) {
      const values = groupRows.map(r => r[agg.field]);
      out[agg.as] = computeAggregate(values, agg.op);
    }

    result.push(out);
  }

  return result;
}

// ========================================================================
// Stack
// ========================================================================

export function applyStack(rows: Row[], transform: StackTransform): Row[] {
  const groups = new Map<string, Row[]>();

  for (const row of rows) {
    const key = transform.groupBy.map(f => String(row[f] ?? '')).join('|');
    const group = groups.get(key);
    if (group) {
      group.push(row);
    } else {
      groups.set(key, [row]);
    }
  }

  const result: Row[] = [];
  for (const [, groupRows] of groups) {
    // Sort within group if specified
    if (transform.sort) {
      const { field, order } = transform.sort;
      groupRows.sort((a, b) => {
        const av = a[field] as number ?? 0;
        const bv = b[field] as number ?? 0;
        return order === 'desc' ? bv - av : av - bv;
      });
    }

    let cumulative = 0;
    for (const row of groupRows) {
      const value = (row[transform.field] as number) ?? 0;
      const stackedRow: Row = {
        ...row,
        [transform.as[0]]: cumulative,
        [transform.as[1]]: cumulative + value,
      };
      cumulative += value;
      result.push(stackedRow);
    }
  }

  return result;
}

// ========================================================================
// Time Unit
// ========================================================================

function truncateToTimeUnit(value: unknown, unit: string): string {
  let date: Date;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'number') {
    date = new Date(value);
  } else if (typeof value === 'string') {
    date = new Date(value);
  } else {
    return String(value);
  }

  if (isNaN(date.getTime())) return String(value);

  switch (unit) {
    case 'year': return String(date.getFullYear());
    case 'quarter': return `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
    case 'month': return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    case 'week': {
      // ISO week — truncate to Monday
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
      return d.toISOString().slice(0, 10);
    }
    case 'day': return date.toISOString().slice(0, 10);
    case 'hour': return `${date.toISOString().slice(0, 13)}:00`;
    case 'minute': return date.toISOString().slice(0, 16);
    case 'yearmonth': return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    case 'yearquarter': return `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
    case 'monthday': return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    default: return String(value);
  }
}

export function applyTimeUnit(rows: Row[], transform: TimeUnitTransform): Row[] {
  return rows.map(row => ({
    ...row,
    [transform.as]: truncateToTimeUnit(row[transform.field], transform.timeUnit),
  }));
}

// ========================================================================
// Bin (Tier 2)
// ========================================================================

export function applyBin(rows: Row[], transform: BinTransform): Row[] {
  const maxBins = transform.maxBins ?? 10;
  const values = rows.map(r => r[transform.field]).filter((v): v is number => typeof v === 'number');

  if (values.length === 0) {
    return rows.map(row => ({ ...row, [transform.as]: null }));
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const binWidth = (max - min) / maxBins || 1;

  return rows.map(row => {
    const val = row[transform.field];
    if (typeof val !== 'number') return { ...row, [transform.as]: null };
    const bin = Math.min(Math.floor((val - min) / binWidth), maxBins - 1);
    const binStart = min + bin * binWidth;
    const binEnd = binStart + binWidth;
    return {
      ...row,
      [transform.as]: `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`,
    };
  });
}

// ========================================================================
// Normalize (Tier 2)
// ========================================================================

export function applyNormalize(rows: Row[], transform: NormalizeTransform): Row[] {
  const groups = new Map<string, Row[]>();

  for (const row of rows) {
    const key = transform.groupBy.map(f => String(row[f] ?? '')).join('|');
    const group = groups.get(key);
    if (group) {
      group.push(row);
    } else {
      groups.set(key, [row]);
    }
  }

  const result: Row[] = [];
  for (const [, groupRows] of groups) {
    const total = groupRows.reduce((sum, row) => sum + ((row[transform.field] as number) ?? 0), 0);
    for (const row of groupRows) {
      const val = (row[transform.field] as number) ?? 0;
      result.push({
        ...row,
        [transform.as]: total > 0 ? val / total : 0,
      });
    }
  }

  return result;
}

// ========================================================================
// Calculate (Tier 2)
// ========================================================================

export function applyCalculate(rows: Row[], transform: CalculateTransform): Row[] {
  // Safe expression evaluator — only supports datum.field references and basic arithmetic
  return rows.map(row => {
    let result: unknown;
    try {
      const expr = transform.expr.replace(/datum\.(\w+)/g, (_, field) => {
        const val = row[field];
        return typeof val === 'number' ? String(val) : `"${String(val ?? '')}"`;
      });
      // Evaluate only if it looks like a safe arithmetic expression
      if (/^[\d\s+\-*/().,"]+$/.test(expr)) {
        result = Function(`"use strict"; return (${expr});`)();
      } else {
        result = null;
      }
    } catch {
      result = null;
    }
    return { ...row, [transform.as]: result };
  });
}
