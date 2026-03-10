/**
 * @phozart/phz-workspace — Catalog Dense Table View State (B-3.01)
 *
 * Pure functions for managing a dense table view of the artifact catalog.
 * Supports multi-column sorting, bulk selection, and inline quick actions.
 */

import type { ArtifactMeta, ArtifactType } from '../types.js';

// ========================================================================
// Sort configuration
// ========================================================================

export type DenseSortField = 'name' | 'type' | 'visibility' | 'updatedAt' | 'owner';

export interface DenseSortConfig {
  field: DenseSortField;
  direction: 'asc' | 'desc';
}

// ========================================================================
// Inline action types
// ========================================================================

export type InlineAction =
  | { kind: 'rename'; artifactId: string; newName: string }
  | { kind: 'duplicate'; artifactId: string }
  | { kind: 'change-visibility'; artifactId: string; published: boolean };

// ========================================================================
// Bulk action types
// ========================================================================

export type BulkAction = 'delete' | 'share' | 'publish' | 'unpublish';

// ========================================================================
// State
// ========================================================================

export interface CatalogDenseState {
  artifacts: ArtifactMeta[];
  viewMode: 'card' | 'dense-table';
  sort: DenseSortConfig;
  selectedIds: Set<string>;
  search: string;
  typeFilter?: ArtifactType;
  pageSize: number;
  currentPage: number;
}

// ========================================================================
// Factory
// ========================================================================

export function initialCatalogDenseState(
  artifacts: ArtifactMeta[] = [],
): CatalogDenseState {
  return {
    artifacts,
    viewMode: 'dense-table',
    sort: { field: 'updatedAt', direction: 'desc' },
    selectedIds: new Set(),
    search: '',
    pageSize: 50,
    currentPage: 0,
  };
}

// ========================================================================
// View mode toggle
// ========================================================================

export function toggleViewMode(state: CatalogDenseState): CatalogDenseState {
  return {
    ...state,
    viewMode: state.viewMode === 'card' ? 'dense-table' : 'card',
  };
}

// ========================================================================
// Sorting
// ========================================================================

export function setSort(
  state: CatalogDenseState,
  field: DenseSortField,
): CatalogDenseState {
  const direction =
    state.sort.field === field && state.sort.direction === 'asc' ? 'desc' : 'asc';
  return { ...state, sort: { field, direction }, currentPage: 0 };
}

export function sortArtifacts(
  artifacts: ArtifactMeta[],
  sort: DenseSortConfig,
): ArtifactMeta[] {
  const sorted = [...artifacts];
  sorted.sort((a, b) => {
    let cmp: number;
    switch (sort.field) {
      case 'name':
        cmp = a.name.localeCompare(b.name);
        break;
      case 'type':
        cmp = a.type.localeCompare(b.type);
        break;
      case 'visibility':
        cmp = (a.published ? 1 : 0) - (b.published ? 1 : 0);
        break;
      case 'updatedAt':
        cmp = (a.updatedAt ?? 0) - (b.updatedAt ?? 0);
        break;
      case 'owner':
        // ArtifactMeta doesn't have owner, sort by id as proxy
        cmp = a.id.localeCompare(b.id);
        break;
      default:
        cmp = 0;
    }
    return sort.direction === 'asc' ? cmp : -cmp;
  });
  return sorted;
}

// ========================================================================
// Filtering
// ========================================================================

export function filterDenseArtifacts(state: CatalogDenseState): ArtifactMeta[] {
  let result = state.artifacts;

  if (state.typeFilter) {
    result = result.filter(a => a.type === state.typeFilter);
  }

  if (state.search) {
    const q = state.search.toLowerCase();
    result = result.filter(
      a =>
        a.name.toLowerCase().includes(q) ||
        (a.description?.toLowerCase().includes(q) ?? false),
    );
  }

  return sortArtifacts(result, state.sort);
}

// ========================================================================
// Pagination
// ========================================================================

export function getPagedArtifacts(state: CatalogDenseState): ArtifactMeta[] {
  const filtered = filterDenseArtifacts(state);
  const start = state.currentPage * state.pageSize;
  return filtered.slice(start, start + state.pageSize);
}

export function getTotalPages(state: CatalogDenseState): number {
  const total = filterDenseArtifacts(state).length;
  return Math.max(1, Math.ceil(total / state.pageSize));
}

export function goToPage(state: CatalogDenseState, page: number): CatalogDenseState {
  const maxPage = getTotalPages(state) - 1;
  return { ...state, currentPage: Math.max(0, Math.min(page, maxPage)) };
}

// ========================================================================
// Selection
// ========================================================================

export function toggleSelection(
  state: CatalogDenseState,
  artifactId: string,
): CatalogDenseState {
  const next = new Set(state.selectedIds);
  if (next.has(artifactId)) {
    next.delete(artifactId);
  } else {
    next.add(artifactId);
  }
  return { ...state, selectedIds: next };
}

export function selectAll(state: CatalogDenseState): CatalogDenseState {
  const filtered = filterDenseArtifacts(state);
  return { ...state, selectedIds: new Set(filtered.map(a => a.id)) };
}

export function deselectAll(state: CatalogDenseState): CatalogDenseState {
  return { ...state, selectedIds: new Set() };
}

export function isAllSelected(state: CatalogDenseState): boolean {
  const filtered = filterDenseArtifacts(state);
  if (filtered.length === 0) return false;
  return filtered.every(a => state.selectedIds.has(a.id));
}

// ========================================================================
// Inline actions
// ========================================================================

export function applyInlineAction(
  state: CatalogDenseState,
  action: InlineAction,
): CatalogDenseState {
  switch (action.kind) {
    case 'rename':
      return {
        ...state,
        artifacts: state.artifacts.map(a =>
          a.id === action.artifactId
            ? { ...a, name: action.newName, updatedAt: Date.now() }
            : a,
        ),
      };

    case 'duplicate': {
      const source = state.artifacts.find(a => a.id === action.artifactId);
      if (!source) return state;
      const duplicate: ArtifactMeta = {
        ...source,
        id: `${source.id}_copy_${Date.now()}`,
        name: `${source.name} (copy)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        published: false,
      };
      return { ...state, artifacts: [...state.artifacts, duplicate] };
    }

    case 'change-visibility':
      return {
        ...state,
        artifacts: state.artifacts.map(a =>
          a.id === action.artifactId
            ? { ...a, published: action.published, updatedAt: Date.now() }
            : a,
        ),
      };
  }
}

// ========================================================================
// Bulk action validation
// ========================================================================

export function canApplyBulkAction(
  state: CatalogDenseState,
  action: BulkAction,
): boolean {
  if (state.selectedIds.size === 0) return false;

  switch (action) {
    case 'delete':
    case 'share':
      return true;
    case 'publish':
      return [...state.selectedIds].some(id => {
        const a = state.artifacts.find(x => x.id === id);
        return a && !a.published;
      });
    case 'unpublish':
      return [...state.selectedIds].some(id => {
        const a = state.artifacts.find(x => x.id === id);
        return a && a.published === true;
      });
  }
}

export function applyBulkAction(
  state: CatalogDenseState,
  action: BulkAction,
): CatalogDenseState {
  if (!canApplyBulkAction(state, action)) return state;

  switch (action) {
    case 'delete':
      return {
        ...state,
        artifacts: state.artifacts.filter(a => !state.selectedIds.has(a.id)),
        selectedIds: new Set(),
      };

    case 'publish':
      return {
        ...state,
        artifacts: state.artifacts.map(a =>
          state.selectedIds.has(a.id) ? { ...a, published: true, updatedAt: Date.now() } : a,
        ),
        selectedIds: new Set(),
      };

    case 'unpublish':
      return {
        ...state,
        artifacts: state.artifacts.map(a =>
          state.selectedIds.has(a.id) ? { ...a, published: false, updatedAt: Date.now() } : a,
        ),
        selectedIds: new Set(),
      };

    case 'share':
      // Share is an intent action — clear selection, consumer handles sharing externally
      return { ...state, selectedIds: new Set() };
  }
}
