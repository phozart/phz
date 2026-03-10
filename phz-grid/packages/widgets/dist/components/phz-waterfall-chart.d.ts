/**
 * @phozart/phz-widgets — Waterfall Chart
 *
 * SVG waterfall chart showing increases, decreases, and totals with
 * connecting lines, running totals, tooltips, and SR accessibility.
 */
import { LitElement } from 'lit';
export interface WaterfallDatum {
    label: string;
    value: number;
    type: 'increase' | 'decrease' | 'total';
}
export interface WaterfallBar {
    label: string;
    value: number;
    type: 'increase' | 'decrease' | 'total';
    start: number;
    end: number;
    color: string;
}
export declare const WATERFALL_COLORS: Record<string, string>;
export declare function computeWaterfallBars(data: WaterfallDatum[], colors?: Record<string, string>): WaterfallBar[];
export declare function computeWaterfallBounds(bars: WaterfallBar[]): {
    min: number;
    max: number;
};
export declare function buildWaterfallAccessibleDescription(bars: WaterfallBar[]): string;
export declare class PhzWaterfallChart extends LitElement {
    static styles: import("lit").CSSResult[];
    data: WaterfallDatum[];
    colors: Record<string, string>;
    title: string;
    loading: boolean;
    error: string | null;
    private tooltipContent;
    private tooltipVisible;
    private tooltipStyle;
    private handleBarClick;
    private handleBarHover;
    private handleBarLeave;
    private handleRetry;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-waterfall-chart': PhzWaterfallChart;
    }
}
//# sourceMappingURL=phz-waterfall-chart.d.ts.map