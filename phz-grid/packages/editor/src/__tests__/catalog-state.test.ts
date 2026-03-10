/**
 * Tests for Catalog Screen State (B-2.04)
 */
import {
  createCatalogState,
  setCatalogItems,
  searchCatalog,
  filterCatalogByType,
  filterCatalogByVisibility,
  sortCatalog,
  openCreateDialog,
  closeCreateDialog,
  setCatalogLoading,
  setCatalogError,
} from '../screens/catalog-state.js';
import type { CatalogItem, CatalogState } from '../screens/catalog-state.js';

const ITEMS: CatalogItem[] = [
  { id: 'a1', name: 'Sales Dashboard', type: 'dashboard', visibility: 'published', ownerId: 'u1', updatedAt: 3000, createdAt: 1000, tags: ['sales'] },
  { id: 'a2', name: 'Quarterly Report', type: 'report', visibility: 'shared', ownerId: 'u1', updatedAt: 2000, createdAt: 2000, description: 'Q4 numbers' },
  { id: 'a3', name: 'My KPI', type: 'kpi', visibility: 'personal', ownerId: 'u2', updatedAt: 1000, createdAt: 3000 },
];

describe('createCatalogState', () => {
  it('creates empty state', () => {
    const state = createCatalogState();
    expect(state.items).toEqual([]);
    expect(state.filteredItems).toEqual([]);
    expect(state.searchQuery).toBe('');
    expect(state.typeFilter).toBeNull();
    expect(state.sortField).toBe('updatedAt');
    expect(state.sortOrder).toBe('desc');
    expect(state.createDialogOpen).toBe(false);
  });

  it('creates with items', () => {
    const state = createCatalogState(ITEMS);
    expect(state.items).toHaveLength(3);
    expect(state.filteredItems).toHaveLength(3);
  });
});

describe('setCatalogItems', () => {
  it('replaces items and re-filters', () => {
    let state = createCatalogState();
    state = setCatalogItems(state, ITEMS);
    expect(state.items).toHaveLength(3);
    expect(state.filteredItems).toHaveLength(3);
  });
});

describe('searchCatalog', () => {
  it('filters by name', () => {
    let state = createCatalogState(ITEMS);
    state = searchCatalog(state, 'sales');
    expect(state.filteredItems).toHaveLength(1);
    expect(state.filteredItems[0].id).toBe('a1');
  });

  it('filters by description', () => {
    let state = createCatalogState(ITEMS);
    state = searchCatalog(state, 'Q4');
    expect(state.filteredItems).toHaveLength(1);
    expect(state.filteredItems[0].id).toBe('a2');
  });

  it('filters by tags', () => {
    let state = createCatalogState(ITEMS);
    state = searchCatalog(state, 'sales');
    expect(state.filteredItems).toHaveLength(1);
  });

  it('shows all when query is empty', () => {
    let state = createCatalogState(ITEMS);
    state = searchCatalog(state, 'sales');
    state = searchCatalog(state, '');
    expect(state.filteredItems).toHaveLength(3);
  });

  it('is case-insensitive', () => {
    let state = createCatalogState(ITEMS);
    state = searchCatalog(state, 'SALES');
    expect(state.filteredItems).toHaveLength(1);
  });
});

describe('filterCatalogByType', () => {
  it('filters by dashboard type', () => {
    let state = createCatalogState(ITEMS);
    state = filterCatalogByType(state, 'dashboard');
    expect(state.filteredItems).toHaveLength(1);
    expect(state.filteredItems[0].type).toBe('dashboard');
  });

  it('clears filter with null', () => {
    let state = createCatalogState(ITEMS);
    state = filterCatalogByType(state, 'dashboard');
    state = filterCatalogByType(state, null);
    expect(state.filteredItems).toHaveLength(3);
  });
});

describe('filterCatalogByVisibility', () => {
  it('filters by personal visibility', () => {
    let state = createCatalogState(ITEMS);
    state = filterCatalogByVisibility(state, 'personal');
    expect(state.filteredItems).toHaveLength(1);
    expect(state.filteredItems[0].id).toBe('a3');
  });

  it('clears filter with null', () => {
    let state = createCatalogState(ITEMS);
    state = filterCatalogByVisibility(state, 'personal');
    state = filterCatalogByVisibility(state, null);
    expect(state.filteredItems).toHaveLength(3);
  });
});

describe('sortCatalog', () => {
  it('sorts by name ascending', () => {
    let state = createCatalogState(ITEMS);
    state = sortCatalog(state, 'name', 'asc');
    expect(state.filteredItems[0].name).toBe('My KPI');
    expect(state.filteredItems[2].name).toBe('Sales Dashboard');
  });

  it('sorts by name descending', () => {
    let state = createCatalogState(ITEMS);
    state = sortCatalog(state, 'name', 'desc');
    expect(state.filteredItems[0].name).toBe('Sales Dashboard');
  });

  it('sorts by updatedAt descending by default', () => {
    const state = createCatalogState(ITEMS);
    // Default is updatedAt desc
    expect(state.filteredItems[0].id).toBe('a1'); // updatedAt: 3000
  });

  it('toggles order when same field clicked twice', () => {
    let state = createCatalogState(ITEMS);
    state = sortCatalog(state, 'name', 'asc');
    state = sortCatalog(state, 'name'); // toggles to desc
    expect(state.sortOrder).toBe('desc');
  });
});

describe('create dialog', () => {
  it('opens and closes', () => {
    let state = createCatalogState();
    state = openCreateDialog(state, 'dashboard');
    expect(state.createDialogOpen).toBe(true);
    expect(state.createArtifactType).toBe('dashboard');

    state = closeCreateDialog(state);
    expect(state.createDialogOpen).toBe(false);
    expect(state.createArtifactType).toBeNull();
  });
});

describe('loading / error', () => {
  it('sets loading', () => {
    let state = createCatalogState();
    state = setCatalogLoading(state, true);
    expect(state.loading).toBe(true);
  });

  it('sets error and clears loading', () => {
    let state = setCatalogLoading(createCatalogState(), true);
    state = setCatalogError(state, 'network error');
    expect(state.error).toBe('network error');
    expect(state.loading).toBe(false);
  });
});

describe('combined filters', () => {
  it('applies search and type filter together', () => {
    let state = createCatalogState(ITEMS);
    state = searchCatalog(state, 'report');
    state = filterCatalogByType(state, 'report');
    expect(state.filteredItems).toHaveLength(1);
    expect(state.filteredItems[0].id).toBe('a2');
  });

  it('applies all three filters together', () => {
    let state = createCatalogState(ITEMS);
    state = filterCatalogByType(state, 'dashboard');
    state = filterCatalogByVisibility(state, 'published');
    state = searchCatalog(state, 'sales');
    expect(state.filteredItems).toHaveLength(1);
    expect(state.filteredItems[0].id).toBe('a1');
  });
});
