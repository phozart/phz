/**
 * @phozart/viewer — Report View State
 *
 * Headless state machine for viewing a report or grid definition.
 * Manages pagination, sort, column visibility, and export options.
 */
import type { ExportFormat } from '@phozart/shared/adapters';
export interface ReportColumnView {
    field: string;
    label: string;
    visible: boolean;
    width?: number;
    sortable: boolean;
}
export interface ReportSort {
    field: string;
    direction: 'asc' | 'desc';
}
export interface ReportViewState {
    /** ID of the report/grid being viewed. */
    reportId: string | null;
    /** Report title. */
    title: string;
    /** Report description. */
    description: string;
    /** Column definitions for the report. */
    columns: ReportColumnView[];
    /** Multi-column sort configuration (ordered by priority). */
    sortColumns: ReportSort[];
    /** Current page (0-based). */
    page: number;
    /** Number of rows per page. */
    pageSize: number;
    /** Total row count (from server). */
    totalRows: number;
    /** Whether data is loading. */
    loading: boolean;
    /** Available export formats. */
    exportFormats: ExportFormat[];
    /** Whether an export is currently in progress. */
    exporting: boolean;
    /** Search query applied to the report data. */
    searchQuery: string;
    /** Row data (current page). */
    rows: unknown[][];
    /** Last refresh timestamp. */
    lastRefreshed: number | null;
    /** Currently hovered column header field (for contextual actions). */
    hoveredColumn: string | null;
}
export declare function createReportViewState(overrides?: Partial<ReportViewState>): ReportViewState;
/**
 * Load report metadata (columns, title, etc.).
 */
export declare function loadReport(state: ReportViewState, report: {
    id: string;
    title: string;
    description?: string;
    columns: ReportColumnView[];
    exportFormats?: ExportFormat[];
}): ReportViewState;
/**
 * Set report data (rows + total count).
 */
export declare function setReportData(state: ReportViewState, rows: unknown[][], totalRows: number): ReportViewState;
/**
 * Set sort configuration (backward compatible — wraps single sort into array).
 */
export declare function setReportSort(state: ReportViewState, sort: ReportSort | null): ReportViewState;
/**
 * Toggle sort on a field. Cycles: asc -> desc -> remove.
 * When addToMulti is false (default), replaces the entire sort array (single-sort).
 * When addToMulti is true, appends/toggles within the multi-sort array.
 */
export declare function toggleReportSort(state: ReportViewState, field: string, addToMulti?: boolean): ReportViewState;
/**
 * Set the current page (0-based). Clamps to valid range.
 */
export declare function setReportPage(state: ReportViewState, page: number): ReportViewState;
/**
 * Set the page size and reset to first page.
 */
export declare function setReportPageSize(state: ReportViewState, pageSize: number): ReportViewState;
/**
 * Set search query.
 */
export declare function setReportSearch(state: ReportViewState, searchQuery: string): ReportViewState;
/**
 * Toggle column visibility.
 */
export declare function toggleColumnVisibility(state: ReportViewState, field: string): ReportViewState;
/**
 * Set exporting state.
 */
export declare function setExporting(state: ReportViewState, exporting: boolean): ReportViewState;
/**
 * Get total number of pages.
 */
export declare function getReportTotalPages(state: ReportViewState): number;
/**
 * Get visible columns.
 */
export declare function getVisibleColumns(state: ReportViewState): ReportColumnView[];
/**
 * Add a column to the multi-sort array.
 * If field already sorted, updates direction.
 */
export declare function addSortColumn(state: ReportViewState, field: string, direction: 'asc' | 'desc'): ReportViewState;
/**
 * Remove a column from the multi-sort array.
 */
export declare function removeSortColumn(state: ReportViewState, field: string): ReportViewState;
/**
 * Clear all sort columns.
 */
export declare function clearAllSorts(state: ReportViewState): ReportViewState;
/**
 * Get the sort priority index for a field (-1 if not sorted).
 */
export declare function getSortIndex(state: ReportViewState, field: string): number;
/** Action types available for column header context menus. */
export type HeaderActionType = 'sort-asc' | 'sort-desc' | 'clear-sort' | 'filter' | 'group' | 'aggregate' | 'hide' | 'pin-left' | 'pin-right';
/** A single action available for a column header. */
export interface ColumnHeaderAction {
    type: HeaderActionType;
    label: string;
    /** Icon identifier for rendering. */
    icon: string;
    enabled: boolean;
    /** True if the action is currently applied (e.g., column is sorted). */
    active: boolean;
}
/**
 * Set the currently hovered column header field.
 * Pass `null` to clear the hover state.
 */
export declare function setHoveredColumn(state: ReportViewState, field: string | null): ReportViewState;
/**
 * Compute the list of contextual actions available for a column header.
 *
 * Actions are determined by the column's type and the current sort state:
 * - **Universal**: sort-asc, sort-desc, clear-sort, filter, hide, pin-left, pin-right
 * - **String / Date**: group
 * - **Number**: aggregate
 *
 * Sort actions reflect the current sort state via `active`. The `clear-sort`
 * action is always present but only `enabled` when the column is actively sorted.
 */
export declare function computeHeaderActions(state: ReportViewState, field: string, columnType: string): ColumnHeaderAction[];
//# sourceMappingURL=report-state.d.ts.map