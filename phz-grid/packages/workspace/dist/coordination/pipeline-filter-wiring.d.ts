/**
 * pipeline-filter-wiring — Wires FilterContextManager into DashboardDataPipeline
 * so that filter changes automatically trigger query re-execution with the
 * resolved filters injected.
 *
 * This bridges the gap between the filter UI layer (FilterContextManager)
 * and the data execution layer (DashboardDataPipeline → DataAdapter.execute()).
 *
 * Tasks: 2.2 (WB-007)
 */
import type { DashboardDataConfig, DashboardLoadingState } from '../types.js';
import type { DataAdapter, DataQuery, DataResult } from '../data-adapter.js';
import type { FilterContextManager } from '../filters/filter-context.js';
/**
 * Build a filtered version of a base query by resolving the current
 * filter context state and injecting the resulting DataQueryFilter[]
 * into the query. Handles multi-source field mapping via
 * FilterContextManager.resolveFiltersForSource().
 */
export declare function buildFilteredPipelineQuery(baseQuery: DataQuery, filterContext: FilterContextManager): DataQuery;
export interface FilterAwarePipeline {
    readonly state: DashboardLoadingState;
    start(): Promise<void>;
    onStateChange(cb: (state: DashboardLoadingState) => void): () => void;
    getWidgetData(widgetId: string, tier: 'preload' | 'full' | 'both'): DataResult | undefined;
    invalidate(): Promise<void>;
    destroy(): void;
}
/**
 * Create a filter-aware dashboard data pipeline that:
 * 1. Injects current filter context into every DataAdapter.execute() call
 * 2. Subscribes to FilterContextManager changes
 * 3. Re-executes queries (debounced) when filters change
 * 4. Cleans up subscription on destroy
 */
export declare function createFilterAwarePipeline(config: DashboardDataConfig, dataAdapter: DataAdapter, filterContext: FilterContextManager, debounceMs?: number): FilterAwarePipeline;
//# sourceMappingURL=pipeline-filter-wiring.d.ts.map