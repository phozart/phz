/**
 * Tests for Coordination module — FilterContext, InteractionBus,
 * LoadingState, NavigationEvents, DashboardDataPipeline, QueryCoordinator,
 * ExecutionStrategy, ServerMode, ExportConfig, FilterAutoSave.
 */
import {
  createFilterContext,
  resolveFieldForSource,
  createDebouncedFilterDispatch,
  createInteractionBus,
  createInitialLoadingState,
  updateLoadingProgress,
  isLoadingComplete,
  isLoadingError,
  isLoading,
  getLoadingDurationMs,
  resolveNavigationFilters,
  buildNavigationEvent,
  emitNavigationEvent,
  isDashboardDataConfig,
  isDetailSourceConfig,
  isQueryCoordinatorConfig,
  defaultQueryCoordinatorConfig,
  // A-2.04 multi-source data config
  migrateLegacyDataConfig,
  // A-2.05 multi-source loading orchestrator
  createMultiSourceLoadingState,
  updateSourceProgress,
  computeOverallProgress,
  // A-2.06 execution strategy
  createDefaultExecutionStrategy,
  selectExecutionEngine,
  selectEngineForFeature,
  // A-2.07 server mode
  createDefaultServerGridConfig,
  isServerMode,
  hasServerCapability,
  // A-2.08 export config
  createDefaultExportConfig,
  shouldUseAsyncExport,
  isFormatEnabled,
  // A-2.10 filter auto-save
  createDefaultAutoSaveConfig,
  createFilterSnapshot,
  shouldAutoSave,
  pruneHistory,
} from '@phozart/shared/coordination';
import type {
  FilterValue,
  NavigationFilterMapping,
  DashboardDataConfig,
  ExecutionStrategyConfig,
  ExecutionContext,
  MultiSourceLoadingState,
} from '@phozart/shared/coordination';

// ========================================================================
// resolveFieldForSource
// ========================================================================

describe('resolveFieldForSource', () => {
  const mappings = [
    {
      canonicalField: 'region',
      sources: [
        { dataSourceId: 'ds1', field: 'region_code' },
        { dataSourceId: 'ds2', field: 'area' },
      ],
    },
  ];

  it('resolves a mapped field for a known data source', () => {
    expect(resolveFieldForSource('region', 'ds1', mappings)).toBe('region_code');
    expect(resolveFieldForSource('region', 'ds2', mappings)).toBe('area');
  });

  it('returns canonical field when data source is not in mappings', () => {
    expect(resolveFieldForSource('region', 'ds3', mappings)).toBe('region');
  });

  it('returns canonical field when no mapping exists for the field', () => {
    expect(resolveFieldForSource('name', 'ds1', mappings)).toBe('name');
  });

  it('returns canonical field when mappings is empty', () => {
    expect(resolveFieldForSource('name', 'ds1', [])).toBe('name');
  });
});

// ========================================================================
// createFilterContext
// ========================================================================

describe('createFilterContext', () => {
  it('creates a context with empty initial state', () => {
    const ctx = createFilterContext();
    const state = ctx.getState();
    expect(state.values.size).toBe(0);
    expect(state.activeFilterIds.size).toBe(0);
    expect(state.crossFilters).toEqual([]);
    expect(state.source).toBe('default');
  });

  it('sets and gets a filter', () => {
    const ctx = createFilterContext();
    const filter: FilterValue = {
      filterId: 'f1',
      field: 'status',
      operator: 'equals',
      value: 'active',
      label: 'Status: active',
    };
    ctx.setFilter(filter);
    const state = ctx.getState();
    expect(state.values.get('f1')).toEqual(filter);
    expect(state.activeFilterIds.has('f1')).toBe(true);
    expect(state.source).toBe('user');
  });

  it('clears a filter', () => {
    const ctx = createFilterContext();
    ctx.setFilter({ filterId: 'f1', field: 'x', operator: 'equals', value: 1, label: '' });
    ctx.clearFilter('f1');
    const state = ctx.getState();
    expect(state.values.size).toBe(0);
    expect(state.activeFilterIds.size).toBe(0);
  });

  it('clearFilter does nothing for unknown filterId', () => {
    const ctx = createFilterContext();
    const handler = vi.fn();
    ctx.subscribe(handler);
    ctx.clearFilter('nonexistent');
    expect(handler).not.toHaveBeenCalled();
  });

  it('clears all filters and cross-filters', () => {
    const ctx = createFilterContext();
    ctx.setFilter({ filterId: 'f1', field: 'x', operator: 'equals', value: 1, label: '' });
    ctx.applyCrossFilter({ sourceWidgetId: 'w1', field: 'y', value: 2, timestamp: Date.now() });
    ctx.clearAll();
    const state = ctx.getState();
    expect(state.values.size).toBe(0);
    expect(state.crossFilters).toEqual([]);
  });

  it('manages cross-filters', () => {
    const ctx = createFilterContext();
    ctx.applyCrossFilter({ sourceWidgetId: 'w1', field: 'region', value: 'US', timestamp: 100 });
    ctx.applyCrossFilter({ sourceWidgetId: 'w2', field: 'status', value: 'active', timestamp: 200 });

    const state = ctx.getState();
    expect(state.crossFilters).toHaveLength(2);

    // Replacing cross filter from same widget
    ctx.applyCrossFilter({ sourceWidgetId: 'w1', field: 'region', value: 'EU', timestamp: 300 });
    const state2 = ctx.getState();
    expect(state2.crossFilters).toHaveLength(2);
    expect(state2.crossFilters.find(cf => cf.sourceWidgetId === 'w1')?.value).toBe('EU');
  });

  it('clears cross-filters by widget ID', () => {
    const ctx = createFilterContext();
    ctx.applyCrossFilter({ sourceWidgetId: 'w1', field: 'x', value: 1, timestamp: 100 });
    ctx.clearCrossFilter('w1');
    expect(ctx.getState().crossFilters).toHaveLength(0);
  });

  it('resolves filters with cross-filters', () => {
    const ctx = createFilterContext();
    ctx.setFilter({ filterId: 'f1', field: 'region', operator: 'equals', value: 'US', label: '' });
    ctx.applyCrossFilter({ sourceWidgetId: 'w1', field: 'status', value: 'active', timestamp: 100 });

    const resolved = ctx.resolveFilters();
    expect(resolved).toHaveLength(2);
    expect(resolved[0].field).toBe('region');
    expect(resolved[1].field).toBe('status');
  });

  it('cross-filters exclude the requesting widget', () => {
    const ctx = createFilterContext();
    ctx.applyCrossFilter({ sourceWidgetId: 'w1', field: 'x', value: 1, timestamp: 100 });
    const resolved = ctx.resolveFilters('w1');
    expect(resolved).toHaveLength(0);
  });

  it('cross-filters do not override user-set filters on same field', () => {
    const ctx = createFilterContext();
    ctx.setFilter({ filterId: 'f1', field: 'status', operator: 'equals', value: 'active', label: '' });
    ctx.applyCrossFilter({ sourceWidgetId: 'w1', field: 'status', value: 'inactive', timestamp: 100 });
    const resolved = ctx.resolveFilters();
    expect(resolved).toHaveLength(1);
    expect(resolved[0].value).toBe('active'); // user filter wins
  });

  it('includes dashboard defaults for unfilled fields', () => {
    const ctx = createFilterContext({
      dashboardFilters: [
        {
          id: 'df1',
          field: 'region',
          dataSourceId: 'ds1',
          label: 'Region',
          filterType: 'select',
          defaultValue: 'US',
          required: false,
          appliesTo: [],
        },
      ],
    });
    const resolved = ctx.resolveFilters();
    expect(resolved).toHaveLength(1);
    expect(resolved[0].field).toBe('region');
    expect(resolved[0].value).toBe('US');
  });

  it('dashboard defaults are overridden by user filters', () => {
    const ctx = createFilterContext({
      dashboardFilters: [
        {
          id: 'df1',
          field: 'region',
          dataSourceId: 'ds1',
          label: 'Region',
          filterType: 'select',
          defaultValue: 'US',
          required: false,
          appliesTo: [],
        },
      ],
    });
    ctx.setFilter({ filterId: 'f1', field: 'region', operator: 'equals', value: 'EU', label: '' });
    const resolved = ctx.resolveFilters();
    expect(resolved).toHaveLength(1);
    expect(resolved[0].value).toBe('EU');
  });

  it('resolveFiltersForSource maps fields via field mappings', () => {
    const ctx = createFilterContext({
      fieldMappings: [
        { canonicalField: 'region', sources: [{ dataSourceId: 'ds1', field: 'region_code' }] },
      ],
    });
    ctx.setFilter({ filterId: 'f1', field: 'region', operator: 'equals', value: 'US', label: '' });
    const resolved = ctx.resolveFiltersForSource('ds1');
    expect(resolved[0].field).toBe('region_code');
  });

  it('resolveFiltersForSource returns canonical when no mapping', () => {
    const ctx = createFilterContext();
    ctx.setFilter({ filterId: 'f1', field: 'region', operator: 'equals', value: 'US', label: '' });
    const resolved = ctx.resolveFiltersForSource('ds1');
    expect(resolved[0].field).toBe('region');
  });

  it('subscribe notifies listeners', () => {
    const ctx = createFilterContext();
    const handler = vi.fn();
    ctx.subscribe(handler);
    ctx.setFilter({ filterId: 'f1', field: 'x', operator: 'equals', value: 1, label: '' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('unsubscribe stops notifications', () => {
    const ctx = createFilterContext();
    const handler = vi.fn();
    const unsub = ctx.subscribe(handler);
    unsub();
    ctx.setFilter({ filterId: 'f1', field: 'x', operator: 'equals', value: 1, label: '' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('setSource updates the source field', () => {
    const ctx = createFilterContext();
    ctx.setSource('url');
    expect(ctx.getState().source).toBe('url');
  });

  it('getState returns defensive copies', () => {
    const ctx = createFilterContext();
    ctx.setFilter({ filterId: 'f1', field: 'x', operator: 'equals', value: 1, label: '' });
    const s1 = ctx.getState();
    const s2 = ctx.getState();
    expect(s1.values).not.toBe(s2.values);
    expect(s1.activeFilterIds).not.toBe(s2.activeFilterIds);
  });
});

// ========================================================================
// createDebouncedFilterDispatch
// ========================================================================

describe('createDebouncedFilterDispatch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces calls to the handler', () => {
    const handler = vi.fn();
    const dispatch = createDebouncedFilterDispatch(handler, 100);

    dispatch('a');
    dispatch('b');
    dispatch('c');

    expect(handler).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith('c');
  });

  it('cancel prevents the handler from firing', () => {
    const handler = vi.fn();
    const dispatch = createDebouncedFilterDispatch(handler, 100);

    dispatch('x');
    dispatch.cancel();

    vi.advanceTimersByTime(200);
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not fire if signal is already aborted', () => {
    const handler = vi.fn();
    const dispatch = createDebouncedFilterDispatch(handler, 100);
    const controller = new AbortController();
    controller.abort();

    dispatch('x', controller.signal);
    vi.advanceTimersByTime(200);
    expect(handler).not.toHaveBeenCalled();
  });
});

// ========================================================================
// createInteractionBus
// ========================================================================

describe('createInteractionBus', () => {
  it('emits and receives events', () => {
    const bus = createInteractionBus();
    const handler = vi.fn();
    bus.on('drill-through', handler);
    bus.emit({ type: 'drill-through', sourceWidgetId: 'w1', field: 'id', value: 42 });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ type: 'drill-through', sourceWidgetId: 'w1', field: 'id', value: 42 });
  });

  it('does not call handlers for other event types', () => {
    const bus = createInteractionBus();
    const handler = vi.fn();
    bus.on('drill-through', handler);
    bus.emit({ type: 'navigate', targetArtifactId: 'x' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('on returns an unsubscribe function', () => {
    const bus = createInteractionBus();
    const handler = vi.fn();
    const unsub = bus.on('navigate', handler);
    unsub();
    bus.emit({ type: 'navigate', targetArtifactId: 'x' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('off removes a specific handler', () => {
    const bus = createInteractionBus();
    const handler = vi.fn();
    bus.on('navigate', handler);
    bus.off('navigate', handler);
    bus.emit({ type: 'navigate', targetArtifactId: 'x' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('supports multiple handlers for the same event type', () => {
    const bus = createInteractionBus();
    const h1 = vi.fn();
    const h2 = vi.fn();
    bus.on('navigate', h1);
    bus.on('navigate', h2);
    bus.emit({ type: 'navigate', targetArtifactId: 'x' });
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });
});

// ========================================================================
// Loading State
// ========================================================================

describe('createInitialLoadingState', () => {
  it('creates idle state with 0 progress', () => {
    const state = createInitialLoadingState();
    expect(state.phase).toBe('idle');
    expect(state.progress).toBe(0);
    expect(state.message).toBeUndefined();
    expect(state.error).toBeUndefined();
    expect(state.startedAt).toBeUndefined();
    expect(state.completedAt).toBeUndefined();
  });
});

describe('updateLoadingProgress', () => {
  it('updates phase and progress', () => {
    const state = createInitialLoadingState();
    const next = updateLoadingProgress(state, { phase: 'preloading', progress: 25 });
    expect(next.phase).toBe('preloading');
    expect(next.progress).toBe(25);
    expect(next.startedAt).toBeDefined();
  });

  it('does not override startedAt if already set', () => {
    const state = { phase: 'preloading' as const, progress: 50, startedAt: 1000 };
    const next = updateLoadingProgress(state, { phase: 'preloading', progress: 75 });
    expect(next.startedAt).toBe(1000);
  });

  it('sets completedAt on full-complete', () => {
    const state = { phase: 'full-loading' as const, progress: 90, startedAt: 1000 };
    const next = updateLoadingProgress(state, { phase: 'full-complete', progress: 100 });
    expect(next.completedAt).toBeDefined();
    expect(next.phase).toBe('full-complete');
  });

  it('sets completedAt on error', () => {
    const state = { phase: 'preloading' as const, progress: 25, startedAt: 1000 };
    const next = updateLoadingProgress(state, { phase: 'error', error: 'Failed' });
    expect(next.completedAt).toBeDefined();
    expect(next.error).toBe('Failed');
  });

  it('clamps progress to [0, 100]', () => {
    const state = createInitialLoadingState();
    const over = updateLoadingProgress(state, { progress: 150 });
    expect(over.progress).toBe(100);
    const under = updateLoadingProgress(state, { progress: -10 });
    expect(under.progress).toBe(0);
  });
});

describe('isLoadingComplete', () => {
  it('returns true for full-complete', () => {
    expect(isLoadingComplete({ phase: 'full-complete', progress: 100 })).toBe(true);
  });

  it('returns false for other phases', () => {
    expect(isLoadingComplete({ phase: 'idle', progress: 0 })).toBe(false);
    expect(isLoadingComplete({ phase: 'preloading', progress: 50 })).toBe(false);
    expect(isLoadingComplete({ phase: 'error', progress: 0 })).toBe(false);
  });
});

describe('isLoadingError', () => {
  it('returns true for error phase', () => {
    expect(isLoadingError({ phase: 'error', progress: 0 })).toBe(true);
  });

  it('returns false for non-error phases', () => {
    expect(isLoadingError({ phase: 'idle', progress: 0 })).toBe(false);
  });
});

describe('isLoading', () => {
  it('returns true for preloading and full-loading', () => {
    expect(isLoading({ phase: 'preloading', progress: 10 })).toBe(true);
    expect(isLoading({ phase: 'full-loading', progress: 50 })).toBe(true);
  });

  it('returns false for idle, complete, error', () => {
    expect(isLoading({ phase: 'idle', progress: 0 })).toBe(false);
    expect(isLoading({ phase: 'full-complete', progress: 100 })).toBe(false);
    expect(isLoading({ phase: 'error', progress: 0 })).toBe(false);
  });
});

describe('getLoadingDurationMs', () => {
  it('returns undefined when startedAt is not set', () => {
    expect(getLoadingDurationMs({ phase: 'idle', progress: 0 })).toBeUndefined();
  });

  it('calculates duration with completedAt', () => {
    expect(getLoadingDurationMs({ phase: 'full-complete', progress: 100, startedAt: 1000, completedAt: 5000 })).toBe(4000);
  });

  it('calculates duration using Date.now() when not completed', () => {
    const start = Date.now() - 500;
    const duration = getLoadingDurationMs({ phase: 'preloading', progress: 50, startedAt: start });
    expect(duration).toBeGreaterThanOrEqual(500);
    expect(duration).toBeLessThan(600);
  });
});

// ========================================================================
// Navigation Events
// ========================================================================

describe('resolveNavigationFilters', () => {
  it('maps source values to target filter definition IDs', () => {
    const mappings: NavigationFilterMapping[] = [
      { sourceField: 'region', targetFilterDefinitionId: 'fd-region', transform: 'passthrough' },
      { sourceField: 'year', targetFilterDefinitionId: 'fd-year', transform: 'passthrough' },
    ];
    const result = resolveNavigationFilters(mappings, { region: 'US', year: 2026 });
    expect(result).toEqual({ 'fd-region': 'US', 'fd-year': 2026 });
  });

  it('skips undefined source values', () => {
    const mappings: NavigationFilterMapping[] = [
      { sourceField: 'region', targetFilterDefinitionId: 'fd-region', transform: 'passthrough' },
    ];
    const result = resolveNavigationFilters(mappings, {});
    expect(result).toEqual({});
  });

  it('handles empty mappings', () => {
    const result = resolveNavigationFilters([], { region: 'US' });
    expect(result).toEqual({});
  });
});

describe('buildNavigationEvent', () => {
  it('builds a navigation event from mappings and source values', () => {
    const mappings: NavigationFilterMapping[] = [
      { sourceField: 'region', targetFilterDefinitionId: 'fd-region', transform: 'passthrough' },
    ];
    const event = buildNavigationEvent('dash-1', mappings, { region: 'US' });
    expect(event.type).toBe('navigate');
    expect(event.targetArtifactId).toBe('dash-1');
    expect(event.filters).toEqual([{ filterDefinitionId: 'fd-region', value: 'US' }]);
  });

  it('builds event with empty filters when no values match', () => {
    const event = buildNavigationEvent('dash-1', [], {});
    expect(event.filters).toEqual([]);
  });
});

describe('emitNavigationEvent', () => {
  it('emits a navigate event on the interaction bus', () => {
    const bus = createInteractionBus();
    const handler = vi.fn();
    bus.on('navigate', handler);

    const mappings: NavigationFilterMapping[] = [
      { sourceField: 'id', targetFilterDefinitionId: 'fd-id', transform: 'passthrough' },
    ];
    emitNavigationEvent(bus, 'report-1', mappings, { id: 42 });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].targetArtifactId).toBe('report-1');
  });
});

// ========================================================================
// Dashboard Data Pipeline type guards
// ========================================================================

describe('isDashboardDataConfig', () => {
  it('returns true for valid config', () => {
    const config = {
      preload: { query: { source: 'ds1', fields: ['a'] } },
      fullLoad: { query: { source: 'ds1', fields: ['a', 'b'] } },
    };
    expect(isDashboardDataConfig(config)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isDashboardDataConfig(null)).toBe(false);
  });

  it('returns false for missing preload', () => {
    expect(isDashboardDataConfig({ fullLoad: { query: {} } })).toBe(false);
  });

  it('returns false for missing fullLoad', () => {
    expect(isDashboardDataConfig({ preload: { query: {} } })).toBe(false);
  });

  it('returns false when preload.query is missing', () => {
    expect(isDashboardDataConfig({ preload: {}, fullLoad: { query: {} } })).toBe(false);
  });

  it('returns false when fullLoad.query is missing', () => {
    expect(isDashboardDataConfig({ preload: { query: {} }, fullLoad: {} })).toBe(false);
  });
});

describe('isDetailSourceConfig', () => {
  it('returns true for valid config', () => {
    const config = {
      id: 'd1',
      name: 'Detail',
      dataSourceId: 'ds1',
      filterMapping: [],
      baseQuery: { source: 'ds1', fields: [] },
      trigger: 'user-action',
    };
    expect(isDetailSourceConfig(config)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isDetailSourceConfig(null)).toBe(false);
  });

  it('returns false when id is missing', () => {
    expect(isDetailSourceConfig({
      name: 'D', dataSourceId: 'ds1', filterMapping: [], baseQuery: {}, trigger: 'user-action',
    })).toBe(false);
  });

  it('returns false when baseQuery is missing', () => {
    expect(isDetailSourceConfig({
      id: 'd1', name: 'D', dataSourceId: 'ds1', filterMapping: [], trigger: 'user-action',
    })).toBe(false);
  });

  it('returns false when trigger is missing', () => {
    expect(isDetailSourceConfig({
      id: 'd1', name: 'D', dataSourceId: 'ds1', filterMapping: [], baseQuery: {},
    })).toBe(false);
  });
});

// ========================================================================
// Query Coordinator
// ========================================================================

describe('defaultQueryCoordinatorConfig', () => {
  it('creates default config', () => {
    const config = defaultQueryCoordinatorConfig();
    expect(config.maxConcurrent).toBe(4);
    expect(config.batchWindowMs).toBe(50);
  });

  it('applies overrides', () => {
    const config = defaultQueryCoordinatorConfig({ maxConcurrent: 8 });
    expect(config.maxConcurrent).toBe(8);
    expect(config.batchWindowMs).toBe(50);
  });
});

describe('isQueryCoordinatorConfig', () => {
  it('returns true for valid config', () => {
    expect(isQueryCoordinatorConfig({ maxConcurrent: 4, batchWindowMs: 50 })).toBe(true);
  });

  it('returns false for null', () => {
    expect(isQueryCoordinatorConfig(null)).toBe(false);
  });

  it('returns false when maxConcurrent is not a number', () => {
    expect(isQueryCoordinatorConfig({ maxConcurrent: '4', batchWindowMs: 50 })).toBe(false);
  });

  it('returns false when batchWindowMs is missing', () => {
    expect(isQueryCoordinatorConfig({ maxConcurrent: 4 })).toBe(false);
  });
});

// ========================================================================
// A-2.04: Multi-source DashboardDataConfig
// ========================================================================

describe('migrateLegacyDataConfig', () => {
  it('wraps legacy preload/fullLoad into sources array', () => {
    const legacy: DashboardDataConfig = {
      preload: { query: { source: 'ds1', fields: ['a'] } },
      fullLoad: { query: { source: 'ds1', fields: ['a', 'b'] } },
    };
    const migrated = migrateLegacyDataConfig(legacy);
    expect(migrated.sources).toHaveLength(1);
    expect(migrated.sources![0].sourceId).toBe('default');
    expect(migrated.sources![0].preload).toEqual(legacy.preload);
    expect(migrated.sources![0].fullLoad).toEqual(legacy.fullLoad);
    // Preserve original fields for backward compat
    expect(migrated.preload).toEqual(legacy.preload);
    expect(migrated.fullLoad).toEqual(legacy.fullLoad);
  });

  it('returns as-is when sources already present', () => {
    const config: DashboardDataConfig = {
      sources: [{ sourceId: 'sales', preload: { query: { source: 'sales', fields: ['x'] } } }],
    };
    const result = migrateLegacyDataConfig(config);
    expect(result).toBe(config); // same reference
  });

  it('returns empty sources when no preload or fullLoad', () => {
    const config: DashboardDataConfig = {};
    const result = migrateLegacyDataConfig(config);
    expect(result.sources).toEqual([]);
  });

  it('handles config with only preload (no fullLoad)', () => {
    const config: DashboardDataConfig = {
      preload: { query: { source: 'ds1', fields: ['a'] } },
    };
    const result = migrateLegacyDataConfig(config);
    expect(result.sources).toHaveLength(1);
    expect(result.sources![0].preload).toBeDefined();
    expect(result.sources![0].fullLoad).toBeUndefined();
  });

  it('preserves detailSources and transition', () => {
    const config: DashboardDataConfig = {
      preload: { query: { source: 'ds1', fields: ['a'] } },
      fullLoad: { query: { source: 'ds1', fields: ['a', 'b'] } },
      detailSources: [],
      transition: 'fade',
    };
    const result = migrateLegacyDataConfig(config);
    expect(result.detailSources).toEqual([]);
    expect(result.transition).toBe('fade');
  });
});

describe('isDashboardDataConfig (multi-source)', () => {
  it('returns true for multi-source format with valid sources', () => {
    const config = {
      sources: [{ sourceId: 'sales' }, { sourceId: 'inventory' }],
    };
    expect(isDashboardDataConfig(config)).toBe(true);
  });

  it('returns false for multi-source with missing sourceId', () => {
    const config = {
      sources: [{ alias: 'Sales' }],
    };
    expect(isDashboardDataConfig(config)).toBe(false);
  });

  it('returns false for empty sources array with no legacy fields', () => {
    const config = { sources: [] };
    expect(isDashboardDataConfig(config)).toBe(false);
  });
});

// ========================================================================
// A-2.05: Multi-source Loading Orchestrator
// ========================================================================

describe('createMultiSourceLoadingState', () => {
  it('creates idle state for all sources', () => {
    const state = createMultiSourceLoadingState(['sales', 'inventory']);
    expect(Object.keys(state.sources)).toHaveLength(2);
    expect(state.sources['sales'].phase).toBe('idle');
    expect(state.sources['inventory'].phase).toBe('idle');
    expect(state.overall.phase).toBe('idle');
    expect(state.overall.progress).toBe(0);
  });

  it('handles empty source list', () => {
    const state = createMultiSourceLoadingState([]);
    expect(Object.keys(state.sources)).toHaveLength(0);
    expect(state.overall.phase).toBe('idle');
  });
});

describe('updateSourceProgress', () => {
  it('updates a single source and recomputes overall', () => {
    const state = createMultiSourceLoadingState(['a', 'b']);
    const next = updateSourceProgress(state, 'a', 'preloading', 50);
    expect(next.sources['a'].phase).toBe('preloading');
    expect(next.sources['a'].progress).toBe(50);
    expect(next.sources['b'].phase).toBe('idle');
    // Overall: min phase is idle (from b)
    expect(next.overall.phase).toBe('idle');
    expect(next.overall.progress).toBe(25); // avg of 50 + 0
  });

  it('all sources complete sets overall to full-complete', () => {
    let state = createMultiSourceLoadingState(['a', 'b']);
    state = updateSourceProgress(state, 'a', 'full-complete', 100);
    state = updateSourceProgress(state, 'b', 'full-complete', 100);
    expect(state.overall.phase).toBe('full-complete');
    expect(state.overall.progress).toBe(100);
  });

  it('error in any source sets overall to error', () => {
    let state = createMultiSourceLoadingState(['a', 'b']);
    state = updateSourceProgress(state, 'a', 'full-complete', 100);
    state = updateSourceProgress(state, 'b', 'error');
    expect(state.overall.phase).toBe('error');
  });

  it('handles unknown sourceId gracefully', () => {
    const state = createMultiSourceLoadingState(['a']);
    const next = updateSourceProgress(state, 'unknown', 'preloading', 30);
    expect(next.sources['unknown']).toBeDefined();
    expect(next.sources['unknown'].phase).toBe('preloading');
  });
});

describe('computeOverallProgress', () => {
  it('returns idle for empty sources', () => {
    const state: MultiSourceLoadingState = { sources: {}, overall: createInitialLoadingState() };
    const result = computeOverallProgress(state);
    expect(result.phase).toBe('idle');
  });

  it('returns the minimum non-error phase across sources', () => {
    const state: MultiSourceLoadingState = {
      sources: {
        a: { phase: 'full-loading', progress: 80 },
        b: { phase: 'preloading', progress: 20 },
      },
      overall: createInitialLoadingState(),
    };
    const result = computeOverallProgress(state);
    expect(result.phase).toBe('preloading');
    expect(result.progress).toBe(50); // avg of 80 + 20
  });
});

// ========================================================================
// A-2.06: Execution Strategy
// ========================================================================

describe('createDefaultExecutionStrategy', () => {
  it('creates auto strategy with standard fallback order', () => {
    const config = createDefaultExecutionStrategy();
    expect(config.preferred).toBe('auto');
    expect(config.fallbackOrder).toEqual(['server', 'duckdb-wasm', 'local-duckdb']);
    expect(config.rowThresholdForLocal).toBe(100_000);
  });

  it('applies overrides', () => {
    const config = createDefaultExecutionStrategy({ preferred: 'server', rowThresholdForLocal: 50_000 });
    expect(config.preferred).toBe('server');
    expect(config.rowThresholdForLocal).toBe(50_000);
  });
});

describe('selectExecutionEngine', () => {
  const fullContext: ExecutionContext = {
    hasServerSupport: true,
    hasDuckDBWasm: true,
    hasLocalDuckDB: true,
  };

  it('uses preferred engine when available (non-auto)', () => {
    const config = createDefaultExecutionStrategy({ preferred: 'duckdb-wasm' });
    expect(selectExecutionEngine(config, fullContext)).toBe('duckdb-wasm');
  });

  it('falls back when preferred engine is unavailable', () => {
    const config = createDefaultExecutionStrategy({ preferred: 'local-duckdb' });
    const ctx: ExecutionContext = { hasServerSupport: true, hasDuckDBWasm: true, hasLocalDuckDB: false };
    // preferred local-duckdb unavailable, falls through to auto logic then fallback
    expect(selectExecutionEngine(config, ctx)).toBe('server');
  });

  it('auto mode prefers local for small datasets', () => {
    const config = createDefaultExecutionStrategy({ rowThresholdForLocal: 100_000 });
    const ctx: ExecutionContext = { rowCount: 50_000, hasServerSupport: true, hasDuckDBWasm: true, hasLocalDuckDB: false };
    expect(selectExecutionEngine(config, ctx)).toBe('duckdb-wasm');
  });

  it('auto mode prefers server for large datasets', () => {
    const config = createDefaultExecutionStrategy({ rowThresholdForLocal: 100_000 });
    const ctx: ExecutionContext = { rowCount: 500_000, hasServerSupport: true, hasDuckDBWasm: true, hasLocalDuckDB: true };
    expect(selectExecutionEngine(config, ctx)).toBe('server');
  });

  it('auto mode prefers server when row count is unknown', () => {
    const config = createDefaultExecutionStrategy();
    const ctx: ExecutionContext = { hasServerSupport: true, hasDuckDBWasm: true, hasLocalDuckDB: true };
    expect(selectExecutionEngine(config, ctx)).toBe('server');
  });

  it('auto mode falls to duckdb-wasm when server unavailable and small dataset', () => {
    const config = createDefaultExecutionStrategy();
    const ctx: ExecutionContext = { rowCount: 1000, hasServerSupport: false, hasDuckDBWasm: true, hasLocalDuckDB: false };
    expect(selectExecutionEngine(config, ctx)).toBe('duckdb-wasm');
  });

  it('returns server as ultimate fallback', () => {
    const config: ExecutionStrategyConfig = { preferred: 'auto', fallbackOrder: [], rowThresholdForLocal: 100_000 };
    const ctx: ExecutionContext = { hasServerSupport: false, hasDuckDBWasm: false, hasLocalDuckDB: false };
    expect(selectExecutionEngine(config, ctx)).toBe('server');
  });
});

describe('selectEngineForFeature', () => {
  it('uses feature override when available', () => {
    const config = createDefaultExecutionStrategy({
      features: { pivot: 'server' },
    });
    const ctx: ExecutionContext = { hasServerSupport: true, hasDuckDBWasm: true, hasLocalDuckDB: false };
    expect(selectEngineForFeature(config, ctx, 'pivot')).toBe('server');
  });

  it('falls back to standard logic when feature has no override', () => {
    const config = createDefaultExecutionStrategy({ preferred: 'duckdb-wasm' });
    const ctx: ExecutionContext = { hasServerSupport: true, hasDuckDBWasm: true, hasLocalDuckDB: false };
    expect(selectEngineForFeature(config, ctx, 'sort')).toBe('duckdb-wasm');
  });

  it('falls back to standard logic when feature engine is unavailable', () => {
    const config = createDefaultExecutionStrategy({
      preferred: 'server',
      features: { pivot: 'local-duckdb' },
    });
    const ctx: ExecutionContext = { hasServerSupport: true, hasDuckDBWasm: true, hasLocalDuckDB: false };
    expect(selectEngineForFeature(config, ctx, 'pivot')).toBe('server');
  });
});

// ========================================================================
// A-2.07: Server Mode
// ========================================================================

describe('createDefaultServerGridConfig', () => {
  it('creates disabled config with sensible defaults', () => {
    const config = createDefaultServerGridConfig();
    expect(config.enabled).toBe(false);
    expect(config.pageSize).toBe(50);
    expect(config.serverSort).toBe(false);
    expect(config.serverFilter).toBe(false);
    expect(config.serverGroupBy).toBe(false);
    expect(config.prefetchPages).toBe(1);
  });

  it('applies overrides', () => {
    const config = createDefaultServerGridConfig({ enabled: true, pageSize: 100, serverSort: true });
    expect(config.enabled).toBe(true);
    expect(config.pageSize).toBe(100);
    expect(config.serverSort).toBe(true);
    expect(config.serverFilter).toBe(false); // not overridden
  });
});

describe('isServerMode', () => {
  it('returns true when enabled', () => {
    expect(isServerMode(createDefaultServerGridConfig({ enabled: true }))).toBe(true);
  });

  it('returns false when disabled', () => {
    expect(isServerMode(createDefaultServerGridConfig())).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isServerMode(undefined)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isServerMode(null)).toBe(false);
  });
});

describe('hasServerCapability', () => {
  it('returns true when server mode enabled and capability is on', () => {
    const config = createDefaultServerGridConfig({ enabled: true, serverSort: true });
    expect(hasServerCapability(config, 'sort')).toBe(true);
  });

  it('returns false when server mode disabled even if capability is on', () => {
    const config = createDefaultServerGridConfig({ enabled: false, serverSort: true });
    expect(hasServerCapability(config, 'sort')).toBe(false);
  });

  it('returns false for undefined config', () => {
    expect(hasServerCapability(undefined, 'sort')).toBe(false);
  });

  it('checks filter capability', () => {
    const config = createDefaultServerGridConfig({ enabled: true, serverFilter: true });
    expect(hasServerCapability(config, 'filter')).toBe(true);
    expect(hasServerCapability(config, 'sort')).toBe(false);
  });

  it('checks groupBy capability', () => {
    const config = createDefaultServerGridConfig({ enabled: true, serverGroupBy: true });
    expect(hasServerCapability(config, 'groupBy')).toBe(true);
  });
});

// ========================================================================
// A-2.08: Export Config
// ========================================================================

describe('createDefaultExportConfig', () => {
  it('creates config with csv and xlsx enabled', () => {
    const config = createDefaultExportConfig();
    expect(config.enabledFormats).toEqual(['csv', 'xlsx']);
    expect(config.includeHeaders).toBe(true);
    expect(config.includeGroupSummary).toBe(true);
    expect(config.asyncThreshold).toBe(10_000);
  });

  it('applies overrides', () => {
    const config = createDefaultExportConfig({ enabledFormats: ['json', 'parquet'], maxRows: 5000 });
    expect(config.enabledFormats).toEqual(['json', 'parquet']);
    expect(config.maxRows).toBe(5000);
    expect(config.includeHeaders).toBe(true);
  });
});

describe('shouldUseAsyncExport', () => {
  it('returns true when row count exceeds threshold', () => {
    const config = createDefaultExportConfig({ asyncThreshold: 10_000 });
    expect(shouldUseAsyncExport(config, 15_000)).toBe(true);
  });

  it('returns false when row count is at or below threshold', () => {
    const config = createDefaultExportConfig({ asyncThreshold: 10_000 });
    expect(shouldUseAsyncExport(config, 10_000)).toBe(false);
    expect(shouldUseAsyncExport(config, 5_000)).toBe(false);
  });

  it('returns false when asyncThreshold is undefined', () => {
    const config = createDefaultExportConfig({ asyncThreshold: undefined });
    expect(shouldUseAsyncExport(config, 1_000_000)).toBe(false);
  });
});

describe('isFormatEnabled', () => {
  it('returns true for enabled format', () => {
    const config = createDefaultExportConfig();
    expect(isFormatEnabled(config, 'csv')).toBe(true);
    expect(isFormatEnabled(config, 'xlsx')).toBe(true);
  });

  it('returns false for disabled format', () => {
    const config = createDefaultExportConfig();
    expect(isFormatEnabled(config, 'pdf')).toBe(false);
    expect(isFormatEnabled(config, 'parquet')).toBe(false);
  });
});

// ========================================================================
// A-2.09: DataAdapter async methods (verification only)
// ========================================================================

describe('DataAdapter async methods (A-2.09 verification)', () => {
  it('verifies async method types are importable from adapters', async () => {
    // Dynamic import to verify the types exist at the module level
    const adapters = await import('@phozart/shared/adapters');
    // The DataAdapter interface is a type, not a value, but we can verify
    // the associated types are exported as values/type guards
    expect(typeof adapters.hasArrowBuffer).toBe('function');
    // AsyncRequestStatus-related types are part of the module
    expect(adapters).toBeDefined();
  });
});

// ========================================================================
// A-2.10: Filter Auto-Save
// ========================================================================

describe('createDefaultAutoSaveConfig', () => {
  it('creates enabled config with 500ms debounce', () => {
    const config = createDefaultAutoSaveConfig();
    expect(config.enabled).toBe(true);
    expect(config.debounceMs).toBe(500);
    expect(config.maxHistoryEntries).toBe(10);
    expect(config.storageKey).toBeUndefined();
  });

  it('applies overrides', () => {
    const config = createDefaultAutoSaveConfig({ debounceMs: 1000, storageKey: 'my-filters' });
    expect(config.debounceMs).toBe(1000);
    expect(config.storageKey).toBe('my-filters');
  });
});

describe('createFilterSnapshot', () => {
  it('creates snapshot with current timestamp', () => {
    const before = Date.now();
    const snap = createFilterSnapshot({ region: 'US', status: 'active' });
    const after = Date.now();
    expect(snap.filters).toEqual({ region: 'US', status: 'active' });
    expect(snap.timestamp).toBeGreaterThanOrEqual(before);
    expect(snap.timestamp).toBeLessThanOrEqual(after);
    expect(snap.artifactId).toBeUndefined();
    expect(snap.userId).toBeUndefined();
  });

  it('includes context when provided', () => {
    const snap = createFilterSnapshot({ x: 1 }, { artifactId: 'dash-1', userId: 'u1' });
    expect(snap.artifactId).toBe('dash-1');
    expect(snap.userId).toBe('u1');
  });

  it('creates a shallow copy of filters', () => {
    const filters = { a: 1 };
    const snap = createFilterSnapshot(filters);
    filters.a = 2;
    expect(snap.filters.a).toBe(1); // not mutated
  });
});

describe('shouldAutoSave', () => {
  it('returns true when enabled and debounce is positive', () => {
    expect(shouldAutoSave(createDefaultAutoSaveConfig())).toBe(true);
  });

  it('returns false when disabled', () => {
    expect(shouldAutoSave(createDefaultAutoSaveConfig({ enabled: false }))).toBe(false);
  });

  it('returns false when debounce is 0', () => {
    expect(shouldAutoSave(createDefaultAutoSaveConfig({ debounceMs: 0 }))).toBe(false);
  });

  it('returns false when debounce is negative', () => {
    expect(shouldAutoSave(createDefaultAutoSaveConfig({ debounceMs: -100 }))).toBe(false);
  });
});

describe('pruneHistory', () => {
  it('returns all entries when within limit', () => {
    const config = createDefaultAutoSaveConfig({ maxHistoryEntries: 5 });
    const history = [
      { filters: {}, timestamp: 1 },
      { filters: {}, timestamp: 2 },
    ];
    const result = pruneHistory(history, config);
    expect(result).toHaveLength(2);
  });

  it('trims oldest entries when over limit', () => {
    const config = createDefaultAutoSaveConfig({ maxHistoryEntries: 2 });
    const history = [
      { filters: { a: 1 }, timestamp: 1 },
      { filters: { b: 2 }, timestamp: 2 },
      { filters: { c: 3 }, timestamp: 3 },
      { filters: { d: 4 }, timestamp: 4 },
    ];
    const result = pruneHistory(history, config);
    expect(result).toHaveLength(2);
    expect(result[0].timestamp).toBe(3);
    expect(result[1].timestamp).toBe(4);
  });

  it('returns a new array (not the original)', () => {
    const config = createDefaultAutoSaveConfig({ maxHistoryEntries: 10 });
    const history = [{ filters: {}, timestamp: 1 }];
    const result = pruneHistory(history, config);
    expect(result).not.toBe(history);
  });

  it('defaults maxHistoryEntries to 10 when undefined', () => {
    const config = createDefaultAutoSaveConfig();
    delete (config as Record<string, unknown>).maxHistoryEntries;
    const history = Array.from({ length: 15 }, (_, i) => ({ filters: {}, timestamp: i }));
    const result = pruneHistory(history, config);
    expect(result).toHaveLength(10);
    expect(result[0].timestamp).toBe(5);
  });
});
