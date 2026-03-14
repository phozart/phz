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
export type FilterOperator = 'equals' | 'notEquals' | 'contains' | 'notContains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'greaterThanOrEqual' | 'lessThan' | 'lessThanOrEqual' | 'between' | 'notBetween' | 'in' | 'notIn' | 'isNull' | 'isNotNull' | 'before' | 'after' | 'lastN' | 'thisperiod' | 'previousperiod';
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
export type FilterUIType = 'select' | 'multi-select' | 'chip-select' | 'tree-select' | 'date-range' | 'date-preset' | 'numeric-range' | 'search' | 'boolean-toggle' | 'field-presence';
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
    sources: Array<{
        dataSourceId: string;
        field: string;
    }>;
}
export declare function resolveFieldForSource(canonicalField: string, dataSourceId: string, mappings: FieldMapping[]): string;
export interface FilterContextManager {
    getState(): FilterContextState;
    setFilter(filter: FilterValue): void;
    clearFilter(filterId: string): void;
    clearAll(): void;
    applyCrossFilter(entry: CrossFilterEntry): void;
    clearCrossFilter(widgetId: string): void;
    resolveFilters(widgetId?: string): FilterValue[];
    resolveFiltersForSource(dataSourceId: string, widgetId?: string): FilterValue[];
    resolveFiltersForSourceWithJoins(targetSourceId: string, filterOriginSourceId?: string, widgetId?: string): FilterValue[];
    subscribe(listener: () => void): () => void;
    setSource(source: FilterContextState['source']): void;
}
export interface FilterContextOptions {
    dashboardFilters?: DashboardFilterDef[];
    fieldMappings?: FieldMapping[];
    sourceRelationships?: SourceRelationship[];
}
export declare function createFilterContext(options?: FilterContextOptions): FilterContextManager;
export interface DebouncedDispatch<T> {
    (value: T, signal?: AbortSignal): void;
    cancel(): void;
}
export declare function createDebouncedFilterDispatch<T>(handler: (value: T) => void, intervalMs?: number): DebouncedDispatch<T>;
//# sourceMappingURL=filter-context.d.ts.map