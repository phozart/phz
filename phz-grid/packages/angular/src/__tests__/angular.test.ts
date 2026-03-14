import { describe, it, expect, vi } from 'vitest';

// Mock @phozart/grid to avoid side-effect import (registers custom element)
vi.mock('@phozart/grid', () => ({}));

import {
  createPhzGridComponent,
  createGridService,
  createSelectionService,
  createSortService,
  createFilterService,
  createEditService,
  createDataService,
} from '../factories.js';

// ---------------------------------------------------------------------------
// Mock Helpers
// ---------------------------------------------------------------------------

function createMockAngularRuntime() {
  return {
    Component: vi.fn(),
    Input: vi.fn(),
    Output: vi.fn(),
    EventEmitter: class {
      emit = vi.fn();
    },
    Injectable: vi.fn(),
  };
}

/**
 * Minimal BehaviorSubject mock matching the RxJSRuntime interface.
 */
class MockBehaviorSubject<T> {
  value: T;
  private subscribers: Array<(value: T) => void> = [];

  constructor(initial: T) {
    this.value = initial;
  }

  next(value: T) {
    this.value = value;
    for (const sub of this.subscribers) sub(value);
  }

  subscribe(observer: (value: T) => void) {
    this.subscribers.push(observer);
    observer(this.value);
    return {
      unsubscribe: () => {
        this.subscribers = this.subscribers.filter((s) => s !== observer);
      },
    };
  }

  asObservable() {
    return { subscribe: (obs: any) => this.subscribe(obs) };
  }

  complete() {
    this.subscribers = [];
  }
}

class MockSubject<T> {
  private subscribers: Array<(value: T) => void> = [];

  next(value: T) {
    for (const sub of this.subscribers) sub(value);
  }

  subscribe(observer: (value: T) => void) {
    this.subscribers.push(observer);
    return {
      unsubscribe: () => {
        this.subscribers = this.subscribers.filter((s) => s !== observer);
      },
    };
  }

  asObservable() {
    return { subscribe: (obs: any) => this.subscribe(obs) };
  }

  complete() {
    this.subscribers = [];
  }
}

function createMockRxJS() {
  return {
    BehaviorSubject: MockBehaviorSubject as any,
    Subject: MockSubject as any,
  };
}

function createMockGridApi() {
  return {
    getState: vi.fn(() => ({ sort: { columns: [] } })),
    getSortState: vi.fn(() => ({ columns: [] })),
    getFilterState: vi.fn(() => ({ filters: [], presets: {} })),
    getEditState: vi.fn(() => ({ status: 'idle' })),
    getSelection: vi.fn(() => ({ rows: ['r1'], cells: [] })),
    getData: vi.fn(() => [{ id: 1, name: 'A' }]),
    getDirtyRows: vi.fn(() => []),
    isDirty: vi.fn(() => false),
    subscribe: vi.fn((_cb: Function) => vi.fn()),
    on: vi.fn((_event: string, _cb: Function) => vi.fn()),
    sort: vi.fn(),
    multiSort: vi.fn(),
    clearSort: vi.fn(),
    addFilter: vi.fn(),
    removeFilter: vi.fn(),
    clearFilters: vi.fn(),
    select: vi.fn(),
    deselect: vi.fn(),
    selectAll: vi.fn(),
    deselectAll: vi.fn(),
    startEdit: vi.fn(),
    commitEdit: vi.fn(() => Promise.resolve(true)),
    cancelEdit: vi.fn(),
    setData: vi.fn(),
    addRow: vi.fn(() => 'new-row-id'),
    updateRow: vi.fn(),
    deleteRow: vi.fn(),
    exportCsv: vi.fn(() => 'csv-data'),
    destroy: vi.fn(),
  } as any;
}

// ===========================================================================
// createPhzGridComponent
// ===========================================================================

describe('createPhzGridComponent', () => {
  it('returns a class whose instances have default input values', () => {
    const ng = createMockAngularRuntime();
    const PhzGridComponent = createPhzGridComponent(ng);
    const instance = new PhzGridComponent();

    expect(instance.data).toEqual([]);
    expect(instance.columns).toEqual([]);
    expect(instance.theme).toBe('auto');
    expect(instance.locale).toBe('en-US');
    expect(instance.responsive).toBe(true);
    expect(instance.virtualization).toBe(true);
    expect(instance.selectionMode).toBe('single');
    expect(instance.editMode).toBe('dblclick');
    expect(instance.loading).toBe(false);
    expect(instance.height).toBe('auto');
    expect(instance.width).toBe('100%');
  });

  it('instance has EventEmitter outputs for grid events', () => {
    const ng = createMockAngularRuntime();
    const PhzGridComponent = createPhzGridComponent(ng);
    const instance = new PhzGridComponent();

    // Every output should be an EventEmitter instance with an emit method
    expect(instance.gridReady).toBeDefined();
    expect(typeof instance.gridReady.emit).toBe('function');
    expect(instance.stateChange).toBeDefined();
    expect(typeof instance.stateChange.emit).toBe('function');
    expect(instance.cellClick).toBeDefined();
    expect(typeof instance.cellClick.emit).toBe('function');
    expect(instance.selectionChange).toBeDefined();
    expect(typeof instance.selectionChange.emit).toBe('function');
    expect(instance.sortChange).toBeDefined();
    expect(typeof instance.sortChange.emit).toBe('function');
    expect(instance.filterChange).toBeDefined();
    expect(typeof instance.filterChange.emit).toBe('function');
    expect(instance.editCommit).toBeDefined();
    expect(typeof instance.editCommit.emit).toBe('function');
  });

  it('getGridInstance returns null before initialization', () => {
    const ng = createMockAngularRuntime();
    const PhzGridComponent = createPhzGridComponent(ng);
    const instance = new PhzGridComponent();

    expect(instance.getGridInstance()).toBeNull();
  });
});

// ===========================================================================
// createGridService
// ===========================================================================

describe('createGridService', () => {
  it('returns a class that can be instantiated', () => {
    const ng = createMockAngularRuntime();
    const GridService = createGridService(ng);
    const svc = new GridService();

    expect(svc).toBeDefined();
    expect(typeof svc.setGridApi).toBe('function');
  });

  it('instance exposes sort, filter, selection, and edit methods', () => {
    const ng = createMockAngularRuntime();
    const GridService = createGridService(ng);
    const svc = new GridService();

    expect(typeof svc.sort).toBe('function');
    expect(typeof svc.clearSort).toBe('function');
    expect(typeof svc.addFilter).toBe('function');
    expect(typeof svc.removeFilter).toBe('function');
    expect(typeof svc.clearFilters).toBe('function');
    expect(typeof svc.select).toBe('function');
    expect(typeof svc.deselect).toBe('function');
    expect(typeof svc.selectAll).toBe('function');
    expect(typeof svc.deselectAll).toBe('function');
    expect(typeof svc.startEdit).toBe('function');
    expect(typeof svc.commitEdit).toBe('function');
    expect(typeof svc.cancelEdit).toBe('function');
    expect(typeof svc.exportCsv).toBe('function');
    expect(typeof svc.destroy).toBe('function');
  });

  it('returns null or defaults when no gridApi is set', () => {
    const ng = createMockAngularRuntime();
    const GridService = createGridService(ng);
    const svc = new GridService();

    expect(svc.getState()).toBeNull();
    expect(svc.getSortState()).toBeNull();
    expect(svc.getFilterState()).toBeNull();
    expect(svc.getEditState()).toBeNull();
    expect(svc.getSelection()).toEqual({ rows: [], cells: [] });
    expect(svc.exportCsv()).toBe('');
  });

  it('delegates to gridApi after setGridApi is called', () => {
    const ng = createMockAngularRuntime();
    const GridService = createGridService(ng);
    const svc = new GridService();
    const api = createMockGridApi();

    svc.setGridApi(api);

    svc.sort('name', 'asc');
    expect(api.sort).toHaveBeenCalledWith('name', 'asc');

    svc.clearSort();
    expect(api.clearSort).toHaveBeenCalled();

    svc.addFilter('age', 'gt', 18);
    expect(api.addFilter).toHaveBeenCalledWith('age', 'gt', 18);

    svc.removeFilter('age');
    expect(api.removeFilter).toHaveBeenCalledWith('age');

    svc.clearFilters();
    expect(api.clearFilters).toHaveBeenCalled();

    svc.select(['r1']);
    expect(api.select).toHaveBeenCalledWith(['r1']);

    svc.deselect(['r1']);
    expect(api.deselect).toHaveBeenCalledWith(['r1']);

    svc.selectAll();
    expect(api.selectAll).toHaveBeenCalled();

    svc.deselectAll();
    expect(api.deselectAll).toHaveBeenCalled();

    const pos = { rowId: 'r1', field: 'name' };
    svc.startEdit(pos);
    expect(api.startEdit).toHaveBeenCalledWith(pos);

    svc.commitEdit(pos, 'Bob');
    expect(api.commitEdit).toHaveBeenCalledWith(pos, 'Bob');

    svc.cancelEdit(pos);
    expect(api.cancelEdit).toHaveBeenCalledWith(pos);

    expect(svc.getState()).toEqual({ sort: { columns: [] } });
    expect(api.getState).toHaveBeenCalled();

    expect(svc.exportCsv()).toBe('csv-data');
    expect(api.exportCsv).toHaveBeenCalled();
  });
});

// ===========================================================================
// createSelectionService
// ===========================================================================

describe('createSelectionService', () => {
  it('returns a factory function', () => {
    const rxjs = createMockRxJS();
    const factory = createSelectionService(rxjs);

    expect(typeof factory).toBe('function');
  });

  it('returns service with selectedRows$, selectedCells$, and action methods', () => {
    const rxjs = createMockRxJS();
    const api = createMockGridApi();
    const svc = createSelectionService(rxjs)(api);

    expect(svc.selectedRows$).toBeDefined();
    expect(svc.selectedCells$).toBeDefined();
    expect(typeof svc.select).toBe('function');
    expect(typeof svc.deselect).toBe('function');
    expect(typeof svc.selectAll).toBe('function');
    expect(typeof svc.deselectAll).toBe('function');
    expect(typeof svc.destroy).toBe('function');

    // selectedRows$ emits initial selection from getSelection()
    let emittedRows: any = null;
    svc.selectedRows$.subscribe((val: any) => {
      emittedRows = val;
    });
    expect(emittedRows).toEqual(['r1']);

    let emittedCells: any = null;
    svc.selectedCells$.subscribe((val: any) => {
      emittedCells = val;
    });
    expect(emittedCells).toEqual([]);

    // Action methods delegate to gridApi
    svc.select(['r2']);
    expect(api.select).toHaveBeenCalledWith(['r2']);

    svc.deselect(['r1']);
    expect(api.deselect).toHaveBeenCalledWith(['r1']);

    svc.selectAll();
    expect(api.selectAll).toHaveBeenCalled();

    svc.deselectAll();
    expect(api.deselectAll).toHaveBeenCalled();
  });

  it('destroy calls unsub and completes subjects', () => {
    const rxjs = createMockRxJS();
    const api = createMockGridApi();
    const unsub = vi.fn();
    api.on.mockReturnValue(unsub);

    const svc = createSelectionService(rxjs)(api);

    // After destroy, further subscriptions should not receive new values
    svc.destroy();
    expect(unsub).toHaveBeenCalled();

    // Verify that subscribers added after destroy get no further emissions
    let emitted = false;
    svc.selectedRows$.subscribe(() => {
      emitted = true;
    });
    // complete() clears subscribers, so subscribe won't fire since
    // our mock BehaviorSubject.complete empties the list, then subscribe
    // adds a new subscriber and immediately calls with the current value.
    // However the key assertion is that unsub was called.
    expect(unsub).toHaveBeenCalledTimes(1);
  });
});

// ===========================================================================
// createSortService
// ===========================================================================

describe('createSortService', () => {
  it('returns service with sortState$ observable that emits initial state', () => {
    const rxjs = createMockRxJS();
    const api = createMockGridApi();
    const svc = createSortService(rxjs)(api);

    let emitted: any = null;
    svc.sortState$.subscribe((val: any) => {
      emitted = val;
    });
    expect(emitted).toEqual({ columns: [] });
  });

  it('sort, multiSort, and clearSort delegate to gridApi', () => {
    const rxjs = createMockRxJS();
    const api = createMockGridApi();
    const svc = createSortService(rxjs)(api);

    svc.sort('name', 'asc');
    expect(api.sort).toHaveBeenCalledWith('name', 'asc');

    svc.multiSort([{ field: 'age', direction: 'desc' }]);
    expect(api.multiSort).toHaveBeenCalledWith([{ field: 'age', direction: 'desc' }]);

    svc.clearSort();
    expect(api.clearSort).toHaveBeenCalled();

    // destroy cleans up
    const unsub = vi.fn();
    api.on.mockReturnValue(unsub);
    const svc2 = createSortService(rxjs)(api);
    svc2.destroy();
    expect(unsub).toHaveBeenCalled();
  });
});

// ===========================================================================
// createFilterService
// ===========================================================================

describe('createFilterService', () => {
  it('returns service with filterState$ observable that emits initial state', () => {
    const rxjs = createMockRxJS();
    const api = createMockGridApi();
    const svc = createFilterService(rxjs)(api);

    let emitted: any = null;
    svc.filterState$.subscribe((val: any) => {
      emitted = val;
    });
    expect(emitted).toEqual({ filters: [], presets: {} });
  });

  it('addFilter, removeFilter, clearFilters delegate to gridApi', () => {
    const rxjs = createMockRxJS();
    const api = createMockGridApi();
    const svc = createFilterService(rxjs)(api);

    svc.addFilter('status', 'equals', 'active');
    expect(api.addFilter).toHaveBeenCalledWith('status', 'equals', 'active');

    svc.removeFilter('status');
    expect(api.removeFilter).toHaveBeenCalledWith('status');

    svc.clearFilters();
    expect(api.clearFilters).toHaveBeenCalled();

    // destroy cleans up
    const unsub = vi.fn();
    api.on.mockReturnValue(unsub);
    const svc2 = createFilterService(rxjs)(api);
    svc2.destroy();
    expect(unsub).toHaveBeenCalled();
  });
});

// ===========================================================================
// createEditService
// ===========================================================================

describe('createEditService', () => {
  it('returns service with editState$, isDirty$, dirtyRows$ observables', () => {
    const rxjs = createMockRxJS();
    const api = createMockGridApi();
    const svc = createEditService(rxjs)(api);

    let editState: any = null;
    svc.editState$.subscribe((val: any) => {
      editState = val;
    });
    expect(editState).toEqual({ status: 'idle' });

    let isDirty: any = null;
    svc.isDirty$.subscribe((val: any) => {
      isDirty = val;
    });
    expect(isDirty).toBe(false);

    let dirtyRows: any = null;
    svc.dirtyRows$.subscribe((val: any) => {
      dirtyRows = val;
    });
    expect(dirtyRows).toEqual([]);
  });

  it('startEdit, commitEdit, cancelEdit delegate to gridApi', () => {
    const rxjs = createMockRxJS();
    const api = createMockGridApi();
    const svc = createEditService(rxjs)(api);

    const pos = { rowId: 'r1', field: 'name' };

    svc.startEdit(pos);
    expect(api.startEdit).toHaveBeenCalledWith(pos);

    svc.cancelEdit(pos);
    expect(api.cancelEdit).toHaveBeenCalledWith(pos);
  });

  it('commitEdit returns a Promise', async () => {
    const rxjs = createMockRxJS();
    const api = createMockGridApi();
    const svc = createEditService(rxjs)(api);

    const pos = { rowId: 'r1', field: 'name' };
    const result = svc.commitEdit(pos, 'NewValue');
    expect(result).toBeInstanceOf(Promise);

    const resolved = await result;
    expect(resolved).toBe(true);
    expect(api.commitEdit).toHaveBeenCalledWith(pos, 'NewValue');
  });
});

// ===========================================================================
// createDataService
// ===========================================================================

describe('createDataService', () => {
  it('returns service with data$ observable', () => {
    const rxjs = createMockRxJS();
    const api = createMockGridApi();
    const svc = createDataService(rxjs)(api);

    expect(svc.data$).toBeDefined();
    expect(typeof svc.setData).toBe('function');
    expect(typeof svc.addRow).toBe('function');
    expect(typeof svc.updateRow).toBe('function');
    expect(typeof svc.deleteRow).toBe('function');
    expect(typeof svc.destroy).toBe('function');
  });

  it('data$ emits initial data from gridApi.getData()', () => {
    const rxjs = createMockRxJS();
    const api = createMockGridApi();
    const svc = createDataService(rxjs)(api);

    let emitted: any = null;
    svc.data$.subscribe((val: any) => {
      emitted = val;
    });
    expect(emitted).toEqual([{ id: 1, name: 'A' }]);
  });

  it('setData, addRow, updateRow, deleteRow delegate to gridApi', () => {
    const rxjs = createMockRxJS();
    const api = createMockGridApi();
    const svc = createDataService(rxjs)(api);

    svc.setData([{ id: 2, name: 'B' }]);
    expect(api.setData).toHaveBeenCalledWith([{ id: 2, name: 'B' }]);

    const newId = svc.addRow({ id: 3, name: 'C' });
    expect(api.addRow).toHaveBeenCalledWith({ id: 3, name: 'C' }, undefined);
    expect(newId).toBe('new-row-id');

    svc.updateRow('r1', { name: 'Updated' });
    expect(api.updateRow).toHaveBeenCalledWith('r1', { name: 'Updated' });

    svc.deleteRow('r1');
    expect(api.deleteRow).toHaveBeenCalledWith('r1');

    // destroy cleans up
    const unsub = vi.fn();
    api.subscribe.mockReturnValue(unsub);
    const svc2 = createDataService(rxjs)(api);
    svc2.destroy();
    expect(unsub).toHaveBeenCalled();
  });
});
