/**
 * @phozart/react — useGridOrchestrator Hook Tests
 *
 * Tests for the orchestrator hook that coordinates
 * PhzGrid + PhzSelectionCriteria + PhzGridAdmin.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Setup ─────────────────────────────────────────────

let stateIndex = 0;
const stateStore: Array<{ value: unknown; setter: Function }> = [];

vi.mock('react', () => ({
  useState: (init: unknown) => {
    const idx = stateIndex++;
    if (!stateStore[idx]) {
      const setter = vi.fn((val: unknown) => {
        stateStore[idx].value = typeof val === 'function' ? (val as Function)(stateStore[idx].value) : val;
      });
      stateStore[idx] = { value: init, setter };
    }
    return [stateStore[idx].value, stateStore[idx].setter];
  },
  useEffect: vi.fn(),
  useCallback: (cb: Function, _deps?: unknown[]) => cb,
  useRef: (init: unknown) => ({ current: init }),
  forwardRef: (comp: Function) => comp,
  useImperativeHandle: vi.fn(),
  createElement: vi.fn(),
}));

vi.mock('@phozart/grid', () => ({}));
vi.mock('@phozart/core', () => ({}));
vi.mock('@phozart/engine', () => ({}));

// ─── Imports ────────────────────────────────────────────────

import { useGridOrchestrator } from '../hooks/use-grid-orchestrator.js';

// ─── Mock GridApi Factory ───────────────────────────────────

function createMockGridApi() {
  return {
    clearFilters: vi.fn(),
    addFilter: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    on: vi.fn(() => vi.fn()),
    getState: vi.fn(() => ({})),
    destroy: vi.fn(),
  } as any;
}

// ─── Test Helpers ───────────────────────────────────────────

function resetHookState() {
  stateIndex = 0;
  stateStore.length = 0;
}

// ─── Tests ──────────────────────────────────────────────────

describe('useGridOrchestrator', () => {
  beforeEach(resetHookState);

  it('returns all expected properties', () => {
    const result = useGridOrchestrator();

    expect(result).toHaveProperty('gridRef');
    expect(result).toHaveProperty('gridApi');
    expect(result).toHaveProperty('filters');
    expect(result).toHaveProperty('presentationProps');
    expect(result).toHaveProperty('handleCriteriaApply');
    expect(result).toHaveProperty('handleCriteriaChange');
    expect(result).toHaveProperty('handleCriteriaReset');
    expect(result).toHaveProperty('handleSettingsSave');
    expect(result).toHaveProperty('handleGridReady');
  });

  it('gridRef starts as null', () => {
    const result = useGridOrchestrator();
    expect(result.gridRef.current).toBeNull();
  });

  it('gridApi starts as null', () => {
    const result = useGridOrchestrator();
    expect(result.gridApi).toBeNull();
  });

  it('filters starts as empty object by default', () => {
    const result = useGridOrchestrator();
    expect(result.filters).toEqual({});
  });

  it('presentationProps starts as empty object by default', () => {
    const result = useGridOrchestrator();
    expect(result.presentationProps).toEqual({});
  });

  it('uses initialFilters from config', () => {
    const initialFilters = { region: 'US', status: ['active', 'pending'] };
    const result = useGridOrchestrator({ initialFilters });
    expect(result.filters).toEqual(initialFilters);
  });

  it('uses initialPresentation from config', () => {
    const initialPresentation = {
      tableSettings: { density: 'compact' as const, showToolbar: true },
    };
    const result = useGridOrchestrator({ initialPresentation });
    expect(result.presentationProps.density).toBe('compact');
    expect(result.presentationProps.showToolbar).toBe(true);
  });
});

describe('useGridOrchestrator — handleGridReady', () => {
  beforeEach(resetHookState);

  it('stores gridApi on gridRef and triggers state update', () => {
    const result = useGridOrchestrator();
    const mockApi = createMockGridApi();

    result.handleGridReady(mockApi);

    expect(result.gridRef.current).toBe(mockApi);
    // stateStore[0] = gridApi (first useState call)
    expect(stateStore[0].setter).toHaveBeenCalledWith(mockApi);
  });
});

describe('useGridOrchestrator — handleCriteriaApply', () => {
  beforeEach(resetHookState);

  it('updates filters state', () => {
    const result = useGridOrchestrator();
    const context = { region: 'US', dept: ['sales', 'eng'] };

    result.handleCriteriaApply({ context });

    // stateStore[1] = filters (second useState call)
    expect(stateStore[1].setter).toHaveBeenCalledWith(context);
  });

  it('applies filters to grid when gridRef is set', () => {
    const result = useGridOrchestrator();
    const mockApi = createMockGridApi();
    result.gridRef.current = mockApi;

    const context = { region: 'US', dept: ['sales', 'eng'] };
    result.handleCriteriaApply({ context });

    expect(mockApi.clearFilters).toHaveBeenCalled();
    expect(mockApi.addFilter).toHaveBeenCalledWith('region', 'equals', 'US');
    expect(mockApi.addFilter).toHaveBeenCalledWith('dept', 'in', ['sales', 'eng']);
  });

  it('skips null and empty string values when applying filters', () => {
    const result = useGridOrchestrator();
    const mockApi = createMockGridApi();
    result.gridRef.current = mockApi;

    const context = { region: 'US', empty: '', nothing: null };
    result.handleCriteriaApply({ context });

    expect(mockApi.clearFilters).toHaveBeenCalled();
    expect(mockApi.addFilter).toHaveBeenCalledTimes(1);
    expect(mockApi.addFilter).toHaveBeenCalledWith('region', 'equals', 'US');
  });
});

describe('useGridOrchestrator — handleCriteriaChange', () => {
  beforeEach(resetHookState);

  it('updates filters state without applying to grid', () => {
    const result = useGridOrchestrator();
    const mockApi = createMockGridApi();
    result.gridRef.current = mockApi;

    const context = { region: 'EU' };
    result.handleCriteriaChange({ context });

    // stateStore[1] = filters (second useState call)
    expect(stateStore[1].setter).toHaveBeenCalledWith(context);
    // But grid methods should NOT be called
    expect(mockApi.clearFilters).not.toHaveBeenCalled();
    expect(mockApi.addFilter).not.toHaveBeenCalled();
  });
});

describe('useGridOrchestrator — handleCriteriaReset', () => {
  beforeEach(resetHookState);

  it('clears filters state', () => {
    const result = useGridOrchestrator({ initialFilters: { region: 'US' } });

    result.handleCriteriaReset();

    // stateStore[1] = filters (second useState call)
    expect(stateStore[1].setter).toHaveBeenCalledWith({});
  });

  it('calls grid.clearFilters when gridRef is set', () => {
    const result = useGridOrchestrator();
    const mockApi = createMockGridApi();
    result.gridRef.current = mockApi;

    result.handleCriteriaReset();

    expect(mockApi.clearFilters).toHaveBeenCalled();
  });

  it('does not throw when gridRef is null', () => {
    const result = useGridOrchestrator();
    expect(() => result.handleCriteriaReset()).not.toThrow();
  });
});

describe('useGridOrchestrator — handleSettingsSave', () => {
  beforeEach(resetHookState);

  it('updates presentation state', () => {
    const result = useGridOrchestrator();
    const settings = {
      tableSettings: { density: 'dense' as const, showToolbar: false },
    };

    result.handleSettingsSave({ settings });

    // setPresentation should be called
    expect(stateStore[2].setter).toHaveBeenCalledWith(settings);
  });
});

describe('useGridOrchestrator — null gridRef safety', () => {
  beforeEach(resetHookState);

  it('handleCriteriaApply is safe with null gridRef', () => {
    const result = useGridOrchestrator();
    // gridRef.current is null (default)
    expect(() => result.handleCriteriaApply({ context: { region: 'US' } })).not.toThrow();
  });

  it('handleCriteriaReset is safe with null gridRef', () => {
    const result = useGridOrchestrator();
    expect(() => result.handleCriteriaReset()).not.toThrow();
  });

  it('handleGridReady is safe and stores the api', () => {
    const result = useGridOrchestrator();
    const mockApi = createMockGridApi();
    expect(() => result.handleGridReady(mockApi)).not.toThrow();
    expect(result.gridRef.current).toBe(mockApi);
  });

  it('handleSettingsSave is safe', () => {
    const result = useGridOrchestrator();
    expect(() => result.handleSettingsSave({ settings: { tableSettings: {} } })).not.toThrow();
  });

  it('handleCriteriaChange is safe', () => {
    const result = useGridOrchestrator();
    expect(() => result.handleCriteriaChange({ context: { x: 'y' } })).not.toThrow();
  });
});
