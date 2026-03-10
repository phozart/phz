import { describe, it, expect, beforeEach } from 'vitest';
import {
  initialDataConfigPanelState,
  addDataSource,
  removeDataSource,
  selectConfigDataSource,
  toggleDataSourceEnabled,
  addFieldAlias,
  removeFieldAlias,
  setRefreshInterval,
  setLoadingStrategy,
  setMaxRows,
  getSelectedSource,
  getEnabledSources,
  resolveFieldName,
  validateDataConfig,
  _resetSourceCounter,
  REFRESH_PRESETS,
} from '../authoring/data-config-panel-state.js';

beforeEach(() => _resetSourceCounter());

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

describe('initialDataConfigPanelState', () => {
  it('creates empty state', () => {
    const state = initialDataConfigPanelState();
    expect(state.sources).toHaveLength(0);
    expect(state.defaultLoadingStrategy).toBe('preload');
    expect(state.defaultRefreshIntervalMs).toBe(300_000);
  });
});

// ---------------------------------------------------------------------------
// Source management
// ---------------------------------------------------------------------------

describe('source management', () => {
  it('adds a data source', () => {
    let state = initialDataConfigPanelState();
    state = addDataSource(state, 'ds-sales', 'Sales DB');
    expect(state.sources).toHaveLength(1);
    expect(state.sources[0].name).toBe('Sales DB');
    expect(state.sources[0].dataSourceId).toBe('ds-sales');
    expect(state.sources[0].enabled).toBe(true);
    expect(state.selectedSourceId).toBe(state.sources[0].id);
  });

  it('removes a data source', () => {
    let state = initialDataConfigPanelState();
    state = addDataSource(state, 'ds-1', 'Source 1');
    const id = state.sources[0].id;
    state = removeDataSource(state, id);
    expect(state.sources).toHaveLength(0);
    expect(state.selectedSourceId).toBeUndefined();
  });

  it('selects a data source', () => {
    let state = initialDataConfigPanelState();
    state = addDataSource(state, 'ds-1', 'Source 1');
    state = addDataSource(state, 'ds-2', 'Source 2');
    state = selectConfigDataSource(state, state.sources[0].id);
    expect(state.selectedSourceId).toBe(state.sources[0].id);
  });

  it('select does nothing for unknown id', () => {
    const state = initialDataConfigPanelState();
    expect(selectConfigDataSource(state, 'unknown').selectedSourceId).toBeUndefined();
  });

  it('toggles enabled status', () => {
    let state = initialDataConfigPanelState();
    state = addDataSource(state, 'ds-1', 'Source 1');
    const id = state.sources[0].id;
    state = toggleDataSourceEnabled(state, id);
    expect(state.sources[0].enabled).toBe(false);
    state = toggleDataSourceEnabled(state, id);
    expect(state.sources[0].enabled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Field aliases
// ---------------------------------------------------------------------------

describe('field aliases', () => {
  it('adds a field alias', () => {
    let state = initialDataConfigPanelState();
    state = addDataSource(state, 'ds-1', 'Source 1');
    const id = state.sources[0].id;
    state = addFieldAlias(state, id, 'revenue', 'Total Revenue');
    expect(state.sources[0].fieldAliases).toHaveLength(1);
    expect(state.sources[0].fieldAliases[0].alias).toBe('Total Revenue');
  });

  it('replaces existing alias for same field', () => {
    let state = initialDataConfigPanelState();
    state = addDataSource(state, 'ds-1', 'Source 1');
    const id = state.sources[0].id;
    state = addFieldAlias(state, id, 'revenue', 'Rev');
    state = addFieldAlias(state, id, 'revenue', 'Total Revenue');
    expect(state.sources[0].fieldAliases).toHaveLength(1);
    expect(state.sources[0].fieldAliases[0].alias).toBe('Total Revenue');
  });

  it('removes a field alias', () => {
    let state = initialDataConfigPanelState();
    state = addDataSource(state, 'ds-1', 'Source 1');
    const id = state.sources[0].id;
    state = addFieldAlias(state, id, 'revenue', 'Rev');
    state = removeFieldAlias(state, id, 'revenue');
    expect(state.sources[0].fieldAliases).toHaveLength(0);
  });

  it('resolveFieldName returns alias', () => {
    let state = initialDataConfigPanelState();
    state = addDataSource(state, 'ds-1', 'Source 1');
    const id = state.sources[0].id;
    state = addFieldAlias(state, id, 'revenue', 'Total Revenue');
    expect(resolveFieldName(state.sources[0], 'revenue')).toBe('Total Revenue');
    expect(resolveFieldName(state.sources[0], 'cost')).toBe('cost');
  });
});

// ---------------------------------------------------------------------------
// Refresh interval
// ---------------------------------------------------------------------------

describe('refresh interval', () => {
  it('sets refresh interval', () => {
    let state = initialDataConfigPanelState();
    state = addDataSource(state, 'ds-1', 'Source 1');
    const id = state.sources[0].id;
    state = setRefreshInterval(state, id, 60_000);
    expect(state.sources[0].refreshIntervalMs).toBe(60_000);
  });

  it('rejects negative interval', () => {
    let state = initialDataConfigPanelState();
    state = addDataSource(state, 'ds-1', 'Source 1');
    const id = state.sources[0].id;
    const prev = state.sources[0].refreshIntervalMs;
    state = setRefreshInterval(state, id, -1);
    expect(state.sources[0].refreshIntervalMs).toBe(prev);
  });

  it('REFRESH_PRESETS are defined', () => {
    expect(REFRESH_PRESETS.length).toBeGreaterThan(0);
    expect(REFRESH_PRESETS[0].label).toBe('Manual');
    expect(REFRESH_PRESETS[0].ms).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Loading strategy
// ---------------------------------------------------------------------------

describe('loading strategy', () => {
  it('sets loading strategy', () => {
    let state = initialDataConfigPanelState();
    state = addDataSource(state, 'ds-1', 'Source 1');
    const id = state.sources[0].id;
    state = setLoadingStrategy(state, id, 'lazy');
    expect(state.sources[0].loadingStrategy).toBe('lazy');
  });
});

// ---------------------------------------------------------------------------
// Max rows
// ---------------------------------------------------------------------------

describe('max rows', () => {
  it('sets max rows', () => {
    let state = initialDataConfigPanelState();
    state = addDataSource(state, 'ds-1', 'Source 1');
    const id = state.sources[0].id;
    state = setMaxRows(state, id, 10000);
    expect(state.sources[0].maxRows).toBe(10000);
  });

  it('rejects negative', () => {
    let state = initialDataConfigPanelState();
    state = addDataSource(state, 'ds-1', 'Source 1');
    const id = state.sources[0].id;
    state = setMaxRows(state, id, -1);
    expect(state.sources[0].maxRows).toBeUndefined();
  });

  it('allows undefined (no limit)', () => {
    let state = initialDataConfigPanelState();
    state = addDataSource(state, 'ds-1', 'Source 1');
    const id = state.sources[0].id;
    state = setMaxRows(state, id, 100);
    state = setMaxRows(state, id, undefined);
    expect(state.sources[0].maxRows).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Getters
// ---------------------------------------------------------------------------

describe('getters', () => {
  it('getSelectedSource returns current source', () => {
    let state = initialDataConfigPanelState();
    state = addDataSource(state, 'ds-1', 'Source 1');
    expect(getSelectedSource(state)?.name).toBe('Source 1');
  });

  it('getEnabledSources filters disabled', () => {
    let state = initialDataConfigPanelState();
    state = addDataSource(state, 'ds-1', 'Source 1');
    state = addDataSource(state, 'ds-2', 'Source 2');
    state = toggleDataSourceEnabled(state, state.sources[0].id);
    expect(getEnabledSources(state)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

describe('validateDataConfig', () => {
  it('fails with no sources', () => {
    const state = initialDataConfigPanelState();
    const result = validateDataConfig(state);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('passes with valid source', () => {
    let state = initialDataConfigPanelState();
    state = addDataSource(state, 'ds-1', 'Source 1');
    const result = validateDataConfig(state);
    expect(result.valid).toBe(true);
  });

  it('fails when all sources disabled', () => {
    let state = initialDataConfigPanelState();
    state = addDataSource(state, 'ds-1', 'Source 1');
    state = toggleDataSourceEnabled(state, state.sources[0].id);
    const result = validateDataConfig(state);
    expect(result.valid).toBe(false);
  });
});
