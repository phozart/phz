/**
 * @phozart/shared — Execution Strategy (A-2.06)
 *
 * Automatic execution engine selection. Determines which query execution
 * backend to use based on configuration, data size, and available capabilities.
 *
 * Pure functions and type definitions only — no side effects.
 */
/**
 * The available query execution backends.
 *
 * - `server` — Execute queries on the remote server via DataAdapter
 * - `duckdb-wasm` — Execute locally in-browser using DuckDB-WASM
 * - `local-duckdb` — Execute on a local DuckDB server (Tier 2)
 * - `auto` — Automatically select based on context
 */
export type ExecutionEngine = 'server' | 'duckdb-wasm' | 'local-duckdb' | 'auto';
/**
 * Configuration for automatic execution engine selection.
 */
export interface ExecutionStrategyConfig {
    /** The preferred execution engine. When set to `auto`, selection is context-driven. */
    preferred: ExecutionEngine;
    /** Fallback order when the preferred engine is unavailable. */
    fallbackOrder: ExecutionEngine[];
    /**
     * Row count threshold below which local execution (duckdb-wasm or local-duckdb)
     * is preferred over server. Defaults to 100_000.
     */
    rowThresholdForLocal?: number;
    /**
     * Per-feature engine overrides. For example, `{ 'pivot': 'server' }` forces
     * pivot queries to always run on the server regardless of the preferred engine.
     */
    features?: Record<string, ExecutionEngine>;
}
/**
 * Runtime context describing what execution backends are available.
 */
export interface ExecutionContext {
    /** Approximate row count of the dataset (if known). */
    rowCount?: number;
    /** Whether the server-side DataAdapter supports query execution. */
    hasServerSupport: boolean;
    /** Whether DuckDB-WASM is loaded and operational in the browser. */
    hasDuckDBWasm: boolean;
    /** Whether a local DuckDB server (Tier 2) is reachable. */
    hasLocalDuckDB: boolean;
}
/**
 * Creates a default execution strategy configuration.
 * Defaults to `auto` with a fallback chain of server -> duckdb-wasm -> local-duckdb.
 */
export declare function createDefaultExecutionStrategy(overrides?: Partial<ExecutionStrategyConfig>): ExecutionStrategyConfig;
/**
 * Selects the best execution engine based on configuration and runtime context.
 *
 * Resolution logic:
 * 1. If `preferred` is not `auto` and the engine is available, use it.
 * 2. If `preferred` is `auto`:
 *    a. If row count is known and below `rowThresholdForLocal`, prefer
 *       local engines (duckdb-wasm first, then local-duckdb).
 *    b. Otherwise prefer server.
 * 3. Walk the `fallbackOrder` to find the first available engine.
 * 4. Return `server` as the ultimate fallback.
 */
export declare function selectExecutionEngine(config: ExecutionStrategyConfig, context: ExecutionContext): ExecutionEngine;
/**
 * Selects the execution engine for a specific feature. If the feature has
 * an explicit override in `config.features`, that engine is used (if available).
 * Otherwise falls back to the standard `selectExecutionEngine` logic.
 */
export declare function selectEngineForFeature(config: ExecutionStrategyConfig, context: ExecutionContext, feature: string): ExecutionEngine;
//# sourceMappingURL=execution-strategy.d.ts.map