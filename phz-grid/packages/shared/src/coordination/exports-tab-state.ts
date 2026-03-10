/**
 * @phozart/phz-shared — Exports Tab State (C-2.02)
 *
 * UI state for the exports history tab. Tracks recent async exports,
 * sorting, and status filtering.
 *
 * Pure functions only — no side effects, no DOM.
 */

import type { ExportFormat } from '../adapters/data-adapter.js';

// ========================================================================
// ExportEntry
// ========================================================================

export interface ExportEntry {
  id: string;
  name: string;
  format: ExportFormat;
  status: string;
  createdAt: number;
  downloadUrl?: string;
}

// ========================================================================
// ExportsTabState
// ========================================================================

export type ExportSortField = 'name' | 'date' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface ExportsTabState {
  exports: ExportEntry[];
  sortBy: ExportSortField;
  sortDirection: SortDirection;
  filterStatus: string | null;
}

// ========================================================================
// Factory
// ========================================================================

/**
 * Create a fresh ExportsTabState with sensible defaults.
 */
export function createExportsTabState(
  overrides?: Partial<ExportsTabState>,
): ExportsTabState {
  return {
    exports: [],
    sortBy: 'date',
    sortDirection: 'desc',
    filterStatus: null,
    ...overrides,
  };
}

// ========================================================================
// State transitions
// ========================================================================

/**
 * Add an export entry. If an entry with the same ID exists, it is replaced.
 */
export function addExport(
  state: ExportsTabState,
  entry: ExportEntry,
): ExportsTabState {
  const filtered = state.exports.filter(e => e.id !== entry.id);
  return {
    ...state,
    exports: [...filtered, entry],
  };
}

/**
 * Update an existing export entry. Returns the state unchanged if not found.
 */
export function updateExport(
  state: ExportsTabState,
  id: string,
  updates: Partial<ExportEntry>,
): ExportsTabState {
  let found = false;
  const exports = state.exports.map(e => {
    if (e.id !== id) return e;
    found = true;
    return { ...e, ...updates };
  });
  if (!found) return state;
  return { ...state, exports };
}

/**
 * Remove an export entry by ID.
 */
export function removeExport(
  state: ExportsTabState,
  id: string,
): ExportsTabState {
  return {
    ...state,
    exports: state.exports.filter(e => e.id !== id),
  };
}

/**
 * Set the sort field and optionally the direction.
 * If the same field is selected again, the direction toggles.
 */
export function setSort(
  state: ExportsTabState,
  sortBy: ExportSortField,
  direction?: SortDirection,
): ExportsTabState {
  const sortDirection =
    direction ??
    (state.sortBy === sortBy
      ? state.sortDirection === 'asc'
        ? 'desc'
        : 'asc'
      : 'desc');

  return { ...state, sortBy, sortDirection };
}

/**
 * Set or clear the status filter.
 */
export function setFilterStatus(
  state: ExportsTabState,
  status: string | null,
): ExportsTabState {
  return { ...state, filterStatus: status };
}

// ========================================================================
// Selectors
// ========================================================================

/**
 * Get the sorted and filtered list of exports.
 */
export function getVisibleExports(state: ExportsTabState): ExportEntry[] {
  let entries = state.exports;

  // Apply status filter
  if (state.filterStatus != null) {
    entries = entries.filter(e => e.status === state.filterStatus);
  }

  // Sort
  const dir = state.sortDirection === 'asc' ? 1 : -1;
  return [...entries].sort((a, b) => {
    switch (state.sortBy) {
      case 'name':
        return dir * a.name.localeCompare(b.name);
      case 'date':
        return dir * (a.createdAt - b.createdAt);
      case 'status':
        return dir * a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });
}
