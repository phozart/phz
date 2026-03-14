/**
 * @phozart/engine/explorer — Explore Types
 *
 * Self-service exploration query model. Users drag fields into
 * dimension/measure/filter slots to build ad-hoc queries.
 * exploreToDataQuery() converts to the flat ExploreDataQuery format.
 *
 * Moved from @phozart/workspace in v15 (A-2.01).
 */
export interface ExploreFieldSlot {
    field: string;
    alias?: string;
}
export interface ExploreValueSlot {
    field: string;
    aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'count_distinct';
    alias?: string;
}
export interface ExploreFilterSlot {
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'contains' | 'between';
    value: unknown;
}
export interface ExploreQuery {
    dimensions: ExploreFieldSlot[];
    measures: ExploreValueSlot[];
    filters: ExploreFilterSlot[];
    sort?: Array<{
        field: string;
        direction: 'asc' | 'desc';
    }>;
    limit?: number;
}
export interface ExploreDataQueryAggregation {
    field: string;
    function: string;
    alias?: string;
}
export interface ExploreDataQueryFilter {
    field: string;
    operator: string;
    value: unknown;
}
export interface ExploreDataQuery {
    fields: string[];
    groupBy?: string[];
    aggregations: ExploreDataQueryAggregation[];
    filters: ExploreDataQueryFilter[];
    sort?: Array<{
        field: string;
        direction: 'asc' | 'desc';
    }>;
    limit?: number;
}
export declare function exploreToDataQuery(explore: ExploreQuery): ExploreDataQuery;
//# sourceMappingURL=explore-types.d.ts.map