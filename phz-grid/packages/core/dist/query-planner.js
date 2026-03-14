/**
 * @phozart/core — Query Planner (Item 6.7)
 *
 * Declarative query planner that inspects data source capabilities and
 * dataset size to generate a QueryPlan routing pipeline stages to the
 * appropriate execution engine (JS main thread, DuckDB, or Server).
 */
const DEFAULT_DUCKDB_THRESHOLD = 10_000;
const DEFAULT_WORKER_THRESHOLD = 5_000;
const ALL_STAGES = ['filter', 'sort', 'group', 'flatten', 'virtualize'];
const SERVER_DEBOUNCE_MS = 300;
export class QueryPlanner {
    duckdbThreshold;
    workerThreshold;
    constructor(config) {
        this.duckdbThreshold = config?.duckdbThreshold ?? DEFAULT_DUCKDB_THRESHOLD;
        this.workerThreshold = config?.workerThreshold ?? DEFAULT_WORKER_THRESHOLD;
    }
    createPlan(capabilities) {
        const engine = this.selectEngine(capabilities);
        const stages = this.selectStages(engine);
        return {
            engine,
            stages,
            rowCount: capabilities.rowCount,
            cancellable: true,
            debounceMs: engine === 'server' ? SERVER_DEBOUNCE_MS : undefined,
            createdAt: Date.now(),
        };
    }
    selectEngine(caps) {
        // Server (async data source) takes priority — data lives remotely
        if (caps.hasAsyncDataSource) {
            return 'server';
        }
        // DuckDB for large local datasets
        if (caps.hasDuckDB && caps.rowCount >= this.duckdbThreshold) {
            return 'duckdb';
        }
        // Worker for medium-sized local datasets (avoids blocking UI)
        if (caps.enableWorkers && !caps.hasAsyncDataSource && !caps.hasDuckDB
            && caps.rowCount >= this.workerThreshold) {
            return 'worker';
        }
        // Default: JS main thread
        return 'js';
    }
    selectStages(engine) {
        // All engines run the full stage set — the execution location differs,
        // but the logical pipeline stages remain the same.
        return [...ALL_STAGES];
    }
}
export class PlanOptimizer {
    optimize(plan, context) {
        const hints = [];
        // 1. Filter pushdown: note that filters should run before pivot
        if (context.activeFilters > 0) {
            hints.push({ type: 'filter-pushdown', filterCount: context.activeFilters });
        }
        // 2. Projection pushdown: if only a subset of columns are used
        if (context.usedFields.length > 0 && context.usedFields.length < context.totalFields) {
            hints.push({ type: 'projection-pushdown', fields: context.usedFields });
        }
        // 3. Short-circuit: if no rows remain after filter, skip sort/group/pivot
        if (context.activeFilters > 0 && plan.rowCount === 0) {
            hints.push({ type: 'short-circuit', reason: 'Filter yielded 0 rows' });
        }
        // 4. DuckDB stage combining: when engine is duckdb, filter+sort+group can be a single SQL query
        if (plan.engine === 'duckdb') {
            const combinable = [];
            if (context.activeFilters > 0)
                combinable.push('filter');
            if (context.activeSort)
                combinable.push('sort');
            if (context.activeGrouping)
                combinable.push('group');
            if (combinable.length > 1) {
                hints.push({ type: 'combine-stages', stages: combinable });
            }
        }
        return { ...plan, hints };
    }
}
//# sourceMappingURL=query-planner.js.map