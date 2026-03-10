/**
 * @phozart/phz-widgets — Scatter / Bubble Chart
 *
 * SVG-based scatter plot with optional bubble mode (size mapped to third dimension).
 * Supports grid, axes, tooltips, keyboard navigation, and SR data table fallback.
 */
import { LitElement } from 'lit';
export interface ScatterDataPoint {
    x: number;
    y: number;
    size?: number;
    color?: string;
    label?: string;
}
interface ScaleResult {
    min: number;
    max: number;
    ticks: number[];
}
export declare function computeNiceScale(min: number, max: number, targetTicks?: number): ScaleResult;
export declare function scalePoint(point: ScatterDataPoint, xScale: ScaleResult, yScale: ScaleResult): {
    px: number;
    py: number;
};
export declare function computeBubbleRadius(size: number | undefined, allSizes: number[], minR?: number, maxR?: number): number;
export declare function buildAccessibleDescription(data: ScatterDataPoint[]): string;
export declare class PhzScatterChart extends LitElement {
    static styles: import("lit").CSSResult[];
    data: ScatterDataPoint[];
    showGrid: boolean;
    showAxis: boolean;
    title: string;
    loading: boolean;
    error: string | null;
    private tooltipContent;
    private tooltipVisible;
    private tooltipStyle;
    private get xScale();
    private get yScale();
    private get allSizes();
    private get isBubble();
    private handlePointClick;
    private handlePointHover;
    private handlePointLeave;
    private handleRetry;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-scatter-chart': PhzScatterChart;
    }
}
export {};
//# sourceMappingURL=phz-scatter-chart.d.ts.map