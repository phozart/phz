/**
 * @phozart/core — DataSet Utilities
 *
 * Conversion and factory functions for the DataSet container.
 */
import type { ColumnDefinition } from './types/column.js';
import type { DataSet, DataSetColumn, DataSetMeta } from './types/dataset.js';
/**
 * Convert DataSetColumn[] to ColumnDefinition[] for the grid.
 *
 * - `label` maps to `header`
 * - `datetime` / `enum` are normalized to core types
 * - `sortable` defaults to `true`
 * - Only includes columns where `visible !== false`
 */
export declare function toColumnDefinitions(columns: DataSetColumn[]): ColumnDefinition[];
/**
 * Convenience factory for creating a DataSet with type safety.
 */
export declare function createDataSet<T = Record<string, unknown>>(columns: DataSetColumn[], rows: T[], meta?: DataSetMeta): DataSet<T>;
/**
 * Infer DataSetColumn[] from sample rows.
 *
 * Scans the first few rows to detect types:
 * - `boolean` if all non-null values are boolean
 * - `number` if all non-null values are numeric
 * - `date` if value is a Date instance or ISO-format string
 * - `string` otherwise
 */
export declare function inferDataSetColumns(rows: Record<string, unknown>[]): DataSetColumn[];
//# sourceMappingURL=dataset.d.ts.map