import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { ColumnDefinition, RowData } from '@phozart/core';
export interface ComputedColumnDef {
    field: string;
    header: string;
    formula: (row: RowData) => unknown;
}
export interface ComputedColumnsHost extends ReactiveControllerHost {
    columnDefs: ColumnDefinition[];
    visibleRows: RowData[];
    setColumnDefs(defs: ColumnDefinition[]): void;
}
export declare class ComputedColumnsController implements ReactiveController {
    private host;
    constructor(host: ComputedColumnsHost);
    hostConnected(): void;
    hostDisconnected(): void;
    applyComputedColumns(computedColumns: ComputedColumnDef[]): void;
}
//# sourceMappingURL=computed-columns.controller.d.ts.map