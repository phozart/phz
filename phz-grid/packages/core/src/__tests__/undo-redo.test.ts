import { describe, it, expect, beforeEach } from 'vitest';
import { createGrid } from '../create-grid.js';
import type { GridApi } from '../types/api.js';

describe('Undo/Redo', () => {
  const data = [
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 },
    { name: 'Charlie', age: 35 },
  ];
  const columns = [
    { field: 'name', header: 'Name', sortable: true },
    { field: 'age', header: 'Age', type: 'number' as const, sortable: true },
  ];

  let grid: GridApi;

  beforeEach(() => {
    grid = createGrid({ data, columns });
  });

  it('starts with canUndo=false and canRedo=false', () => {
    expect(grid.canUndo()).toBe(false);
    expect(grid.canRedo()).toBe(false);
  });

  it('undo returns false when nothing to undo', () => {
    expect(grid.undo()).toBe(false);
  });

  it('redo returns false when nothing to redo', () => {
    expect(grid.redo()).toBe(false);
  });

  it('sort -> undo reverts sort', () => {
    grid.sort('name', 'asc');
    expect(grid.getSortState().columns).toHaveLength(1);
    expect(grid.canUndo()).toBe(true);

    grid.undo();
    expect(grid.getSortState().columns).toHaveLength(0);
    expect(grid.canUndo()).toBe(false);
    expect(grid.canRedo()).toBe(true);
  });

  it('sort -> filter -> undo reverts filter but keeps sort', () => {
    grid.sort('name', 'asc');
    grid.addFilter('age', 'greaterThan', 20);

    expect(grid.getFilterState().filters).toHaveLength(1);

    grid.undo();
    // Filter should be reverted, sort should remain
    expect(grid.getFilterState().filters).toHaveLength(0);
    expect(grid.getSortState().columns).toHaveLength(1);
    expect(grid.getSortState().columns[0].field).toBe('name');
  });

  it('undo -> redo restores state', () => {
    grid.sort('name', 'asc');
    const sortedState = grid.getSortState();

    grid.undo();
    expect(grid.getSortState().columns).toHaveLength(0);

    grid.redo();
    expect(grid.getSortState()).toEqual(sortedState);
    expect(grid.canRedo()).toBe(false);
  });

  it('redo stack clears on new change after undo', () => {
    grid.sort('name', 'asc');
    grid.sort('age', 'desc');

    grid.undo(); // back to sort by name
    expect(grid.canRedo()).toBe(true);

    // New change should clear redo stack
    grid.addFilter('age', 'greaterThan', 20);
    expect(grid.canRedo()).toBe(false);
  });

  it('max stack depth is 50 — 51st change evicts oldest', () => {
    // Make 51 sort changes
    for (let i = 0; i <= 50; i++) {
      grid.sort('name', i % 2 === 0 ? 'asc' : 'desc');
    }

    // Should be able to undo 50 times (stack max is 50)
    let undoCount = 0;
    while (grid.undo()) {
      undoCount++;
    }
    expect(undoCount).toBe(50);
  });

  it('updates history state slice', () => {
    expect(grid.getState().history.canUndo).toBe(false);
    expect(grid.getState().history.canRedo).toBe(false);

    grid.sort('name', 'asc');
    expect(grid.getState().history.canUndo).toBe(true);
    expect(grid.getState().history.undoStack).toBe(1);

    grid.undo();
    expect(grid.getState().history.canUndo).toBe(false);
    expect(grid.getState().history.canRedo).toBe(true);
    expect(grid.getState().history.redoStack).toBe(1);
  });

  it('column visibility change is undoable', () => {
    grid.setColumnVisibility('name', false);
    expect(grid.getColumnState().visibility['name']).toBe(false);

    grid.undo();
    expect(grid.getColumnState().visibility['name']).toBe(true);
  });

  it('groupBy is undoable', () => {
    grid.groupBy('name');
    expect(grid.getState().grouping.groupBy).toEqual(['name']);

    grid.undo();
    expect(grid.getState().grouping.groupBy).toEqual([]);
  });
});
