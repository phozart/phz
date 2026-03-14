/**
 * @phozart/duckdb — DuckDB Aggregation
 *
 * Generates SQL for aggregation queries, including DuckDB-specific
 * statistical functions not available in the JS engine.
 */

import { sanitizeIdentifier, type FilterInput, type SqlResult } from './sql-builder.js';
import type { FilterOperator } from '@phozart/core';

export type DuckDBAggregationFunction =
  | 'sum' | 'avg' | 'min' | 'max' | 'count'
  | 'first' | 'last'
  | 'median' | 'stddev' | 'variance'
  | 'percentile_cont' | 'approx_count_distinct';

export interface AggregationFieldInput {
  field: string;
  functions: DuckDBAggregationFunction[];
}

function aggFunctionToSQL(fn: DuckDBAggregationFunction, col: string): string {
  switch (fn) {
    case 'sum': return `SUM(${col})`;
    case 'avg': return `AVG(${col})`;
    case 'min': return `MIN(${col})`;
    case 'max': return `MAX(${col})`;
    case 'count': return `COUNT(${col})`;
    case 'first': return `FIRST(${col})`;
    case 'last': return `LAST(${col})`;
    case 'median': return `MEDIAN(${col})`;
    case 'stddev': return `STDDEV(${col})`;
    case 'variance': return `VARIANCE(${col})`;
    case 'percentile_cont': return `PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ${col})`;
    case 'approx_count_distinct': return `APPROX_COUNT_DISTINCT(${col})`;
    default: return `COUNT(${col})`;
  }
}

function buildFilterWhereClause(filters: FilterInput[]): { clause: string; params: unknown[] } {
  if (filters.length === 0) return { clause: '', params: [] };

  const parts: string[] = [];
  const params: unknown[] = [];

  for (const filter of filters) {
    const col = `"${sanitizeIdentifier(filter.field)}"`;
    switch (filter.operator) {
      case 'equals':
        parts.push(`${col} = ?`);
        params.push(filter.value);
        break;
      case 'notEquals':
        parts.push(`${col} != ?`);
        params.push(filter.value);
        break;
      case 'greaterThan':
        parts.push(`${col} > ?`);
        params.push(filter.value);
        break;
      case 'lessThan':
        parts.push(`${col} < ?`);
        params.push(filter.value);
        break;
      case 'isNull':
        parts.push(`${col} IS NULL`);
        break;
      case 'isNotNull':
        parts.push(`${col} IS NOT NULL`);
        break;
      default:
        parts.push(`${col} = ?`);
        params.push(filter.value);
    }
  }

  return { clause: `WHERE ${parts.join(' AND ')}`, params };
}

export function buildAggregationQuery(
  tableName: string,
  fields: AggregationFieldInput[],
  filters?: FilterInput[],
): SqlResult {
  const table = `"${sanitizeIdentifier(tableName)}"`;
  const selects: string[] = [];

  for (const field of fields) {
    const col = `"${sanitizeIdentifier(field.field)}"`;
    for (const fn of field.functions) {
      const alias = `"${sanitizeIdentifier(field.field)}_${sanitizeIdentifier(fn)}"`;
      selects.push(`${aggFunctionToSQL(fn, col)} AS ${alias}`);
    }
  }

  let sql = `SELECT ${selects.join(', ')} FROM ${table}`;
  const params: unknown[] = [];

  if (filters && filters.length > 0) {
    const where = buildFilterWhereClause(filters);
    sql += ` ${where.clause}`;
    params.push(...where.params);
  }

  return { sql, params };
}

export function buildGroupAggregationQuery(
  tableName: string,
  groupBy: string[],
  fields: AggregationFieldInput[],
  filters?: FilterInput[],
): SqlResult {
  const table = `"${sanitizeIdentifier(tableName)}"`;
  const groupCols = groupBy.map(f => `"${sanitizeIdentifier(f)}"`);

  const aggSelects: string[] = [];
  for (const field of fields) {
    const col = `"${sanitizeIdentifier(field.field)}"`;
    for (const fn of field.functions) {
      const alias = `"${sanitizeIdentifier(field.field)}_${sanitizeIdentifier(fn)}"`;
      aggSelects.push(`${aggFunctionToSQL(fn, col)} AS ${alias}`);
    }
  }

  const selectParts = [...groupCols, ...aggSelects];
  let sql = `SELECT ${selectParts.join(', ')} FROM ${table}`;
  const params: unknown[] = [];

  if (filters && filters.length > 0) {
    const where = buildFilterWhereClause(filters);
    sql += ` ${where.clause}`;
    params.push(...where.params);
  }

  sql += ` GROUP BY ${groupCols.join(', ')}`;

  return { sql, params };
}
