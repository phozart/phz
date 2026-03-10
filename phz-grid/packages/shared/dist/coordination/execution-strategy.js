/**
 * @phozart/phz-shared — Execution Strategy (A-2.06)
 *
 * Automatic execution engine selection. Determines which query execution
 * backend to use based on configuration, data size, and available capabilities.
 *
 * Pure functions and type definitions only — no side effects.
 */
// ========================================================================
// createDefaultExecutionStrategy
// ========================================================================
/**
 * Creates a default execution strategy configuration.
 * Defaults to `auto` with a fallback chain of server -> duckdb-wasm -> local-duckdb.
 */
export function createDefaultExecutionStrategy(overrides) {
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
export function selectExecutionEngine(config, context) {
    const isAvailable = (engine) => {
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
            if (context.hasDuckDBWasm)
                return 'duckdb-wasm';
            if (context.hasLocalDuckDB)
                return 'local-duckdb';
            if (context.hasServerSupport)
                return 'server';
        }
        else {
            // Large dataset or unknown size: prefer server
            if (context.hasServerSupport)
                return 'server';
            if (context.hasDuckDBWasm)
                return 'duckdb-wasm';
            if (context.hasLocalDuckDB)
                return 'local-duckdb';
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
export function selectEngineForFeature(config, context, feature) {
    const featureEngine = config.features?.[feature];
    if (featureEngine && featureEngine !== 'auto') {
        const isAvailable = (featureEngine === 'server' && context.hasServerSupport) ||
            (featureEngine === 'duckdb-wasm' && context.hasDuckDBWasm) ||
            (featureEngine === 'local-duckdb' && context.hasLocalDuckDB);
        if (isAvailable)
            return featureEngine;
    }
    return selectExecutionEngine(config, context);
}
//# sourceMappingURL=execution-strategy.js.map