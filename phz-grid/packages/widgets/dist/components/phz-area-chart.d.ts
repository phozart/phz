/**
 * @phozart/widgets — Area Chart
 *
 * SVG area chart with optional stacking, gridlines, axes, and multi-series support.
 */
import { LitElement } from 'lit';
export interface AreaDataPoint {
    x: string | number;
    y: number;
}
export interface AreaSeries {
    name: string;
    data: AreaDataPoint[];
    color?: string;
}
export interface ScaledPoint {
    sx: number;
    sy: number;
    x: string | number;
    y: number;
}
export interface AreaChartPadding {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
export declare function scalePoints(data: AreaDataPoint[], minY: number, maxY: number, width: number, height: number, padding: AreaChartPadding): ScaledPoint[];
export declare function buildLinePath(points: ScaledPoint[]): string;
export declare function buildAreaPath(points: ScaledPoint[], baselineY: number): string;
export declare function computeStackedData(allSeries: AreaSeries[]): AreaSeries[];
export declare function computeYBounds(allSeries: AreaSeries[]): {
    min: number;
    max: number;
};
export declare class PhzAreaChart extends LitElement {
    static styles: import("lit").CSSResult[];
    data: AreaSeries[];
    stacked: boolean;
    showGrid: boolean;
    showAxis: boolean;
    opacity: number;
    chartTitle: string;
    loading: boolean;
    error: string | null;
    colors: string[];
    private tooltipContent;
    private tooltipVisible;
    private tooltipStyle;
    private get effectiveColors();
    private handlePointHover;
    private handlePointLeave;
    private handleRetry;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-area-chart': PhzAreaChart;
    }
}
//# sourceMappingURL=phz-area-chart.d.ts.map