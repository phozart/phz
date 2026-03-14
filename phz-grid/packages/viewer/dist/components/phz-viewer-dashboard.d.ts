/**
 * @phozart/viewer — <phz-viewer-dashboard> Custom Element
 *
 * Dashboard view screen. Renders a read-only dashboard with widgets,
 * cross-filtering, and expand/collapse. Delegates state to
 * the headless dashboard-state functions.
 */
import { LitElement, type TemplateResult } from 'lit';
import type { CrossFilterEntry } from '@phozart/shared/coordination';
import { type DashboardViewState, type DashboardWidgetView } from '../screens/dashboard-state.js';
export declare class PhzViewerDashboard extends LitElement {
    static styles: import("lit").CSSResult;
    dashboardId: string;
    widgets: DashboardWidgetView[];
    dashboardTitle: string;
    dashboardDescription: string;
    private _dashState;
    willUpdate(changed: Map<string, unknown>): void;
    getDashboardState(): DashboardViewState;
    applyWidgetCrossFilter(entry: CrossFilterEntry): void;
    clearWidgetCrossFilter(widgetId: string): void;
    refresh(): void;
    render(): TemplateResult;
    private _renderWidget;
    private _handleRefresh;
    private _handleFullscreen;
    private _handleExpandWidget;
    private _handleClearCrossFilter;
    private _handleClearAllCrossFilters;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-viewer-dashboard': PhzViewerDashboard;
    }
}
//# sourceMappingURL=phz-viewer-dashboard.d.ts.map