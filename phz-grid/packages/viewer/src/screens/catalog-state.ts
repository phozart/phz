/**
 * @phozart/phz-viewer — Catalog Screen State
 *
 * Headless state machine for the artifact catalog. Manages search,
 * filtering by type, sorting, and paginated artifact listing.
 */

import type { ArtifactType, VisibilityMeta } from '@phozart/phz-shared/artifacts';

// ========================================================================
// Sort options
// ========================================================================

export type CatalogSortField = 'name' | 'type' | 'updatedAt' | 'visibility';
export type CatalogSortDirection = 'asc' | 'desc';

export interface CatalogSort {
  field: CatalogSortField;
  direction: CatalogSortDirection;
}

// ========================================================================
// CatalogState
// ========================================================================

export interface CatalogState {
  /** All artifacts visible to the current viewer. */
  artifacts: VisibilityMeta[];
  /** Filtered/sorted artifacts after applying search and type filter. */
  filteredArtifacts: VisibilityMeta[];
  /** Full-text search query. */
  searchQuery: string;
  /** Filter by artifact type (null = show all). */
  typeFilter: ArtifactType | null;
  /** Current sort configuration. */
  sort: CatalogSort;
  /** Whether the catalog is loading. */
  loading: boolean;
  /** Current page (0-based). */
  page: number;
  /** Number of items per page. */
  pageSize: number;
  /** Total number of items matching current filters. */
  totalCount: number;
  /** Favorite artifact IDs. */
  favoriteIds: Set<string>;
  /** Display mode for the catalog. */
  viewMode: 'grid' | 'list';
}

// ========================================================================
// Factory: createCatalogState
// ========================================================================

export function createCatalogState(
  overrides?: Partial<CatalogState>,
): CatalogState {
  const artifacts = overrides?.artifacts ?? [];
  const state: CatalogState = {
    artifacts,
    filteredArtifacts: overrides?.filteredArtifacts ?? [...artifacts],
    searchQuery: overrides?.searchQuery ?? '',
    typeFilter: overrides?.typeFilter ?? null,
    sort: overrides?.sort ?? { field: 'name', direction: 'asc' },
    loading: overrides?.loading ?? false,
    page: overrides?.page ?? 0,
    pageSize: overrides?.pageSize ?? 20,
    totalCount: overrides?.totalCount ?? artifacts.length,
    favoriteIds: overrides?.favoriteIds ?? new Set(),
    viewMode: overrides?.viewMode ?? 'grid',
  };
  return state;
}

// ========================================================================
// Filtering and sorting
// ========================================================================

/**
 * Apply search query and type filter to the artifact list, then sort.
 * Returns a new CatalogState with filteredArtifacts updated.
 */
export function applyFilters(state: CatalogState): CatalogState {
  let result = [...state.artifacts];

  // Text search across name and description
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase().trim();
    result = result.filter(
      a =>
        a.name.toLowerCase().includes(q) ||
        (a.description?.toLowerCase().includes(q) ?? false),
    );
  }

  // Type filter
  if (state.typeFilter) {
    result = result.filter(a => a.type === state.typeFilter);
  }

  // Sort
  result.sort((a, b) => {
    const dir = state.sort.direction === 'asc' ? 1 : -1;
    switch (state.sort.field) {
      case 'name':
        return dir * a.name.localeCompare(b.name);
      case 'type':
        return dir * a.type.localeCompare(b.type);
      case 'visibility':
        return dir * a.visibility.localeCompare(b.visibility);
      default:
        return dir * a.name.localeCompare(b.name);
    }
  });

  return {
    ...state,
    filteredArtifacts: result,
    totalCount: result.length,
    page: 0, // Reset to first page on filter change
  };
}

/**
 * Set search query and recompute filtered artifacts.
 */
export function setSearchQuery(state: CatalogState, query: string): CatalogState {
  return applyFilters({ ...state, searchQuery: query });
}

/**
 * Set type filter and recompute filtered artifacts.
 */
export function setTypeFilter(state: CatalogState, typeFilter: ArtifactType | null): CatalogState {
  return applyFilters({ ...state, typeFilter });
}

/**
 * Set sort configuration and recompute filtered artifacts.
 */
export function setCatalogSort(state: CatalogState, sort: CatalogSort): CatalogState {
  return applyFilters({ ...state, sort });
}

/**
 * Set the current page (0-based). Clamps to valid range.
 */
export function setCatalogPage(state: CatalogState, page: number): CatalogState {
  const maxPage = Math.max(0, Math.ceil(state.totalCount / state.pageSize) - 1);
  return { ...state, page: Math.max(0, Math.min(page, maxPage)) };
}

/**
 * Set artifacts and recompute filtered list.
 */
export function setCatalogArtifacts(state: CatalogState, artifacts: VisibilityMeta[]): CatalogState {
  return applyFilters({ ...state, artifacts, loading: false });
}

/**
 * Toggle favorite status for an artifact.
 */
export function toggleFavorite(state: CatalogState, artifactId: string): CatalogState {
  const favoriteIds = new Set(state.favoriteIds);
  if (favoriteIds.has(artifactId)) {
    favoriteIds.delete(artifactId);
  } else {
    favoriteIds.add(artifactId);
  }
  return { ...state, favoriteIds };
}

/**
 * Toggle between grid and list view modes.
 */
export function toggleViewMode(state: CatalogState): CatalogState {
  return { ...state, viewMode: state.viewMode === 'grid' ? 'list' : 'grid' };
}

/**
 * Get the current page of artifacts.
 */
export function getCurrentPage(state: CatalogState): VisibilityMeta[] {
  const start = state.page * state.pageSize;
  return state.filteredArtifacts.slice(start, start + state.pageSize);
}

/**
 * Get total number of pages.
 */
export function getTotalPages(state: CatalogState): number {
  return Math.max(1, Math.ceil(state.totalCount / state.pageSize));
}
