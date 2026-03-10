/**
 * @phozart/phz-widgets — Standalone Widget Renderer
 *
 * Renders a single widget from an EnhancedWidgetConfig + raw data.
 * Processes data via the widget data processor, then renders the appropriate component.
 * For embedding individual widgets outside a dashboard.
 */
import { LitElement } from 'lit';
import type { EnhancedWidgetConfig, BIEngine, KPIScoreProvider } from '@phozart/phz-engine';
import './phz-kpi-card.js';
import './phz-kpi-scorecard.js';
import './phz-bar-chart.js';
import './phz-trend-line.js';
import './phz-bottom-n.js';
import './phz-status-table.js';
import './phz-drill-link.js';
export declare class PhzWidget extends LitElement {
    static styles: import("lit").CSSResult[];
    config?: EnhancedWidgetConfig;
    data: Record<string, unknown>[];
    engine?: BIEngine;
    scoreProvider?: KPIScoreProvider;
    loading: boolean;
    error: string | null;
    private renderWidgetContent;
    private handleRetry;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-widget': PhzWidget;
    }
}
//# sourceMappingURL=phz-widget.d.ts.map