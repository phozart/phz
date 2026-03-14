/**
 * @phozart/viewer — <phz-viewer-report> Custom Element
 *
 * Report/grid view screen. Displays tabular data with pagination,
 * sort, and export. Delegates to phz-grid for rendering.
 */
import { LitElement, type TemplateResult } from 'lit';
import type { ExportFormat } from '@phozart/shared/adapters';
import { type ReportViewState, type ReportColumnView } from '../screens/report-state.js';
export interface ReportExportEventDetail {
    reportId: string;
    format: ExportFormat;
}
export interface ReportSortEventDetail {
    field: string;
    direction: 'asc' | 'desc' | null;
}
export interface ReportPageEventDetail {
    page: number;
    pageSize: number;
}
export declare class PhzViewerReport extends LitElement {
    static styles: import("lit").CSSResult;
    reportId: string;
    reportTitle: string;
    reportDescription: string;
    columns: ReportColumnView[];
    rows: unknown[][];
    totalRows: number;
    exportFormats: ExportFormat[];
    private _reportState;
    willUpdate(changed: Map<string, unknown>): void;
    getReportState(): ReportViewState;
    render(): TemplateResult;
    private _handleSearch;
    private _handleExport;
    private _handlePage;
    private _handlePageSize;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-viewer-report': PhzViewerReport;
    }
}
//# sourceMappingURL=phz-viewer-report.d.ts.map