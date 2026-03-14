/**
 * @phozart/duckdb — DuckDB Pivot
 *
 * Generates DuckDB-native PIVOT SQL from PivotConfig.
 * Supports multiple value fields (unlike the JS engine which uses only the first).
 * Supports date grouping and subtotals via ROLLUP.
 */

import type { PivotConfig } from '@phozart/core';
import { sanitizeIdentifier, type SqlResult } from './sql-builder.js';

export type DateGranularity = 'year' | 'quarter' | 'month' | 'week' | 'day';

export interface PivotQueryOptions {
  dateGroupings?: Record<string, DateGranularity>; // field → granularity
}

function aggFnToSQL(fn: string): string {
  return fn.toUpperCase();
}

/**
 * Generate a DuckDB SQL expression for date bucketing.
 * Duplicated from @phozart/engine to avoid circular dependency.
 */
function dateGroupingExpr(field: string, granularity: DateGranularity): string {
  const quoted = `"${field}"`;

  switch (granularity) {
    case 'year':
      return `CAST(EXTRACT(YEAR FROM ${quoted}) AS INTEGER)`;
    case 'quarter':
      return `'Q' || EXTRACT(QUARTER FROM ${quoted}) || ' ' || EXTRACT(YEAR FROM ${quoted})`;
    case 'month':
      return `STRFTIME(${quoted}, '%Y-%m')`;
    case 'week':
      return `STRFTIME(${quoted}, '%G-W%V')`;
    case 'day':
      return `CAST(${quoted} AS DATE)`;
  }
}

/**
 * Resolve a field to its SQL expression, applying date grouping if configured.
 */
function resolveFieldExpr(field: string, options?: PivotQueryOptions): string {
  const granularity = options?.dateGroupings?.[field];
  if (granularity) {
    return dateGroupingExpr(sanitizeIdentifier(field), granularity);
  }
  return `"${sanitizeIdentifier(field)}"`;
}

export function buildPivotQuery(
  tableName: string,
  config: PivotConfig,
  options?: PivotQueryOptions,
): SqlResult {
  if (
    config.valueFields.length === 0 ||
    config.columnFields.length === 0
  ) {
    return { sql: '', params: [] };
  }

  const table = `"${sanitizeIdentifier(tableName)}"`;

  // Build USING clause: SUM("revenue"), AVG("revenue")
  const usingParts = config.valueFields.map(vf =>
    `${aggFnToSQL(vf.aggregation)}("${sanitizeIdentifier(vf.field)}")`
  ).join(', ');

  // ON clause: the column field to pivot on (DuckDB PIVOT supports single ON field)
  const onExpr = resolveFieldExpr(config.columnFields[0], options);

  // GROUP BY clause: the row fields (with optional date grouping)
  const groupByParts = config.rowFields.map(f => resolveFieldExpr(f, options));

  let sql = `PIVOT ${table} ON ${onExpr} USING ${usingParts}`;

  if (groupByParts.length > 0) {
    if (config.showSubtotals) {
      sql += ` GROUP BY ROLLUP(${groupByParts.join(', ')})`;
    } else {
      sql += ` GROUP BY ${groupByParts.join(', ')}`;
    }
  }

  return { sql, params: [] };
}
