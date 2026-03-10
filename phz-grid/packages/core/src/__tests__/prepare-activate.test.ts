import { describe, it, expect } from 'vitest';
import { prepareGrid, activateGrid, createGrid } from '../create-grid.js';

const data = [
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 },
];
const columns = [
  { field: 'name', header: 'Name', sortable: true },
  { field: 'age', header: 'Age', type: 'number' as const, sortable: true },
];

describe('prepareGrid', () => {
  it('returns columns, data, and initial state', () => {
    const prepared = prepareGrid({ data, columns });
    expect(prepared.columns).toHaveLength(2);
    expect(prepared.data).toHaveLength(2);
    expect(prepared.data[0]).toHaveProperty('__id');
    expect(prepared.initialState).toBeDefined();
    expect(prepared.initialState.sort).toEqual({ columns: [] });
  });

  it('infers columns when none provided', () => {
    const prepared = prepareGrid({ data });
    expect(prepared.columns.length).toBeGreaterThan(0);
    expect(prepared.columns.map(c => c.field)).toContain('name');
    expect(prepared.columns.map(c => c.field)).toContain('age');
  });

  it('computes restricted and masked fields', () => {
    const prepared = prepareGrid({
      data,
      columns: [
        { field: 'name', header: 'Name' },
        {
          field: 'age',
          header: 'Age',
          type: 'number' as const,
          access: { requiredRoles: ['admin'] },
        },
      ],
      userRole: 'viewer',
    });
    expect(prepared.restrictedFields.has('age')).toBe(true);
    expect(prepared.maskedFields.has('age')).toBe(false);
  });

  it('applies initialState overrides', () => {
    const prepared = prepareGrid({
      data,
      columns,
      initialState: {
        sort: { columns: [{ field: 'name', direction: 'asc' }] },
      },
    });
    expect(prepared.initialState.sort.columns).toHaveLength(1);
    expect(prepared.initialState.sort.columns[0].field).toBe('name');
  });
});

describe('activateGrid', () => {
  it('produces a working GridApi from prepared', () => {
    const prepared = prepareGrid({ data, columns });
    const grid = activateGrid(prepared);

    expect(grid.getData()).toHaveLength(2);
    expect(grid.getSortState().columns).toHaveLength(0);

    grid.sort('name', 'asc');
    expect(grid.getSortState().columns[0].field).toBe('name');
  });

  it('supports undo/redo', () => {
    const prepared = prepareGrid({ data, columns });
    const grid = activateGrid(prepared);

    grid.sort('name', 'asc');
    expect(grid.canUndo()).toBe(true);
    grid.undo();
    expect(grid.getSortState().columns).toHaveLength(0);
  });

  it('supports views', () => {
    const prepared = prepareGrid({ data, columns });
    const grid = activateGrid(prepared);

    const view = grid.saveView('Test');
    expect(grid.listViews()).toHaveLength(1);
    expect(view.name).toBe('Test');
  });
});

describe('createGrid backward compatibility', () => {
  it('still works as a single call', () => {
    const grid = createGrid({ data, columns });
    expect(grid.getData()).toHaveLength(2);

    grid.sort('name', 'asc');
    expect(grid.getSortState().columns[0].field).toBe('name');
    expect(grid.canUndo()).toBe(true);
  });
});
