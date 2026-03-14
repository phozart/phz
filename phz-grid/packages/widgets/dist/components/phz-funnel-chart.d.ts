/**
 * @phozart/widgets — Funnel Chart
 *
 * SVG funnel visualization with stage labels, conversion rates,
 * percentages, tooltips, and SR accessibility.
 */
import { LitElement } from 'lit';
export interface FunnelDatum {
    stage: string;
    value: number;
    color?: string;
}
export interface FunnelStage {
    stage: string;
    value: number;
    percentage: number;
    conversionRate: number | null;
    widthPercent: number;
    color: string;
}
export declare const FUNNEL_PALETTE: string[];
export declare function computeFunnelStages(data: FunnelDatum[], palette?: string[]): FunnelStage[];
export declare function computeOverallConversion(data: FunnelDatum[]): number;
export declare function buildFunnelAccessibleDescription(stages: FunnelStage[]): string;
export declare class PhzFunnelChart extends LitElement {
    static styles: import("lit").CSSResult[];
    data: FunnelDatum[];
    showLabels: boolean;
    showPercentage: boolean;
    title: string;
    loading: boolean;
    error: string | null;
    private tooltipContent;
    private tooltipVisible;
    private tooltipStyle;
    private handleStageClick;
    private handleStageHover;
    private handleStageLeave;
    private handleRetry;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-funnel-chart': PhzFunnelChart;
    }
}
//# sourceMappingURL=phz-funnel-chart.d.ts.map