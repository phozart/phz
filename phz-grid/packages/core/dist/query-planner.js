/**
 * @phozart/phz-core — Query Planner (Item 6.7)
 *
 * Declarative query planner that inspects data source capabilities and
 * dataset size to generate a QueryPlan routing pipeline stages to the
 * appropriate execution engine (JS main thread, DuckDB, or Server).
 */
const DEFAULT_DUCKDB_THRESHOLD = 10_000;
const ALL_STAGES = ['filter', 'sort', 'group', 'flatten', 'virtualize'];
const SERVER_DEBOUNCE_MS = 300;
export class QueryPlanner {
    duckdbThreshold;
    constructor(config) {
        this.duckdbThreshold = config?.duckdbThreshold ?? DEFAULT_DUCKDB_THRESHOLD;
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
        // Default: JS main thread
        return 'js';
    }
    selectStages(engine) {
        // All engines run the full stage set — the execution location differs,
        // but the logical pipeline stages remain the same.
        return [...ALL_STAGES];
    }
}
//# sourceMappingURL=query-planner.js.map