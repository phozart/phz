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

const DEFAULT_DUCKDB_THRESHOLD = 10_000;
const ALL_STAGES: QueryPlanStage[] = ['filter', 'sort', 'group', 'flatten', 'virtualize'];
const SERVER_DEBOUNCE_MS = 300;

export class QueryPlanner {
  private duckdbThreshold: number;

  constructor(config?: QueryPlannerConfig) {
    this.duckdbThreshold = config?.duckdbThreshold ?? DEFAULT_DUCKDB_THRESHOLD;
  }

  createPlan(capabilities: PipelineCapabilities): QueryPlan {
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

  private selectEngine(caps: PipelineCapabilities): ExecutionEngine {
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

  private selectStages(engine: ExecutionEngine): QueryPlanStage[] {
    // All engines run the full stage set — the execution location differs,
    // but the logical pipeline stages remain the same.
    return [...ALL_STAGES];
  }
}
