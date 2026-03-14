/**
 * <phz-report-embed> — Standalone report rendering surface.
 * Wraps a grid with report-specific features (title, description, export).
 *
 * Accepts a ReportViewConfig with data source, columns, filters, and sort.
 * Fetches data via DataAdapter.execute() or uses a direct data prop.
 */
import { LitElement } from 'lit';
import type { DataAdapter, ViewerContext } from '@phozart/shared/adapters';
import type { ColumnDefinition } from '@phozart/core';
export interface ReportViewConfig {
    id: string;
    title: string;
    description?: string;
    sourceId: string;
    columns?: ColumnDefinition[];
    filters?: Array<{
        field: string;
        operator: string;
        value: unknown;
    }>;
    sort?: {
        field: string;
        direction: 'asc' | 'desc';
    };
    pageSize?: number;
}
export declare class PhzReportEmbed extends LitElement {
    static styles: import("lit").CSSResult;
    /** Data adapter for fetching report data. */
    dataAdapter?: DataAdapter;
    /** Report configuration. */
    config?: ReportViewConfig;
    /** Viewer context for RLS. */
    viewerContext?: ViewerContext;
    /** Direct data override. */
    data?: unknown[];
    /** Grid density. */
    density: 'compact' | 'dense' | 'comfortable';
    /** Grid theme. */
    theme: string;
    private _loading;
    private _error;
    private _resolvedData;
    connectedCallback(): void;
    updated(changed: Map<string, unknown>): void;
    private _fetchData;
    protected render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-report-embed': PhzReportEmbed;
    }
}
//# sourceMappingURL=phz-report-view.d.ts.map