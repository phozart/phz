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
import { filterValuesToQueryFilters, injectFiltersIntoQuery, } from '../filters/filter-query-bridge.js';
// ========================================================================
// Query-level filter injection
// ========================================================================
/**
 * Build a filtered version of a base query by resolving the current
 * filter context state and injecting the resulting DataQueryFilter[]
 * into the query. Handles multi-source field mapping via
 * FilterContextManager.resolveFiltersForSource().
 */
export function buildFilteredPipelineQuery(baseQuery, filterContext) {
    // Use data source–specific resolution for correct field mapping
    const filterValues = filterContext.resolveFiltersForSource(baseQuery.source);
    const queryFilters = filterValuesToQueryFilters(filterValues);
    if (queryFilters.length === 0)
        return baseQuery;
    return injectFiltersIntoQuery(baseQuery, queryFilters);
}
/**
 * Create a filter-aware dashboard data pipeline that:
 * 1. Injects current filter context into every DataAdapter.execute() call
 * 2. Subscribes to FilterContextManager changes
 * 3. Re-executes queries (debounced) when filters change
 * 4. Cleans up subscription on destroy
 */
export function createFilterAwarePipeline(config, dataAdapter, filterContext, debounceMs = 150) {
    let currentState = { phase: 'idle' };
    let preloadResult;
    let fullResult;
    const listeners = new Set();
    let destroyed = false;
    let debounceTimer = null;
    function setState(update) {
        currentState = { ...currentState, ...update };
        if (destroyed)
            return;
        for (const listener of listeners) {
            listener({ ...currentState });
        }
    }
    async function runLoad() {
        if (destroyed)
            return;
        setState({ phase: 'preloading', error: undefined, progress: 0 });
        try {
            // Build filtered queries using current filter state
            const preloadQuery = buildFilteredPipelineQuery(config.preload.query, filterContext);
            const fullLoadQuery = buildFilteredPipelineQuery({ ...config.fullLoad.query, limit: config.fullLoad.maxRows }, filterContext);
            // Fire preload + full-load in parallel
            const preloadPromise = dataAdapter.execute(preloadQuery);
            const fullLoadPromise = dataAdapter.execute(fullLoadQuery);
            // Handle preload completion
            preloadResult = await preloadPromise;
            if (destroyed)
                return;
            setState({ phase: 'preload-complete', progress: 50 });
            // Handle full-load completion
            fullResult = await fullLoadPromise;
            if (destroyed)
                return;
            setState({ phase: 'full-complete', progress: 100 });
        }
        catch (err) {
            if (destroyed)
                return;
            const message = err instanceof Error ? err.message : String(err);
            setState({ phase: 'error', error: message });
        }
    }
    // Subscribe to filter context changes for automatic re-execution
    const unsubFilter = filterContext.subscribe(() => {
        if (destroyed)
            return;
        // Debounce to avoid re-executing on rapid filter changes
        if (debounceTimer !== null)
            clearTimeout(debounceTimer);
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
        get state() {
            return { ...currentState };
        },
        async start() {
            await runLoad();
        },
        onStateChange(cb) {
            listeners.add(cb);
            return () => { listeners.delete(cb); };
        },
        getWidgetData(_widgetId, tier) {
            if (tier === 'preload')
                return preloadResult;
            if (tier === 'full')
                return fullResult;
            return fullResult ?? preloadResult;
        },
        async invalidate() {
            preloadResult = undefined;
            fullResult = undefined;
            await runLoad();
        },
        destroy() {
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
//# sourceMappingURL=pipeline-filter-wiring.js.map