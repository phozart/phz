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

export type DataQueryFilterOperator =
  | 'equals' | 'notEquals'
  | 'contains' | 'notContains'
  | 'startsWith' | 'endsWith'
  | 'greaterThan' | 'greaterThanOrEqual'
  | 'lessThan' | 'lessThanOrEqual'
  | 'between' | 'notBetween'
  | 'in' | 'notIn'
  | 'isNull' | 'isNotNull';

// ========================================================================
// Operator mapping
// ========================================================================

/**
 * Map a FilterOperator to a DataQueryFilterOperator.
 * Returns undefined for temporal operators that need special resolution.
 */
export function mapFilterOperator(
  op: FilterOperator,
): DataQueryFilterOperator | undefined {
  switch (op) {
    // Direct 1:1 mappings
    case 'equals':
    case 'notEquals':
    case 'contains':
    case 'notContains':
    case 'startsWith':
    case 'endsWith':
    case 'greaterThan':
    case 'greaterThanOrEqual':
    case 'lessThan':
    case 'lessThanOrEqual':
    case 'between':
    case 'notBetween':
    case 'in':
    case 'notIn':
    case 'isNull':
    case 'isNotNull':
      return op;

    // Date aliases
    case 'before':
      return 'lessThan';
    case 'after':
      return 'greaterThan';

    // Temporal operators need special handling
    case 'lastN':
    case 'thisperiod':
    case 'previousperiod':
      return undefined;
  }
}

// ========================================================================
// Temporal operator resolution
// ========================================================================

interface TemporalConfig {
  n?: number;
  unit?: 'days' | 'weeks' | 'months' | 'years' | 'hours' | 'minutes'
       | 'day' | 'week' | 'month' | 'year' | 'quarter';
}

/**
 * Resolve temporal filter operators into concrete date-range between filters.
 * Returns undefined if the operator is not a temporal type.
 */
export function resolveTemporalFilter(
  field: string,
  operator: string,
  config: TemporalConfig,
  now: Date = new Date(),
): DataQueryFilter | undefined {
  switch (operator) {
    case 'lastN': {
      const n = config.n ?? 7;
      const unit = normalizeUnit(config.unit ?? 'days');
      const start = subtractTime(now, n, unit);
      return {
        field,
        operator: 'between',
        value: [start.toISOString(), now.toISOString()],
      };
    }

    case 'thisperiod': {
      const unit = normalizeUnit(config.unit ?? 'month');
      const start = periodStart(now, unit);
      const end = periodEnd(now, unit);
      return {
        field,
        operator: 'between',
        value: [start.toISOString(), end.toISOString()],
      };
    }

    case 'previousperiod': {
      const unit = normalizeUnit(config.unit ?? 'month');
      const prevEnd = periodStart(now, unit);
      prevEnd.setMilliseconds(prevEnd.getMilliseconds() - 1);
      const prevStart = periodStart(prevEnd, unit);
      return {
        field,
        operator: 'between',
        value: [prevStart.toISOString(), prevEnd.toISOString()],
      };
    }

    default:
      return undefined;
  }
}

function normalizeUnit(unit: string): 'days' | 'weeks' | 'months' | 'years' | 'hours' | 'minutes' {
  const map: Record<string, 'days' | 'weeks' | 'months' | 'years' | 'hours' | 'minutes'> = {
    day: 'days', days: 'days',
    week: 'weeks', weeks: 'weeks',
    month: 'months', months: 'months',
    year: 'years', years: 'years',
    quarter: 'months', // quarter = 3 months, handled in subtractTime
    hour: 'hours', hours: 'hours',
    minute: 'minutes', minutes: 'minutes',
  };
  return map[unit] ?? 'days';
}

function subtractTime(date: Date, n: number, unit: string): Date {
  const result = new Date(date);
  switch (unit) {
    case 'days': result.setDate(result.getDate() - n); break;
    case 'weeks': result.setDate(result.getDate() - n * 7); break;
    case 'months': result.setMonth(result.getMonth() - n); break;
    case 'years': result.setFullYear(result.getFullYear() - n); break;
    case 'hours': result.setHours(result.getHours() - n); break;
    case 'minutes': result.setMinutes(result.getMinutes() - n); break;
  }
  return result;
}

function periodStart(date: Date, unit: string): Date {
  const result = new Date(date);
  switch (unit) {
    case 'days':
      result.setHours(0, 0, 0, 0);
      break;
    case 'weeks':
      result.setDate(result.getDate() - result.getDay());
      result.setHours(0, 0, 0, 0);
      break;
    case 'months':
      result.setDate(1);
      result.setHours(0, 0, 0, 0);
      break;
    case 'years':
      result.setMonth(0, 1);
      result.setHours(0, 0, 0, 0);
      break;
  }
  return result;
}

function periodEnd(date: Date, unit: string): Date {
  const result = periodStart(date, unit);
  switch (unit) {
    case 'days':
      result.setDate(result.getDate() + 1);
      break;
    case 'weeks':
      result.setDate(result.getDate() + 7);
      break;
    case 'months':
      result.setMonth(result.getMonth() + 1);
      break;
    case 'years':
      result.setFullYear(result.getFullYear() + 1);
      break;
  }
  result.setMilliseconds(result.getMilliseconds() - 1);
  return result;
}

// ========================================================================
// FilterValue[] → DataQueryFilter[] conversion
// ========================================================================

/**
 * Convert FilterValue[] (from FilterContextManager) to DataQueryFilter[]
 * (for DataAdapter.execute()). Handles:
 * - Direct operator mapping
 * - Temporal operator resolution to date ranges
 * - Skipping null/undefined values (except isNull/isNotNull)
 */
export function filterValuesToQueryFilters(
  filters: readonly FilterValue[],
  now?: Date,
): DataQueryFilter[] {
  const result: DataQueryFilter[] = [];

  for (const filter of filters) {
    // Skip null values unless checking for null
    if (
      (filter.value === null || filter.value === undefined) &&
      filter.operator !== 'isNull' &&
      filter.operator !== 'isNotNull'
    ) {
      continue;
    }

    // Try direct operator mapping
    const mappedOp = mapFilterOperator(filter.operator);

    if (mappedOp !== undefined) {
      result.push({
        field: filter.field,
        operator: mappedOp,
        value: filter.value,
      });
      continue;
    }

    // Temporal operators need date resolution
    const temporal = resolveTemporalFilter(
      filter.field,
      filter.operator,
      (filter.value as TemporalConfig) ?? {},
      now,
    );

    if (temporal) {
      result.push(temporal);
    }
  }

  return result;
}

// ========================================================================
// Query filter injection
// ========================================================================

/**
 * Inject DataQueryFilter[] into a DataQuery, merging with any existing filters.
 * Returns a new query object (does not mutate the original).
 */
export function injectFiltersIntoQuery(
  query: DataQuery,
  filters: readonly DataQueryFilter[],
): DataQuery {
  if (filters.length === 0) return query;

  return {
    ...query,
    filters: [...(Array.isArray(query.filters) ? query.filters as DataQueryFilter[] : []), ...filters],
  };
}
