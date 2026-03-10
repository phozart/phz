/**
 * @phozart/phz-widgets — KPI Scorecard
 *
 * Matrix: KPIs (rows) x breakdowns (columns) with status cells.
 */
import { LitElement } from 'lit';
import type { KPIDefinition, KPIScoreResponse } from '@phozart/phz-engine';
export declare class PhzKPIScorecard extends LitElement {
    static styles: import("lit").CSSResult[];
    kpiDefinitions: KPIDefinition[];
    scores: KPIScoreResponse[];
    expandable: boolean;
    expandedWidgets?: string[];
    loading: boolean;
    error: string | null;
    private expandedKPIs;
    private tooltipContent;
    private tooltipVisible;
    private tooltipStyle;
    private get classifiedScores();
    private get breakdownLabels();
    private get statusSummary();
    private toggleExpand;
    private renderStatusCell;
    private handleRetry;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-kpi-scorecard': PhzKPIScorecard;
    }
}
//# sourceMappingURL=phz-kpi-scorecard.d.ts.map