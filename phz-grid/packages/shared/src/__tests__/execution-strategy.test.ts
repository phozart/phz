/**
 * Tests for ExecutionStrategy — automatic execution engine selection.
 *
 * Covers createDefaultExecutionStrategy, selectExecutionEngine,
 * selectEngineForFeature, and all branching paths.
 */
import {
  createDefaultExecutionStrategy,
  selectExecutionEngine,
  selectEngineForFeature,
} from '@phozart/shared/coordination';
import type {
  ExecutionStrategyConfig,
  ExecutionContext,
} from '@phozart/shared/coordination';

// ========================================================================
// createDefaultExecutionStrategy
// ========================================================================

describe('createDefaultExecutionStrategy', () => {
  it('creates default config with auto preferred', () => {
    const config = createDefaultExecutionStrategy();
    expect(config.preferred).toBe('auto');
    expect(config.fallbackOrder).toEqual(['server', 'duckdb-wasm', 'local-duckdb']);
    expect(config.rowThresholdForLocal).toBe(100_000);
  });

  it('applies overrides', () => {
    const config = createDefaultExecutionStrategy({
      preferred: 'server',
      rowThresholdForLocal: 50_000,
    });
    expect(config.preferred).toBe('server');
    expect(config.rowThresholdForLocal).toBe(50_000);
    // Fallback order should still be default
    expect(config.fallbackOrder).toEqual(['server', 'duckdb-wasm', 'local-duckdb']);
  });

  it('overrides fallbackOrder', () => {
    const config = createDefaultExecutionStrategy({
      fallbackOrder: ['local-duckdb', 'server'],
    });
    expect(config.fallbackOrder).toEqual(['local-duckdb', 'server']);
  });

  it('supports features override', () => {
    const config = createDefaultExecutionStrategy({
      features: { pivot: 'server' },
    });
    expect(config.features?.pivot).toBe('server');
  });

  it('returns undefined features when not overridden', () => {
    const config = createDefaultExecutionStrategy();
    expect(config.features).toBeUndefined();
  });
});

// ========================================================================
// selectExecutionEngine — non-auto preferred
// ========================================================================

describe('selectExecutionEngine — non-auto preferred', () => {
  it('uses preferred engine when available', () => {
    const config = createDefaultExecutionStrategy({ preferred: 'server' });
    const ctx: ExecutionContext = {
      hasServerSupport: true,
      hasDuckDBWasm: true,
      hasLocalDuckDB: false,
    };
    expect(selectExecutionEngine(config, ctx)).toBe('server');
  });

  it('uses preferred duckdb-wasm when available', () => {
    const config = createDefaultExecutionStrategy({ preferred: 'duckdb-wasm' });
    const ctx: ExecutionContext = {
      hasServerSupport: true,
      hasDuckDBWasm: true,
      hasLocalDuckDB: false,
    };
    expect(selectExecutionEngine(config, ctx)).toBe('duckdb-wasm');
  });

  it('uses preferred local-duckdb when available', () => {
    const config = createDefaultExecutionStrategy({ preferred: 'local-duckdb' });
    const ctx: ExecutionContext = {
      hasServerSupport: false,
      hasDuckDBWasm: false,
      hasLocalDuckDB: true,
    };
    expect(selectExecutionEngine(config, ctx)).toBe('local-duckdb');
  });

  it('falls through to fallback when preferred is unavailable', () => {
    const config = createDefaultExecutionStrategy({ preferred: 'duckdb-wasm' });
    const ctx: ExecutionContext = {
      hasServerSupport: true,
      hasDuckDBWasm: false,
      hasLocalDuckDB: false,
    };
    expect(selectExecutionEngine(config, ctx)).toBe('server');
  });

  it('falls to second fallback when first is unavailable', () => {
    const config = createDefaultExecutionStrategy({
      preferred: 'local-duckdb',
      fallbackOrder: ['duckdb-wasm', 'server'],
    });
    const ctx: ExecutionContext = {
      hasServerSupport: true,
      hasDuckDBWasm: false,
      hasLocalDuckDB: false,
    };
    expect(selectExecutionEngine(config, ctx)).toBe('server');
  });
});

// ========================================================================
// selectExecutionEngine — auto mode, small dataset
// ========================================================================

describe('selectExecutionEngine — auto mode, small dataset', () => {
  const config = createDefaultExecutionStrategy();

  it('prefers duckdb-wasm for small datasets', () => {
    const ctx: ExecutionContext = {
      rowCount: 50_000,
      hasServerSupport: true,
      hasDuckDBWasm: true,
      hasLocalDuckDB: true,
    };
    expect(selectExecutionEngine(config, ctx)).toBe('duckdb-wasm');
  });

  it('falls to local-duckdb when duckdb-wasm unavailable for small datasets', () => {
    const ctx: ExecutionContext = {
      rowCount: 10_000,
      hasServerSupport: true,
      hasDuckDBWasm: false,
      hasLocalDuckDB: true,
    };
    expect(selectExecutionEngine(config, ctx)).toBe('local-duckdb');
  });

  it('falls to server when no local engines for small datasets', () => {
    const ctx: ExecutionContext = {
      rowCount: 10_000,
      hasServerSupport: true,
      hasDuckDBWasm: false,
      hasLocalDuckDB: false,
    };
    expect(selectExecutionEngine(config, ctx)).toBe('server');
  });

  it('uses exact threshold boundary (at threshold = local)', () => {
    const ctx: ExecutionContext = {
      rowCount: 100_000,
      hasServerSupport: true,
      hasDuckDBWasm: true,
      hasLocalDuckDB: false,
    };
    expect(selectExecutionEngine(config, ctx)).toBe('duckdb-wasm');
  });

  it('uses custom rowThresholdForLocal', () => {
    const customConfig = createDefaultExecutionStrategy({ rowThresholdForLocal: 1000 });
    const ctx: ExecutionContext = {
      rowCount: 500,
      hasServerSupport: true,
      hasDuckDBWasm: true,
      hasLocalDuckDB: false,
    };
    expect(selectExecutionEngine(customConfig, ctx)).toBe('duckdb-wasm');
  });
});

// ========================================================================
// selectExecutionEngine — auto mode, large dataset
// ========================================================================

describe('selectExecutionEngine — auto mode, large dataset', () => {
  const config = createDefaultExecutionStrategy();

  it('prefers server for large datasets', () => {
    const ctx: ExecutionContext = {
      rowCount: 500_000,
      hasServerSupport: true,
      hasDuckDBWasm: true,
      hasLocalDuckDB: true,
    };
    expect(selectExecutionEngine(config, ctx)).toBe('server');
  });

  it('falls to duckdb-wasm when server unavailable for large datasets', () => {
    const ctx: ExecutionContext = {
      rowCount: 500_000,
      hasServerSupport: false,
      hasDuckDBWasm: true,
      hasLocalDuckDB: false,
    };
    expect(selectExecutionEngine(config, ctx)).toBe('duckdb-wasm');
  });

  it('falls to local-duckdb when server and wasm unavailable for large datasets', () => {
    const ctx: ExecutionContext = {
      rowCount: 500_000,
      hasServerSupport: false,
      hasDuckDBWasm: false,
      hasLocalDuckDB: true,
    };
    expect(selectExecutionEngine(config, ctx)).toBe('local-duckdb');
  });
});

// ========================================================================
// selectExecutionEngine — auto mode, unknown row count
// ========================================================================

describe('selectExecutionEngine — auto mode, unknown row count', () => {
  const config = createDefaultExecutionStrategy();

  it('prefers server when rowCount is undefined (large dataset path)', () => {
    const ctx: ExecutionContext = {
      hasServerSupport: true,
      hasDuckDBWasm: true,
      hasLocalDuckDB: true,
    };
    expect(selectExecutionEngine(config, ctx)).toBe('server');
  });

  it('falls to duckdb-wasm when server unavailable and rowCount unknown', () => {
    const ctx: ExecutionContext = {
      hasServerSupport: false,
      hasDuckDBWasm: true,
      hasLocalDuckDB: true,
    };
    expect(selectExecutionEngine(config, ctx)).toBe('duckdb-wasm');
  });
});

// ========================================================================
// selectExecutionEngine — ultimate fallback
// ========================================================================

describe('selectExecutionEngine — ultimate fallback', () => {
  it('returns server when no engines are available', () => {
    const config = createDefaultExecutionStrategy({ preferred: 'duckdb-wasm' });
    const ctx: ExecutionContext = {
      hasServerSupport: false,
      hasDuckDBWasm: false,
      hasLocalDuckDB: false,
    };
    expect(selectExecutionEngine(config, ctx)).toBe('server');
  });

  it('returns server when fallbackOrder is empty and preferred unavailable', () => {
    const config = createDefaultExecutionStrategy({
      preferred: 'duckdb-wasm',
      fallbackOrder: [],
    });
    const ctx: ExecutionContext = {
      hasServerSupport: false,
      hasDuckDBWasm: false,
      hasLocalDuckDB: false,
    };
    expect(selectExecutionEngine(config, ctx)).toBe('server');
  });

  it('skips auto entries in fallbackOrder', () => {
    const config: ExecutionStrategyConfig = {
      preferred: 'duckdb-wasm',
      fallbackOrder: ['auto', 'local-duckdb'],
      rowThresholdForLocal: 100_000,
    };
    const ctx: ExecutionContext = {
      hasServerSupport: false,
      hasDuckDBWasm: false,
      hasLocalDuckDB: true,
    };
    expect(selectExecutionEngine(config, ctx)).toBe('local-duckdb');
  });
});

// ========================================================================
// selectEngineForFeature
// ========================================================================

describe('selectEngineForFeature', () => {
  it('uses feature override when available', () => {
    const config = createDefaultExecutionStrategy({
      features: { pivot: 'server' },
    });
    const ctx: ExecutionContext = {
      rowCount: 1000,
      hasServerSupport: true,
      hasDuckDBWasm: true,
      hasLocalDuckDB: false,
    };
    // Even though auto+small would choose duckdb-wasm, pivot overrides to server
    expect(selectEngineForFeature(config, ctx, 'pivot')).toBe('server');
  });

  it('falls back to standard selection when feature has no override', () => {
    const config = createDefaultExecutionStrategy({
      features: { pivot: 'server' },
    });
    const ctx: ExecutionContext = {
      rowCount: 1000,
      hasServerSupport: true,
      hasDuckDBWasm: true,
      hasLocalDuckDB: false,
    };
    expect(selectEngineForFeature(config, ctx, 'filter')).toBe('duckdb-wasm');
  });

  it('falls back when feature override engine is unavailable', () => {
    const config = createDefaultExecutionStrategy({
      features: { pivot: 'duckdb-wasm' },
    });
    const ctx: ExecutionContext = {
      rowCount: 1000,
      hasServerSupport: true,
      hasDuckDBWasm: false,
      hasLocalDuckDB: false,
    };
    // duckdb-wasm not available, falls back to standard selection
    expect(selectEngineForFeature(config, ctx, 'pivot')).toBe('server');
  });

  it('ignores auto feature overrides', () => {
    const config = createDefaultExecutionStrategy({
      features: { pivot: 'auto' },
    });
    const ctx: ExecutionContext = {
      rowCount: 1000,
      hasServerSupport: true,
      hasDuckDBWasm: true,
      hasLocalDuckDB: false,
    };
    // auto override is skipped, standard auto selection kicks in
    expect(selectEngineForFeature(config, ctx, 'pivot')).toBe('duckdb-wasm');
  });

  it('works with no features defined', () => {
    const config = createDefaultExecutionStrategy();
    const ctx: ExecutionContext = {
      hasServerSupport: true,
      hasDuckDBWasm: true,
      hasLocalDuckDB: false,
    };
    expect(selectEngineForFeature(config, ctx, 'anything')).toBe('server');
  });

  it('uses local-duckdb feature override when available', () => {
    const config = createDefaultExecutionStrategy({
      features: { export: 'local-duckdb' },
    });
    const ctx: ExecutionContext = {
      hasServerSupport: true,
      hasDuckDBWasm: true,
      hasLocalDuckDB: true,
    };
    expect(selectEngineForFeature(config, ctx, 'export')).toBe('local-duckdb');
  });
});
