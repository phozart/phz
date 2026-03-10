/**
 * @phozart/phz-workspace — Report Chart State
 *
 * Pure functions for managing chart toggle, chart type selection, and
 * visual encoding channels in the report editor.
 *
 * Chart types align with the WidgetType union from @phozart/phz-engine/widget
 * and the suggestChartType output from @phozart/phz-engine/explorer/chart-suggest.
 */
import type { FieldMetadata } from '@phozart/phz-shared';
export type ReportChartType = 'bar-chart' | 'line' | 'area' | 'pie' | 'scatter' | 'gauge' | 'kpi-card' | 'trend-line';
export type EncodingChannel = 'category' | 'value' | 'color' | 'size' | 'detail' | 'tooltip';
export interface ChartEncoding {
    category?: string;
    value: string[];
    color?: string;
    size?: string;
    detail?: string;
    tooltip: string[];
}
export interface ReportChartState {
    previewMode: 'table' | 'chart';
    chartType: ReportChartType;
    chartOverride?: ReportChartType;
    encoding: ChartEncoding;
    chartStyleOverrides?: Record<string, unknown>;
}
export declare function initialReportChartState(): ReportChartState;
export declare function setPreviewMode(state: ReportChartState, mode: ReportChartState['previewMode']): ReportChartState;
export declare function overrideChartType(state: ReportChartState, chartType: ReportChartType | undefined): ReportChartState;
export declare function getEffectiveChartType(state: ReportChartState): ReportChartType;
export declare function setEncoding(state: ReportChartState, channel: EncodingChannel, field: string): ReportChartState;
export declare function removeEncoding(state: ReportChartState, channel: EncodingChannel, field: string): ReportChartState;
export declare function autoMapColumnsToEncoding(state: ReportChartState, fields: readonly FieldMetadata[]): ReportChartState;
export declare function getChartTypeAvailability(encoding: ChartEncoding): Record<ReportChartType, boolean>;
//# sourceMappingURL=report-chart-state.d.ts.map