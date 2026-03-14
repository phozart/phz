/**
 * @phozart/shared — FilterContext (A-1.05)
 *
 * Centralized filter state manager for dashboards. Merges four filter levels:
 * global -> dashboard defaults -> user/widget filters -> cross-filters.
 *
 * Supports multi-source field mapping resolution and debounced dispatch.
 * Join-aware filter propagation respects SourceRelationship join directions.
 *
 * Extracted from workspace/filters/filter-context.ts as pure types + functions.
 */

import type { SourceRelationship } from '../types/source-relationship.js';
import { isJoinPropagationAllowed } from '../types/source-relationship.js';

// ========================================================================
// Filter types (self-contained — no workspace imports)
// ========================================================================

export type FilterOperator =
  | 'equals' | 'notEquals'
  | 'contains' | 'notContains'
  | 'startsWith' | 'endsWith'
  | 'greaterThan' | 'greaterThanOrEqual'
  | 'lessThan' | 'lessThanOrEqual'
  | 'between' | 'notBetween'
  | 'in' | 'notIn'
  | 'isNull' | 'isNotNull'
  | 'before' | 'after'
  | 'lastN' | 'thisperiod' | 'previousperiod';

export interface FilterValue {
  filterId: string;
  field: string;
  operator: FilterOperator;
  value: unknown;
  label: string;
}

export interface CrossFilterEntry {
  sourceWidgetId: string;
  field: string;
  value: unknown;
  timestamp: number;
}

export interface FilterContextState {
  values: Map<string, FilterValue>;
  activeFilterIds: Set<string>;
  crossFilters: CrossFilterEntry[];
  lastUpdated: number;
  source: 'user' | 'preset' | 'url' | 'default';
}

export type FilterUIType =
  | 'select' | 'multi-select' | 'chip-select' | 'tree-select'
  | 'date-range' | 'date-preset' | 'numeric-range'
  | 'search' | 'boolean-toggle' | 'field-presence';

export interface DashboardFilterDef {
  id: string;
  field: string;
  dataSourceId: string;
  label: string;
  filterType: FilterUIType;
  defaultValue?: unknown;
  required: boolean;
  appliesTo: string[];
  queryLayer?: 'server' | 'client' | 'auto';
}

export interface FieldMapping {
  canonicalField: string;
  sources: Array<{ dataSourceId: string; field: string }>;
}

// ========================================================================
// Field resolution
// ========================================================================

export function resolveFieldForSource(
  canonicalField: string,
  dataSourceId: string,
  mappings: FieldMapping[],
): string {
  const mapping = mappings.find(m => m.canonicalField === canonicalField);
  if (!mapping) return canonicalField;
  const source = mapping.sources.find(s => s.dataSourceId === dataSourceId);
  return source ? source.field : canonicalField;
}

// ========================================================================
// FilterContextManager interface
// ========================================================================

export interface FilterContextManager {
  getState(): FilterContextState;
  setFilter(filter: FilterValue): void;
  clearFilter(filterId: string): void;
  clearAll(): void;
  applyCrossFilter(entry: CrossFilterEntry): void;
  clearCrossFilter(widgetId: string): void;
  resolveFilters(widgetId?: string): FilterValue[];
  resolveFiltersForSource(dataSourceId: string, widgetId?: string): FilterValue[];
  resolveFiltersForSourceWithJoins(
    targetSourceId: string,
    filterOriginSourceId?: string,
    widgetId?: string,
  ): FilterValue[];
  subscribe(listener: () => void): () => void;
  setSource(source: FilterContextState['source']): void;
}

// ========================================================================
// Options
// ========================================================================

export interface FilterContextOptions {
  dashboardFilters?: DashboardFilterDef[];
  fieldMappings?: FieldMapping[];
  sourceRelationships?: SourceRelationship[];
}

// ========================================================================
// createFilterContext
// ========================================================================

export function createFilterContext(options?: FilterContextOptions): FilterContextManager {
  const dashboardFilters = options?.dashboardFilters ?? [];
  const fieldMappings = options?.fieldMappings ?? [];
  const sourceRelationships = options?.sourceRelationships ?? [];

  const values = new Map<string, FilterValue>();
  const activeFilterIds = new Set<string>();
  let crossFilters: CrossFilterEntry[] = [];
  let lastUpdated = Date.now();
  let source: FilterContextState['source'] = 'default';

  const listeners = new Set<() => void>();

  function notify(): void {
    lastUpdated = Date.now();
    for (const listener of listeners) {
      listener();
    }
  }

  function getState(): FilterContextState {
    return {
      values: new Map(values),
      activeFilterIds: new Set(activeFilterIds),
      crossFilters: [...crossFilters],
      lastUpdated,
      source,
    };
  }

  function setFilter(filter: FilterValue): void {
    values.set(filter.filterId, filter);
    activeFilterIds.add(filter.filterId);
    if (source === 'default') source = 'user';
    notify();
  }

  function clearFilter(filterId: string): void {
    if (values.delete(filterId)) {
      activeFilterIds.delete(filterId);
      notify();
    }
  }

  function clearAll(): void {
    values.clear();
    activeFilterIds.clear();
    crossFilters = [];
    notify();
  }

  function applyCrossFilter(entry: CrossFilterEntry): void {
    crossFilters = crossFilters.filter(cf => cf.sourceWidgetId !== entry.sourceWidgetId);
    crossFilters.push(entry);
    notify();
  }

  function clearCrossFilter(widgetId: string): void {
    crossFilters = crossFilters.filter(cf => cf.sourceWidgetId !== widgetId);
    notify();
  }

  function resolveFilters(widgetId?: string): FilterValue[] {
    const result: FilterValue[] = [];
    const seenFields = new Set<string>();

    // Layer 1+2: User/widget filters (highest priority)
    for (const filter of values.values()) {
      result.push(filter);
      seenFields.add(filter.field);
    }

    // Layer 3: Cross-filters (exclude ones from requesting widget)
    for (const cf of crossFilters) {
      if (widgetId && cf.sourceWidgetId === widgetId) continue;
      if (!seenFields.has(cf.field)) {
        result.push({
          filterId: `_cross_${cf.sourceWidgetId}_${cf.field}`,
          field: cf.field,
          operator: 'equals',
          value: cf.value,
          label: `Cross-filter: ${cf.field}`,
        });
        seenFields.add(cf.field);
      }
    }

    // Layer 4: Dashboard defaults (lowest priority, only if not overridden)
    for (const def of dashboardFilters) {
      if (!seenFields.has(def.field) && def.defaultValue !== undefined) {
        result.push({
          filterId: `_default_${def.id}`,
          field: def.field,
          operator: 'equals',
          value: def.defaultValue,
          label: `${def.label}: ${def.defaultValue}`,
        });
        seenFields.add(def.field);
      }
    }

    return result;
  }

  function resolveFiltersForSource(dataSourceId: string, widgetId?: string): FilterValue[] {
    const filters = resolveFilters(widgetId);
    if (fieldMappings.length === 0) return filters;

    return filters.map(f => ({
      ...f,
      field: resolveFieldForSource(f.field, dataSourceId, fieldMappings),
    }));
  }

  function resolveFiltersForSourceWithJoins(
    targetSourceId: string,
    filterOriginSourceId?: string,
    widgetId?: string,
  ): FilterValue[] {
    const allFilters = resolveFilters(widgetId);

    if (sourceRelationships.length === 0 || !filterOriginSourceId) {
      // No join constraints — fall back to standard field mapping resolution
      return resolveFiltersForSource(targetSourceId, widgetId);
    }

    // If same source, no join check needed
    if (filterOriginSourceId === targetSourceId) {
      return allFilters.map(f => ({
        ...f,
        field: resolveFieldForSource(f.field, targetSourceId, fieldMappings),
      }));
    }

    // Check join propagation permission
    if (!isJoinPropagationAllowed(sourceRelationships, filterOriginSourceId, targetSourceId)) {
      return []; // Propagation not allowed by join direction
    }

    // Propagation allowed — resolve field mappings for target source
    return allFilters.map(f => ({
      ...f,
      field: resolveFieldForSource(f.field, targetSourceId, fieldMappings),
    }));
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }

  function setSourceFn(s: FilterContextState['source']): void {
    source = s;
  }

  return {
    getState,
    setFilter,
    clearFilter,
    clearAll,
    applyCrossFilter,
    clearCrossFilter,
    resolveFilters,
    resolveFiltersForSource,
    resolveFiltersForSourceWithJoins,
    subscribe,
    setSource: setSourceFn,
  };
}

// ========================================================================
// Debounced filter dispatch
// ========================================================================

export interface DebouncedDispatch<T> {
  (value: T, signal?: AbortSignal): void;
  cancel(): void;
}

export function createDebouncedFilterDispatch<T>(
  handler: (value: T) => void,
  intervalMs: number = 150,
): DebouncedDispatch<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let abortListener: (() => void) | null = null;

  function cleanup(): void {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    abortListener = null;
  }

  function dispatch(value: T, signal?: AbortSignal): void {
    cleanup();

    if (signal?.aborted) return;

    if (signal) {
      abortListener = () => cleanup();
      signal.addEventListener('abort', abortListener, { once: true });
    }

    timer = setTimeout(() => {
      timer = null;
      if (signal) {
        signal.removeEventListener('abort', abortListener!);
      }
      if (!signal?.aborted) {
        handler(value);
      }
    }, intervalMs);
  }

  dispatch.cancel = cleanup;

  return dispatch;
}
