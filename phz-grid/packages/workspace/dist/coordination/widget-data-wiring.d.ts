/**
 * widget-data-wiring — Bridges widget configurations to DataAdapter execution.
 *
 * Task 3.1: Widget data subscription pattern
 * Task 3.2: Build DataQuery from widget data config → DataAdapter.execute()
 * Task 3.3: Real KPI data resolution (replaces synthetic previousValue)
 * Task 3.4: Auto-refresh handled by pipeline-filter-wiring (filter subscription)
 * Task 3.5: Loading/error state resolution per widget
 * Task 3.6: Empty state detection
 *
 * Tasks: 3.1-3.6 (WB-013 through WB-017, WB-027)
 */
import type { DataAdapter, DataQuery, DataResult } from '../data-adapter.js';
/** Inline filter type for widget data inputs (maps to DataQuery.filters). */
interface WidgetFilter {
    field: string;
    operator: string;
    value: unknown;
}
export interface WidgetDataInput {
    dataSourceId: string;
    dimensions: Array<{
        field: string;
    }>;
    measures: Array<{
        field: string;
        aggregation: string;
    }>;
    filters?: WidgetFilter[];
    limit?: number;
}
/**
 * Build a DataQuery from a widget's data configuration.
 * Maps dimensions → fields + groupBy, measures → fields + aggregations.
 */
export declare function buildWidgetQuery(input: WidgetDataInput): DataQuery;
export interface WidgetDataResult {
    rows: unknown[][];
    columns: Array<{
        name: string;
        dataType: string;
    }>;
    totalRows: number;
    error?: string;
}
/**
 * Fetch data for a widget by building a DataQuery and calling DataAdapter.execute().
 * Returns a normalized result with error handling.
 */
export declare function fetchWidgetData(adapter: DataAdapter, input: WidgetDataInput): Promise<WidgetDataResult>;
export type WidgetLoadingStatus = 'loading' | 'error' | 'empty' | 'ready';
export interface WidgetLoadingState {
    status: WidgetLoadingStatus;
    errorMessage?: string;
}
export interface WidgetStateInput {
    loading: boolean;
    error?: string;
    data?: DataResult;
}
/**
 * Resolve the visual state for a widget based on its loading/data state.
 * Priority: loading > error > empty > ready.
 */
export declare function resolveWidgetLoadingState(input: WidgetStateInput): WidgetLoadingState;
export interface KPIDataInput {
    currentValue: number;
    previousValue?: number;
    target?: number;
    unit: string;
}
export interface KPIResolvedData {
    value: number;
    previousValue?: number;
    target?: number;
    deltaPercent?: number;
    deltaDirection?: 'up' | 'down' | 'flat';
    unit: string;
}
/**
 * Resolve KPI display data from real DataAdapter results.
 * Computes delta percentage and direction from actual current/previous values
 * instead of using synthetic `previousValue = value * 0.95`.
 */
export declare function resolveKPIWithRealData(input: KPIDataInput): KPIResolvedData;
export {};
//# sourceMappingURL=widget-data-wiring.d.ts.map