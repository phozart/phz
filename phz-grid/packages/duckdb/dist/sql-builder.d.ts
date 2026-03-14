/**
 * @phozart/duckdb — SQL Builder
 *
 * Generates parameterized SQL from grid state (filters, sort, grouping, viewport).
 * Never interpolates values — all user data goes through params array.
 */
import type { FilterOperator, SortDirection } from '@phozart/core';
export interface FilterInput {
    field: string;
    operator: FilterOperator;
    value: unknown;
}
export interface SortInput {
    field: string;
    direction: SortDirection;
}
export interface ViewportInput {
    offset: number;
    limit: number;
}
export type AggregationFunction = 'sum' | 'avg' | 'min' | 'max' | 'count';
export interface AggregateColumn {
    field: string;
    function: AggregationFunction;
}
export interface HavingInput {
    field: string;
    operator: FilterOperator;
    value: unknown;
    aggregation: AggregationFunction;
}
export interface GridQueryInput {
    tableName: string;
    filters: FilterInput[];
    sort: SortInput[];
    groupBy: string[];
    viewport?: ViewportInput;
    aggregates?: AggregateColumn[];
    having?: HavingInput[];
}
export interface SqlResult {
    sql: string;
    params: unknown[];
}
export declare function sanitizeIdentifier(name: string): string;
export declare function buildGridQuery(input: GridQueryInput): SqlResult;
export declare function buildCountQuery(input: {
    tableName: string;
    filters: FilterInput[];
    groupBy?: string[];
}): SqlResult;
//# sourceMappingURL=sql-builder.d.ts.map