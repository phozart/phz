/**
 * @phozart/workspace — DuckDB DataAdapter Utilities
 *
 * SQL generation helpers that map DataQuery/DataAdapter types to DuckDB SQL.
 * Uses parameterized queries throughout — never interpolates values.
 *
 * The actual DuckDB connection is injected at runtime via @phozart/duckdb
 * (optional peer dependency).
 */

import type {
  DataAdapter,
  DataQuery,
  DataResult,
  DataSourceSchema,
  DataSourceSummary,
  FieldMetadata,
  SemanticHint,
  AggregationSpec,
  WindowSpec,
} from '../data-adapter.js';

// ========================================================================
// Identifier sanitization (prevents SQL injection)
// ========================================================================

function sanitizeIdentifier(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '_');
}

function quoteId(name: string): string {
  return `"${sanitizeIdentifier(name)}"`;
}

// ========================================================================
// DuckDB type mapping
// ========================================================================

export function mapDuckDBTypeToDataType(duckType: string): FieldMetadata['dataType'] {
  const upper = duckType.toUpperCase();

  if (upper.startsWith('DECIMAL') || upper.startsWith('NUMERIC')) return 'number';

  switch (true) {
    case upper === 'VARCHAR' || upper === 'TEXT' || upper === 'CHAR' || upper.startsWith('CHAR('):
      return 'string';
    case upper === 'INTEGER' || upper === 'INT' || upper === 'BIGINT' || upper === 'SMALLINT' || upper === 'TINYINT':
    case upper === 'HUGEINT' || upper === 'UINTEGER' || upper === 'UBIGINT':
    case upper === 'DOUBLE' || upper === 'FLOAT' || upper === 'REAL':
      return 'number';
    case upper === 'BOOLEAN' || upper === 'BOOL':
      return 'boolean';
    case upper === 'DATE' || upper === 'TIMESTAMP' || upper === 'TIMESTAMPTZ':
    case upper === 'TIMESTAMP WITH TIME ZONE' || upper === 'TIMESTAMP_S' || upper === 'TIMESTAMP_MS' || upper === 'TIMESTAMP_NS':
      return 'date';
    default:
      return 'string';
  }
}

// ========================================================================
// Semantic hint inference
// ========================================================================

const ID_PATTERNS = /^(id|.*_id|.*_key|.*_pk)$/i;
const TIMESTAMP_PATTERNS = /^(.*_at|.*_date|.*_time|timestamp|created|updated|modified|deleted)$/i;
const PRICE_PATTERNS = /^(.*price|.*cost|.*amount|.*total|.*fee|.*charge)$/i;
const PERCENT_PATTERNS = /^(.*_pct|.*_rate|.*_ratio|.*percent|.*percentage)$/i;
const CATEGORY_PATTERNS = /^(status|type|kind|category|group|level|state|mode|role)$/i;

export function inferSemanticHint(
  fieldName: string,
  dataType: FieldMetadata['dataType'],
): SemanticHint | undefined {
  if (dataType === 'date') return 'timestamp';
  if (dataType === 'boolean') return undefined;

  const name = fieldName.toLowerCase();

  if (ID_PATTERNS.test(name)) return 'identifier';
  if (TIMESTAMP_PATTERNS.test(name)) return 'timestamp';

  if (dataType === 'number') {
    if (PRICE_PATTERNS.test(name)) return 'currency';
    if (PERCENT_PATTERNS.test(name)) return 'percentage';
    return 'measure';
  }

  if (dataType === 'string') {
    if (CATEGORY_PATTERNS.test(name)) return 'category';
    return 'dimension';
  }

  return undefined;
}

// ========================================================================
// Column schema -> FieldMetadata
// ========================================================================

export function mapColumnSchemaToFieldMetadata(col: {
  name: string;
  type: string;
  nullable: boolean;
}): FieldMetadata {
  const dataType = mapDuckDBTypeToDataType(col.type);
  return {
    name: col.name,
    dataType,
    nullable: col.nullable,
    semanticHint: inferSemanticHint(col.name, dataType),
  };
}

// ========================================================================
// Aggregation SQL
// ========================================================================

const AGG_FN_MAP: Record<string, (col: string) => string> = {
  sum: (col) => `SUM(${col})`,
  avg: (col) => `AVG(${col})`,
  count: (col) => `COUNT(${col})`,
  countDistinct: (col) => `COUNT(DISTINCT ${col})`,
  min: (col) => `MIN(${col})`,
  max: (col) => `MAX(${col})`,
  median: (col) => `MEDIAN(${col})`,
  stddev: (col) => `STDDEV(${col})`,
  variance: (col) => `VARIANCE(${col})`,
  first: (col) => `FIRST(${col})`,
  last: (col) => `LAST(${col})`,
};

export function buildAggregationSelectSQL(
  field: string,
  fn: string,
  alias?: string,
): string {
  const col = quoteId(field);
  const builder = AGG_FN_MAP[fn];
  const expr = builder ? builder(col) : `${fn.toUpperCase()}(${col})`;
  const as = quoteId(alias ?? `${field}_${fn}`);
  return `${expr} AS ${as}`;
}

// ========================================================================
// Window function SQL
// ========================================================================

export function buildWindowFunctionSQL(spec: WindowSpec): string {
  const col = quoteId(spec.field);

  let expr: string;
  switch (spec.function) {
    case 'runningTotal':
      expr = `SUM(${col})`;
      break;
    case 'rank':
      expr = 'RANK()';
      break;
    case 'denseRank':
      expr = 'DENSE_RANK()';
      break;
    case 'rowNumber':
      expr = 'ROW_NUMBER()';
      break;
    case 'lag':
      expr = `LAG(${col}, ${spec.offset ?? 1})`;
      break;
    case 'lead':
      expr = `LEAD(${col}, ${spec.offset ?? 1})`;
      break;
    case 'percentOfTotal':
      expr = `${col} * 1.0 / SUM(${col})`;
      break;
    case 'periodOverPeriod':
      expr = `LAG(${col}, 1)`;
      break;
    default:
      expr = col;
  }

  const partitionClause = spec.partitionBy?.length
    ? `PARTITION BY ${spec.partitionBy.map(quoteId).join(', ')}`
    : '';

  const orderClause = spec.orderBy?.length
    ? `ORDER BY ${spec.orderBy.map(quoteId).join(', ')}`
    : '';

  const overParts = [partitionClause, orderClause].filter(Boolean).join(' ');
  const over = `OVER (${overParts})`;

  return `${expr} ${over} AS ${quoteId(spec.alias)}`;
}

// ========================================================================
// Full query builder: DataQuery -> SQL
// ========================================================================

export interface SqlResult {
  sql: string;
  params: unknown[];
}

export function buildDataAdapterQuery(query: DataQuery): SqlResult {
  const table = quoteId(query.source);
  const params: unknown[] = [];

  // --- SELECT clause ---
  const selectParts: string[] = [];

  // Explicit fields
  if (query.fields.length > 0) {
    selectParts.push(...query.fields.map(quoteId));
  }

  // Aggregations
  if (query.aggregations?.length) {
    for (const agg of query.aggregations) {
      selectParts.push(buildAggregationSelectSQL(agg.field, agg.function, agg.alias));
    }
  }

  // Window functions
  if (query.windows?.length) {
    for (const win of query.windows) {
      selectParts.push(buildWindowFunctionSQL(win));
    }
  }

  const select = selectParts.length > 0 ? selectParts.join(', ') : '*';
  let sql = `SELECT ${select} FROM ${table}`;

  // --- WHERE clause (filters are opaque; skip if not array-of-objects) ---
  // Filters are typed as `unknown` in DataQuery, so we don't generate
  // WHERE clauses here. Consumers should use the DuckDB sql-builder's
  // buildWhereClause for filter-to-SQL conversion.

  // --- GROUP BY ---
  if (query.groupBy?.length) {
    sql += ` GROUP BY ${query.groupBy.map(quoteId).join(', ')}`;
  }

  // --- ORDER BY ---
  if (query.sort?.length) {
    const sortParts = query.sort.map(
      s => `${quoteId(s.field)} ${s.direction === 'desc' ? 'DESC' : 'ASC'}`,
    );
    sql += ` ORDER BY ${sortParts.join(', ')}`;
  }

  // --- LIMIT / OFFSET ---
  if (query.limit !== undefined) {
    sql += ' LIMIT ?';
    params.push(query.limit);
  }
  if (query.offset !== undefined) {
    sql += ' OFFSET ?';
    params.push(query.offset);
  }

  return { sql, params };
}
