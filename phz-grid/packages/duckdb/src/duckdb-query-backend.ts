/**
 * DuckDB QueryBackend — executes queries against DuckDB-WASM tables.
 *
 * Delegates SQL generation and execution to a provided executeSQL function.
 * Consumers must provide a pre-initialized query executor with data loaded.
 */

import type {
  QueryBackend,
  LocalQuery,
  LocalQueryResult,
  QueryBackendCapabilities,
} from '@phozart/phz-core';
import { sanitizeIdentifier } from './sql-builder.js';

export interface DuckDBQueryBackendOptions {
  tableName: string;
  /**
   * Query executor — accepts a SQL string and returns rows.
   * This is typically DuckDBDataSource.query() or a direct connection.
   */
  executeSQL: (sql: string) => Promise<Record<string, unknown>[]>;
}

function quoteId(name: string): string {
  return `"${sanitizeIdentifier(name)}"`;
}

function mapOperator(op: string): string {
  switch (op) {
    case 'equals': return '=';
    case 'notEquals': return '!=';
    case 'greaterThan': return '>';
    case 'greaterThanOrEqual': return '>=';
    case 'lessThan': return '<';
    case 'lessThanOrEqual': return '<=';
    case 'contains': return 'LIKE';
    default: return '=';
  }
}

function buildWhereClause(filters: LocalQuery['filters']): string {
  if (filters.length === 0) return '';
  const conditions = filters.map(f => {
    const field = quoteId(f.field);
    const op = mapOperator(f.operator);
    if (f.value === null || f.value === undefined) {
      return f.operator === 'equals' ? `${field} IS NULL` : `${field} IS NOT NULL`;
    }
    if (typeof f.value === 'string') {
      const escaped = String(f.value).replace(/'/g, "''");
      if (f.operator === 'contains') return `${field} LIKE '%${escaped}%'`;
      if (f.operator === 'startsWith') return `${field} LIKE '${escaped}%'`;
      if (f.operator === 'endsWith') return `${field} LIKE '%${escaped}'`;
      return `${field} ${op} '${escaped}'`;
    }
    return `${field} ${op} ${f.value}`;
  });
  return ` WHERE ${conditions.join(' AND ')}`;
}

function buildOrderByClause(sort: LocalQuery['sort']): string {
  if (sort.length === 0) return '';
  const clauses = sort.map(s =>
    `${quoteId(s.field)} ${s.direction.toUpperCase()}`
  );
  return ` ORDER BY ${clauses.join(', ')}`;
}

function buildLimitClause(query: LocalQuery): string {
  let clause = '';
  if (query.limit !== undefined) clause += ` LIMIT ${query.limit}`;
  if (query.offset !== undefined) clause += ` OFFSET ${query.offset}`;
  return clause;
}

export function createDuckDBQueryBackend(options: DuckDBQueryBackendOptions): QueryBackend {
  const { tableName, executeSQL } = options;
  const safeTable = quoteId(tableName);

  const capabilities: QueryBackendCapabilities = {
    filter: true,
    sort: true,
    group: true,
    aggregate: true,
    pagination: true,
  };

  return {
    async execute(query: LocalQuery): Promise<LocalQueryResult> {
      const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

      const fields = query.fields && query.fields.length > 0
        ? query.fields.map(f => quoteId(f)).join(', ')
        : '*';

      const where = buildWhereClause(query.filters);
      const orderBy = buildOrderByClause(query.sort);
      const limit = buildLimitClause(query);

      const countSQL = `SELECT COUNT(*) as cnt FROM ${safeTable}`;
      const filteredCountSQL = `SELECT COUNT(*) as cnt FROM ${safeTable}${where}`;
      const dataSQL = `SELECT ${fields} FROM ${safeTable}${where}${orderBy}${limit}`;

      const [countResult, filteredResult, rows] = await Promise.all([
        executeSQL(countSQL),
        executeSQL(filteredCountSQL),
        executeSQL(dataSQL),
      ]);

      const totalCount = Number(countResult[0]?.cnt ?? 0);
      const filteredCount = Number(filteredResult[0]?.cnt ?? 0);

      const elapsed = typeof performance !== 'undefined'
        ? performance.now() - startTime
        : Date.now() - startTime;

      return {
        rows,
        totalCount,
        filteredCount,
        executionEngine: 'duckdb-wasm',
        executionTimeMs: Math.round(elapsed * 100) / 100,
      };
    },

    getCapabilities(): QueryBackendCapabilities {
      return { ...capabilities };
    },
  };
}
