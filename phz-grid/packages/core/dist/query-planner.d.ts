/**
 * @phozart/phz-core — Query Planner (Item 6.7)
 *
 * Declarative query planner that inspects data source capabilities and
 * dataset size to generate a QueryPlan routing pipeline stages to the
 * appropriate execution engine (JS main thread, DuckDB, or Server).
 */
export type ExecutionEngine = 'js' | 'duckdb' | 'server';
export type QueryPlanStage = 'filter' | 'sort' | 'group' | 'flatten' | 'virtualize';
export interface QueryPlan {
    engine: ExecutionEngine;
    stages: QueryPlanStage[];
    rowCount: number;
    cancellable: boolean;
    debounceMs?: number;
    createdAt: number;
}
export interface PipelineCapabilities {
    hasAsyncDataSource: boolean;
    hasDuckDB: boolean;
    rowCount: number;
    enableWorkers: boolean;
}
export interface QueryPlannerConfig {
    duckdbThreshold?: number;
}
export declare class QueryPlanner {
    private duckdbThreshold;
    constructor(config?: QueryPlannerConfig);
    createPlan(capabilities: PipelineCapabilities): QueryPlan;
    private selectEngine;
    private selectStages;
}
//# sourceMappingURL=query-planner.d.ts.map