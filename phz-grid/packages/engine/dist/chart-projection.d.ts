/**
 * @phozart/engine — Chart Data Projection
 *
 * Projects row data into chart-ready data series.
 */
import type { ChartConfig } from '@phozart/core';
export interface ChartDataPoint {
    x: string | number;
    y: number;
    label?: string;
}
export interface ChartDataSeries {
    field: string;
    label: string;
    data: ChartDataPoint[];
}
export interface PieSlice {
    category: string;
    value: number;
    percentage: number;
}
/**
 * Project rows into chart data series based on config.
 * One series per config.options.series entry.
 */
export declare function projectChartData(rows: Record<string, unknown>[], config: ChartConfig): ChartDataSeries[];
/**
 * Project rows grouped by a dimension, aggregating a value field.
 * Useful for bar charts by category.
 */
export declare function projectAggregatedChartData(rows: Record<string, unknown>[], config: ChartConfig, groupField: string): ChartDataSeries[];
/**
 * Project rows into pie chart slices.
 */
export declare function projectPieData(rows: Record<string, unknown>[], categoryField: string, valueField: string, aggregation?: 'sum' | 'count'): PieSlice[];
//# sourceMappingURL=chart-projection.d.ts.map