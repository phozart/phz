import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ViewsManager } from '../views.js';
import { createGrid } from '../create-grid.js';
import type { GridApi } from '../types/api.js';
import type { SerializedGridState } from '../types/state.js';

// --- ViewsManager unit tests ---

function makeState(sortField?: string): SerializedGridState {
  return {
    version: '1',
    sort: { columns: sortField ? [{ field: sortField, direction: 'asc' }] : [] },
    filter: { filters: [], presets: {} },
    selection: { selectedRows: [], selectedCells: [] },
    columns: { order: ['name', 'age'], widths: {}, visibility: {} },
    grouping: { groupBy: [], expandedGroups: [] },
  };
}

describe('ViewsManager', () => {
  let vm: ViewsManager;

  beforeEach(() => {
    vm = new ViewsManager();
  });

  it('starts with no views', () => {
    expect(vm.listViews()).toHaveLength(0);
    expect(vm.getActiveViewId()).toBeNull();
  });

  it('saves a view and sets it active', () => {
    const view = vm.saveView('My View', makeState());
    expect(view.name).toBe('My View');
    expect(view.id).toBeDefined();
    expect(vm.getActiveViewId()).toBe(view.id);
    expect(vm.listViews()).toHaveLength(1);
  });

  it('loads a view and returns the SavedView', () => {
    const view = vm.saveView('V1', makeState('name'));
    const loaded = vm.loadView(view.id);
    expect(loaded.state.sort.columns[0].field).toBe('name');
  });

  it('throws when loading non-existent view', () => {
    expect(() => vm.loadView('nonexistent')).toThrow();
  });

  it('deletes a view', () => {
    const view = vm.saveView('V1', makeState());
    vm.deleteView(view.id);
    expect(vm.listViews()).toHaveLength(0);
    expect(vm.getActiveViewId()).toBeNull();
  });

  it('renames a view', () => {
    const view = vm.saveView('Old Name', makeState());
    vm.renameView(view.id, 'New Name');
    expect(vm.getView(view.id)!.name).toBe('New Name');
  });

  it('throws when renaming non-existent view', () => {
    expect(() => vm.renameView('missing', 'name')).toThrow();
  });

  it('sets and clears default view', () => {
    const v1 = vm.saveView('V1', makeState());
    const v2 = vm.saveView('V2', makeState());
    vm.setDefaultView(v1.id);
    expect(vm.listViews().find(v => v.id === v1.id)!.isDefault).toBe(true);

    vm.setDefaultView(v2.id);
    expect(vm.listViews().find(v => v.id === v1.id)!.isDefault).toBe(false);
    expect(vm.listViews().find(v => v.id === v2.id)!.isDefault).toBe(true);

    vm.setDefaultView(null);
    expect(vm.listViews().every(v => !v.isDefault)).toBe(true);
  });

  it('detects dirty state', () => {
    const state1 = makeState('name');
    const view = vm.saveView('V1', state1);
    expect(vm.isViewDirty(state1)).toBe(false);

    const state2 = makeState('age');
    expect(vm.isViewDirty(state2)).toBe(true);
  });

  it('is not dirty when no active view', () => {
    expect(vm.isViewDirty(makeState())).toBe(false);
  });

  it('overwrites existing view with saveCurrentToView', () => {
    const view = vm.saveView('V1', makeState('name'));
    const updated = vm.saveCurrentToView(view.id, makeState('age'));
    expect(updated.state.sort.columns[0].field).toBe('age');
    expect(vm.listViews()).toHaveLength(1);
  });

  it('throws when overwriting non-existent view', () => {
    expect(() => vm.saveCurrentToView('missing', makeState())).toThrow();
  });

  it('imports and exports views', () => {
    vm.saveView('V1', makeState());
    vm.saveView('V2', makeState());
    const exported = vm.exportViews();
    expect(exported).toHaveLength(2);

    const vm2 = new ViewsManager();
    vm2.importViews(exported);
    expect(vm2.listViews()).toHaveLength(2);
  });

  it('initializes with views', () => {
    const initial = [
      { id: 'v1', name: 'View 1', state: makeState(), isDefault: true, createdAt: '', updatedAt: '' },
    ];
    const vm2 = new ViewsManager(initial);
    expect(vm2.listViews()).toHaveLength(1);
    expect(vm2.listViews()[0].isDefault).toBe(true);
  });

  it('saves view with makeDefault option', () => {
    vm.saveView('V1', makeState());
    const v2 = vm.saveView('V2', makeState(), { makeDefault: true });
    expect(vm.listViews().find(v => v.id === v2.id)!.isDefault).toBe(true);
  });
});

// --- createGrid integration tests ---

describe('createGrid views integration', () => {
  const data = [
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 },
  ];
  const columns = [
    { field: 'name', header: 'Name', sortable: true },
    { field: 'age', header: 'Age', type: 'number' as const, sortable: true },
  ];

  function makeGrid(): GridApi {
    return createGrid({ data, columns });
  }

  it('saveView and loadView work', () => {
    const grid = makeGrid();
    grid.sort('name', 'asc');
    const view = grid.saveView('Sorted by name');
    expect(view.name).toBe('Sorted by name');

    grid.sort('age', 'desc');
    grid.loadView(view.id);
    const sortState = grid.getSortState();
    expect(sortState.columns[0].field).toBe('name');
  });

  it('listViews returns summaries', () => {
    const grid = makeGrid();
    grid.saveView('V1');
    grid.saveView('V2');
    expect(grid.listViews()).toHaveLength(2);
  });

  it('deleteView removes a view', () => {
    const grid = makeGrid();
    const view = grid.saveView('V1');
    grid.deleteView(view.id);
    expect(grid.listViews()).toHaveLength(0);
  });

  it('renameView changes the name', () => {
    const grid = makeGrid();
    const view = grid.saveView('Old');
    grid.renameView(view.id, 'New');
    expect(grid.getView(view.id)!.name).toBe('New');
  });

  it('isViewDirty detects state changes', () => {
    const grid = makeGrid();
    grid.saveView('V1');
    expect(grid.isViewDirty()).toBe(false);

    grid.sort('age', 'desc');
    expect(grid.isViewDirty()).toBe(true);
  });

  it('getActiveViewId tracks active view', () => {
    const grid = makeGrid();
    expect(grid.getActiveViewId()).toBeNull();
    const view = grid.saveView('V1');
    expect(grid.getActiveViewId()).toBe(view.id);
  });

  it('setDefaultView and listViews reflect default', () => {
    const grid = makeGrid();
    const view = grid.saveView('V1');
    grid.setDefaultView(view.id);
    expect(grid.listViews()[0].isDefault).toBe(true);
  });

  it('importViews and exportViews round-trip', () => {
    const grid = makeGrid();
    grid.saveView('V1');
    grid.saveView('V2');
    const exported = grid.exportViews();

    const grid2 = makeGrid();
    grid2.importViews(exported);
    expect(grid2.listViews()).toHaveLength(2);
  });

  it('emits view:save event', () => {
    const grid = makeGrid();
    const handler = vi.fn();
    grid.on('view:save', handler);
    grid.saveView('V1');
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].viewName).toBe('V1');
  });

  it('emits view:load event', () => {
    const grid = makeGrid();
    const view = grid.saveView('V1');
    const handler = vi.fn();
    grid.on('view:load', handler);
    grid.loadView(view.id);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('emits view:delete event', () => {
    const grid = makeGrid();
    const view = grid.saveView('V1');
    const handler = vi.fn();
    grid.on('view:delete', handler);
    grid.deleteView(view.id);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('saveCurrentToView overwrites', () => {
    const grid = makeGrid();
    const view = grid.saveView('V1');
    grid.sort('age', 'desc');
    const updated = grid.saveCurrentToView(view.id);
    expect(updated.state.sort.columns[0].field).toBe('age');
  });
});
