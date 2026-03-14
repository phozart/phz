/**
 * @phozart/widgets — Pie / Donut Chart
 *
 * SVG-based pie and donut chart with legend, tooltips, and keyboard navigation.
 */
import { LitElement } from 'lit';
export interface PieChartDatum {
    label: string;
    value: number;
    color?: string;
}
export declare class PhzPieChart extends LitElement {
    static styles: import("lit").CSSResult[];
    data: PieChartDatum[];
    donut: boolean;
    showLegend: boolean;
    showLabels: boolean;
    title: string;
    loading: boolean;
    error: string | null;
    private tooltipContent;
    private tooltipVisible;
    private tooltipStyle;
    private focusedIndex;
    private get computedSlices();
    private handleSliceClick;
    private handleSliceHover;
    private handleSliceLeave;
    private handleKeyDown;
    private focusSlice;
    private handleRetry;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-pie-chart': PhzPieChart;
    }
}
//# sourceMappingURL=phz-pie-chart.d.ts.map