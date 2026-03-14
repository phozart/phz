/**
 * @phozart/editor — Catalog Screen State (B-2.04)
 *
 * Editor catalog state with creation actions. Unlike the viewer catalog
 * (read-only), the editor catalog supports creating new dashboards and
 * reports, filtering by artifact type, search, and visibility management.
 */

import type { ArtifactVisibility, ArtifactType, VisibilityMeta } from '@phozart/shared/artifacts';

// ========================================================================
// CatalogSortField / CatalogSortOrder
// ========================================================================

export type CatalogSortField = 'name' | 'updatedAt' | 'createdAt' | 'type';
export type CatalogSortOrder = 'asc' | 'desc';

// ========================================================================
// CatalogItem — display model for a catalog entry
// ========================================================================

export interface CatalogItem {
  id: string;
  name: string;
  description?: string;
  type: ArtifactType;
  visibility: ArtifactVisibility;
  ownerId: string;
  ownerName?: string;
  updatedAt: number;
  createdAt: number;
  thumbnailUrl?: string;
  tags?: string[];
}

// ========================================================================
// CatalogState
// ========================================================================

export interface CatalogState {
  /** All catalog items (unfiltered). */
  items: CatalogItem[];
  /** Filtered and sorted items for display. */
  filteredItems: CatalogItem[];
  /** Text search query. */
  searchQuery: string;
  /** Filter by artifact type (null = show all). */
  typeFilter: ArtifactType | null;
  /** Filter by visibility level (null = show all). */
  visibilityFilter: ArtifactVisibility | null;
  /** Sort field and order. */
  sortField: CatalogSortField;
  sortOrder: CatalogSortOrder;
  /** Whether the "create new" dialog is open. */
  createDialogOpen: boolean;
  /** The type of artifact being created. */
  createArtifactType: ArtifactType | null;
  /** Whether items are loading. */
  loading: boolean;
  /** Current error. */
  error: unknown;
}

// ========================================================================
// Factory
// ========================================================================

export function createCatalogState(items?: CatalogItem[]): CatalogState {
  const state: CatalogState = {
    items: items ?? [],
    filteredItems: items ?? [],
    searchQuery: '',
    typeFilter: null,
    visibilityFilter: null,
    sortField: 'updatedAt',
    sortOrder: 'desc',
    createDialogOpen: false,
    createArtifactType: null,
    loading: false,
    error: null,
  };
  return state;
}

// ========================================================================
// Internal: apply filters and sorting
// ========================================================================

function applyFiltersAndSort(state: CatalogState): CatalogItem[] {
  let result = [...state.items];

  // Search filter
  if (state.searchQuery.trim()) {
    const query = state.searchQuery.toLowerCase();
    result = result.filter(
      item =>
        item.name.toLowerCase().includes(query) ||
        (item.description?.toLowerCase().includes(query) ?? false) ||
        (item.tags?.some(tag => tag.toLowerCase().includes(query)) ?? false),
    );
  }

  // Type filter
  if (state.typeFilter) {
    result = result.filter(item => item.type === state.typeFilter);
  }

  // Visibility filter
  if (state.visibilityFilter) {
    result = result.filter(item => item.visibility === state.visibilityFilter);
  }

  // Sort
  result.sort((a, b) => {
    let cmp = 0;
    switch (state.sortField) {
      case 'name':
        cmp = a.name.localeCompare(b.name);
        break;
      case 'updatedAt':
        cmp = a.updatedAt - b.updatedAt;
        break;
      case 'createdAt':
        cmp = a.createdAt - b.createdAt;
        break;
      case 'type':
        cmp = a.type.localeCompare(b.type);
        break;
    }
    return state.sortOrder === 'asc' ? cmp : -cmp;
  });

  return result;
}

// ========================================================================
// State transitions
// ========================================================================

/**
 * Set the catalog items and re-apply filters.
 */
export function setCatalogItems(state: CatalogState, items: CatalogItem[]): CatalogState {
  const newState = { ...state, items };
  return { ...newState, filteredItems: applyFiltersAndSort(newState) };
}

/**
 * Update the search query and re-filter.
 */
export function searchCatalog(state: CatalogState, query: string): CatalogState {
  const newState = { ...state, searchQuery: query };
  return { ...newState, filteredItems: applyFiltersAndSort(newState) };
}

/**
 * Filter by artifact type.
 */
export function filterCatalogByType(
  state: CatalogState,
  type: ArtifactType | null,
): CatalogState {
  const newState = { ...state, typeFilter: type };
  return { ...newState, filteredItems: applyFiltersAndSort(newState) };
}

/**
 * Filter by visibility level.
 */
export function filterCatalogByVisibility(
  state: CatalogState,
  visibility: ArtifactVisibility | null,
): CatalogState {
  const newState = { ...state, visibilityFilter: visibility };
  return { ...newState, filteredItems: applyFiltersAndSort(newState) };
}

/**
 * Change sort field and/or order.
 */
export function sortCatalog(
  state: CatalogState,
  field: CatalogSortField,
  order?: CatalogSortOrder,
): CatalogState {
  const newOrder = order ?? (state.sortField === field && state.sortOrder === 'asc' ? 'desc' : 'asc');
  const newState = { ...state, sortField: field, sortOrder: newOrder };
  return { ...newState, filteredItems: applyFiltersAndSort(newState) };
}

/**
 * Open the create artifact dialog.
 */
export function openCreateDialog(
  state: CatalogState,
  artifactType: ArtifactType,
): CatalogState {
  return { ...state, createDialogOpen: true, createArtifactType: artifactType };
}

/**
 * Close the create artifact dialog.
 */
export function closeCreateDialog(state: CatalogState): CatalogState {
  return { ...state, createDialogOpen: false, createArtifactType: null };
}

/**
 * Set loading state.
 */
export function setCatalogLoading(state: CatalogState, loading: boolean): CatalogState {
  return { ...state, loading };
}

/**
 * Set error state.
 */
export function setCatalogError(state: CatalogState, error: unknown): CatalogState {
  return { ...state, error, loading: false };
}
