import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { GridApi, RowData, RowId, ColumnDefinition } from '@phozart/phz-core';
export interface SelectionHost extends ReactiveControllerHost, EventTarget {
    gridApi: GridApi | null;
    selectionMode: 'none' | 'single' | 'multi' | 'range';
    visibleRows: RowData[];
    columnDefs: ColumnDefinition[];
}
export declare class SelectionController implements ReactiveController {
    private host;
    selectedRowIds: Set<RowId>;
    lastClickedRowId: RowId | null;
    cellRangeAnchor: {
        rowIndex: number;
        colIndex: number;
    } | null;
    cellRangeEnd: {
        rowIndex: number;
        colIndex: number;
    } | null;
    isDraggingRange: boolean;
    constructor(host: SelectionHost);
    hostConnected(): void;
    hostDisconnected(): void;
    toggleRowSelection(row: RowData): void;
    handleRowClick(e: MouseEvent, row: RowData): void;
    handleCellMouseDown(e: MouseEvent, rowIdx: number, colIdx: number): void;
    handleCellMouseMove(_e: MouseEvent, rowIdx: number, colIdx: number): void;
    handleCellMouseUp(): void;
    isCellInRange(rowIdx: number, colIdx: number): boolean;
    getCellRangeCount(): number;
    clearCellRange(): void;
    extendCellRange(direction: 'up' | 'down' | 'left' | 'right', rowCount: number, colCount: number, focusedPosition?: {
        rowIndex: number;
        columnIndex: number;
    }): void;
    syncFromGridState(selectedRows: RowId[]): void;
}
//# sourceMappingURL=selection.controller.d.ts.map