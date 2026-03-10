/**
 * @phozart/phz-widgets — KPI Card
 *
 * Single KPI display with value, status badge, delta, and optional sparkline.
 */
import { LitElement } from 'lit';
import type { KPIDefinition } from '@phozart/phz-engine';
import type { SelectionContext } from '@phozart/phz-core';
export declare class PhzKPICard extends LitElement {
    static styles: import("lit").CSSResult[];
    kpiDefinition?: KPIDefinition;
    value: number;
    previousValue?: number;
    trendData?: number[];
    cardStyle: 'compact' | 'expanded' | 'minimal';
    selectionContext?: SelectionContext;
    loading: boolean;
    error: string | null;
    private tooltipContent;
    private tooltipVisible;
    /** KPI appearance overrides from widget config. */
    kpiAppearance?: {
        valueSize?: number;
        layout?: 'vertical' | 'horizontal';
        alignment?: 'left' | 'center' | 'right';
        showTrend?: boolean;
        showTarget?: boolean;
        showSparkline?: boolean;
    };
    private get status();
    private get delta();
    private formatValue;
    private renderStatusBadge;
    private renderDelta;
    private renderSparkline;
    private handleRetry;
    private get valueTooltip();
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-kpi-card': PhzKPICard;
    }
}
//# sourceMappingURL=phz-kpi-card.d.ts.map