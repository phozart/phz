/**
 * @phozart/phz-editor — Report Editing State (B-2.09)
 *
 * State machine for the report editing screen. Supports report
 * configuration (columns, filters, sorting), preview mode,
 * and save/publish actions.
 */

import type { ArtifactVisibility } from '@phozart/phz-shared/artifacts';

// ========================================================================
// ReportColumnConfig
// ========================================================================

export interface ReportColumnConfig {
  field: string;
  label: string;
  visible: boolean;
  width?: number;
  format?: string;
  aggregation?: string;
}

// ========================================================================
// ReportFilterConfig
// ========================================================================

export interface ReportFilterConfig {
  field: string;
  operator: string;
  value: unknown;
  enabled: boolean;
}

// ========================================================================
// ReportSortConfig
// ========================================================================

export interface ReportSortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

// ========================================================================
// ReportEditState
// ========================================================================

export interface ReportEditState {
  /** Report artifact ID. */
  reportId: string;
  /** Report title. */
  title: string;
  /** Report description. */
  description: string;
  /** Data source ID. */
  dataSourceId: string;
  /** Column configuration. */
  columns: ReportColumnConfig[];
  /** Active filters. */
  filters: ReportFilterConfig[];
  /** Sort configuration. */
  sorts: ReportSortConfig[];
  /** Row limit (0 = unlimited). */
  rowLimit: number;
  /** Whether the report is in preview mode. */
  previewMode: boolean;
  /** Preview data (rows from the data adapter). */
  previewData: unknown[][] | null;
  /** Preview row count. */
  previewRowCount: number;
  /** Report visibility. */
  visibility: ArtifactVisibility;
  /** Whether the report has unsaved changes. */
  dirty: boolean;
  /** Loading state. */
  loading: boolean;
  /** Error state. */
  error: unknown;
}

// ========================================================================
// Factory
// ========================================================================

export function createReportEditState(
  reportId: string,
  overrides?: Partial<ReportEditState>,
): ReportEditState {
  return {
    reportId,
    title: '',
    description: '',
    dataSourceId: '',
    columns: [],
    filters: [],
    sorts: [],
    rowLimit: 0,
    previewMode: false,
    previewData: null,
    previewRowCount: 0,
    visibility: 'personal',
    dirty: false,
    loading: false,
    error: null,
    ...overrides,
  };
}

// ========================================================================
// Column operations
// ========================================================================

/**
 * Add a column to the report.
 */
export function addReportColumn(
  state: ReportEditState,
  column: ReportColumnConfig,
): ReportEditState {
  return {
    ...state,
    columns: [...state.columns, column],
    dirty: true,
  };
}

/**
 * Remove a column by field name.
 */
export function removeReportColumn(
  state: ReportEditState,
  field: string,
): ReportEditState {
  return {
    ...state,
    columns: state.columns.filter(c => c.field !== field),
    dirty: true,
  };
}

/**
 * Update a column's configuration.
 */
export function updateReportColumn(
  state: ReportEditState,
  field: string,
  updates: Partial<ReportColumnConfig>,
): ReportEditState {
  return {
    ...state,
    columns: state.columns.map(c =>
      c.field === field ? { ...c, ...updates } : c,
    ),
    dirty: true,
  };
}

/**
 * Reorder columns by providing the new field order.
 */
export function reorderReportColumns(
  state: ReportEditState,
  fieldOrder: string[],
): ReportEditState {
  const columnMap = new Map(state.columns.map(c => [c.field, c]));
  const reordered = fieldOrder
    .map(field => columnMap.get(field))
    .filter((c): c is ReportColumnConfig => c !== undefined);

  return { ...state, columns: reordered, dirty: true };
}

// ========================================================================
// Filter operations
// ========================================================================

/**
 * Add a filter to the report.
 */
export function addReportFilter(
  state: ReportEditState,
  filter: ReportFilterConfig,
): ReportEditState {
  return {
    ...state,
    filters: [...state.filters, filter],
    dirty: true,
  };
}

/**
 * Remove a filter by index.
 */
export function removeReportFilter(
  state: ReportEditState,
  index: number,
): ReportEditState {
  const filters = [...state.filters];
  filters.splice(index, 1);
  return { ...state, filters, dirty: true };
}

/**
 * Update a filter at a given index.
 */
export function updateReportFilter(
  state: ReportEditState,
  index: number,
  updates: Partial<ReportFilterConfig>,
): ReportEditState {
  const filters = state.filters.map((f, i) =>
    i === index ? { ...f, ...updates } : f,
  );
  return { ...state, filters, dirty: true };
}

// ========================================================================
// Sort operations
// ========================================================================

/**
 * Set the sort configuration.
 */
export function setReportSorts(
  state: ReportEditState,
  sorts: ReportSortConfig[],
): ReportEditState {
  return { ...state, sorts, dirty: true };
}

// ========================================================================
// Preview mode
// ========================================================================

/**
 * Toggle preview mode.
 */
export function toggleReportPreview(state: ReportEditState): ReportEditState {
  return { ...state, previewMode: !state.previewMode };
}

/**
 * Set preview data.
 */
export function setReportPreviewData(
  state: ReportEditState,
  data: unknown[][],
  rowCount: number,
): ReportEditState {
  return { ...state, previewData: data, previewRowCount: rowCount, previewMode: true };
}

/**
 * Clear preview data.
 */
export function clearReportPreview(state: ReportEditState): ReportEditState {
  return { ...state, previewData: null, previewRowCount: 0, previewMode: false };
}

// ========================================================================
// Metadata
// ========================================================================

/**
 * Set report title.
 */
export function setReportTitle(state: ReportEditState, title: string): ReportEditState {
  return { ...state, title, dirty: true };
}

/**
 * Set report description.
 */
export function setReportDescription(
  state: ReportEditState,
  description: string,
): ReportEditState {
  return { ...state, description, dirty: true };
}

/**
 * Set the data source.
 */
export function setReportDataSource(
  state: ReportEditState,
  dataSourceId: string,
): ReportEditState {
  return { ...state, dataSourceId, dirty: true };
}

/**
 * Mark the report as saved.
 */
export function markReportSaved(state: ReportEditState): ReportEditState {
  return { ...state, dirty: false };
}

/**
 * Set loading state.
 */
export function setReportLoading(state: ReportEditState, loading: boolean): ReportEditState {
  return { ...state, loading, error: loading ? null : state.error };
}

/**
 * Set error state.
 */
export function setReportError(state: ReportEditState, error: unknown): ReportEditState {
  return { ...state, error, loading: false };
}
