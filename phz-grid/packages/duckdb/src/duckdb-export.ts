/**
 * @phozart/duckdb — DuckDB Export
 *
 * Export DuckDB tables to Parquet, Arrow IPC, or CSV format.
 * Uses DuckDB's native COPY command for optimal performance.
 */

import type { DuckDBQueryExecutor } from './duckdb-compute-backend.js';
import { sanitizeIdentifier, type FilterInput, buildGridQuery } from './sql-builder.js';

export type ExportFormat = 'parquet' | 'arrow-ipc' | 'csv';
export type ExportCompression = 'zstd' | 'snappy' | 'gzip' | 'none';

export interface ExportOptions {
  format: ExportFormat;
  compression?: ExportCompression;  // parquet only, default 'zstd'
  rowGroupSize?: number;            // parquet only
}

/**
 * Export a DuckDB table to a Uint8Array in the specified format.
 *
 * Implementation: Uses DuckDB's COPY command to write to an in-memory
 * file, then reads the result as a Uint8Array.
 */
export async function exportTable(
  executor: DuckDBQueryExecutor,
  tableName: string,
  options: ExportOptions,
): Promise<Uint8Array> {
  const safeTable = sanitizeIdentifier(tableName);
  const fileName = `export_${Date.now()}.${formatExtension(options.format)}`;

  const copyOptions = buildCopyOptions(options);
  const copySql = `COPY "${safeTable}" TO '${fileName}' ${copyOptions}`;

  await executor.execute(copySql);

  // Read the file back (DuckDB WASM uses in-memory FS)
  const readSql = `SELECT content FROM read_blob('${fileName}')`;
  const rows = await executor.execute(readSql);
  const content = rows[0]?.content;

  // Clean up the file
  try {
    await executor.execute(`CALL remove_file('${fileName}')`);
  } catch {
    // Ignore cleanup errors
  }

  if (content instanceof Uint8Array) {
    return content;
  }

  // Fallback: return empty array if content extraction fails
  return new Uint8Array(0);
}

/**
 * Export with filters applied (avoids exporting the entire table).
 * Wraps the filtered query in a subquery for COPY.
 */
export async function exportFilteredTable(
  executor: DuckDBQueryExecutor,
  tableName: string,
  filters: FilterInput[],
  options: ExportOptions,
): Promise<Uint8Array> {
  const fileName = `export_filtered_${Date.now()}.${formatExtension(options.format)}`;

  // Build the filtered query
  const { sql: selectSql, params } = buildGridQuery({
    tableName,
    filters,
    sort: [],
    groupBy: [],
  });

  const copyOptions = buildCopyOptions(options);
  const copySql = `COPY (${selectSql}) TO '${fileName}' ${copyOptions}`;

  await executor.execute(copySql, params);

  // Read the file back
  const readSql = `SELECT content FROM read_blob('${fileName}')`;
  const rows = await executor.execute(readSql);
  const content = rows[0]?.content;

  // Clean up
  try {
    await executor.execute(`CALL remove_file('${fileName}')`);
  } catch {
    // Ignore cleanup errors
  }

  if (content instanceof Uint8Array) {
    return content;
  }

  return new Uint8Array(0);
}

/**
 * Build SQL for exporting via a SELECT query (no file I/O).
 * Returns the SQL that produces the data in the requested format.
 * Useful when the caller handles the output (e.g., streaming to client).
 */
export function buildExportQuery(
  tableName: string,
  options: ExportOptions,
  filters?: FilterInput[],
): string {
  const safeTable = sanitizeIdentifier(tableName);

  if (filters && filters.length > 0) {
    const { sql } = buildGridQuery({
      tableName,
      filters,
      sort: [],
      groupBy: [],
    });
    return `COPY (${sql}) TO '/dev/stdout' ${buildCopyOptions(options)}`;
  }

  return `COPY "${safeTable}" TO '/dev/stdout' ${buildCopyOptions(options)}`;
}

function buildCopyOptions(options: ExportOptions): string {
  const parts: string[] = [];

  switch (options.format) {
    case 'parquet':
      parts.push('(FORMAT PARQUET');
      if (options.compression && options.compression !== 'none') {
        parts.push(`, COMPRESSION '${options.compression.toUpperCase()}'`);
      }
      if (options.rowGroupSize) {
        parts.push(`, ROW_GROUP_SIZE ${options.rowGroupSize}`);
      }
      parts.push(')');
      break;

    case 'arrow-ipc':
      parts.push('(FORMAT ARROW)');
      break;

    case 'csv':
      parts.push('(FORMAT CSV, HEADER true)');
      break;
  }

  return parts.join('');
}

function formatExtension(format: ExportFormat): string {
  switch (format) {
    case 'parquet': return 'parquet';
    case 'arrow-ipc': return 'arrow';
    case 'csv': return 'csv';
  }
}
