/**
 * @phozart/phz-duckdb — DuckDB Pivot
 *
 * Generates DuckDB-native PIVOT SQL from PivotConfig.
 * Supports multiple value fields (unlike the JS engine which uses only the first).
 */
import type { PivotConfig } from '@phozart/phz-core';
import { type SqlResult } from './sql-builder.js';
export declare function buildPivotQuery(tableName: string, config: PivotConfig): SqlResult;
//# sourceMappingURL=duckdb-pivot.d.ts.map