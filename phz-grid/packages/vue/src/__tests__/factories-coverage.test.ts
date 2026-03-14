import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @phozart/grid to avoid side-effect import (registers custom element)
vi.mock('@phozart/grid', () => ({}));

import {
  createPhzGridComponent,
  createUseGrid,
  createUseGridSelection,
  createUseGridSort,
  createUseGridFilter,
  createUseGridEdit,
} from '../factories.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a mock Vue runtime with controllable ref behavior. */
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

/** Build a mock Vue runtime where ref returns a controllable object and
 *  onMounted stores callbacks so we can invoke them after wiring up a mock element. */
function createDeferredVueRuntime() {
  const mountedCallbacks: Function[] = [];
  const watchCallbacks: Array<{ source: Function; cb: Function }> = [];

  return {
    vue: {
      defineComponent: vi.fn((opts: any) => opts),
      h: vi.fn((...args: any[]) => ({ tag: args[0], props: args[1], children: args[2] })),
      ref: <T>(value: T) => ({ value }),
      onMounted: vi.fn((fn: Function) => { mountedCallbacks.push(fn); }),
      onUnmounted: vi.fn(),
      watch: vi.fn((source: any, cb: any) => { watchCallbacks.push({ source, cb }); }),
    },
    mountedCallbacks,
    watchCallbacks,
  };
}

function createMockGridApi() {
  return {
    getState: vi.fn(() => ({ sort: { columns: [] } })),
    getSortState: vi.fn(() => ({ columns: [] })),
    getFilterState: vi.fn(() => ({ filters: [], presets: {} })),
    getEditState: vi.fn(() => ({ status: 'idle' })),
    getSelection: vi.fn(() => ({ rows: ['r1'], cells: [{ rowId: 'r1', field: 'name' }] })),
    getData: vi.fn(() => []),
    getDirtyRows: vi.fn(() => ['r2']),
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
    exportState: vi.fn(() => ({ columns: [], sort: null })),
    importState: vi.fn(),
  } as any;
}

function createMockElement() {
  const listeners: Record<string, Function[]> = {};
  return {
    data: null as any,
    columns: null as any,
    pageSizeOptions: null as any,
    showToolbar: null as any,
    showDensityToggle: null as any,
    showColumnEditor: null as any,
    showAdminSettings: null as any,
    showPagination: null as any,
    showCheckboxes: null as any,
    showRowActions: null as any,
    showSelectionActions: null as any,
    showEditActions: null as any,
    showCopyActions: null as any,
    rowBanding: null as any,
    statusColors: null as any,
    barThresholds: null as any,
    dateFormats: null as any,
    numberFormats: null as any,
    columnStyles: null as any,
    hoverHighlight: null as any,
    compactNumbers: null as any,
    autoSizeColumns: null as any,
    aggregation: null as any,
    groupBy: null as any,
    groupByLevels: null as any,
    groupTotals: null as any,
    groupTotalsFn: null as any,
    conditionalFormattingRules: null as any,
    columnGroups: null as any,
    copyHeaders: null as any,
    copyFormatted: null as any,
    addEventListener: vi.fn((event: string, handler: Function) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    }),
    _listeners: listeners,
    _emit(event: string, detail: any) {
      const handlers = listeners[event] || [];
      for (const h of handlers) {
        h({ detail });
      }
    },
  };
}

// ===========================================================================
// createPhzGridComponent — full coverage
// ===========================================================================
describe('createPhzGridComponent — full coverage', () => {
  it('syncAllProperties sets all props on the element during onMounted', () => {
    const { vue, mountedCallbacks } = createDeferredVueRuntime();
    const component = createPhzGridComponent(vue);

    const mockEl = createMockElement();

    // We need ref to return the mock element for gridRef.
    // The first ref call is for gridRef, second for gridApi.
    let refCallCount = 0;
    const gridRefObj = { value: null as any };
    const gridApiRefObj = { value: null as any };
    vue.ref = ((val: any) => {
      refCallCount++;
      if (refCallCount === 1) return gridRefObj;
      if (refCallCount === 2) return gridApiRefObj;
      return { value: val };
    }) as any;

    const mockProps = {
      data: [{ id: 1, name: 'Alice' }],
      columns: [{ field: 'id' }, { field: 'name' }],
      theme: 'dark',
      locale: 'en-US',
      selectionMode: 'multi',
      editMode: 'click',
      height: 'auto',
      width: '100%',
      pageSizeOptions: [10, 20],
      showToolbar: true,
      showDensityToggle: false,
      showColumnEditor: true,
      showAdminSettings: false,
      showPagination: true,
      showCheckboxes: true,
      showRowActions: false,
      showSelectionActions: true,
      showEditActions: false,
      showCopyActions: true,
      rowBanding: true,
      statusColors: { active: { bg: '#00ff00', color: '#000', dot: '#0f0' } },
      barThresholds: [{ min: 0, color: 'red' }],
      dateFormats: { created: 'YYYY-MM-DD' },
      numberFormats: { amount: { decimals: 2 } },
      columnStyles: { name: 'bold' },
      hoverHighlight: true,
      compactNumbers: true,
      autoSizeColumns: true,
      aggregation: true,
      groupBy: ['status'],
      groupByLevels: [['status', 'region']],
      groupTotals: true,
      groupTotalsFn: 'sum',
      conditionalFormattingRules: [{ field: 'amount', condition: 'gt', value: 100 }],
      columnGroups: [{ header: 'Personal', children: ['name', 'age'] }],
      copyHeaders: true,
      copyFormatted: false,
      modelValue: undefined,
      density: 'compact',
      gridTitle: 'Test Grid',
      gridSubtitle: 'Subtitle',
      scrollMode: 'paginate',
      pageSize: 10,
      gridLines: 'horizontal',
      gridLineColor: '#E7E5E4',
      gridLineWidth: 'thin',
      bandingColor: '#FAFAF9',
      cellTextOverflow: 'wrap',
      aggregationFn: 'sum',
      aggregationPosition: 'bottom',
      userRole: 'user',
      loadingMode: 'paginate',
      virtualScrollThreshold: 0,
      fetchPageSize: 100,
      prefetchPages: 2,
      responsive: true,
      virtualization: true,
      loading: false,
    };
    const mockEmit = vi.fn();
    const mockSlots = { default: vi.fn(() => ['slot-content']) };

    // Wire up the mock element before onMounted fires
    gridRefObj.value = mockEl;

    const renderFn = component.setup(mockProps, { emit: mockEmit, slots: mockSlots });

    // Now fire onMounted callback
    for (const cb of mountedCallbacks) cb();

    // Verify syncAllProperties set data and columns
    expect(mockEl.data).toEqual(mockProps.data);
    expect(mockEl.columns).toEqual(mockProps.columns);
    expect(mockEl.pageSizeOptions).toEqual([10, 20]);
    expect(mockEl.showToolbar).toBe(true);
    expect(mockEl.showDensityToggle).toBe(false);
    expect(mockEl.showColumnEditor).toBe(true);
    expect(mockEl.showAdminSettings).toBe(false);
    expect(mockEl.showPagination).toBe(true);
    expect(mockEl.showCheckboxes).toBe(true);
    expect(mockEl.showRowActions).toBe(false);
    expect(mockEl.showSelectionActions).toBe(true);
    expect(mockEl.showEditActions).toBe(false);
    expect(mockEl.showCopyActions).toBe(true);
    expect(mockEl.rowBanding).toBe(true);
    expect(mockEl.statusColors).toEqual(mockProps.statusColors);
    expect(mockEl.barThresholds).toEqual(mockProps.barThresholds);
    expect(mockEl.dateFormats).toEqual(mockProps.dateFormats);
    expect(mockEl.numberFormats).toEqual(mockProps.numberFormats);
    expect(mockEl.columnStyles).toEqual(mockProps.columnStyles);
    expect(mockEl.hoverHighlight).toBe(true);
    expect(mockEl.compactNumbers).toBe(true);
    expect(mockEl.autoSizeColumns).toBe(true);
    expect(mockEl.aggregation).toBe(true);
    expect(mockEl.groupBy).toEqual(['status']);
    expect(mockEl.groupByLevels).toEqual([['status', 'region']]);
    expect(mockEl.groupTotals).toBe(true);
    expect(mockEl.groupTotalsFn).toBe('sum');
    expect(mockEl.conditionalFormattingRules).toEqual(mockProps.conditionalFormattingRules);
    expect(mockEl.columnGroups).toEqual(mockProps.columnGroups);
    expect(mockEl.copyHeaders).toBe(true);
    expect(mockEl.copyFormatted).toBe(false);

    // Verify event listeners were registered
    expect(mockEl.addEventListener).toHaveBeenCalledWith('grid-ready', expect.any(Function));
    expect(mockEl.addEventListener).toHaveBeenCalledWith('selection-change', expect.any(Function));
    expect(mockEl.addEventListener).toHaveBeenCalledWith('sort-change', expect.any(Function));
    expect(mockEl.addEventListener).toHaveBeenCalledWith('filter-change', expect.any(Function));
    expect(mockEl.addEventListener).toHaveBeenCalledWith('edit-commit', expect.any(Function));
    expect(mockEl.addEventListener).toHaveBeenCalledWith('cell-click', expect.any(Function));
  });

  it('onMounted early-returns when gridRef.value is null', () => {
    const { vue, mountedCallbacks } = createDeferredVueRuntime();
    const component = createPhzGridComponent(vue);

    // ref returns null for gridRef
    let refCallCount = 0;
    vue.ref = ((val: any) => {
      refCallCount++;
      return { value: val };
    }) as any;

    const mockProps = {
      data: [],
      columns: [],
      height: 'auto',
      width: '100%',
      selectionMode: 'single',
      editMode: 'dblclick',
      theme: 'auto',
      locale: 'en-US',
      density: 'compact',
      gridTitle: '',
      gridSubtitle: '',
      scrollMode: 'paginate',
      pageSize: 10,
      gridLines: 'horizontal',
      gridLineColor: '#E7E5E4',
      gridLineWidth: 'thin',
      bandingColor: '#FAFAF9',
      cellTextOverflow: 'wrap',
      aggregationFn: 'sum',
      aggregationPosition: 'bottom',
      userRole: 'user',
      loadingMode: 'paginate',
      virtualScrollThreshold: 0,
      fetchPageSize: 100,
      prefetchPages: 2,
    };
    const mockEmit = vi.fn();
    const mockSlots = {};

    component.setup(mockProps, { emit: mockEmit, slots: mockSlots });

    // onMounted should have been registered
    expect(mountedCallbacks.length).toBe(1);
    // Invoke it — gridRef.value is null so it early-returns
    mountedCallbacks[0]();
    // emit should not have been called
    expect(mockEmit).not.toHaveBeenCalled();
  });

  it('grid-ready event sets gridApi and emits', () => {
    const { vue, mountedCallbacks } = createDeferredVueRuntime();
    const component = createPhzGridComponent(vue);

    const mockEl = createMockElement();
    const gridRefObj = { value: mockEl as any };
    const gridApiRefObj = { value: null as any };
    let refCallCount = 0;
    vue.ref = ((val: any) => {
      refCallCount++;
      if (refCallCount === 1) return gridRefObj;
      if (refCallCount === 2) return gridApiRefObj;
      return { value: val };
    }) as any;

    const mockProps = {
      data: [{ id: 1 }],
      columns: [{ field: 'id' }],
      height: 'auto', width: '100%', selectionMode: 'single', editMode: 'dblclick',
      theme: 'auto', locale: 'en-US', density: 'compact',
      gridTitle: '', gridSubtitle: '', scrollMode: 'paginate', pageSize: 10,
      gridLines: 'horizontal', gridLineColor: '#E7E5E4', gridLineWidth: 'thin',
      bandingColor: '#FAFAF9', cellTextOverflow: 'wrap', aggregationFn: 'sum',
      aggregationPosition: 'bottom', userRole: 'user', loadingMode: 'paginate',
      virtualScrollThreshold: 0, fetchPageSize: 100, prefetchPages: 2,
      modelValue: undefined,
    };
    const mockEmit = vi.fn();
    const mockSlots = {};

    component.setup(mockProps, { emit: mockEmit, slots: mockSlots });

    // Fire onMounted
    for (const cb of mountedCallbacks) cb();

    // Simulate grid-ready event
    const mockApi = createMockGridApi();
    mockEl._emit('grid-ready', { gridInstance: mockApi });

    expect(gridApiRefObj.value).toBe(mockApi);
    expect(mockEmit).toHaveBeenCalledWith('grid-ready', mockApi);
  });

  it('selection-change event emits detail and update:modelValue when modelValue is defined', () => {
    const { vue, mountedCallbacks } = createDeferredVueRuntime();
    const component = createPhzGridComponent(vue);

    const mockEl = createMockElement();
    const gridRefObj = { value: mockEl as any };
    const gridApiRefObj = { value: null as any };
    let refCallCount = 0;
    vue.ref = ((val: any) => {
      refCallCount++;
      if (refCallCount === 1) return gridRefObj;
      if (refCallCount === 2) return gridApiRefObj;
      return { value: val };
    }) as any;

    const mockProps = {
      data: [], columns: [],
      height: 'auto', width: '100%', selectionMode: 'single', editMode: 'dblclick',
      theme: 'auto', locale: 'en-US', density: 'compact',
      gridTitle: '', gridSubtitle: '', scrollMode: 'paginate', pageSize: 10,
      gridLines: 'horizontal', gridLineColor: '#E7E5E4', gridLineWidth: 'thin',
      bandingColor: '#FAFAF9', cellTextOverflow: 'wrap', aggregationFn: 'sum',
      aggregationPosition: 'bottom', userRole: 'user', loadingMode: 'paginate',
      virtualScrollThreshold: 0, fetchPageSize: 100, prefetchPages: 2,
      modelValue: ['existing-row'],
    };
    const mockEmit = vi.fn();
    component.setup(mockProps, { emit: mockEmit, slots: {} });
    for (const cb of mountedCallbacks) cb();

    const detail = { selectedRows: ['r1', 'r2'] };
    mockEl._emit('selection-change', detail);

    expect(mockEmit).toHaveBeenCalledWith('selection-change', detail);
    expect(mockEmit).toHaveBeenCalledWith('update:modelValue', ['r1', 'r2']);
  });

  it('selection-change event does NOT emit update:modelValue when modelValue is undefined', () => {
    const { vue, mountedCallbacks } = createDeferredVueRuntime();
    const component = createPhzGridComponent(vue);

    const mockEl = createMockElement();
    const gridRefObj = { value: mockEl as any };
    const gridApiRefObj = { value: null as any };
    let refCallCount = 0;
    vue.ref = ((val: any) => {
      refCallCount++;
      if (refCallCount === 1) return gridRefObj;
      if (refCallCount === 2) return gridApiRefObj;
      return { value: val };
    }) as any;

    const mockProps = {
      data: [], columns: [],
      height: 'auto', width: '100%', selectionMode: 'single', editMode: 'dblclick',
      theme: 'auto', locale: 'en-US', density: 'compact',
      gridTitle: '', gridSubtitle: '', scrollMode: 'paginate', pageSize: 10,
      gridLines: 'horizontal', gridLineColor: '#E7E5E4', gridLineWidth: 'thin',
      bandingColor: '#FAFAF9', cellTextOverflow: 'wrap', aggregationFn: 'sum',
      aggregationPosition: 'bottom', userRole: 'user', loadingMode: 'paginate',
      virtualScrollThreshold: 0, fetchPageSize: 100, prefetchPages: 2,
      modelValue: undefined,
    };
    const mockEmit = vi.fn();
    component.setup(mockProps, { emit: mockEmit, slots: {} });
    for (const cb of mountedCallbacks) cb();

    mockEl._emit('selection-change', { selectedRows: ['r1'] });

    expect(mockEmit).toHaveBeenCalledWith('selection-change', { selectedRows: ['r1'] });
    expect(mockEmit).not.toHaveBeenCalledWith('update:modelValue', expect.anything());
  });

  it('selection-change falls back to empty array when selectedRows is undefined', () => {
    const { vue, mountedCallbacks } = createDeferredVueRuntime();
    const component = createPhzGridComponent(vue);

    const mockEl = createMockElement();
    const gridRefObj = { value: mockEl as any };
    const gridApiRefObj = { value: null as any };
    let refCallCount = 0;
    vue.ref = ((val: any) => {
      refCallCount++;
      if (refCallCount === 1) return gridRefObj;
      if (refCallCount === 2) return gridApiRefObj;
      return { value: val };
    }) as any;

    const mockProps = {
      data: [], columns: [],
      height: 'auto', width: '100%', selectionMode: 'single', editMode: 'dblclick',
      theme: 'auto', locale: 'en-US', density: 'compact',
      gridTitle: '', gridSubtitle: '', scrollMode: 'paginate', pageSize: 10,
      gridLines: 'horizontal', gridLineColor: '#E7E5E4', gridLineWidth: 'thin',
      bandingColor: '#FAFAF9', cellTextOverflow: 'wrap', aggregationFn: 'sum',
      aggregationPosition: 'bottom', userRole: 'user', loadingMode: 'paginate',
      virtualScrollThreshold: 0, fetchPageSize: 100, prefetchPages: 2,
      modelValue: [],
    };
    const mockEmit = vi.fn();
    component.setup(mockProps, { emit: mockEmit, slots: {} });
    for (const cb of mountedCallbacks) cb();

    // selectedRows is undefined in the detail
    mockEl._emit('selection-change', {});

    expect(mockEmit).toHaveBeenCalledWith('update:modelValue', []);
  });

  it('sort-change, filter-change, edit-commit, cell-click events emit correctly', () => {
    const { vue, mountedCallbacks } = createDeferredVueRuntime();
    const component = createPhzGridComponent(vue);

    const mockEl = createMockElement();
    const gridRefObj = { value: mockEl as any };
    const gridApiRefObj = { value: null as any };
    let refCallCount = 0;
    vue.ref = ((val: any) => {
      refCallCount++;
      if (refCallCount === 1) return gridRefObj;
      if (refCallCount === 2) return gridApiRefObj;
      return { value: val };
    }) as any;

    const mockProps = {
      data: [], columns: [],
      height: 'auto', width: '100%', selectionMode: 'single', editMode: 'dblclick',
      theme: 'auto', locale: 'en-US', density: 'compact',
      gridTitle: '', gridSubtitle: '', scrollMode: 'paginate', pageSize: 10,
      gridLines: 'horizontal', gridLineColor: '#E7E5E4', gridLineWidth: 'thin',
      bandingColor: '#FAFAF9', cellTextOverflow: 'wrap', aggregationFn: 'sum',
      aggregationPosition: 'bottom', userRole: 'user', loadingMode: 'paginate',
      virtualScrollThreshold: 0, fetchPageSize: 100, prefetchPages: 2,
      modelValue: undefined,
    };
    const mockEmit = vi.fn();
    component.setup(mockProps, { emit: mockEmit, slots: {} });
    for (const cb of mountedCallbacks) cb();

    mockEl._emit('sort-change', { field: 'name', direction: 'asc' });
    expect(mockEmit).toHaveBeenCalledWith('sort-change', { field: 'name', direction: 'asc' });

    mockEl._emit('filter-change', { filters: [] });
    expect(mockEmit).toHaveBeenCalledWith('filter-change', { filters: [] });

    mockEl._emit('edit-commit', { rowId: 'r1', field: 'name', value: 'Bob' });
    expect(mockEmit).toHaveBeenCalledWith('edit-commit', { rowId: 'r1', field: 'name', value: 'Bob' });

    mockEl._emit('cell-click', { rowId: 'r1', field: 'name' });
    expect(mockEmit).toHaveBeenCalledWith('cell-click', { rowId: 'r1', field: 'name' });
  });

  it('watch for data updates the element data', () => {
    const { vue, mountedCallbacks, watchCallbacks } = createDeferredVueRuntime();
    const component = createPhzGridComponent(vue);

    const mockEl = createMockElement();
    const gridRefObj = { value: mockEl as any };
    const gridApiRefObj = { value: null as any };
    let refCallCount = 0;
    vue.ref = ((val: any) => {
      refCallCount++;
      if (refCallCount === 1) return gridRefObj;
      if (refCallCount === 2) return gridApiRefObj;
      return { value: val };
    }) as any;

    const mockProps = {
      data: [{ id: 1 }], columns: [{ field: 'id' }],
      height: 'auto', width: '100%', selectionMode: 'single', editMode: 'dblclick',
      theme: 'auto', locale: 'en-US', density: 'compact',
      gridTitle: '', gridSubtitle: '', scrollMode: 'paginate', pageSize: 10,
      gridLines: 'horizontal', gridLineColor: '#E7E5E4', gridLineWidth: 'thin',
      bandingColor: '#FAFAF9', cellTextOverflow: 'wrap', aggregationFn: 'sum',
      aggregationPosition: 'bottom', userRole: 'user', loadingMode: 'paginate',
      virtualScrollThreshold: 0, fetchPageSize: 100, prefetchPages: 2,
    };
    const mockEmit = vi.fn();
    component.setup(mockProps, { emit: mockEmit, slots: {} });

    // There should be 2 watch calls: one for data, one for columns
    expect(watchCallbacks.length).toBe(2);

    // Trigger data watch callback with new data
    const newData = [{ id: 2 }, { id: 3 }];
    watchCallbacks[0].cb(newData);
    expect(mockEl.data).toEqual(newData);

    // Trigger columns watch callback with new columns
    const newCols = [{ field: 'name' }];
    watchCallbacks[1].cb(newCols);
    expect(mockEl.columns).toEqual(newCols);
  });

  it('watch for data does nothing when el is null', () => {
    const { vue, mountedCallbacks, watchCallbacks } = createDeferredVueRuntime();
    const component = createPhzGridComponent(vue);

    // gridRef returns null value
    let refCallCount = 0;
    vue.ref = ((val: any) => {
      refCallCount++;
      return { value: val };
    }) as any;

    const mockProps = {
      data: [], columns: [],
      height: 'auto', width: '100%', selectionMode: 'single', editMode: 'dblclick',
      theme: 'auto', locale: 'en-US', density: 'compact',
      gridTitle: '', gridSubtitle: '', scrollMode: 'paginate', pageSize: 10,
      gridLines: 'horizontal', gridLineColor: '#E7E5E4', gridLineWidth: 'thin',
      bandingColor: '#FAFAF9', cellTextOverflow: 'wrap', aggregationFn: 'sum',
      aggregationPosition: 'bottom', userRole: 'user', loadingMode: 'paginate',
      virtualScrollThreshold: 0, fetchPageSize: 100, prefetchPages: 2,
    };
    component.setup(mockProps, { emit: vi.fn(), slots: {} });

    // Trigger data watch — el is null, should not throw
    expect(() => watchCallbacks[0].cb([{ id: 99 }])).not.toThrow();
    // Trigger columns watch — el is null, should not throw
    expect(() => watchCallbacks[1].cb([{ field: 'x' }])).not.toThrow();
  });

  it('render function converts numeric height and width to px strings', () => {
    const vue = createMockVueRuntime();
    const component = createPhzGridComponent(vue);

    const mockProps = {
      data: [], columns: [],
      height: 500, width: 800,
      selectionMode: 'single', editMode: 'dblclick',
      theme: 'auto', locale: 'en-US', density: 'compact',
      gridTitle: 'My Grid', gridSubtitle: 'Sub',
      scrollMode: 'virtual', pageSize: 20,
      gridLines: 'both', gridLineColor: '#ccc', gridLineWidth: 'medium',
      bandingColor: '#fff', cellTextOverflow: 'ellipsis',
      aggregationFn: 'avg', aggregationPosition: 'top',
      userRole: 'admin', loadingMode: 'lazy',
      virtualScrollThreshold: 100, fetchPageSize: 50, prefetchPages: 3,
    };
    const mockEmit = vi.fn();
    const mockSlots = {};

    const renderFn = component.setup(mockProps, { emit: mockEmit, slots: mockSlots });
    renderFn();

    expect(vue.h).toHaveBeenCalledWith(
      'phz-grid',
      expect.objectContaining({
        'grid-height': '500px',
        'grid-width': '800px',
        density: 'compact',
        'grid-title': 'My Grid',
        'grid-subtitle': 'Sub',
        'scroll-mode': 'virtual',
        'page-size': 20,
        'grid-lines': 'both',
        'grid-line-color': '#ccc',
        'grid-line-width': 'medium',
        'banding-color': '#fff',
        'cell-text-overflow': 'ellipsis',
        'aggregation-fn': 'avg',
        'aggregation-position': 'top',
        'user-role': 'admin',
        'loading-mode': 'lazy',
        'virtual-scroll-threshold': 100,
        'fetch-page-size': 50,
        'prefetch-pages': 3,
      }),
      undefined,
    );
  });

  it('render function passes string height and width as-is', () => {
    const vue = createMockVueRuntime();
    const component = createPhzGridComponent(vue);

    const mockProps = {
      data: [], columns: [],
      height: '50vh', width: '80%',
      selectionMode: 'single', editMode: 'dblclick',
      theme: 'auto', locale: 'en-US', density: 'compact',
      gridTitle: '', gridSubtitle: '', scrollMode: 'paginate', pageSize: 10,
      gridLines: 'horizontal', gridLineColor: '#E7E5E4', gridLineWidth: 'thin',
      bandingColor: '#FAFAF9', cellTextOverflow: 'wrap', aggregationFn: 'sum',
      aggregationPosition: 'bottom', userRole: 'user', loadingMode: 'paginate',
      virtualScrollThreshold: 0, fetchPageSize: 100, prefetchPages: 2,
    };
    const renderFn = component.setup(mockProps, { emit: vi.fn(), slots: {} });
    renderFn();

    expect(vue.h).toHaveBeenCalledWith(
      'phz-grid',
      expect.objectContaining({
        'grid-height': '50vh',
        'grid-width': '80%',
      }),
      undefined,
    );
  });

  it('includes all expected display/config props', () => {
    const vue = createMockVueRuntime();
    const component = createPhzGridComponent(vue);

    const propNames = Object.keys(component.props);
    const expected = [
      'data', 'columns', 'theme', 'locale', 'responsive', 'virtualization',
      'selectionMode', 'editMode', 'loading', 'height', 'width', 'modelValue',
      'density', 'gridTitle', 'gridSubtitle', 'scrollMode', 'pageSize',
      'pageSizeOptions', 'showToolbar', 'showDensityToggle', 'showColumnEditor',
      'showAdminSettings', 'showPagination', 'showCheckboxes', 'showRowActions',
      'showSelectionActions', 'showEditActions', 'showCopyActions', 'rowBanding',
      'statusColors', 'barThresholds', 'dateFormats', 'numberFormats', 'columnStyles',
      'gridLines', 'gridLineColor', 'gridLineWidth', 'bandingColor', 'hoverHighlight',
      'cellTextOverflow', 'compactNumbers', 'autoSizeColumns', 'aggregation',
      'aggregationFn', 'aggregationPosition', 'groupBy', 'groupByLevels', 'groupTotals',
      'groupTotalsFn', 'conditionalFormattingRules', 'columnGroups', 'userRole',
      'copyHeaders', 'copyFormatted', 'loadingMode', 'virtualScrollThreshold',
      'fetchPageSize', 'prefetchPages',
    ];
    for (const prop of expected) {
      expect(propNames).toContain(prop);
    }
  });

  it('prop defaults return correct types', () => {
    const vue = createMockVueRuntime();
    const component = createPhzGridComponent(vue);

    // Props with function defaults
    expect(component.props.pageSizeOptions.default()).toEqual([5, 10, 20, 50]);
    expect(component.props.statusColors.default()).toEqual({});
    expect(component.props.barThresholds.default()).toEqual([]);
    expect(component.props.dateFormats.default()).toEqual({});
    expect(component.props.numberFormats.default()).toEqual({});
    expect(component.props.columnStyles.default()).toEqual({});
    expect(component.props.groupBy.default()).toEqual([]);
    expect(component.props.groupByLevels.default()).toEqual([]);
    expect(component.props.conditionalFormattingRules.default()).toEqual([]);
    expect(component.props.columnGroups.default()).toEqual([]);
  });
});

// ===========================================================================
// createUseGrid — full coverage
// ===========================================================================
describe('createUseGrid — full coverage', () => {
  it('importState is a no-op when gridInstance is null', () => {
    const vue = createMockVueRuntime();
    const useGrid = createUseGrid(vue);
    const result = useGrid();

    // Should not throw
    expect(() => result.importState({ columns: [], sort: null } as any)).not.toThrow();
  });

  it('importState delegates to gridInstance when available', () => {
    const vue = createMockVueRuntime();
    const useGrid = createUseGrid(vue);
    const result = useGrid();
    const mockApi = createMockGridApi();
    result.gridInstance.value = mockApi;

    const state = { columns: [{ field: 'name' }], sort: null } as any;
    result.importState(state);

    expect(mockApi.importState).toHaveBeenCalledWith(state);
  });
});

// ===========================================================================
// createUseGridSelection — full coverage
// ===========================================================================
describe('createUseGridSelection — full coverage', () => {
  it('watch callback syncs selection and registers event listener', () => {
    const vue = createMockVueRuntime();
    const useGridSelection = createUseGridSelection(vue);
    const mockApi = createMockGridApi();
    const gridInstance = { value: mockApi };

    const result = useGridSelection(gridInstance);

    // vue.watch should have been called
    expect(vue.watch).toHaveBeenCalledOnce();

    // Get the watch callback and invoke it with the mock API
    const watchCall = (vue.watch as any).mock.calls[0];
    const watchCallback = watchCall[1];

    watchCallback(mockApi);

    // After sync, selectedRows and selectedCells should reflect getSelection()
    expect(result.selectedRows.value).toEqual(['r1']);
    expect(result.selectedCells.value).toEqual([{ rowId: 'r1', field: 'name' }]);

    // on('selection:change', sync) should have been registered
    expect(mockApi.on).toHaveBeenCalledWith('selection:change', expect.any(Function));
  });

  it('watch callback does nothing when grid is null', () => {
    const vue = createMockVueRuntime();
    const useGridSelection = createUseGridSelection(vue);
    const gridInstance = { value: null as any };

    const result = useGridSelection(gridInstance);

    const watchCall = (vue.watch as any).mock.calls[0];
    const watchCallback = watchCall[1];

    // Should not throw when grid is null
    watchCallback(null);

    expect(result.selectedRows.value).toEqual([]);
    expect(result.selectedCells.value).toEqual([]);
  });

  it('selection:change event callback re-syncs state', () => {
    const vue = createMockVueRuntime();
    const useGridSelection = createUseGridSelection(vue);
    const mockApi = createMockGridApi();
    const gridInstance = { value: mockApi };

    const result = useGridSelection(gridInstance);

    // Get the watch callback and invoke it
    const watchCallback = (vue.watch as any).mock.calls[0][1];
    watchCallback(mockApi);

    // Find the on('selection:change') callback
    const onCall = mockApi.on.mock.calls.find((c: any[]) => c[0] === 'selection:change');
    expect(onCall).toBeDefined();
    const syncCallback = onCall[1];

    // Change what getSelection returns
    mockApi.getSelection.mockReturnValue({ rows: ['r3', 'r4'], cells: [] });
    syncCallback();

    expect(result.selectedRows.value).toEqual(['r3', 'r4']);
    expect(result.selectedCells.value).toEqual([]);
  });

  it('deselect delegates to gridApi', () => {
    const vue = createMockVueRuntime();
    const useGridSelection = createUseGridSelection(vue);
    const mockApi = createMockGridApi();
    const gridInstance = { value: mockApi };

    const result = useGridSelection(gridInstance);
    result.deselect(['r1']);

    expect(mockApi.deselect).toHaveBeenCalledWith(['r1']);
  });

  it('selectAll delegates to gridApi', () => {
    const vue = createMockVueRuntime();
    const useGridSelection = createUseGridSelection(vue);
    const mockApi = createMockGridApi();
    const gridInstance = { value: mockApi };

    const result = useGridSelection(gridInstance);
    result.selectAll();

    expect(mockApi.selectAll).toHaveBeenCalledOnce();
  });

  it('deselectAll delegates to gridApi', () => {
    const vue = createMockVueRuntime();
    const useGridSelection = createUseGridSelection(vue);
    const mockApi = createMockGridApi();
    const gridInstance = { value: mockApi };

    const result = useGridSelection(gridInstance);
    result.deselectAll();

    expect(mockApi.deselectAll).toHaveBeenCalledOnce();
  });

  it('selectRange delegates to gridApi', () => {
    const vue = createMockVueRuntime();
    const useGridSelection = createUseGridSelection(vue);
    const mockApi = createMockGridApi();
    const gridInstance = { value: mockApi };

    const result = useGridSelection(gridInstance);
    const start = { rowId: 'r1', field: 'name' };
    const end = { rowId: 'r3', field: 'age' };
    result.selectRange(start, end);

    expect(mockApi.selectRange).toHaveBeenCalledWith(start, end);
  });

  it('methods are no-ops when gridInstance is not provided', () => {
    const vue = createMockVueRuntime();
    const useGridSelection = createUseGridSelection(vue);
    const result = useGridSelection();

    // None of these should throw
    expect(() => result.select(['r1'])).not.toThrow();
    expect(() => result.deselect(['r1'])).not.toThrow();
    expect(() => result.selectAll()).not.toThrow();
    expect(() => result.deselectAll()).not.toThrow();
    expect(() => result.selectRange({ rowId: 'r1', field: 'a' }, { rowId: 'r2', field: 'b' })).not.toThrow();
  });

  it('methods are no-ops when gridInstance.value is null', () => {
    const vue = createMockVueRuntime();
    const useGridSelection = createUseGridSelection(vue);
    const gridInstance = { value: null as any };
    const result = useGridSelection(gridInstance);

    expect(() => result.select(['r1'])).not.toThrow();
    expect(() => result.deselect(['r1'])).not.toThrow();
    expect(() => result.selectAll()).not.toThrow();
    expect(() => result.deselectAll()).not.toThrow();
    expect(() => result.selectRange({ rowId: 'r1', field: 'a' }, { rowId: 'r2', field: 'b' })).not.toThrow();
  });

  it('does not register watch when no gridInstance', () => {
    const vue = createMockVueRuntime();
    const useGridSelection = createUseGridSelection(vue);
    useGridSelection();

    expect(vue.watch).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// createUseGridSort — full coverage
// ===========================================================================
describe('createUseGridSort — full coverage', () => {
  it('watch callback syncs sort state and registers event listener', () => {
    const vue = createMockVueRuntime();
    const useGridSort = createUseGridSort(vue);
    const mockApi = createMockGridApi();
    const gridInstance = { value: mockApi };

    const result = useGridSort(gridInstance);

    expect(vue.watch).toHaveBeenCalledOnce();
    const watchCallback = (vue.watch as any).mock.calls[0][1];
    watchCallback(mockApi);

    expect(result.sortState.value).toEqual({ columns: [] });
    expect(mockApi.on).toHaveBeenCalledWith('sort:change', expect.any(Function));
  });

  it('watch callback does nothing when grid is null', () => {
    const vue = createMockVueRuntime();
    const useGridSort = createUseGridSort(vue);
    const gridInstance = { value: null as any };

    const result = useGridSort(gridInstance);

    const watchCallback = (vue.watch as any).mock.calls[0][1];
    watchCallback(null);

    expect(result.sortState.value).toBeNull();
  });

  it('sort:change event callback re-syncs sort state', () => {
    const vue = createMockVueRuntime();
    const useGridSort = createUseGridSort(vue);
    const mockApi = createMockGridApi();
    const gridInstance = { value: mockApi };

    const result = useGridSort(gridInstance);

    const watchCallback = (vue.watch as any).mock.calls[0][1];
    watchCallback(mockApi);

    const onCall = mockApi.on.mock.calls.find((c: any[]) => c[0] === 'sort:change');
    const sortChangeCallback = onCall[1];

    mockApi.getSortState.mockReturnValue({ columns: [{ field: 'name', direction: 'asc' }] });
    sortChangeCallback();

    expect(result.sortState.value).toEqual({ columns: [{ field: 'name', direction: 'asc' }] });
  });

  it('clearSort delegates to gridApi', () => {
    const vue = createMockVueRuntime();
    const useGridSort = createUseGridSort(vue);
    const mockApi = createMockGridApi();
    const gridInstance = { value: mockApi };

    const result = useGridSort(gridInstance);
    result.clearSort();

    expect(mockApi.clearSort).toHaveBeenCalledOnce();
  });

  it('methods are no-ops when gridInstance is not provided', () => {
    const vue = createMockVueRuntime();
    const useGridSort = createUseGridSort(vue);
    const result = useGridSort();

    expect(() => result.sort('name', 'asc')).not.toThrow();
    expect(() => result.multiSort([{ field: 'name', direction: 'asc' }])).not.toThrow();
    expect(() => result.clearSort()).not.toThrow();
  });

  it('methods are no-ops when gridInstance.value is null', () => {
    const vue = createMockVueRuntime();
    const useGridSort = createUseGridSort(vue);
    const gridInstance = { value: null as any };
    const result = useGridSort(gridInstance);

    expect(() => result.sort('name', 'asc')).not.toThrow();
    expect(() => result.multiSort([{ field: 'name', direction: 'asc' }])).not.toThrow();
    expect(() => result.clearSort()).not.toThrow();
  });

  it('does not register watch when no gridInstance', () => {
    const vue = createMockVueRuntime();
    const useGridSort = createUseGridSort(vue);
    useGridSort();

    expect(vue.watch).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// createUseGridFilter — full coverage
// ===========================================================================
describe('createUseGridFilter — full coverage', () => {
  it('watch callback syncs filter state and registers event listener', () => {
    const vue = createMockVueRuntime();
    const useGridFilter = createUseGridFilter(vue);
    const mockApi = createMockGridApi();
    const gridInstance = { value: mockApi };

    const result = useGridFilter(gridInstance);

    expect(vue.watch).toHaveBeenCalledOnce();
    const watchCallback = (vue.watch as any).mock.calls[0][1];
    watchCallback(mockApi);

    expect(result.filterState.value).toEqual({ filters: [], presets: {} });
    expect(mockApi.on).toHaveBeenCalledWith('filter:change', expect.any(Function));
  });

  it('watch callback does nothing when grid is null', () => {
    const vue = createMockVueRuntime();
    const useGridFilter = createUseGridFilter(vue);
    const gridInstance = { value: null as any };

    const result = useGridFilter(gridInstance);

    const watchCallback = (vue.watch as any).mock.calls[0][1];
    watchCallback(null);

    expect(result.filterState.value).toBeNull();
  });

  it('filter:change event callback re-syncs filter state', () => {
    const vue = createMockVueRuntime();
    const useGridFilter = createUseGridFilter(vue);
    const mockApi = createMockGridApi();
    const gridInstance = { value: mockApi };

    const result = useGridFilter(gridInstance);

    const watchCallback = (vue.watch as any).mock.calls[0][1];
    watchCallback(mockApi);

    const onCall = mockApi.on.mock.calls.find((c: any[]) => c[0] === 'filter:change');
    const filterChangeCallback = onCall[1];

    mockApi.getFilterState.mockReturnValue({ filters: [{ field: 'status', op: 'eq', value: 'active' }], presets: {} });
    filterChangeCallback();

    expect(result.filterState.value).toEqual({
      filters: [{ field: 'status', op: 'eq', value: 'active' }],
      presets: {},
    });
  });

  it('removeFilter delegates to gridApi', () => {
    const vue = createMockVueRuntime();
    const useGridFilter = createUseGridFilter(vue);
    const mockApi = createMockGridApi();
    const gridInstance = { value: mockApi };

    const result = useGridFilter(gridInstance);
    result.removeFilter('status');

    expect(mockApi.removeFilter).toHaveBeenCalledWith('status');
  });

  it('clearFilters delegates to gridApi', () => {
    const vue = createMockVueRuntime();
    const useGridFilter = createUseGridFilter(vue);
    const mockApi = createMockGridApi();
    const gridInstance = { value: mockApi };

    const result = useGridFilter(gridInstance);
    result.clearFilters();

    expect(mockApi.clearFilters).toHaveBeenCalledOnce();
  });

  it('methods are no-ops when gridInstance is not provided', () => {
    const vue = createMockVueRuntime();
    const useGridFilter = createUseGridFilter(vue);
    const result = useGridFilter();

    expect(() => result.addFilter('name', 'equals', 'x')).not.toThrow();
    expect(() => result.removeFilter('name')).not.toThrow();
    expect(() => result.clearFilters()).not.toThrow();
    expect(() => result.savePreset('preset1')).not.toThrow();
    expect(() => result.loadPreset('preset1')).not.toThrow();
  });

  it('methods are no-ops when gridInstance.value is null', () => {
    const vue = createMockVueRuntime();
    const useGridFilter = createUseGridFilter(vue);
    const gridInstance = { value: null as any };
    const result = useGridFilter(gridInstance);

    expect(() => result.addFilter('name', 'equals', 'x')).not.toThrow();
    expect(() => result.removeFilter('name')).not.toThrow();
    expect(() => result.clearFilters()).not.toThrow();
    expect(() => result.savePreset('preset1')).not.toThrow();
    expect(() => result.loadPreset('preset1')).not.toThrow();
  });

  it('does not register watch when no gridInstance', () => {
    const vue = createMockVueRuntime();
    const useGridFilter = createUseGridFilter(vue);
    useGridFilter();

    expect(vue.watch).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// createUseGridEdit — full coverage
// ===========================================================================
describe('createUseGridEdit — full coverage', () => {
  it('watch callback syncs edit state, isDirty, dirtyRows and subscribes', () => {
    const vue = createMockVueRuntime();
    const useGridEdit = createUseGridEdit(vue);
    const mockApi = createMockGridApi();
    const gridInstance = { value: mockApi };

    const result = useGridEdit(gridInstance);

    expect(vue.watch).toHaveBeenCalledOnce();
    const watchCallback = (vue.watch as any).mock.calls[0][1];
    watchCallback(mockApi);

    expect(result.editState.value).toEqual({ status: 'idle' });
    expect(result.isDirty.value).toBe(true);
    expect(result.dirtyRows.value).toEqual(['r2']);
    expect(mockApi.subscribe).toHaveBeenCalledWith(expect.any(Function));
  });

  it('watch callback does nothing when grid is null', () => {
    const vue = createMockVueRuntime();
    const useGridEdit = createUseGridEdit(vue);
    const gridInstance = { value: null as any };

    const result = useGridEdit(gridInstance);

    const watchCallback = (vue.watch as any).mock.calls[0][1];
    watchCallback(null);

    expect(result.editState.value).toBeNull();
    expect(result.isDirty.value).toBe(false);
    expect(result.dirtyRows.value).toEqual([]);
  });

  it('subscribe callback re-syncs edit state', () => {
    const vue = createMockVueRuntime();
    const useGridEdit = createUseGridEdit(vue);
    const mockApi = createMockGridApi();
    const gridInstance = { value: mockApi };

    const result = useGridEdit(gridInstance);

    const watchCallback = (vue.watch as any).mock.calls[0][1];
    watchCallback(mockApi);

    // Find the subscribe callback
    const subscribeCallback = mockApi.subscribe.mock.calls[0][0];

    // Change what the API returns
    mockApi.getEditState.mockReturnValue({ status: 'editing', cell: { rowId: 'r1', field: 'name' } });
    mockApi.isDirty.mockReturnValue(false);
    mockApi.getDirtyRows.mockReturnValue([]);
    subscribeCallback();

    expect(result.editState.value).toEqual({ status: 'editing', cell: { rowId: 'r1', field: 'name' } });
    expect(result.isDirty.value).toBe(false);
    expect(result.dirtyRows.value).toEqual([]);
  });

  it('startEdit delegates to gridApi', () => {
    const vue = createMockVueRuntime();
    const useGridEdit = createUseGridEdit(vue);
    const mockApi = createMockGridApi();
    const gridInstance = { value: mockApi };

    const result = useGridEdit(gridInstance);
    const pos = { rowId: 'r1', field: 'name' };
    result.startEdit(pos);

    expect(mockApi.startEdit).toHaveBeenCalledWith(pos);
  });

  it('cancelEdit delegates to gridApi', () => {
    const vue = createMockVueRuntime();
    const useGridEdit = createUseGridEdit(vue);
    const mockApi = createMockGridApi();
    const gridInstance = { value: mockApi };

    const result = useGridEdit(gridInstance);
    const pos = { rowId: 'r1', field: 'name' };
    result.cancelEdit(pos);

    expect(mockApi.cancelEdit).toHaveBeenCalledWith(pos);
  });

  it('methods are no-ops when gridInstance is not provided', () => {
    const vue = createMockVueRuntime();
    const useGridEdit = createUseGridEdit(vue);
    const result = useGridEdit();

    expect(() => result.startEdit({ rowId: 'r1', field: 'name' })).not.toThrow();
    expect(() => result.cancelEdit({ rowId: 'r1', field: 'name' })).not.toThrow();
  });

  it('methods are no-ops when gridInstance.value is null', () => {
    const vue = createMockVueRuntime();
    const useGridEdit = createUseGridEdit(vue);
    const gridInstance = { value: null as any };
    const result = useGridEdit(gridInstance);

    expect(() => result.startEdit({ rowId: 'r1', field: 'name' })).not.toThrow();
    expect(() => result.cancelEdit({ rowId: 'r1', field: 'name' })).not.toThrow();
  });

  it('commitEdit returns false promise when gridInstance.value is null', async () => {
    const vue = createMockVueRuntime();
    const useGridEdit = createUseGridEdit(vue);
    const gridInstance = { value: null as any };
    const result = useGridEdit(gridInstance);

    const pos = { rowId: 'r1', field: 'name' };
    const commitResult = result.commitEdit(pos, 'val');
    await expect(commitResult).resolves.toBe(false);
  });

  it('does not register watch when no gridInstance', () => {
    const vue = createMockVueRuntime();
    const useGridEdit = createUseGridEdit(vue);
    useGridEdit();

    expect(vue.watch).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// VueRuntime interface — verify ref is called
// ===========================================================================
describe('VueRuntime ref usage', () => {
  it('createUseGrid calls vue.ref for gridInstance and state', () => {
    const vue = createMockVueRuntime();
    const refSpy = vi.fn((val: any) => ({ value: val }));
    vue.ref = refSpy as any;

    const useGrid = createUseGrid(vue);
    useGrid();

    // Should be called twice: once for gridInstance(null), once for state(null)
    expect(refSpy).toHaveBeenCalledTimes(2);
    expect(refSpy).toHaveBeenCalledWith(null);
  });

  it('createUseGridSelection calls vue.ref for selectedRows and selectedCells', () => {
    const vue = createMockVueRuntime();
    const refSpy = vi.fn((val: any) => ({ value: val }));
    vue.ref = refSpy as any;

    const useGridSelection = createUseGridSelection(vue);
    useGridSelection();

    expect(refSpy).toHaveBeenCalledTimes(2);
    expect(refSpy).toHaveBeenCalledWith([]);
  });

  it('createUseGridSort calls vue.ref for sortState', () => {
    const vue = createMockVueRuntime();
    const refSpy = vi.fn((val: any) => ({ value: val }));
    vue.ref = refSpy as any;

    const useGridSort = createUseGridSort(vue);
    useGridSort();

    expect(refSpy).toHaveBeenCalledTimes(1);
    expect(refSpy).toHaveBeenCalledWith(null);
  });

  it('createUseGridFilter calls vue.ref for filterState', () => {
    const vue = createMockVueRuntime();
    const refSpy = vi.fn((val: any) => ({ value: val }));
    vue.ref = refSpy as any;

    const useGridFilter = createUseGridFilter(vue);
    useGridFilter();

    expect(refSpy).toHaveBeenCalledTimes(1);
    expect(refSpy).toHaveBeenCalledWith(null);
  });

  it('createUseGridEdit calls vue.ref for editState, isDirty, dirtyRows', () => {
    const vue = createMockVueRuntime();
    const refSpy = vi.fn((val: any) => ({ value: val }));
    vue.ref = refSpy as any;

    const useGridEdit = createUseGridEdit(vue);
    useGridEdit();

    expect(refSpy).toHaveBeenCalledTimes(3);
    expect(refSpy).toHaveBeenCalledWith(null);
    expect(refSpy).toHaveBeenCalledWith(false);
    expect(refSpy).toHaveBeenCalledWith([]);
  });
});
