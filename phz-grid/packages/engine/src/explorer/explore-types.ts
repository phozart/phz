/**
 * @phozart/engine/explorer — Explore Types
 *
 * Self-service exploration query model. Users drag fields into
 * dimension/measure/filter slots to build ad-hoc queries.
 * exploreToDataQuery() converts to the flat ExploreDataQuery format.
 *
 * Moved from @phozart/workspace in v15 (A-2.01).
 */

// --- Slot types ---

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

// --- ExploreQuery ---

export interface ExploreQuery {
  dimensions: ExploreFieldSlot[];
  measures: ExploreValueSlot[];
  filters: ExploreFilterSlot[];
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  limit?: number;
}

// --- ExploreDataQuery (output format) ---

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
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  limit?: number;
}

// --- Conversion ---

export function exploreToDataQuery(explore: ExploreQuery): ExploreDataQuery {
  const dimensionFields = explore.dimensions.map(d => d.field);
  const measureFields = explore.measures.map(m => m.field);

  const aggregations: ExploreDataQueryAggregation[] = explore.measures.map(m => ({
    field: m.field,
    function: m.aggregation,
    alias: m.alias,
  }));

  const filters: ExploreDataQueryFilter[] = explore.filters.map(f => ({
    field: f.field,
    operator: f.operator,
    value: f.value,
  }));

  const result: ExploreDataQuery = {
    fields: [...dimensionFields, ...measureFields],
    aggregations,
    filters,
  };

  if (dimensionFields.length > 0) {
    result.groupBy = dimensionFields;
  }

  if (explore.sort) {
    result.sort = explore.sort;
  }

  if (explore.limit !== undefined) {
    result.limit = explore.limit;
  }

  return result;
}
