/**
 * @phozart/widgets — Bar Chart
 *
 * Horizontal ranked bars with value labels and optional volume indicator.
 * Supports simple (single-series), stacked, and grouped modes.
 */
import { LitElement } from 'lit';
import type { ChartDataSeries } from '@phozart/engine';
export interface MultiSeriesDataPoint {
    label: string;
    values: Record<string, number>;
}
export interface StackedSegment {
    series: string;
    value: number;
    offset: number;
    color: string;
}
export interface GroupedBar {
    series: string;
    value: number;
    index: number;
    color: string;
}
export interface LegendItem {
    series: string;
    color: string;
}
export declare function computeStackedSegments(point: MultiSeriesDataPoint, seriesNames: string[], colors: string[]): StackedSegment[];
export declare function computeGroupedBars(point: MultiSeriesDataPoint, seriesNames: string[], colors: string[]): GroupedBar[];
export declare function computeStackedTotal(point: MultiSeriesDataPoint): number;
export declare function generateLegendItems(seriesNames: string[], colors: string[]): LegendItem[];
export declare class PhzBarChart extends LitElement {
    static styles: import("lit").CSSResult[];
    /** Single-series data (simple mode). */
    data?: ChartDataSeries;
    /** Multi-series data for stacked/grouped modes. */
    multiSeriesData?: MultiSeriesDataPoint[];
    /** Bar chart mode. */
    mode: 'simple' | 'stacked' | 'grouped';
    /** Series names for multi-series modes. Inferred from first data point if not set. */
    seriesNames?: string[];
    /** Chart title override for multi-series mode. */
    chartTitle?: string;
    rankOrder: 'asc' | 'desc';
    showVolume: boolean;
    maxBars: number;
    loading: boolean;
    error: string | null;
    /** Custom bar/series colors. Falls back to DEFAULT_SERIES_COLORS in multi-series mode. */
    colors: string[];
    private tooltipContent;
    private tooltipVisible;
    private tooltipStyle;
    private get effectiveColors();
    private get effectiveSeriesNames();
    private get isMultiSeries();
    private get sortedData();
    private get sortedMultiData();
    private handleBarClick;
    private handleSegmentClick;
    private handleBarHover;
    private handleMultiBarHover;
    private handleBarLeave;
    private handleRetry;
    render(): import("lit-html").TemplateResult<1>;
    private renderSimple;
    private renderMultiSeries;
    private renderStacked;
    private renderGrouped;
    private renderLegend;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-bar-chart': PhzBarChart;
    }
}
//# sourceMappingURL=phz-bar-chart.d.ts.map