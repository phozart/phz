import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { GridApi, ColumnDefinition, RowData, RowId, SortDirection } from '@phozart/phz-core';
import type { MenuItem } from '../components/phz-context-menu.js';
import type { RowAction, FilterInfo } from '../types.js';
export interface ContextMenuCommands {
    sort(field: string, dir: 'asc' | 'desc' | null): void;
    announceSort(field: string, dir?: string): void;
    openFilter(field: string): void;
    removeFilter(field: string): void;
    hideColumn(field: string): void;
    autoFitColumn(field: string): void;
    groupBy(field: string): void;
    ungroupBy(): void;
    openChart(field: string): void;
    detectAnomalies(field: string): void;
    openColumnChooser(): void;
    exportCSV(): void;
    exportExcel(): void;
    copyCell(rowId: RowId, field: string): void;
    copyRow(rowId: RowId): void;
    copyCellRange(includeHeaders: boolean): void;
    copySelectedRows(includeHeaders: boolean): void;
    selectRow(rowId: RowId): void;
    selectAll(): void;
    handleRowAction(actionId: string, row: RowData): void;
}
export interface ContextMenuHost extends ReactiveControllerHost, EventTarget {
    gridApi: GridApi | null;
    columnDefs: ColumnDefinition[];
    visibleRows: RowData[];
    sortColumns: Array<{
        field: string;
        direction: SortDirection;
    }>;
    activeFilters: Map<string, FilterInfo>;
    isGrouped: boolean;
    selectedRowIds: Set<RowId>;
    cellRangeAnchor: {
        rowIndex: number;
        colIndex: number;
    } | null;
    cellRangeEnd: {
        rowIndex: number;
        colIndex: number;
    } | null;
    effectiveRowActions: RowAction[];
    copyHeaders: boolean;
    copyFormatted: boolean;
    dateFormats: Record<string, string>;
    commands: ContextMenuCommands;
}
export declare class ContextMenuController implements ReactiveController {
    private host;
    ctxMenuOpen: boolean;
    ctxMenuX: number;
    ctxMenuY: number;
    ctxMenuItems: MenuItem[];
    ctxMenuSource: 'header' | 'body';
    ctxMenuField: string;
    ctxMenuRowId: RowId | null;
    constructor(host: ContextMenuHost);
    hostConnected(): void;
    hostDisconnected(): void;
    handleHeaderContextMenu(e: MouseEvent, col: ColumnDefinition): void;
    showHeaderContextMenu(x: number, y: number, col: ColumnDefinition): void;
    handleBodyContextMenu(e: MouseEvent, row: RowData): void;
    handleContextMenuSelect(id: string): void;
    close(): void;
    private getCellRangeCount;
}
//# sourceMappingURL=context-menu.controller.d.ts.map