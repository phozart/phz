/**
 * @phozart/phz-duckdb — DuckDB Aggregation
 *
 * Generates SQL for aggregation queries, including DuckDB-specific
 * statistical functions not available in the JS engine.
 */
import { type FilterInput, type SqlResult } from './sql-builder.js';
export type DuckDBAggregationFunction = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'first' | 'last' | 'median' | 'stddev' | 'variance' | 'percentile_cont' | 'approx_count_distinct';
export interface AggregationFieldInput {
    field: string;
    functions: DuckDBAggregationFunction[];
}
export declare function buildAggregationQuery(tableName: string, fields: AggregationFieldInput[], filters?: FilterInput[]): SqlResult;
export declare function buildGroupAggregationQuery(tableName: string, groupBy: string[], fields: AggregationFieldInput[], filters?: FilterInput[]): SqlResult;
//# sourceMappingURL=duckdb-aggregation.d.ts.map