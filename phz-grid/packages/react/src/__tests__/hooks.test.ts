/**
 * @phozart/phz-react — Hook Tests
 *
 * Tests for all 6 React hooks that wrap GridApi operations.
 * Since React hooks cannot be called outside a component render cycle,
 * we mock React's hooks to exercise the module logic directly.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Setup ─────────────────────────────────────────────

// Track effect callbacks so we can invoke them manually
let effectCallbacks: Array<{ cb: Function; deps: unknown[] }> = [];
// Track state setters to simulate React state
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
  useEffect: (cb: Function, deps?: unknown[]) => {
    effectCallbacks.push({ cb, deps: deps ?? [] });
  },
  useCallback: (cb: Function, _deps?: unknown[]) => cb,
  useRef: (init: unknown) => ({ current: init }),
  forwardRef: (comp: Function) => comp,
  useImperativeHandle: vi.fn(),
  createElement: vi.fn(),
}));

// Mock the grid and core packages to avoid side-effect imports
vi.mock('@phozart/phz-grid', () => ({}));
vi.mock('@phozart/phz-core', () => ({}));

// ─── Hook Imports ───────────────────────────────────────────

import { useGridState } from '../hooks/use-grid-state.js';
import { useGridSelection } from '../hooks/use-grid-selection.js';
import { useGridSort } from '../hooks/use-grid-sort.js';
import { useGridFilter } from '../hooks/use-grid-filter.js';
import { useGridEdit } from '../hooks/use-grid-edit.js';
import { useGridData } from '../hooks/use-grid-data.js';

// ─── Mock GridApi Factory ───────────────────────────────────

function createMockGridApi() {
  return {
    getState: vi.fn(() => ({
      sort: { columns: [] },
      filter: { filters: [], presets: {} },
      selection: { mode: 'single', selectedRows: new Set(), selectedCells: new Set() },
      edit: { status: 'idle' },
    })),
    getSortState: vi.fn(() => ({ columns: [] })),
    getFilterState: vi.fn(() => ({ filters: [], presets: {} })),
    getEditState: vi.fn(() => ({ status: 'idle' })),
    getSelection: vi.fn(() => ({ rows: ['row-1', 'row-2'], cells: [{ rowId: 'row-1', field: 'name' }] })),
    getData: vi.fn(() => [
      { __rowId: 'r1', name: 'Alice', age: 30 },
      { __rowId: 'r2', name: 'Bob', age: 25 },
    ]),
    getDirtyRows: vi.fn(() => ['row-1']),
    isDirty: vi.fn(() => true),
    subscribe: vi.fn(() => vi.fn()),
    on: vi.fn(() => vi.fn()),
    sort: vi.fn(),
    multiSort: vi.fn(),
    clearSort: vi.fn(),
    addFilter: vi.fn(),
    removeFilter: vi.fn(),
    clearFilters: vi.fn(),
    saveFilterPreset: vi.fn(),
    loadFilterPreset: vi.fn(),
    select: vi.fn(),
    deselect: vi.fn(),
    selectAll: vi.fn(),
    deselectAll: vi.fn(),
    selectRange: vi.fn(),
    startEdit: vi.fn(),
    commitEdit: vi.fn(() => Promise.resolve(true)),
    cancelEdit: vi.fn(),
    setData: vi.fn(),
    addRow: vi.fn(() => 'new-row-id'),
    updateRow: vi.fn(),
    deleteRow: vi.fn(),
    exportState: vi.fn(() => ({ sort: { columns: [] }, filter: { filters: [] } })),
    importState: vi.fn(),
    destroy: vi.fn(),
  } as any;
}

// ─── Test Helpers ───────────────────────────────────────────

function resetHookState() {
  effectCallbacks = [];
  stateIndex = 0;
  stateStore.length = 0;
}

function runEffects() {
  const callbacks = [...effectCallbacks];
  effectCallbacks = [];
  const cleanups: Function[] = [];
  for (const { cb } of callbacks) {
    const cleanup = cb();
    if (typeof cleanup === 'function') cleanups.push(cleanup);
  }
  return cleanups;
}

// ─── Hook Export Tests ──────────────────────────────────────

describe('Hook exports', () => {
  it('useGridState is a function', () => {
    expect(typeof useGridState).toBe('function');
  });

  it('useGridSelection is a function', () => {
    expect(typeof useGridSelection).toBe('function');
  });

  it('useGridSort is a function', () => {
    expect(typeof useGridSort).toBe('function');
  });

  it('useGridFilter is a function', () => {
    expect(typeof useGridFilter).toBe('function');
  });

  it('useGridEdit is a function', () => {
    expect(typeof useGridEdit).toBe('function');
  });

  it('useGridData is a function', () => {
    expect(typeof useGridData).toBe('function');
  });
});

// ─── useGridState Tests ─────────────────────────────────────

describe('useGridState', () => {
  beforeEach(resetHookState);

  it('returns state, setState, exportState, importState', () => {
    const api = createMockGridApi();
    const gridRef = { current: api };
    const result = useGridState(gridRef as any);

    expect(result).toHaveProperty('state');
    expect(result).toHaveProperty('setState');
    expect(result).toHaveProperty('exportState');
    expect(result).toHaveProperty('importState');
  });

  it('initial state is null before effects run', () => {
    const gridRef = { current: createMockGridApi() };
    const result = useGridState(gridRef as any);
    expect(result.state).toBeNull();
  });

  it('effect subscribes to grid state changes', () => {
    const api = createMockGridApi();
    const gridRef = { current: api };
    useGridState(gridRef as any);
    runEffects();

    expect(api.getState).toHaveBeenCalled();
    expect(api.subscribe).toHaveBeenCalled();
  });

  it('exportState delegates to gridApi.exportState()', () => {
    const api = createMockGridApi();
    const gridRef = { current: api };
    const { exportState } = useGridState(gridRef as any);

    const exported = exportState();
    expect(api.exportState).toHaveBeenCalled();
    expect(exported).toEqual({ sort: { columns: [] }, filter: { filters: [] } });
  });

  it('importState delegates to gridApi.importState()', () => {
    const api = createMockGridApi();
    const gridRef = { current: api };
    const { importState } = useGridState(gridRef as any);

    const stateToImport = { sort: { columns: [] } } as any;
    importState(stateToImport);
    expect(api.importState).toHaveBeenCalledWith(stateToImport);
  });

  it('setState merges partial state via export/import cycle', () => {
    const api = createMockGridApi();
    const gridRef = { current: api };
    const { setState } = useGridState(gridRef as any);

    setState({ sort: { columns: [{ field: 'name', direction: 'asc' }] } } as any);
    expect(api.exportState).toHaveBeenCalled();
    expect(api.importState).toHaveBeenCalled();
  });
});

// ─── useGridSelection Tests ─────────────────────────────────

describe('useGridSelection', () => {
  beforeEach(resetHookState);

  it('returns selectedRows, selectedCells, select, deselect, selectAll, deselectAll, selectRange', () => {
    const gridRef = { current: createMockGridApi() };
    const result = useGridSelection(gridRef as any);

    expect(result).toHaveProperty('selectedRows');
    expect(result).toHaveProperty('selectedCells');
    expect(result).toHaveProperty('select');
    expect(result).toHaveProperty('deselect');
    expect(result).toHaveProperty('selectAll');
    expect(result).toHaveProperty('deselectAll');
    expect(result).toHaveProperty('selectRange');
  });

  it('initial selectedRows is empty array before effects run', () => {
    const gridRef = { current: createMockGridApi() };
    const result = useGridSelection(gridRef as any);
    expect(result.selectedRows).toEqual([]);
    expect(result.selectedCells).toEqual([]);
  });

  it('select delegates to gridApi.select()', () => {
    const api = createMockGridApi();
    const gridRef = { current: api };
    const { select } = useGridSelection(gridRef as any);

    select('row-1');
    expect(api.select).toHaveBeenCalledWith('row-1');
  });

  it('deselect delegates to gridApi.deselect()', () => {
    const api = createMockGridApi();
    const gridRef = { current: api };
    const { deselect } = useGridSelection(gridRef as any);

    deselect(['row-1', 'row-2']);
    expect(api.deselect).toHaveBeenCalledWith(['row-1', 'row-2']);
  });

  it('selectAll delegates to gridApi.selectAll()', () => {
    const api = createMockGridApi();
    const gridRef = { current: api };
    const { selectAll } = useGridSelection(gridRef as any);

    selectAll();
    expect(api.selectAll).toHaveBeenCalled();
  });

  it('deselectAll delegates to gridApi.deselectAll()', () => {
    const api = createMockGridApi();
    const gridRef = { current: api };
    const { deselectAll } = useGridSelection(gridRef as any);

    deselectAll();
    expect(api.deselectAll).toHaveBeenCalled();
  });

  it('selectRange delegates to gridApi.selectRange()', () => {
    const api = createMockGridApi();
    const gridRef = { current: api };
    const { selectRange } = useGridSelection(gridRef as any);

    const start = { rowId: 'r1', field: 'name' };
    const end = { rowId: 'r5', field: 'age' };
    selectRange(start, end);
    expect(api.selectRange).toHaveBeenCalledWith(start, end);
  });

  it('effect subscribes to selection:change event', () => {
    const api = createMockGridApi();
    const gridRef = { current: api };
    useGridSelection(gridRef as any);
    runEffects();

    expect(api.getSelection).toHaveBeenCalled();
    expect(api.on).toHaveBeenCalledWith('selection:change', expect.any(Function));
  });
});

// ─── useGridSort Tests ──────────────────────────────────────

describe('useGridSort', () => {
  beforeEach(resetHookState);

  it('returns sortState, sort, multiSort, clearSort', () => {
    const gridRef = { current: createMockGridApi() };
    const result = useGridSort(gridRef as any);

    expect(result).toHaveProperty('sortState');
    expect(result).toHaveProperty('sort');
    expect(result).toHaveProperty('multiSort');
    expect(result).toHaveProperty('clearSort');
  });

  it('initial sortState is null before effects run', () => {
    const gridRef = { current: createMockGridApi() };
    const result = useGridSort(gridRef as any);
    expect(result.sortState).toBeNull();
  });

  it('sort delegates to gridApi.sort()', () => {
    const api = createMockGridApi();
    const gridRef = { current: api };
    const { sort } = useGridSort(gridRef as any);

    sort('name', 'asc');
    expect(api.sort).toHaveBeenCalledWith('name', 'asc');
  });

  it('multiSort delegates to gridApi.multiSort()', () => {
    const api = createMockGridApi();
    const gridRef = { current: api };
    const { multiSort } = useGridSort(gridRef as any);

    const sorts = [
      { field: 'name', direction: 'asc' as const },
      { field: 'age', direction: 'desc' as const },
    ];
    multiSort(sorts);
    expect(api.multiSort).toHaveBeenCalledWith(sorts);
  });

  it('clearSort delegates to gridApi.clearSort()', () => {
    const api = createMockGridApi();
    const gridRef = { current: api };
    const { clearSort } = useGridSort(gridRef as any);

    clearSort();
    expect(api.clearSort).toHaveBeenCalled();
  });

  it('effect subscribes to sort:change event', () => {
    const api = createMockGridApi();
    const gridRef = { current: api };
    useGridSort(gridRef as any);
    runEffects();

    expect(api.getSortState).toHaveBeenCalled();
    expect(api.on).toHaveBeenCalledWith('sort:change', expect.any(Function));
  });
});

// ─── useGridFilter Tests ────────────────────────────────────

describe('useGridFilter', () => {
  beforeEach(resetHookState);

  it('returns filterState, addFilter, removeFilter, clearFilters, savePreset, loadPreset', () => {
    const gridRef = { current: createMockGridApi() };
    const result = useGridFilter(gridRef as any);

    expect(result).toHaveProperty('filterState');
    expect(result).toHaveProperty('addFilter');
    expect(result).toHaveProperty('removeFilter');
    expect(result).toHaveProperty('clearFilters');
    expect(result).toHaveProperty('savePreset');
    expect(result).toHaveProperty('loadPreset');
  });

  it('initial filterState is null before effects run', () => {
    const gridRef = { current: createMockGridApi() };
    const result = useGridFilter(gridRef as any);
    expect(result.filterState).toBeNull();
  });

  it('addFilter delegates to gridApi.addFilter()', () => {
    const api = createMockGridApi();
    const gridRef = { current: api };
    const { addFilter } = useGridFilter(gridRef as any);

    addFilter('status', 'equals', 'active');
    expect(api.addFilter).toHaveBeenCalledWith('status', 'equals', 'active');
  });

  it('removeFilter delegates to gridApi.removeFilter()', () => {
    const api = createMockGridApi();
    const gridRef = { current: api };
    const { removeFilter } = useGridFilter(gridRef as any);

    removeFilter('status');
    expect(api.removeFilter).toHaveBeenCalledWith('status');
  });

  it('clearFilters delegates to gridApi.clearFilters()', () => {
    const api = createMockGridApi();
    const gridRef = { current: api };
    const { clearFilters } = useGridFilter(gridRef as any);

    clearFilters();
    expect(api.clearFilters).toHaveBeenCalled();
  });

  it('savePreset delegates to gridApi.saveFilterPreset()', () => {
    const api = createMockGridApi();
    const gridRef = { current: api };
    const { savePreset } = useGridFilter(gridRef as any);

    savePreset('my-preset');
    expect(api.saveFilterPreset).toHaveBeenCalledWith('my-preset');
  });

  it('loadPreset delegates to gridApi.loadFilterPreset()', () => {
    const api = createMockGridApi();
    const gridRef = { current: api };
    const { loadPreset } = useGridFilter(gridRef as any);

    loadPreset('my-preset');
    expect(api.loadFilterPreset).toHaveBeenCalledWith('my-preset');
  });

  it('effect subscribes to filter:change event', () => {
    const api = createMockGridApi();
    const gridRef = { current: api };
    useGridFilter(gridRef as any);
    runEffects();

    expect(api.getFilterState).toHaveBeenCalled();
    expect(api.on).toHaveBeenCalledWith('filter:change', expect.any(Function));
  });
});

// ─── useGridEdit Tests ──────────────────────────────────────

describe('useGridEdit', () => {
  beforeEach(resetHookState);

  it('returns editState, startEdit, commitEdit, cancelEdit, isDirty, dirtyRows', () => {
    const gridRef = { current: createMockGridApi() };
    const result = useGridEdit(gridRef as any);

    expect(result).toHaveProperty('editState');
    expect(result).toHaveProperty('startEdit');
    expect(result).toHaveProperty('commitEdit');
    expect(result).toHaveProperty('cancelEdit');
    expect(result).toHaveProperty('isDirty');
    expect(result).toHaveProperty('dirtyRows');
  });

  it('initial editState is null before effects run', () => {
    const gridRef = { current: createMockGridApi() };
    const result = useGridEdit(gridRef as any);
    expect(result.editState).toBeNull();
  });

  it('initial isDirty is false before effects run', () => {
    const gridRef = { current: createMockGridApi() };
    const result = useGridEdit(gridRef as any);
    expect(result.isDirty).toBe(false);
  });

  it('initial dirtyRows is empty before effects run', () => {
    const gridRef = { current: createMockGridApi() };
    const result = useGridEdit(gridRef as any);
    expect(result.dirtyRows).toEqual([]);
  });

  it('startEdit delegates to gridApi.startEdit()', () => {
    const api = createMockGridApi();
    const gridRef = { current: api };
    const { startEdit } = useGridEdit(gridRef as any);

    const pos = { rowId: 'r1', field: 'name' };
    startEdit(pos);
    expect(api.startEdit).toHaveBeenCalledWith(pos);
  });

  it('commitEdit delegates to gridApi.commitEdit() and returns a promise', async () => {
    const api = createMockGridApi();
    const gridRef = { current: api };
    const { commitEdit } = useGridEdit(gridRef as any);

    const pos = { rowId: 'r1', field: 'name' };
    const result = commitEdit(pos, 'New Value');
    expect(api.commitEdit).toHaveBeenCalledWith(pos, 'New Value');
    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toBe(true);
  });

  it('cancelEdit delegates to gridApi.cancelEdit()', () => {
    const api = createMockGridApi();
    const gridRef = { current: api };
    const { cancelEdit } = useGridEdit(gridRef as any);

    const pos = { rowId: 'r1', field: 'name' };
    cancelEdit(pos);
    expect(api.cancelEdit).toHaveBeenCalledWith(pos);
  });

  it('commitEdit returns false when no gridRef.current', async () => {
    const gridRef = { current: null };
    resetHookState();
    const { commitEdit } = useGridEdit(gridRef as any);

    const pos = { rowId: 'r1', field: 'name' };
    const result = await commitEdit(pos, 'value');
    expect(result).toBe(false);
  });

  it('effect subscribes via grid.subscribe()', () => {
    const api = createMockGridApi();
    const gridRef = { current: api };
    useGridEdit(gridRef as any);
    runEffects();

    expect(api.getEditState).toHaveBeenCalled();
    expect(api.isDirty).toHaveBeenCalled();
    expect(api.getDirtyRows).toHaveBeenCalled();
    expect(api.subscribe).toHaveBeenCalled();
  });
});

// ─── useGridData Tests ──────────────────────────────────────

describe('useGridData', () => {
  beforeEach(resetHookState);

  it('returns data, setData, addRow, updateRow, deleteRow', () => {
    const gridRef = { current: createMockGridApi() };
    const result = useGridData(gridRef as any);

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('setData');
    expect(result).toHaveProperty('addRow');
    expect(result).toHaveProperty('updateRow');
    expect(result).toHaveProperty('deleteRow');
  });

  it('initial data is empty array before effects run', () => {
    const gridRef = { current: createMockGridApi() };
    const result = useGridData(gridRef as any);
    expect(result.data).toEqual([]);
  });

  it('setData delegates to gridApi.setData()', () => {
    const api = createMockGridApi();
    const gridRef = { current: api };
    const { setData } = useGridData(gridRef as any);

    const newData = [{ name: 'Charlie' }];
    setData(newData);
    expect(api.setData).toHaveBeenCalledWith(newData);
  });

  it('addRow delegates to gridApi.addRow() and returns RowId', () => {
    const api = createMockGridApi();
    const gridRef = { current: api };
    const { addRow } = useGridData(gridRef as any);

    const rowId = addRow({ name: 'Diana', age: 28 });
    expect(api.addRow).toHaveBeenCalledWith({ name: 'Diana', age: 28 }, undefined);
    expect(rowId).toBe('new-row-id');
  });

  it('addRow with position delegates correctly', () => {
    const api = createMockGridApi();
    const gridRef = { current: api };
    const { addRow } = useGridData(gridRef as any);

    addRow({ name: 'Eve' }, 3);
    expect(api.addRow).toHaveBeenCalledWith({ name: 'Eve' }, 3);
  });

  it('addRow returns empty string when no gridRef.current', () => {
    const gridRef = { current: null };
    resetHookState();
    const { addRow } = useGridData(gridRef as any);

    const rowId = addRow({ name: 'Ghost' });
    expect(rowId).toBe('');
  });

  it('updateRow delegates to gridApi.updateRow()', () => {
    const api = createMockGridApi();
    const gridRef = { current: api };
    const { updateRow } = useGridData(gridRef as any);

    updateRow('r1', { name: 'Updated Alice' });
    expect(api.updateRow).toHaveBeenCalledWith('r1', { name: 'Updated Alice' });
  });

  it('deleteRow delegates to gridApi.deleteRow()', () => {
    const api = createMockGridApi();
    const gridRef = { current: api };
    const { deleteRow } = useGridData(gridRef as any);

    deleteRow('r2');
    expect(api.deleteRow).toHaveBeenCalledWith('r2');
  });

  it('effect subscribes via grid.subscribe()', () => {
    const api = createMockGridApi();
    const gridRef = { current: api };
    useGridData(gridRef as any);
    runEffects();

    expect(api.getData).toHaveBeenCalled();
    expect(api.subscribe).toHaveBeenCalled();
  });

  it('effect cleanup calls unsubscribe', () => {
    const unsub = vi.fn();
    const api = createMockGridApi();
    api.subscribe = vi.fn(() => unsub);
    const gridRef = { current: api };
    useGridData(gridRef as any);

    const cleanups = runEffects();
    expect(cleanups).toHaveLength(1);
    cleanups[0]();
    expect(unsub).toHaveBeenCalled();
  });
});

// ─── Null Ref Safety Tests ──────────────────────────────────

describe('Hook null ref safety', () => {
  beforeEach(resetHookState);

  it('useGridState with null ref does not throw', () => {
    const gridRef = { current: null };
    expect(() => useGridState(gridRef as any)).not.toThrow();
  });

  it('useGridSelection with null ref does not throw', () => {
    const gridRef = { current: null };
    expect(() => useGridSelection(gridRef as any)).not.toThrow();
  });

  it('useGridSort with null ref does not throw', () => {
    const gridRef = { current: null };
    expect(() => useGridSort(gridRef as any)).not.toThrow();
  });

  it('useGridFilter with null ref does not throw', () => {
    const gridRef = { current: null };
    expect(() => useGridFilter(gridRef as any)).not.toThrow();
  });

  it('useGridEdit with null ref does not throw', () => {
    const gridRef = { current: null };
    expect(() => useGridEdit(gridRef as any)).not.toThrow();
  });

  it('useGridData with null ref does not throw', () => {
    const gridRef = { current: null };
    expect(() => useGridData(gridRef as any)).not.toThrow();
  });

  it('useGridState effect with null ref skips subscription', () => {
    const gridRef = { current: null };
    useGridState(gridRef as any);
    const cleanups = runEffects();
    // No cleanup returned because the effect early-returned
    expect(cleanups).toHaveLength(0);
  });

  it('useGridSort action functions are safe with null ref', () => {
    const gridRef = { current: null };
    const { sort, multiSort, clearSort } = useGridSort(gridRef as any);

    // These should not throw even with null ref
    expect(() => sort('name', 'asc')).not.toThrow();
    expect(() => multiSort([{ field: 'name', direction: 'asc' }])).not.toThrow();
    expect(() => clearSort()).not.toThrow();
  });

  it('useGridFilter action functions are safe with null ref', () => {
    const gridRef = { current: null };
    const { addFilter, removeFilter, clearFilters, savePreset, loadPreset } = useGridFilter(gridRef as any);

    expect(() => addFilter('name', 'equals' as any, 'test')).not.toThrow();
    expect(() => removeFilter('name')).not.toThrow();
    expect(() => clearFilters()).not.toThrow();
    expect(() => savePreset('preset1')).not.toThrow();
    expect(() => loadPreset('preset1')).not.toThrow();
  });

  it('useGridSelection action functions are safe with null ref', () => {
    const gridRef = { current: null };
    const { select, deselect, selectAll, deselectAll, selectRange } = useGridSelection(gridRef as any);

    expect(() => select('row-1')).not.toThrow();
    expect(() => deselect('row-1')).not.toThrow();
    expect(() => selectAll()).not.toThrow();
    expect(() => deselectAll()).not.toThrow();
    expect(() => selectRange({ rowId: 'r1', field: 'a' }, { rowId: 'r2', field: 'b' })).not.toThrow();
  });

  it('useGridData action functions are safe with null ref', () => {
    const gridRef = { current: null };
    const { setData, addRow, updateRow, deleteRow } = useGridData(gridRef as any);

    expect(() => setData([])).not.toThrow();
    expect(() => addRow({ name: 'test' })).not.toThrow();
    expect(() => updateRow('r1', { name: 'x' })).not.toThrow();
    expect(() => deleteRow('r1')).not.toThrow();
  });
});
