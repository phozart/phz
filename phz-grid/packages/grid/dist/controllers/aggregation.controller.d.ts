import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { ColumnDefinition, RowData } from '@phozart/core';
type AggregationFn = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'none';
export interface AggregationHost extends ReactiveControllerHost {
    filteredRows: RowData[];
}
export declare class AggregationController implements ReactiveController {
    private host;
    constructor(host: AggregationHost);
    hostConnected(): void;
    hostDisconnected(): void;
    computeColumnAgg(rows: Record<string, unknown>[], col: ColumnDefinition, fn: AggregationFn): string;
    /**
     * Compute a summary row for all visible columns.
     * Returns a map of field -> formatted aggregation value.
     */
    computeSummaryRow(rows: Record<string, unknown>[], columns: ColumnDefinition[], fn: AggregationFn): Record<string, string>;
    static getSummaryLabel(fn: AggregationFn): string;
}
export {};
//# sourceMappingURL=aggregation.controller.d.ts.map