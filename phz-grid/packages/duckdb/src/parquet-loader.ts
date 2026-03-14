/**
 * @phozart/duckdb — Parquet Loader
 *
 * Smart Parquet loading with projection pushdown, predicate pushdown,
 * and schema inspection.
 */

import { sanitizeIdentifier, type FilterInput, type SqlResult } from './sql-builder.js';
import type { FilterOperator } from '@phozart/core';

const ALLOWED_URL_SCHEMES = /^(https?:\/\/|\/|\.\/|\.\.\/)/i;

function validateUrl(url: string): void {
  if (!ALLOWED_URL_SCHEMES.test(url)) {
    throw new Error(
      `@phozart/duckdb: Unsupported URL scheme in '${url.slice(0, 50)}'. ` +
      `Only http://, https://, and relative paths are allowed.`
    );
  }
}

function sanitizeUrl(url: string): string {
  validateUrl(url);
  return url.replace(/'/g, "''");
}

function buildSimpleWhereClause(filters: FilterInput[]): { clause: string; params: unknown[] } {
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
      case 'greaterThanOrEqual':
        parts.push(`${col} >= ?`);
        params.push(filter.value);
        break;
      case 'lessThanOrEqual':
        parts.push(`${col} <= ?`);
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

export function buildProjectionQuery(url: string, columns?: string[]): string {
  const safeUrl = sanitizeUrl(url);
  const selectClause = columns && columns.length > 0
    ? columns.map(c => `"${sanitizeIdentifier(c)}"`).join(', ')
    : '*';
  return `SELECT ${selectClause} FROM read_parquet('${safeUrl}')`;
}

export function buildPredicatePushdownQuery(
  url: string,
  columns?: string[],
  filters?: FilterInput[],
): SqlResult {
  const safeUrl = sanitizeUrl(url);
  const selectClause = columns && columns.length > 0
    ? columns.map(c => `"${sanitizeIdentifier(c)}"`).join(', ')
    : '*';

  let sql = `SELECT ${selectClause} FROM read_parquet('${safeUrl}')`;
  const params: unknown[] = [];

  if (filters && filters.length > 0) {
    const where = buildSimpleWhereClause(filters);
    sql += ` ${where.clause}`;
    params.push(...where.params);
  }

  return { sql, params };
}

export function buildSchemaInspectionQuery(url: string): string {
  const safeUrl = sanitizeUrl(url);
  return `SELECT * FROM parquet_schema('${safeUrl}')`;
}
