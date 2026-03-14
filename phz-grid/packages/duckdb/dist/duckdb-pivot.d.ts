/**
 * @phozart/duckdb — DuckDB Pivot
 *
 * Generates DuckDB-native PIVOT SQL from PivotConfig.
 * Supports multiple value fields (unlike the JS engine which uses only the first).
 * Supports date grouping and subtotals via ROLLUP.
 */
import type { PivotConfig } from '@phozart/core';
import { type SqlResult } from './sql-builder.js';
export type DateGranularity = 'year' | 'quarter' | 'month' | 'week' | 'day';
export interface PivotQueryOptions {
    dateGroupings?: Record<string, DateGranularity>;
}
export declare function buildPivotQuery(tableName: string, config: PivotConfig, options?: PivotQueryOptions): SqlResult;
//# sourceMappingURL=duckdb-pivot.d.ts.map