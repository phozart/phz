/**
 * @phozart/phz-widgets — Trend Line
 *
 * SVG line chart with optional target reference line and status zones.
 */
import { LitElement } from 'lit';
import type { ChartDataSeries, KPIDefinition } from '@phozart/phz-engine';
export declare class PhzTrendLine extends LitElement {
    static styles: import("lit").CSSResult[];
    data?: ChartDataSeries;
    target?: number;
    periods: number;
    kpiDefinition?: KPIDefinition;
    /** Line color. Falls back to default blue (#3B82F6). */
    lineColor: string;
    /** Target line color. Falls back to default gray (#78716C). */
    targetColor: string;
    loading: boolean;
    error: string | null;
    private tooltipContent;
    private tooltipVisible;
    private tooltipStyle;
    private get chartPoints();
    private handlePointClick;
    private handlePointHover;
    private handlePointLeave;
    private handleRetry;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-trend-line': PhzTrendLine;
    }
}
//# sourceMappingURL=phz-trend-line.d.ts.map