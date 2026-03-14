/**
 * @phozart/engine-admin — Dashboard Builder
 *
 * 3-panel: widget catalog (left) | canvas (center) | widget config (right).
 * Produces complete DashboardConfig with data bindings per widget type.
 * Embeddable component.
 */
import { LitElement } from 'lit';
import type { BIEngine, DashboardConfig } from '@phozart/engine';
export declare class PhzDashboardBuilder extends LitElement {
    static styles: import("lit").CSSResult[];
    engine?: BIEngine;
    dashboardId?: string;
    data?: Record<string, unknown>[];
    private dashboardName;
    private dashboardDescription;
    private layoutColumns;
    private widgets;
    private selectedWidgetId?;
    private nextId;
    /** Load an existing dashboard config into the builder */
    loadConfig(config: DashboardConfig): void;
    private addWidget;
    private removeWidget;
    private selectWidget;
    private updateWidgetColSpan;
    private updateWidgetConfig;
    private get _hasData();
    private get _hasEngine();
    private getNumericFields;
    private getStringFields;
    private getKPIList;
    private getReportList;
    /** Render an inline notice when a required dependency is not connected. */
    private renderMissingDep;
    /**
     * Validate the dashboard config before publishing.
     * Returns an array of validation error strings (empty = valid).
     */
    private validateDashboard;
    private handlePublish;
    private getWidgetBindingSummary;
    private renderKpiCardConfig;
    private renderScorecardConfig;
    private renderBarChartConfig;
    private renderTrendLineConfig;
    private renderBottomNConfig;
    private renderStatusTableConfig;
    private renderDrillLinkConfig;
    private renderReportConfig;
    private renderWidgetTypeConfig;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-dashboard-builder': PhzDashboardBuilder;
    }
}
//# sourceMappingURL=phz-dashboard-builder.d.ts.map