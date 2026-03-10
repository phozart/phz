/**
 * @phozart/phz-viewer — Report View State
 *
 * Headless state machine for viewing a report or grid definition.
 * Manages pagination, sort, column visibility, and export options.
 */
import type { ExportFormat } from '@phozart/phz-shared/adapters';
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
    /** Current sort configuration (null if no sort). */
    sort: ReportSort | null;
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
 * Set sort configuration.
 */
export declare function setReportSort(state: ReportViewState, sort: ReportSort | null): ReportViewState;
/**
 * Toggle sort on a field. Cycles: asc -> desc -> none.
 */
export declare function toggleReportSort(state: ReportViewState, field: string): ReportViewState;
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
//# sourceMappingURL=report-state.d.ts.map