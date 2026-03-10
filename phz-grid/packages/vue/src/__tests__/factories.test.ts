import { describe, it, expect, vi } from 'vitest';

// Mock @phozart/phz-grid to avoid side-effect import (registers custom element)
vi.mock('@phozart/phz-grid', () => ({}));

import {
  createPhzGridComponent,
  createUseGrid,
  createUseGridSelection,
  createUseGridSort,
  createUseGridFilter,
  createUseGridEdit,
} from '../factories.js';

function createMockVueRuntime() {
  return {
    defineComponent: vi.fn((opts: any) => opts),
    h: vi.fn((...args: any[]) => ({ tag: args[0], props: args[1], children: args[2] })),
    ref: <T>(value: T) => ({ value }),
    onMounted: vi.fn((fn: Function) => fn()),
    onUnmounted: vi.fn(),
    watch: vi.fn(),
  };
}

function createMockGridApi() {
  return {
    getState: vi.fn(() => ({ sort: { columns: [] } })),
    getSortState: vi.fn(() => ({ columns: [] })),
    getFilterState: vi.fn(() => ({ filters: [], presets: {} })),
    getEditState: vi.fn(() => ({ status: 'idle' })),
    getSelection: vi.fn(() => ({ rows: [], cells: [] })),
    getData: vi.fn(() => []),
    getDirtyRows: vi.fn(() => []),
    isDirty: vi.fn(() => false),
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
    exportState: vi.fn(() => ({ columns: [], sort: null })),
    importState: vi.fn(),
  } as any;
}

// ---------------------------------------------------------------------------
// createPhzGridComponent
// ---------------------------------------------------------------------------
describe('createPhzGridComponent', () => {
  it('returns a component definition with name PhzGrid', () => {
    const vue = createMockVueRuntime();
    const component = createPhzGridComponent(vue);

    expect(vue.defineComponent).toHaveBeenCalledOnce();
    expect(component.name).toBe('PhzGrid');
  });

  it('has correct props with defaults', () => {
    const vue = createMockVueRuntime();
    const component = createPhzGridComponent(vue);

    expect(component.props.data).toEqual({ type: Array, required: true });
    expect(component.props.columns).toEqual({ type: Array, required: true });
    expect(component.props.theme).toEqual({ type: String, default: 'auto' });
    expect(component.props.locale).toEqual({ type: String, default: 'en-US' });
    expect(component.props.responsive).toEqual({ type: Boolean, default: true });
    expect(component.props.virtualization).toEqual({ type: Boolean, default: true });
    expect(component.props.selectionMode).toEqual({ type: String, default: 'single' });
    expect(component.props.editMode).toEqual({ type: String, default: 'dblclick' });
    expect(component.props.loading).toEqual({ type: Boolean, default: false });
    expect(component.props.height).toEqual({ type: [String, Number], default: 'auto' });
    expect(component.props.width).toEqual({ type: [String, Number], default: '100%' });
    expect(component.props.modelValue).toEqual({ type: Array, default: undefined });
  });

  it('has correct emits array', () => {
    const vue = createMockVueRuntime();
    const component = createPhzGridComponent(vue);

    expect(component.emits).toEqual([
      'update:modelValue',
      'grid-ready',
      'selection-change',
      'sort-change',
      'filter-change',
      'edit-commit',
      'cell-click',
    ]);
  });

  it('setup function returns a render function that renders phz-grid', () => {
    const vue = createMockVueRuntime();
    const component = createPhzGridComponent(vue);

    const mockProps = {
      data: [{ id: 1 }],
      columns: [{ field: 'id' }],
      theme: 'dark',
      locale: 'en-US',
      selectionMode: 'multi',
      editMode: 'click',
      height: 400,
      width: '80%',
    };
    const mockEmit = vi.fn();
    const mockSlots = { default: vi.fn(() => ['slot-content']) };

    const renderFn = component.setup(mockProps, { emit: mockEmit, slots: mockSlots });
    expect(typeof renderFn).toBe('function');

    const vnode = renderFn();

    // h was called with 'phz-grid' tag
    expect(vue.h).toHaveBeenCalledWith(
      'phz-grid',
      expect.objectContaining({
        'selection-mode': 'multi',
        'edit-mode': 'click',
        'grid-height': '400px',
        'grid-width': '80%',
        theme: 'dark',
        locale: 'en-US',
      }),
      ['slot-content'],
    );
  });
});

// ---------------------------------------------------------------------------
// createUseGrid
// ---------------------------------------------------------------------------
describe('createUseGrid', () => {
  it('returns a function', () => {
    const vue = createMockVueRuntime();
    const useGrid = createUseGrid(vue);

    expect(typeof useGrid).toBe('function');
  });

  it('calling it returns gridInstance, state, exportState, importState', () => {
    const vue = createMockVueRuntime();
    const useGrid = createUseGrid(vue);
    const result = useGrid();

    expect(result).toHaveProperty('gridInstance');
    expect(result).toHaveProperty('state');
    expect(result).toHaveProperty('exportState');
    expect(result).toHaveProperty('importState');
    expect(result.gridInstance.value).toBeNull();
    expect(result.state.value).toBeNull();
    expect(typeof result.exportState).toBe('function');
    expect(typeof result.importState).toBe('function');
  });

  it('exportState returns null when no grid instance is set', () => {
    const vue = createMockVueRuntime();
    const useGrid = createUseGrid(vue);
    const { exportState } = useGrid();

    expect(exportState()).toBeNull();
  });

  it('exportState delegates to gridInstance when available', () => {
    const vue = createMockVueRuntime();
    const useGrid = createUseGrid(vue);
    const result = useGrid();
    const mockApi = createMockGridApi();

    result.gridInstance.value = mockApi;

    const exported = result.exportState();
    expect(mockApi.exportState).toHaveBeenCalledOnce();
    expect(exported).toEqual({ columns: [], sort: null });
  });
});

// ---------------------------------------------------------------------------
// createUseGridSelection
// ---------------------------------------------------------------------------
describe('createUseGridSelection', () => {
  it('returns a function', () => {
    const vue = createMockVueRuntime();
    const useGridSelection = createUseGridSelection(vue);

    expect(typeof useGridSelection).toBe('function');
  });

  it('calling it returns selectedRows, selectedCells, select, deselect, selectAll, deselectAll, selectRange', () => {
    const vue = createMockVueRuntime();
    const useGridSelection = createUseGridSelection(vue);
    const result = useGridSelection();

    expect(result).toHaveProperty('selectedRows');
    expect(result).toHaveProperty('selectedCells');
    expect(result).toHaveProperty('select');
    expect(result).toHaveProperty('deselect');
    expect(result).toHaveProperty('selectAll');
    expect(result).toHaveProperty('deselectAll');
    expect(result).toHaveProperty('selectRange');
  });

  it('selectedRows and selectedCells are reactive refs initialised to empty arrays', () => {
    const vue = createMockVueRuntime();
    const useGridSelection = createUseGridSelection(vue);
    const result = useGridSelection();

    expect(result.selectedRows.value).toEqual([]);
    expect(result.selectedCells.value).toEqual([]);
  });

  it('select delegates to gridApi when gridInstance is provided', () => {
    const vue = createMockVueRuntime();
    const useGridSelection = createUseGridSelection(vue);
    const mockApi = createMockGridApi();
    const gridInstance = { value: mockApi };

    const result = useGridSelection(gridInstance);
    result.select(['row-1', 'row-2']);

    expect(mockApi.select).toHaveBeenCalledWith(['row-1', 'row-2']);
  });
});

// ---------------------------------------------------------------------------
// createUseGridSort
// ---------------------------------------------------------------------------
describe('createUseGridSort', () => {
  it('returns a function', () => {
    const vue = createMockVueRuntime();
    const useGridSort = createUseGridSort(vue);

    expect(typeof useGridSort).toBe('function');
  });

  it('calling it returns sortState, sort, multiSort, clearSort', () => {
    const vue = createMockVueRuntime();
    const useGridSort = createUseGridSort(vue);
    const result = useGridSort();

    expect(result).toHaveProperty('sortState');
    expect(result).toHaveProperty('sort');
    expect(result).toHaveProperty('multiSort');
    expect(result).toHaveProperty('clearSort');
    expect(result.sortState.value).toBeNull();
  });

  it('sort delegates to gridApi when gridInstance is provided', () => {
    const vue = createMockVueRuntime();
    const useGridSort = createUseGridSort(vue);
    const mockApi = createMockGridApi();
    const gridInstance = { value: mockApi };

    const result = useGridSort(gridInstance);
    result.sort('name', 'asc');

    expect(mockApi.sort).toHaveBeenCalledWith('name', 'asc');
  });

  it('multiSort delegates to gridApi', () => {
    const vue = createMockVueRuntime();
    const useGridSort = createUseGridSort(vue);
    const mockApi = createMockGridApi();
    const gridInstance = { value: mockApi };

    const result = useGridSort(gridInstance);
    const sorts = [
      { field: 'name', direction: 'asc' as const },
      { field: 'age', direction: 'desc' as const },
    ];
    result.multiSort(sorts);

    expect(mockApi.multiSort).toHaveBeenCalledWith(sorts);
  });
});

// ---------------------------------------------------------------------------
// createUseGridFilter
// ---------------------------------------------------------------------------
describe('createUseGridFilter', () => {
  it('returns a function', () => {
    const vue = createMockVueRuntime();
    const useGridFilter = createUseGridFilter(vue);

    expect(typeof useGridFilter).toBe('function');
  });

  it('calling it returns filterState, addFilter, removeFilter, clearFilters, savePreset, loadPreset', () => {
    const vue = createMockVueRuntime();
    const useGridFilter = createUseGridFilter(vue);
    const result = useGridFilter();

    expect(result).toHaveProperty('filterState');
    expect(result).toHaveProperty('addFilter');
    expect(result).toHaveProperty('removeFilter');
    expect(result).toHaveProperty('clearFilters');
    expect(result).toHaveProperty('savePreset');
    expect(result).toHaveProperty('loadPreset');
    expect(result.filterState.value).toBeNull();
  });

  it('addFilter delegates to gridApi when gridInstance is provided', () => {
    const vue = createMockVueRuntime();
    const useGridFilter = createUseGridFilter(vue);
    const mockApi = createMockGridApi();
    const gridInstance = { value: mockApi };

    const result = useGridFilter(gridInstance);
    result.addFilter('status', 'equals', 'active');

    expect(mockApi.addFilter).toHaveBeenCalledWith('status', 'equals', 'active');
  });

  it('savePreset and loadPreset delegate to gridApi', () => {
    const vue = createMockVueRuntime();
    const useGridFilter = createUseGridFilter(vue);
    const mockApi = createMockGridApi();
    const gridInstance = { value: mockApi };

    const result = useGridFilter(gridInstance);
    result.savePreset('my-filters');
    result.loadPreset('my-filters');

    expect(mockApi.saveFilterPreset).toHaveBeenCalledWith('my-filters');
    expect(mockApi.loadFilterPreset).toHaveBeenCalledWith('my-filters');
  });
});

// ---------------------------------------------------------------------------
// createUseGridEdit
// ---------------------------------------------------------------------------
describe('createUseGridEdit', () => {
  it('returns a function', () => {
    const vue = createMockVueRuntime();
    const useGridEdit = createUseGridEdit(vue);

    expect(typeof useGridEdit).toBe('function');
  });

  it('calling it returns editState, startEdit, commitEdit, cancelEdit, isDirty, dirtyRows', () => {
    const vue = createMockVueRuntime();
    const useGridEdit = createUseGridEdit(vue);
    const result = useGridEdit();

    expect(result).toHaveProperty('editState');
    expect(result).toHaveProperty('startEdit');
    expect(result).toHaveProperty('commitEdit');
    expect(result).toHaveProperty('cancelEdit');
    expect(result).toHaveProperty('isDirty');
    expect(result).toHaveProperty('dirtyRows');
  });

  it('isDirty and dirtyRows are reactive refs with correct initial values', () => {
    const vue = createMockVueRuntime();
    const useGridEdit = createUseGridEdit(vue);
    const result = useGridEdit();

    expect(result.isDirty.value).toBe(false);
    expect(result.dirtyRows.value).toEqual([]);
    expect(result.editState.value).toBeNull();
  });

  it('commitEdit returns a Promise that resolves to false when no gridInstance', async () => {
    const vue = createMockVueRuntime();
    const useGridEdit = createUseGridEdit(vue);
    const result = useGridEdit();

    const pos = { rowId: 'r1', field: 'name' };
    const commitResult = result.commitEdit(pos, 'new-value');

    expect(commitResult).toBeInstanceOf(Promise);
    await expect(commitResult).resolves.toBe(false);
  });

  it('commitEdit delegates to gridApi and returns its Promise when gridInstance is provided', async () => {
    const vue = createMockVueRuntime();
    const useGridEdit = createUseGridEdit(vue);
    const mockApi = createMockGridApi();
    const gridInstance = { value: mockApi };

    const result = useGridEdit(gridInstance);
    const pos = { rowId: 'r1', field: 'name' };
    const commitResult = result.commitEdit(pos, 'new-value');

    expect(mockApi.commitEdit).toHaveBeenCalledWith(pos, 'new-value');
    await expect(commitResult).resolves.toBe(true);
  });
});
