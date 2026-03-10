/**
 * Tests for Exports Tab State (C-2.02)
 */
import { describe, it, expect } from 'vitest';
import {
  createExportsTabState,
  addExport,
  updateExport,
  removeExport,
  setSort,
  setFilterStatus,
  getVisibleExports,
} from '../coordination/exports-tab-state.js';
import type { ExportEntry } from '../coordination/exports-tab-state.js';

// --- Test helpers ---

function makeEntry(overrides?: Partial<ExportEntry>): ExportEntry {
  return {
    id: `exp_${Math.random().toString(36).slice(2, 8)}`,
    name: 'Test Export',
    format: 'csv',
    status: 'complete',
    createdAt: Date.now(),
    ...overrides,
  };
}

describe('createExportsTabState', () => {
  it('creates default state', () => {
    const state = createExportsTabState();
    expect(state.exports).toEqual([]);
    expect(state.sortBy).toBe('date');
    expect(state.sortDirection).toBe('desc');
    expect(state.filterStatus).toBeNull();
  });

  it('accepts overrides', () => {
    const state = createExportsTabState({ sortBy: 'name', sortDirection: 'asc' });
    expect(state.sortBy).toBe('name');
    expect(state.sortDirection).toBe('asc');
  });
});

describe('addExport', () => {
  it('adds an export entry', () => {
    const state = createExportsTabState();
    const entry = makeEntry({ id: 'e1' });
    const next = addExport(state, entry);
    expect(next.exports).toHaveLength(1);
    expect(next.exports[0].id).toBe('e1');
  });

  it('replaces existing entry with same ID', () => {
    const state = createExportsTabState();
    const e1 = makeEntry({ id: 'e1', status: 'pending' });
    const e1Updated = makeEntry({ id: 'e1', status: 'complete' });
    const next = addExport(addExport(state, e1), e1Updated);
    expect(next.exports).toHaveLength(1);
    expect(next.exports[0].status).toBe('complete');
  });
});

describe('updateExport', () => {
  it('updates an existing entry', () => {
    let state = createExportsTabState();
    state = addExport(state, makeEntry({ id: 'e1', status: 'pending' }));
    state = updateExport(state, 'e1', { status: 'complete', downloadUrl: 'https://example.com/file.csv' });
    expect(state.exports[0].status).toBe('complete');
    expect(state.exports[0].downloadUrl).toBe('https://example.com/file.csv');
  });

  it('returns state unchanged for unknown ID', () => {
    const state = createExportsTabState();
    const next = updateExport(state, 'unknown', { status: 'complete' });
    expect(next).toBe(state);
  });
});

describe('removeExport', () => {
  it('removes an entry by ID', () => {
    let state = createExportsTabState();
    state = addExport(state, makeEntry({ id: 'e1' }));
    state = addExport(state, makeEntry({ id: 'e2' }));
    state = removeExport(state, 'e1');
    expect(state.exports).toHaveLength(1);
    expect(state.exports[0].id).toBe('e2');
  });
});

describe('setSort', () => {
  it('sets sort field and direction', () => {
    const state = createExportsTabState();
    const next = setSort(state, 'name', 'asc');
    expect(next.sortBy).toBe('name');
    expect(next.sortDirection).toBe('asc');
  });

  it('toggles direction when same field is selected without explicit direction', () => {
    const state = createExportsTabState({ sortBy: 'date', sortDirection: 'desc' });
    const next = setSort(state, 'date');
    expect(next.sortDirection).toBe('asc');
  });

  it('defaults to desc when a new field is selected without direction', () => {
    const state = createExportsTabState({ sortBy: 'date', sortDirection: 'asc' });
    const next = setSort(state, 'name');
    expect(next.sortDirection).toBe('desc');
  });
});

describe('setFilterStatus', () => {
  it('sets a status filter', () => {
    const state = createExportsTabState();
    const next = setFilterStatus(state, 'complete');
    expect(next.filterStatus).toBe('complete');
  });

  it('clears the status filter', () => {
    const state = createExportsTabState({ filterStatus: 'complete' });
    const next = setFilterStatus(state, null);
    expect(next.filterStatus).toBeNull();
  });
});

describe('getVisibleExports', () => {
  it('returns all exports when no filter', () => {
    let state = createExportsTabState();
    state = addExport(state, makeEntry({ id: 'e1' }));
    state = addExport(state, makeEntry({ id: 'e2' }));
    expect(getVisibleExports(state)).toHaveLength(2);
  });

  it('filters by status', () => {
    let state = createExportsTabState({ filterStatus: 'complete' });
    state = addExport(state, makeEntry({ id: 'e1', status: 'complete' }));
    state = addExport(state, makeEntry({ id: 'e2', status: 'pending' }));
    const visible = getVisibleExports(state);
    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe('e1');
  });

  it('sorts by name ascending', () => {
    let state = createExportsTabState({ sortBy: 'name', sortDirection: 'asc' });
    state = addExport(state, makeEntry({ id: 'e1', name: 'Zebra' }));
    state = addExport(state, makeEntry({ id: 'e2', name: 'Apple' }));
    const visible = getVisibleExports(state);
    expect(visible[0].name).toBe('Apple');
    expect(visible[1].name).toBe('Zebra');
  });

  it('sorts by date descending', () => {
    let state = createExportsTabState({ sortBy: 'date', sortDirection: 'desc' });
    state = addExport(state, makeEntry({ id: 'e1', createdAt: 1000 }));
    state = addExport(state, makeEntry({ id: 'e2', createdAt: 2000 }));
    const visible = getVisibleExports(state);
    expect(visible[0].createdAt).toBe(2000);
    expect(visible[1].createdAt).toBe(1000);
  });

  it('sorts by status', () => {
    let state = createExportsTabState({ sortBy: 'status', sortDirection: 'asc' });
    state = addExport(state, makeEntry({ id: 'e1', status: 'pending' }));
    state = addExport(state, makeEntry({ id: 'e2', status: 'complete' }));
    const visible = getVisibleExports(state);
    expect(visible[0].status).toBe('complete');
    expect(visible[1].status).toBe('pending');
  });

  it('combines filter and sort', () => {
    let state = createExportsTabState({
      sortBy: 'name',
      sortDirection: 'asc',
      filterStatus: 'complete',
    });
    state = addExport(state, makeEntry({ id: 'e1', name: 'Zebra', status: 'complete' }));
    state = addExport(state, makeEntry({ id: 'e2', name: 'Apple', status: 'complete' }));
    state = addExport(state, makeEntry({ id: 'e3', name: 'Banana', status: 'pending' }));
    const visible = getVisibleExports(state);
    expect(visible).toHaveLength(2);
    expect(visible[0].name).toBe('Apple');
    expect(visible[1].name).toBe('Zebra');
  });
});
