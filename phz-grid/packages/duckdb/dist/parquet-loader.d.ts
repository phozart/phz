/**
 * @phozart/duckdb — Parquet Loader
 *
 * Smart Parquet loading with projection pushdown, predicate pushdown,
 * and schema inspection.
 */
import { type FilterInput, type SqlResult } from './sql-builder.js';
export declare function buildProjectionQuery(url: string, columns?: string[]): string;
export declare function buildPredicatePushdownQuery(url: string, columns?: string[], filters?: FilterInput[]): SqlResult;
export declare function buildSchemaInspectionQuery(url: string): string;
//# sourceMappingURL=parquet-loader.d.ts.map