/**
 * @phozart/phz-duckdb — AI Query Executor
 *
 * Wires AI toolkit's NL→SQL output to DuckDB execution.
 * Validates SQL is read-only before execution.
 */
import type { ColumnDefinition } from '@phozart/phz-core';
import type { DuckDBDataSource } from './types.js';
export interface AIToolkitLike {
    executeNaturalLanguageQuery(query: string, options?: {
        schema?: ColumnDefinition[];
        dialect?: string;
    }): Promise<{
        sql: string;
        confidence: number;
        error?: string;
    }>;
}
export interface AIQueryExecutorConfig {
    tableName?: string;
}
export interface AIExecutionResult {
    sql: string;
    data?: unknown[];
    error?: string;
    executionTime?: number;
}
export interface AIQueryExecutor {
    executeNLQuery(query: string): Promise<AIExecutionResult>;
    getSchemaContext(): Promise<ColumnDefinition[]>;
}
export declare function createAIQueryExecutor(dataSource: DuckDBDataSource, aiToolkit: AIToolkitLike, config?: AIQueryExecutorConfig): AIQueryExecutor;
//# sourceMappingURL=ai-executor.d.ts.map