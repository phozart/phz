/**
 * @phozart/phz-local — DuckDB Native Adapter (R.3)
 *
 * Implements DataAdapter wrapping native DuckDB Node.js bindings.
 * DuckDB is an optional dependency — this module gracefully handles
 * its absence. Tests mock the DuckDB interface.
 */

import type {
  DataAdapter,
  DataQuery,
  DataResult,
  DataSourceSchema,
  DataSourceSummary,
  FieldMetadata,
  ColumnDescriptor,
} from '@phozart/phz-workspace';

// --- DuckDB abstraction layer ---
// This interface mirrors the subset of duckdb's Database/Connection API we use.
// By abstracting it, we can mock it in tests without requiring the native binary.

export interface DuckDBBinding {
  run(sql: string, params?: unknown[]): Promise<void>;
  all(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]>;
}

// --- SQL builder (simplified, reuses patterns from workspace duckdb-data-adapter) ---

function quoteId(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

export function buildQuerySQL(query: DataQuery): { sql: string; params: unknown[] } {
  const table = quoteId(query.source);
  const params: unknown[] = [];

  // SELECT
  const selectFields = query.fields.map(quoteId).join(', ');
  let sql = `SELECT ${selectFields} FROM ${table}`;

  // WHERE (simplified — filters as field=value pairs)
  if (query.filters && typeof query.filters === 'object') {
    const filterEntries = Object.entries(query.filters as Record<string, unknown>);
    if (filterEntries.length > 0) {
      const clauses = filterEntries.map(([field]) => {
        params.push((query.filters as Record<string, unknown>)[field]);
        return `${quoteId(field)} = ?`;
      });
      sql += ` WHERE ${clauses.join(' AND ')}`;
    }
  }

  // GROUP BY
  if (query.groupBy?.length) {
    sql += ` GROUP BY ${query.groupBy.map(quoteId).join(', ')}`;
  }

  // ORDER BY
  if (query.sort?.length) {
    const sortClauses = query.sort.map(s => `${quoteId(s.field)} ${s.direction.toUpperCase()}`);
    sql += ` ORDER BY ${sortClauses.join(', ')}`;
  }

  // LIMIT / OFFSET
  if (query.limit !== undefined) {
    sql += ` LIMIT ${query.limit}`;
  }
  if (query.offset !== undefined) {
    sql += ` OFFSET ${query.offset}`;
  }

  return { sql, params };
}

function mapDuckDBType(duckType: string): FieldMetadata['dataType'] {
  const t = duckType.toUpperCase();
  if (t.includes('INT') || t.includes('FLOAT') || t.includes('DOUBLE') || t.includes('DECIMAL') || t.includes('NUMERIC')) return 'number';
  if (t.includes('DATE') || t.includes('TIME') || t.includes('TIMESTAMP')) return 'date';
  if (t.includes('BOOL')) return 'boolean';
  return 'string';
}

// --- DuckDB Native DataAdapter ---

export class DuckDBNativeAdapter implements DataAdapter {
  private db: DuckDBBinding;
  private dbPath: string;

  constructor(db: DuckDBBinding, dbPath: string) {
    this.db = db;
    this.dbPath = dbPath;
  }

  async execute(
    query: DataQuery,
    context?: { viewerContext?: unknown; signal?: AbortSignal },
  ): Promise<DataResult> {
    const start = Date.now();
    const { sql, params } = buildQuerySQL(query);
    const rows = await this.db.all(sql, params);

    const columns: ColumnDescriptor[] = rows.length > 0
      ? Object.keys(rows[0]).map(name => ({ name, dataType: typeof rows[0][name] === 'number' ? 'number' : 'string' }))
      : query.fields.map(name => ({ name, dataType: 'string' }));

    const dataRows = rows.map(row => columns.map(col => row[col.name]));

    return {
      columns,
      rows: dataRows,
      metadata: {
        totalRows: rows.length,
        truncated: false,
        queryTimeMs: Date.now() - start,
      },
    };
  }

  async getSchema(sourceId?: string): Promise<DataSourceSchema> {
    const tableName = sourceId ?? 'data';
    const rows = await this.db.all(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ?`,
      [tableName],
    );

    const fields: FieldMetadata[] = rows.map(row => ({
      name: row.column_name as string,
      dataType: mapDuckDBType(row.data_type as string),
      nullable: true,
    }));

    return {
      id: tableName,
      name: tableName,
      fields,
    };
  }

  async listDataSources(): Promise<DataSourceSummary[]> {
    const rows = await this.db.all(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'main'`,
    );

    const summaries: DataSourceSummary[] = [];
    for (const row of rows) {
      const name = row.table_name as string;
      const countResult = await this.db.all(`SELECT COUNT(*) as cnt FROM ${quoteId(name)}`);
      summaries.push({
        id: name,
        name,
        fieldCount: 0,
        rowCount: (countResult[0]?.cnt as number) ?? 0,
      });
    }

    return summaries;
  }

  async getDistinctValues(
    sourceId: string,
    field: string,
    options?: { search?: string; limit?: number; filters?: unknown },
  ): Promise<{ values: unknown[]; totalCount: number; truncated: boolean }> {
    const table = quoteId(sourceId);
    const col = quoteId(field);
    const limit = options?.limit ?? 100;

    let sql = `SELECT DISTINCT ${col} FROM ${table}`;
    const params: unknown[] = [];

    if (options?.search) {
      sql += ` WHERE CAST(${col} AS VARCHAR) ILIKE ?`;
      params.push(`%${options.search}%`);
    }

    sql += ` ORDER BY ${col} LIMIT ?`;
    params.push(limit + 1);

    const rows = await this.db.all(sql, params);
    const truncated = rows.length > limit;
    const values = rows.slice(0, limit).map(r => r[field]);

    // Get total distinct count
    const countSql = `SELECT COUNT(DISTINCT ${col}) as cnt FROM ${table}`;
    const countResult = await this.db.all(countSql);
    const totalCount = (countResult[0]?.cnt as number) ?? 0;

    return { values, totalCount, truncated };
  }

  async getFieldStats(
    sourceId: string,
    field: string,
    filters?: unknown,
  ): Promise<{
    min?: number;
    max?: number;
    distinctCount: number;
    nullCount: number;
    totalCount: number;
  }> {
    const table = quoteId(sourceId);
    const col = quoteId(field);

    const sql = `SELECT
      MIN(${col}) as min_val,
      MAX(${col}) as max_val,
      COUNT(DISTINCT ${col}) as distinct_count,
      SUM(CASE WHEN ${col} IS NULL THEN 1 ELSE 0 END) as null_count,
      COUNT(*) as total_count
    FROM ${table}`;

    const rows = await this.db.all(sql);
    const row = rows[0] ?? {};

    return {
      min: typeof row.min_val === 'number' ? row.min_val : undefined,
      max: typeof row.max_val === 'number' ? row.max_val : undefined,
      distinctCount: (row.distinct_count as number) ?? 0,
      nullCount: (row.null_count as number) ?? 0,
      totalCount: (row.total_count as number) ?? 0,
    };
  }

  async importFile(filePath: string, tableName: string): Promise<void> {
    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'csv':
        await this.db.run(`CREATE OR REPLACE TABLE ${quoteId(tableName)} AS SELECT * FROM read_csv_auto('${filePath}')`);
        break;
      case 'parquet':
        await this.db.run(`CREATE OR REPLACE TABLE ${quoteId(tableName)} AS SELECT * FROM read_parquet('${filePath}')`);
        break;
      case 'json':
        await this.db.run(`CREATE OR REPLACE TABLE ${quoteId(tableName)} AS SELECT * FROM read_json_auto('${filePath}')`);
        break;
      default:
        throw new Error(`Unsupported file format: ${ext}`);
    }
  }
}
