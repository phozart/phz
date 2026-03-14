/**
 * @phozart/shared — Execution Strategy (A-2.06)
 *
 * Automatic execution engine selection. Determines which query execution
 * backend to use based on configuration, data size, and available capabilities.
 *
 * Pure functions and type definitions only — no side effects.
 */

// ========================================================================
// ExecutionEngine
// ========================================================================

/**
 * The available query execution backends.
 *
 * - `server` — Execute queries on the remote server via DataAdapter
 * - `duckdb-wasm` — Execute locally in-browser using DuckDB-WASM
 * - `local-duckdb` — Execute on a local DuckDB server (Tier 2)
 * - `auto` — Automatically select based on context
 */
export type ExecutionEngine = 'server' | 'duckdb-wasm' | 'local-duckdb' | 'auto';

// ========================================================================
// ExecutionStrategyConfig
// ========================================================================

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

// ========================================================================
// ExecutionContext — runtime capabilities
// ========================================================================

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

// ========================================================================
// createDefaultExecutionStrategy
// ========================================================================

/**
 * Creates a default execution strategy configuration.
 * Defaults to `auto` with a fallback chain of server -> duckdb-wasm -> local-duckdb.
 */
export function createDefaultExecutionStrategy(
  overrides?: Partial<ExecutionStrategyConfig>,
): ExecutionStrategyConfig {
  return {
    preferred: 'auto',
    fallbackOrder: ['server', 'duckdb-wasm', 'local-duckdb'],
    rowThresholdForLocal: 100_000,
    ...overrides,
  };
}

// ========================================================================
// selectExecutionEngine
// ========================================================================

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
export function selectExecutionEngine(
  config: ExecutionStrategyConfig,
  context: ExecutionContext,
): ExecutionEngine {
  const isAvailable = (engine: ExecutionEngine): boolean => {
    switch (engine) {
      case 'server':
        return context.hasServerSupport;
      case 'duckdb-wasm':
        return context.hasDuckDBWasm;
      case 'local-duckdb':
        return context.hasLocalDuckDB;
      case 'auto':
        return false; // `auto` is not a concrete engine
    }
  };

  // Non-auto preferred engine
  if (config.preferred !== 'auto') {
    if (isAvailable(config.preferred)) {
      return config.preferred;
    }
    // Fall through to fallback chain
  }

  // Auto selection: prefer local for small datasets
  if (config.preferred === 'auto') {
    const threshold = config.rowThresholdForLocal ?? 100_000;
    if (context.rowCount !== undefined && context.rowCount <= threshold) {
      // Try local engines first
      if (context.hasDuckDBWasm) return 'duckdb-wasm';
      if (context.hasLocalDuckDB) return 'local-duckdb';
      if (context.hasServerSupport) return 'server';
    } else {
      // Large dataset or unknown size: prefer server
      if (context.hasServerSupport) return 'server';
      if (context.hasDuckDBWasm) return 'duckdb-wasm';
      if (context.hasLocalDuckDB) return 'local-duckdb';
    }
  }

  // Walk fallback order
  for (const engine of config.fallbackOrder) {
    if (engine !== 'auto' && isAvailable(engine)) {
      return engine;
    }
  }

  // Ultimate fallback
  return 'server';
}

// ========================================================================
// selectEngineForFeature
// ========================================================================

/**
 * Selects the execution engine for a specific feature. If the feature has
 * an explicit override in `config.features`, that engine is used (if available).
 * Otherwise falls back to the standard `selectExecutionEngine` logic.
 */
export function selectEngineForFeature(
  config: ExecutionStrategyConfig,
  context: ExecutionContext,
  feature: string,
): ExecutionEngine {
  const featureEngine = config.features?.[feature];
  if (featureEngine && featureEngine !== 'auto') {
    const isAvailable =
      (featureEngine === 'server' && context.hasServerSupport) ||
      (featureEngine === 'duckdb-wasm' && context.hasDuckDBWasm) ||
      (featureEngine === 'local-duckdb' && context.hasLocalDuckDB);
    if (isAvailable) return featureEngine;
  }
  return selectExecutionEngine(config, context);
}
