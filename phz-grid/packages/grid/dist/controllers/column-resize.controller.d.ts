import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { GridApi, ColumnDefinition } from '@phozart/core';
export interface ColumnResizeHost extends ReactiveControllerHost {
    gridApi: GridApi | null;
    columnDefs: ColumnDefinition[];
    visibleRows: import('@phozart/core').RowData[];
}
export declare class ColumnResizeController implements ReactiveController {
    private host;
    constructor(host: ColumnResizeHost);
    hostConnected(): void;
    hostDisconnected(): void;
    startResize(e: MouseEvent, field: string): void;
    autoFitColumn(e: MouseEvent, field: string): void;
    autoSizeAllColumns(): void;
}
//# sourceMappingURL=column-resize.controller.d.ts.map