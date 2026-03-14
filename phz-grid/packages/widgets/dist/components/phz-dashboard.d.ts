/**
 * @phozart/widgets — Dashboard Renderer
 *
 * Renders a full dashboard from config: resolves layout, positions widgets in CSS grid.
 * When `data` is provided, auto-hydrates widgets via the engine widget resolver.
 * Supports both legacy DashboardConfig and EnhancedDashboardConfig (detected via `version` field).
 * This is an embeddable component, not a standalone app.
 */
import { LitElement } from 'lit';
import type { DashboardConfig, BIEngine, KPIScoreProvider, EnhancedDashboardConfig, FilterAdapter } from '@phozart/engine';
import type { SelectionContext } from '@phozart/core';
import './phz-kpi-card.js';
import './phz-kpi-scorecard.js';
import './phz-bar-chart.js';
import './phz-trend-line.js';
import './phz-bottom-n.js';
import './phz-status-table.js';
import './phz-drill-link.js';
import './phz-widget.js';
export declare class PhzDashboard extends LitElement {
    static styles: import("lit").CSSResult[];
    config?: DashboardConfig | EnhancedDashboardConfig;
    engine?: BIEngine;
    selectionContext?: SelectionContext;
    data?: Record<string, unknown>[];
    scoreProvider?: KPIScoreProvider;
    /** Optional FilterAdapter for unified CriteriaEngine-based filtering. */
    filterAdapter?: FilterAdapter;
    loading: boolean;
    error: string | null;
    private refreshTimer?;
    private resolvedWidgets?;
    private globalFilterValues;
    private filterUnsubscribe?;
    connectedCallback(): void;
    disconnectedCallback(): void;
    willUpdate(changed: Map<string, unknown>): void;
    private setupFilterSubscription;
    private get isEnhanced();
    private get legacyConfig();
    /**
     * Get the data filtered through the FilterAdapter (if available),
     * falling back to the legacy globalFilterValues approach.
     */
    private getFilteredData;
    private resolveWidgets;
    private applyGlobalFilterValues;
    private setupAutoRefresh;
    private handleWidgetClick;
    /** Get a copy of the current config for external use */
    getConfig(): DashboardConfig | EnhancedDashboardConfig | undefined;
    /** Emit dashboard-save event with current config */
    save(): void;
    private renderWidget;
    private renderEnhancedGlobalFilters;
    private handleRetry;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-dashboard': PhzDashboard;
    }
}
//# sourceMappingURL=phz-dashboard.d.ts.map