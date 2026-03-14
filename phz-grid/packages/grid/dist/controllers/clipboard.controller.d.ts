import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { ColumnDefinition, RowData, RowId } from '@phozart/core';
import type { ToastController } from './toast.controller.js';
export interface ClipboardHost extends ReactiveControllerHost {
    visibleRows: RowData[];
    columnDefs: ColumnDefinition[];
    selectedRowIds: Set<RowId>;
    copyHeaders: boolean;
    copyFormatted: boolean;
    maxCopyRows: number;
    excludeFieldsFromCopy: string[];
    dateFormats: Record<string, string>;
    cellRangeAnchor: {
        rowIndex: number;
        colIndex: number;
    } | null;
    cellRangeEnd: {
        rowIndex: number;
        colIndex: number;
    } | null;
    toast: ToastController;
}
export declare class ClipboardController implements ReactiveController {
    private host;
    constructor(host: ClipboardHost);
    hostConnected(): void;
    hostDisconnected(): void;
    copyCell(rowId: RowId, field: string): void;
    copyRow(rowId: RowId): void;
    copyCellRange(includeHeaders: boolean): void;
    copySelectedRows(includeHeaders: boolean): void;
}
//# sourceMappingURL=clipboard.controller.d.ts.map