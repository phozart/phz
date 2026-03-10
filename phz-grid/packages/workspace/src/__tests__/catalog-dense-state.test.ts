import { describe, it, expect } from 'vitest';
import type { ArtifactMeta } from '../types.js';
import {
  initialCatalogDenseState,
  toggleViewMode,
  setSort,
  sortArtifacts,
  filterDenseArtifacts,
  getPagedArtifacts,
  getTotalPages,
  goToPage,
  toggleSelection,
  selectAll,
  deselectAll,
  isAllSelected,
  applyInlineAction,
  canApplyBulkAction,
  applyBulkAction,
} from '../catalog/catalog-dense-state.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const artifacts: ArtifactMeta[] = [
  { id: '1', type: 'report', name: 'Sales Report', createdAt: 1000, updatedAt: 3000, published: true },
  { id: '2', type: 'dashboard', name: 'Executive Dashboard', description: 'C-suite overview', createdAt: 2000, updatedAt: 2000 },
  { id: '3', type: 'report', name: 'Inventory Report', createdAt: 3000, updatedAt: 1000, published: false },
  { id: '4', type: 'kpi', name: 'Revenue KPI', createdAt: 4000, updatedAt: 4000, published: true },
  { id: '5', type: 'dashboard', name: 'Operations Dashboard', createdAt: 500, updatedAt: 500 },
];

// ---------------------------------------------------------------------------
// initialCatalogDenseState
// ---------------------------------------------------------------------------

describe('initialCatalogDenseState', () => {
  it('returns correct defaults', () => {
    const state = initialCatalogDenseState();
    expect(state.viewMode).toBe('dense-table');
    expect(state.sort.field).toBe('updatedAt');
    expect(state.sort.direction).toBe('desc');
    expect(state.selectedIds.size).toBe(0);
    expect(state.pageSize).toBe(50);
    expect(state.currentPage).toBe(0);
  });

  it('accepts artifacts', () => {
    const state = initialCatalogDenseState(artifacts);
    expect(state.artifacts).toHaveLength(5);
  });
});

// ---------------------------------------------------------------------------
// View mode toggle
// ---------------------------------------------------------------------------

describe('toggleViewMode', () => {
  it('toggles from dense-table to card', () => {
    const state = initialCatalogDenseState();
    expect(toggleViewMode(state).viewMode).toBe('card');
  });

  it('toggles from card back to dense-table', () => {
    const state = { ...initialCatalogDenseState(), viewMode: 'card' as const };
    expect(toggleViewMode(state).viewMode).toBe('dense-table');
  });
});

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

describe('setSort', () => {
  it('toggles direction when same field clicked', () => {
    let state = initialCatalogDenseState();
    state = setSort(state, 'updatedAt');
    expect(state.sort.direction).toBe('asc');
    state = setSort(state, 'updatedAt');
    expect(state.sort.direction).toBe('desc');
  });

  it('defaults to asc when new field selected', () => {
    const state = setSort(initialCatalogDenseState(), 'name');
    expect(state.sort.field).toBe('name');
    expect(state.sort.direction).toBe('asc');
  });

  it('resets page to 0', () => {
    let state = { ...initialCatalogDenseState(), currentPage: 3 };
    state = setSort(state, 'name');
    expect(state.currentPage).toBe(0);
  });
});

describe('sortArtifacts', () => {
  it('sorts by name ascending', () => {
    const sorted = sortArtifacts(artifacts, { field: 'name', direction: 'asc' });
    expect(sorted.map(a => a.name)).toEqual([
      'Executive Dashboard', 'Inventory Report', 'Operations Dashboard', 'Revenue KPI', 'Sales Report',
    ]);
  });

  it('sorts by type descending', () => {
    const sorted = sortArtifacts(artifacts, { field: 'type', direction: 'desc' });
    expect(sorted[0].type).toBe('report');
  });

  it('sorts by visibility', () => {
    const sorted = sortArtifacts(artifacts, { field: 'visibility', direction: 'desc' });
    expect(sorted[0].published).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

describe('filterDenseArtifacts', () => {
  it('filters by type', () => {
    const state = { ...initialCatalogDenseState(artifacts), typeFilter: 'report' as const };
    const result = filterDenseArtifacts(state);
    expect(result).toHaveLength(2);
    expect(result.every(a => a.type === 'report')).toBe(true);
  });

  it('filters by search', () => {
    const state = { ...initialCatalogDenseState(artifacts), search: 'operations' };
    const result = filterDenseArtifacts(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('5');
  });

  it('searches descriptions', () => {
    const state = { ...initialCatalogDenseState(artifacts), search: 'c-suite' };
    const result = filterDenseArtifacts(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });
});

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

describe('pagination', () => {
  it('pages results', () => {
    const state = { ...initialCatalogDenseState(artifacts), pageSize: 2 };
    const page0 = getPagedArtifacts(state);
    expect(page0).toHaveLength(2);

    const state1 = goToPage(state, 1);
    const page1 = getPagedArtifacts(state1);
    expect(page1).toHaveLength(2);
  });

  it('getTotalPages calculates correctly', () => {
    const state = { ...initialCatalogDenseState(artifacts), pageSize: 2 };
    expect(getTotalPages(state)).toBe(3);
  });

  it('goToPage clamps to valid range', () => {
    const state = initialCatalogDenseState(artifacts);
    expect(goToPage(state, -1).currentPage).toBe(0);
    expect(goToPage(state, 100).currentPage).toBe(0); // only 1 page with 50 pageSize
  });
});

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

describe('selection', () => {
  it('toggles selection on and off', () => {
    let state = initialCatalogDenseState(artifacts);
    state = toggleSelection(state, '1');
    expect(state.selectedIds.has('1')).toBe(true);
    state = toggleSelection(state, '1');
    expect(state.selectedIds.has('1')).toBe(false);
  });

  it('selectAll selects all filtered artifacts', () => {
    const state = selectAll(initialCatalogDenseState(artifacts));
    expect(state.selectedIds.size).toBe(5);
  });

  it('deselectAll clears selection', () => {
    let state = selectAll(initialCatalogDenseState(artifacts));
    state = deselectAll(state);
    expect(state.selectedIds.size).toBe(0);
  });

  it('isAllSelected returns true when all selected', () => {
    const state = selectAll(initialCatalogDenseState(artifacts));
    expect(isAllSelected(state)).toBe(true);
  });

  it('isAllSelected returns false on empty list', () => {
    expect(isAllSelected(initialCatalogDenseState())).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Inline actions
// ---------------------------------------------------------------------------

describe('applyInlineAction', () => {
  it('renames an artifact', () => {
    const state = initialCatalogDenseState(artifacts);
    const next = applyInlineAction(state, { kind: 'rename', artifactId: '1', newName: 'New Name' });
    expect(next.artifacts.find(a => a.id === '1')?.name).toBe('New Name');
  });

  it('duplicates an artifact', () => {
    const state = initialCatalogDenseState(artifacts);
    const next = applyInlineAction(state, { kind: 'duplicate', artifactId: '1' });
    expect(next.artifacts).toHaveLength(6);
    expect(next.artifacts[5].name).toBe('Sales Report (copy)');
    expect(next.artifacts[5].published).toBe(false);
  });

  it('does not duplicate non-existent artifact', () => {
    const state = initialCatalogDenseState(artifacts);
    const next = applyInlineAction(state, { kind: 'duplicate', artifactId: 'nonexistent' });
    expect(next.artifacts).toHaveLength(5);
  });

  it('changes visibility', () => {
    const state = initialCatalogDenseState(artifacts);
    const next = applyInlineAction(state, { kind: 'change-visibility', artifactId: '3', published: true });
    expect(next.artifacts.find(a => a.id === '3')?.published).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Bulk actions
// ---------------------------------------------------------------------------

describe('bulk actions', () => {
  it('canApplyBulkAction returns false with empty selection', () => {
    const state = initialCatalogDenseState(artifacts);
    expect(canApplyBulkAction(state, 'delete')).toBe(false);
  });

  it('delete removes selected artifacts', () => {
    let state = initialCatalogDenseState(artifacts);
    state = toggleSelection(state, '1');
    state = toggleSelection(state, '2');
    state = applyBulkAction(state, 'delete');
    expect(state.artifacts).toHaveLength(3);
    expect(state.selectedIds.size).toBe(0);
  });

  it('publish publishes selected artifacts', () => {
    let state = initialCatalogDenseState(artifacts);
    state = toggleSelection(state, '3');
    state = applyBulkAction(state, 'publish');
    expect(state.artifacts.find(a => a.id === '3')?.published).toBe(true);
  });

  it('unpublish unpublishes selected artifacts', () => {
    let state = initialCatalogDenseState(artifacts);
    state = toggleSelection(state, '1');
    state = applyBulkAction(state, 'unpublish');
    expect(state.artifacts.find(a => a.id === '1')?.published).toBe(false);
  });

  it('share clears selection (intent-only)', () => {
    let state = initialCatalogDenseState(artifacts);
    state = toggleSelection(state, '1');
    state = applyBulkAction(state, 'share');
    expect(state.selectedIds.size).toBe(0);
    expect(state.artifacts).toHaveLength(5);
  });
});
