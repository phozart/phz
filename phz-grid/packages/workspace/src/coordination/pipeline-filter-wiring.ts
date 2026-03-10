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

import type {
  DashboardDataConfig,
  DashboardLoadingState,
} from '../types.js';
import type {
  DataAdapter,
  DataQuery,
  DataResult,
} from '../data-adapter.js';
import type { FilterContextManager } from '../filters/filter-context.js';
import {
  filterValuesToQueryFilters,
  injectFiltersIntoQuery,
} from '../filters/filter-query-bridge.js';

// ========================================================================
// Query-level filter injection
// ========================================================================

/**
 * Build a filtered version of a base query by resolving the current
 * filter context state and injecting the resulting DataQueryFilter[]
 * into the query. Handles multi-source field mapping via
 * FilterContextManager.resolveFiltersForSource().
 */
export function buildFilteredPipelineQuery(
  baseQuery: DataQuery,
  filterContext: FilterContextManager,
): DataQuery {
  // Use data source–specific resolution for correct field mapping
  const filterValues = filterContext.resolveFiltersForSource(baseQuery.source);
  const queryFilters = filterValuesToQueryFilters(filterValues);

  if (queryFilters.length === 0) return baseQuery;
  return injectFiltersIntoQuery(baseQuery, queryFilters);
}

// ========================================================================
// Filter-aware pipeline
// ========================================================================

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
export function createFilterAwarePipeline(
  config: DashboardDataConfig,
  dataAdapter: DataAdapter,
  filterContext: FilterContextManager,
  debounceMs: number = 150,
): FilterAwarePipeline {
  let currentState: DashboardLoadingState = { phase: 'idle' };
  let preloadResult: DataResult | undefined;
  let fullResult: DataResult | undefined;
  const listeners = new Set<(state: DashboardLoadingState) => void>();
  let destroyed = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function setState(update: Partial<DashboardLoadingState>): void {
    currentState = { ...currentState, ...update };
    if (destroyed) return;
    for (const listener of listeners) {
      listener({ ...currentState });
    }
  }

  async function runLoad(): Promise<void> {
    if (destroyed) return;

    setState({ phase: 'preloading', error: undefined, progress: 0 });

    try {
      // Build filtered queries using current filter state
      const preloadQuery = buildFilteredPipelineQuery(config.preload.query, filterContext);
      const fullLoadQuery = buildFilteredPipelineQuery(
        { ...config.fullLoad.query, limit: config.fullLoad.maxRows },
        filterContext,
      );

      // Fire preload + full-load in parallel
      const preloadPromise = dataAdapter.execute(preloadQuery);
      const fullLoadPromise = dataAdapter.execute(fullLoadQuery);

      // Handle preload completion
      preloadResult = await preloadPromise;
      if (destroyed) return;
      setState({ phase: 'preload-complete', progress: 50 });

      // Handle full-load completion
      fullResult = await fullLoadPromise;
      if (destroyed) return;
      setState({ phase: 'full-complete', progress: 100 });
    } catch (err) {
      if (destroyed) return;
      const message = err instanceof Error ? err.message : String(err);
      setState({ phase: 'error', error: message });
    }
  }

  // Subscribe to filter context changes for automatic re-execution
  const unsubFilter = filterContext.subscribe(() => {
    if (destroyed) return;

    // Debounce to avoid re-executing on rapid filter changes
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      if (!destroyed) {
        preloadResult = undefined;
        fullResult = undefined;
        runLoad();
      }
    }, debounceMs);
  });

  return {
    get state(): DashboardLoadingState {
      return { ...currentState };
    },

    async start(): Promise<void> {
      await runLoad();
    },

    onStateChange(cb: (state: DashboardLoadingState) => void): () => void {
      listeners.add(cb);
      return () => { listeners.delete(cb); };
    },

    getWidgetData(_widgetId: string, tier: 'preload' | 'full' | 'both'): DataResult | undefined {
      if (tier === 'preload') return preloadResult;
      if (tier === 'full') return fullResult;
      return fullResult ?? preloadResult;
    },

    async invalidate(): Promise<void> {
      preloadResult = undefined;
      fullResult = undefined;
      await runLoad();
    },

    destroy(): void {
      destroyed = true;
      unsubFilter();
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      listeners.clear();
      preloadResult = undefined;
      fullResult = undefined;
    },
  };
}
