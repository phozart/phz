import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { GridApi, ColumnDefinition } from '@phozart/phz-core';
import type { RowGroup } from '@phozart/phz-core';
import { type CellFormatting } from '../export/excel-exporter.js';
import type { ToastController } from './toast.controller.js';
import type { DataSetMeta } from '@phozart/phz-core';
type AggregationFn = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'none';
export interface ExportHost extends ReactiveControllerHost {
    gridApi: GridApi | null;
    columnDefs: ColumnDefinition[];
    columnGroups: Array<{
        header: string;
        children: string[];
    }>;
    isGrouped: boolean;
    groups: RowGroup[];
    aggregationFn: AggregationFn;
    dateFormats: Record<string, string>;
    numberFormats: Record<string, {
        decimals?: number;
        display?: string;
        prefix?: string;
        suffix?: string;
    }>;
    compactNumbers: boolean;
    statusColors: Record<string, {
        bg: string;
        color: string;
        dot: string;
    }>;
    barThresholds: Array<{
        min: number;
        color: string;
    }>;
    gridLines: string;
    gridLineColor: string;
    toast: ToastController;
    _dataSetMeta?: DataSetMeta;
    filteredRowCount: number;
}
export declare class ExportController implements ReactiveController {
    private host;
    exportIncludeFormatting: boolean;
    exportIncludeGroupHeaders: boolean;
    constructor(host: ExportHost);
    hostConnected(): void;
    hostDisconnected(): void;
    exportCSV(options?: {
        filename?: string;
        selectedOnly?: boolean;
        includeFormatting?: boolean;
        includeGroupHeaders?: boolean;
        columnFormatting?: Record<string, CellFormatting>;
        colorThresholds?: Record<string, Array<{
            operator: string;
            value: unknown;
            bgColor?: string;
            textColor?: string;
        }>>;
    }): void;
    exportExcel(options?: {
        filename?: string;
        selectedOnly?: boolean;
        sheetName?: string;
        includeFormatting?: boolean;
        includeGroupHeaders?: boolean;
        columnFormatting?: Record<string, CellFormatting>;
        colorThresholds?: Record<string, Array<{
            operator: string;
            value: unknown;
            bgColor?: string;
            textColor?: string;
        }>>;
    }): void;
    private buildExportGroupRows;
    computeGroupColumnAgg(rows: Record<string, unknown>[], col: ColumnDefinition, fn: AggregationFn): string;
}
export {};
//# sourceMappingURL=export.controller.d.ts.map