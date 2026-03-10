/**
 * @phozart/phz-engine — Aggregation Engine
 *
 * Compute aggregations over row data: sum, avg, min, max, count, first, last.
 */
import type { AggregationConfig, AggregationFunction } from '@phozart/phz-core';
import type { RowGroup } from '@phozart/phz-core';
export interface AggregationResult {
    fieldResults: Record<string, Record<string, unknown>>;
}
/**
 * Compute a single aggregation over a set of rows for a given field.
 */
export declare function computeAggregation(rows: Record<string, unknown>[], field: string, fn: AggregationFunction): unknown;
/**
 * Compute aggregations for multiple fields and functions.
 */
export declare function computeAggregations(rows: Record<string, unknown>[], config: AggregationConfig): AggregationResult;
/**
 * Compute aggregations for each group in a grouped row model.
 */
export declare function computeGroupAggregations(groups: RowGroup[], config: AggregationConfig): RowGroup[];
//# sourceMappingURL=aggregation.d.ts.map