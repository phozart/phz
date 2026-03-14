/**
 * @phozart/engine — Filter Adapter
 *
 * Bridges CriteriaEngine output (ArtefactCriteria) to widget data filtering.
 * Provides:
 * - applyArtefactCriteria(): pure function that filters rows using FilterCriterion[]
 * - FilterAdapter: stateful adapter managing values, criteria, and subscriptions
 * - globalFiltersToCriteriaBindings(): converts GlobalFilter[] into CriteriaEngine registrations
 */
import type { ArtefactId, ArtefactCriteria, SelectionContext } from '@phozart/core';
import type { CriteriaEngine } from './criteria/criteria-engine.js';
import type { GlobalFilter } from './dashboard-enhanced.js';
export interface FilterAdapter {
    /** Apply current filter state to a data array, returning filtered rows. */
    applyFilters(data: Record<string, unknown>[]): Record<string, unknown>[];
    /** Set filter values and rebuild criteria. Notifies subscribers. */
    setValues(values: SelectionContext): void;
    /** Get current filter values. */
    getValues(): SelectionContext;
    /** Get the latest ArtefactCriteria (or null if no values set). */
    getCurrentCriteria(): ArtefactCriteria | null;
    /** Reset all filter values. Notifies subscribers. */
    reset(): void;
    /** Subscribe to criteria changes. Returns unsubscribe function. */
    subscribe(listener: (criteria: ArtefactCriteria) => void): () => void;
}
/**
 * Apply ArtefactCriteria filters to a data array, returning matching rows.
 * All filters are combined with AND logic. Null values skip the filter.
 */
export declare function applyArtefactCriteria(data: Record<string, unknown>[], criteria: ArtefactCriteria): Record<string, unknown>[];
export declare function createFilterAdapter(criteriaEngine: CriteriaEngine, artefactId: ArtefactId): FilterAdapter;
/**
 * Convert GlobalFilter[] from an EnhancedDashboardConfig into CriteriaEngine
 * filter definitions and bindings. This makes GlobalFilter a thin wrapper
 * over the CriteriaEngine, unifying both filter systems.
 */
export declare function globalFiltersToCriteriaBindings(criteriaEngine: CriteriaEngine, artId: ArtefactId, globalFilters: GlobalFilter[]): void;
//# sourceMappingURL=filter-adapter.d.ts.map