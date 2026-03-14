/**
 * @phozart/widgets — Line Chart
 *
 * SVG-based multi-series line chart with axes, gridlines, legend, and tooltips.
 * Supports time, linear, and category x-axis types.
 */
import { LitElement } from 'lit';
export interface LineChartPoint {
    x: number | string;
    y: number;
}
export interface LineChartSeries {
    label: string;
    points: LineChartPoint[];
    color?: string;
}
export declare class PhzLineChart extends LitElement {
    static styles: import("lit").CSSResult[];
    data: LineChartSeries[];
    showGrid: boolean;
    showAxis: boolean;
    showLegend: boolean;
    xAxisType: 'time' | 'linear' | 'category';
    title: string;
    loading: boolean;
    error: string | null;
    private tooltipContent;
    private tooltipVisible;
    private tooltipStyle;
    private hiddenSeries;
    private get visibleSeries();
    private get yScale();
    private seriesColor;
    private toggleSeries;
    private handlePointClick;
    private handlePointHover;
    private handlePointLeave;
    private handleRetry;
    private buildAccessibleTable;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-line-chart': PhzLineChart;
    }
}
//# sourceMappingURL=phz-line-chart.d.ts.map