/**
 * @phozart/phz-viewer — Report View State
 *
 * Headless state machine for viewing a report or grid definition.
 * Manages pagination, sort, column visibility, and export options.
 */

import type { ExportFormat } from '@phozart/phz-shared/adapters';

// ========================================================================
// Column display config (read-only)
// ========================================================================

export interface ReportColumnView {
  field: string;
  label: string;
  visible: boolean;
  width?: number;
  sortable: boolean;
}

// ========================================================================
// Sort state
// ========================================================================

export interface ReportSort {
  field: string;
  direction: 'asc' | 'desc';
}

// ========================================================================
// ReportViewState
// ========================================================================

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

// ========================================================================
// Factory
// ========================================================================

export function createReportViewState(
  overrides?: Partial<ReportViewState>,
): ReportViewState {
  return {
    reportId: overrides?.reportId ?? null,
    title: overrides?.title ?? '',
    description: overrides?.description ?? '',
    columns: overrides?.columns ?? [],
    sort: overrides?.sort ?? null,
    page: overrides?.page ?? 0,
    pageSize: overrides?.pageSize ?? 50,
    totalRows: overrides?.totalRows ?? 0,
    loading: overrides?.loading ?? false,
    exportFormats: overrides?.exportFormats ?? ['csv', 'xlsx'],
    exporting: overrides?.exporting ?? false,
    searchQuery: overrides?.searchQuery ?? '',
    rows: overrides?.rows ?? [],
    lastRefreshed: overrides?.lastRefreshed ?? null,
  };
}

// ========================================================================
// State transitions
// ========================================================================

/**
 * Load report metadata (columns, title, etc.).
 */
export function loadReport(
  state: ReportViewState,
  report: {
    id: string;
    title: string;
    description?: string;
    columns: ReportColumnView[];
    exportFormats?: ExportFormat[];
  },
): ReportViewState {
  return {
    ...state,
    reportId: report.id,
    title: report.title,
    description: report.description ?? '',
    columns: report.columns,
    exportFormats: report.exportFormats ?? state.exportFormats,
    loading: false,
    page: 0,
    sort: null,
    searchQuery: '',
    lastRefreshed: Date.now(),
  };
}

/**
 * Set report data (rows + total count).
 */
export function setReportData(
  state: ReportViewState,
  rows: unknown[][],
  totalRows: number,
): ReportViewState {
  return {
    ...state,
    rows,
    totalRows,
    loading: false,
    lastRefreshed: Date.now(),
  };
}

/**
 * Set sort configuration.
 */
export function setReportSort(
  state: ReportViewState,
  sort: ReportSort | null,
): ReportViewState {
  return { ...state, sort, page: 0, loading: true };
}

/**
 * Toggle sort on a field. Cycles: asc -> desc -> none.
 */
export function toggleReportSort(
  state: ReportViewState,
  field: string,
): ReportViewState {
  if (state.sort?.field !== field) {
    return setReportSort(state, { field, direction: 'asc' });
  }
  if (state.sort.direction === 'asc') {
    return setReportSort(state, { field, direction: 'desc' });
  }
  return setReportSort(state, null);
}

/**
 * Set the current page (0-based). Clamps to valid range.
 */
export function setReportPage(
  state: ReportViewState,
  page: number,
): ReportViewState {
  const maxPage = Math.max(0, Math.ceil(state.totalRows / state.pageSize) - 1);
  return { ...state, page: Math.max(0, Math.min(page, maxPage)), loading: true };
}

/**
 * Set the page size and reset to first page.
 */
export function setReportPageSize(
  state: ReportViewState,
  pageSize: number,
): ReportViewState {
  return { ...state, pageSize: Math.max(1, pageSize), page: 0, loading: true };
}

/**
 * Set search query.
 */
export function setReportSearch(
  state: ReportViewState,
  searchQuery: string,
): ReportViewState {
  return { ...state, searchQuery, page: 0, loading: true };
}

/**
 * Toggle column visibility.
 */
export function toggleColumnVisibility(
  state: ReportViewState,
  field: string,
): ReportViewState {
  return {
    ...state,
    columns: state.columns.map(c =>
      c.field === field ? { ...c, visible: !c.visible } : c,
    ),
  };
}

/**
 * Set exporting state.
 */
export function setExporting(
  state: ReportViewState,
  exporting: boolean,
): ReportViewState {
  return { ...state, exporting };
}

/**
 * Get total number of pages.
 */
export function getReportTotalPages(state: ReportViewState): number {
  return Math.max(1, Math.ceil(state.totalRows / state.pageSize));
}

/**
 * Get visible columns.
 */
export function getVisibleColumns(state: ReportViewState): ReportColumnView[] {
  return state.columns.filter(c => c.visible);
}
