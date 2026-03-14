/**
 * filter-query-bridge — Converts FilterValue[] (UI layer) to DataQueryFilter[]
 * (data layer) for injection into DataAdapter.execute() queries.
 *
 * This is the critical missing bridge between FilterContextManager and the
 * data pipeline. It handles:
 * - Direct operator mapping (equals → equals, etc.)
 * - Temporal operator resolution (lastN → between with computed date range)
 * - before/after → lessThan/greaterThan mapping
 * - Null-value skipping (except isNull/isNotNull)
 * - Query filter injection (merge with existing filters)
 *
 * Tasks: 2.1 (WB-006, WB-026)
 */
import type { FilterValue, FilterOperator } from '@phozart/shared';
import type { DataQuery } from '../data-adapter.js';
/** Filter format compatible with DataQuery.filters (serializable). */
export interface DataQueryFilter {
    field: string;
    operator: DataQueryFilterOperator;
    value: unknown;
}
export type DataQueryFilterOperator = 'equals' | 'notEquals' | 'contains' | 'notContains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'greaterThanOrEqual' | 'lessThan' | 'lessThanOrEqual' | 'between' | 'notBetween' | 'in' | 'notIn' | 'isNull' | 'isNotNull';
/**
 * Map a FilterOperator to a DataQueryFilterOperator.
 * Returns undefined for temporal operators that need special resolution.
 */
export declare function mapFilterOperator(op: FilterOperator): DataQueryFilterOperator | undefined;
interface TemporalConfig {
    n?: number;
    unit?: 'days' | 'weeks' | 'months' | 'years' | 'hours' | 'minutes' | 'day' | 'week' | 'month' | 'year' | 'quarter';
}
/**
 * Resolve temporal filter operators into concrete date-range between filters.
 * Returns undefined if the operator is not a temporal type.
 */
export declare function resolveTemporalFilter(field: string, operator: string, config: TemporalConfig, now?: Date): DataQueryFilter | undefined;
/**
 * Convert FilterValue[] (from FilterContextManager) to DataQueryFilter[]
 * (for DataAdapter.execute()). Handles:
 * - Direct operator mapping
 * - Temporal operator resolution to date ranges
 * - Skipping null/undefined values (except isNull/isNotNull)
 */
export declare function filterValuesToQueryFilters(filters: readonly FilterValue[], now?: Date): DataQueryFilter[];
/**
 * Inject DataQueryFilter[] into a DataQuery, merging with any existing filters.
 * Returns a new query object (does not mutate the original).
 */
export declare function injectFiltersIntoQuery(query: DataQuery, filters: readonly DataQueryFilter[]): DataQuery;
export {};
//# sourceMappingURL=filter-query-bridge.d.ts.map