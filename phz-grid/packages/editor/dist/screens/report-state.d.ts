/**
 * @phozart/editor — Report Editing State (B-2.09)
 *
 * State machine for the report editing screen. Supports report
 * configuration (columns, filters, sorting), preview mode,
 * and save/publish actions.
 */
import type { ArtifactVisibility } from '@phozart/shared/artifacts';
export interface ReportColumnConfig {
    field: string;
    label: string;
    visible: boolean;
    width?: number;
    format?: string;
    aggregation?: string;
}
export interface ReportFilterConfig {
    field: string;
    operator: string;
    value: unknown;
    enabled: boolean;
}
export interface ReportSortConfig {
    field: string;
    direction: 'asc' | 'desc';
}
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
export declare function createReportEditState(reportId: string, overrides?: Partial<ReportEditState>): ReportEditState;
/**
 * Add a column to the report.
 */
export declare function addReportColumn(state: ReportEditState, column: ReportColumnConfig): ReportEditState;
/**
 * Remove a column by field name.
 */
export declare function removeReportColumn(state: ReportEditState, field: string): ReportEditState;
/**
 * Update a column's configuration.
 */
export declare function updateReportColumn(state: ReportEditState, field: string, updates: Partial<ReportColumnConfig>): ReportEditState;
/**
 * Reorder columns by providing the new field order.
 */
export declare function reorderReportColumns(state: ReportEditState, fieldOrder: string[]): ReportEditState;
/**
 * Add a filter to the report.
 */
export declare function addReportFilter(state: ReportEditState, filter: ReportFilterConfig): ReportEditState;
/**
 * Remove a filter by index.
 */
export declare function removeReportFilter(state: ReportEditState, index: number): ReportEditState;
/**
 * Update a filter at a given index.
 */
export declare function updateReportFilter(state: ReportEditState, index: number, updates: Partial<ReportFilterConfig>): ReportEditState;
/**
 * Set the sort configuration.
 */
export declare function setReportSorts(state: ReportEditState, sorts: ReportSortConfig[]): ReportEditState;
/**
 * Toggle preview mode.
 */
export declare function toggleReportPreview(state: ReportEditState): ReportEditState;
/**
 * Set preview data.
 */
export declare function setReportPreviewData(state: ReportEditState, data: unknown[][], rowCount: number): ReportEditState;
/**
 * Clear preview data.
 */
export declare function clearReportPreview(state: ReportEditState): ReportEditState;
/**
 * Set report title.
 */
export declare function setReportTitle(state: ReportEditState, title: string): ReportEditState;
/**
 * Set report description.
 */
export declare function setReportDescription(state: ReportEditState, description: string): ReportEditState;
/**
 * Set the data source.
 */
export declare function setReportDataSource(state: ReportEditState, dataSourceId: string): ReportEditState;
/**
 * Mark the report as saved.
 */
export declare function markReportSaved(state: ReportEditState): ReportEditState;
/**
 * Set loading state.
 */
export declare function setReportLoading(state: ReportEditState, loading: boolean): ReportEditState;
/**
 * Set error state.
 */
export declare function setReportError(state: ReportEditState, error: unknown): ReportEditState;
//# sourceMappingURL=report-state.d.ts.map