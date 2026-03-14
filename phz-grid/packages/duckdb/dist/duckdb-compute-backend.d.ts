/**
 * @phozart/duckdb — DuckDB ComputeBackend
 *
 * Implements ComputeBackend by generating SQL and delegating execution
 * to a DuckDB connection via the DuckDBQueryExecutor interface.
 */
import type { AggregationConfig, PivotConfig } from '@phozart/core';
import type { ComputeBackend, CalculatedFieldInput } from '@phozart/engine';
import type { AggregationResult } from '@phozart/engine';
import type { PivotResult } from '@phozart/engine';
import { type FilterInput } from './sql-builder.js';
export interface DuckDBQueryExecutor {
    execute(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]>;
    tableName: string;
}
export declare class DuckDBComputeBackend implements ComputeBackend {
    private executor;
    constructor(executor: DuckDBQueryExecutor);
    aggregate(_data: Record<string, unknown>[], config: AggregationConfig): Promise<AggregationResult>;
    pivot(_data: Record<string, unknown>[], config: PivotConfig): Promise<PivotResult>;
    filter(_data: Record<string, unknown>[], criteria: FilterInput[]): Promise<Record<string, unknown>[]>;
    computeCalculatedFields(_data: Record<string, unknown>[], fields: CalculatedFieldInput[]): Promise<Record<string, unknown>[]>;
}
export declare function createDuckDBComputeBackend(executor: DuckDBQueryExecutor): ComputeBackend;
/**
 * Validates and sanitizes a SQL expression for use in calculated fields.
 * Returns the trimmed expression if safe, throws if dangerous.
 */
export declare function sanitizeExpression(expr: string): string;
//# sourceMappingURL=duckdb-compute-backend.d.ts.map