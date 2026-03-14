/**
 * @phozart/shared — Exports Tab State (C-2.02)
 *
 * UI state for the exports history tab. Tracks recent async exports,
 * sorting, and status filtering.
 *
 * Pure functions only — no side effects, no DOM.
 */
import type { ExportFormat } from '../adapters/data-adapter.js';
export interface ExportEntry {
    id: string;
    name: string;
    format: ExportFormat;
    status: string;
    createdAt: number;
    downloadUrl?: string;
}
export type ExportSortField = 'name' | 'date' | 'status';
export type SortDirection = 'asc' | 'desc';
export interface ExportsTabState {
    exports: ExportEntry[];
    sortBy: ExportSortField;
    sortDirection: SortDirection;
    filterStatus: string | null;
}
/**
 * Create a fresh ExportsTabState with sensible defaults.
 */
export declare function createExportsTabState(overrides?: Partial<ExportsTabState>): ExportsTabState;
/**
 * Add an export entry. If an entry with the same ID exists, it is replaced.
 */
export declare function addExport(state: ExportsTabState, entry: ExportEntry): ExportsTabState;
/**
 * Update an existing export entry. Returns the state unchanged if not found.
 */
export declare function updateExport(state: ExportsTabState, id: string, updates: Partial<ExportEntry>): ExportsTabState;
/**
 * Remove an export entry by ID.
 */
export declare function removeExport(state: ExportsTabState, id: string): ExportsTabState;
/**
 * Set the sort field and optionally the direction.
 * If the same field is selected again, the direction toggles.
 */
export declare function setSort(state: ExportsTabState, sortBy: ExportSortField, direction?: SortDirection): ExportsTabState;
/**
 * Set or clear the status filter.
 */
export declare function setFilterStatus(state: ExportsTabState, status: string | null): ExportsTabState;
/**
 * Get the sorted and filtered list of exports.
 */
export declare function getVisibleExports(state: ExportsTabState): ExportEntry[];
//# sourceMappingURL=exports-tab-state.d.ts.map