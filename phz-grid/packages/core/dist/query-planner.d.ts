/**
 * @phozart/core — Query Planner (Item 6.7)
 *
 * Declarative query planner that inspects data source capabilities and
 * dataset size to generate a QueryPlan routing pipeline stages to the
 * appropriate execution engine (JS main thread, DuckDB, or Server).
 */
export type ExecutionEngine = 'js' | 'duckdb' | 'server' | 'worker';
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
    workerThreshold?: number;
}
export declare class QueryPlanner {
    private duckdbThreshold;
    private workerThreshold;
    constructor(config?: QueryPlannerConfig);
    createPlan(capabilities: PipelineCapabilities): QueryPlan;
    private selectEngine;
    private selectStages;
}
export interface OptimizedQueryPlan extends QueryPlan {
    hints: QueryHint[];
}
export type QueryHint = {
    type: 'filter-pushdown';
    filterCount: number;
} | {
    type: 'projection-pushdown';
    fields: string[];
} | {
    type: 'short-circuit';
    reason: string;
} | {
    type: 'combine-stages';
    stages: QueryPlanStage[];
};
export interface PlanContext {
    activeFilters: number;
    activeSort: boolean;
    activeGrouping: boolean;
    pivotActive: boolean;
    usedFields: string[];
    totalFields: number;
}
export declare class PlanOptimizer {
    optimize(plan: QueryPlan, context: PlanContext): OptimizedQueryPlan;
}
//# sourceMappingURL=query-planner.d.ts.map