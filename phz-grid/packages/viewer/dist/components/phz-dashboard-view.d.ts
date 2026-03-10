/**
 * <phz-dashboard-view> — Standalone dashboard rendering surface.
 * Renders a dashboard layout with widgets, without requiring the viewer shell.
 *
 * Consumers inject widget content via named slots (e.g., slot="widget-w1").
 * Supports auto-grid and fixed grid layouts with configurable column count.
 */
import { LitElement } from 'lit';
import type { DataAdapter, ViewerContext } from '@phozart/phz-shared/adapters';
export interface DashboardViewConfig {
    id: string;
    title: string;
    widgets: DashboardViewWidget[];
    layout?: 'auto-grid' | 'fixed';
    columns?: number;
}
export interface DashboardViewWidget {
    id: string;
    type: string;
    title?: string;
    sourceId: string;
    config?: Record<string, unknown>;
    position?: {
        row: number;
        col: number;
        rowSpan?: number;
        colSpan?: number;
    };
}
export declare class PhzDashboardView extends LitElement {
    static styles: import("lit").CSSResult;
    /** Data adapter for fetching widget data. */
    dataAdapter?: DataAdapter;
    /** Dashboard configuration. */
    config?: DashboardViewConfig;
    /** Viewer context for RLS. */
    viewerContext?: ViewerContext;
    private _loading;
    private _error;
    protected render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-dashboard-view': PhzDashboardView;
    }
}
//# sourceMappingURL=phz-dashboard-view.d.ts.map