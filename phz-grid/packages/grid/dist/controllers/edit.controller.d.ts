import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { GridApi, ColumnDefinition, RowData, RowId } from '@phozart/core';
import type { ToastController } from './toast.controller.js';
export interface EditingCell {
    rowId: RowId;
    field: string;
    value: unknown;
}
export interface EditHost extends ReactiveControllerHost {
    gridApi: GridApi | null;
    columnDefs: ColumnDefinition[];
    toast: ToastController;
}
export declare class EditController implements ReactiveController {
    private host;
    editingCell: EditingCell | null;
    editValue: string;
    constructor(host: EditHost);
    hostConnected(): void;
    hostDisconnected(): void;
    startInlineEdit(row: RowData, field: string): void;
    commitInlineEdit(rawValue: string): void;
    cancelInlineEdit(): void;
    isEditing(rowId: RowId, field: string): boolean;
}
//# sourceMappingURL=edit.controller.d.ts.map