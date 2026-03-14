/**
 * @phozart/grid — Excel (XLSX) Exporter
 *
 * Generates XLSX files using OpenXML format without external dependencies.
 * Preserves column types (numbers as numbers, dates as dates).
 */
import type { GridApi, ColumnDefinition, RowData, CriteriaExportMetadata, DataSetMeta } from '@phozart/core';
import { type ExportGroupRow } from './csv-exporter.js';
export interface CellFormatting {
    bgColor?: string;
    textColor?: string;
    bold?: boolean;
    italic?: boolean;
}
export interface ExcelExportOptions {
    sheetName?: string;
    filename?: string;
    includeHeaders?: boolean;
    selectedOnly?: boolean;
    columns?: string[];
    columnGroups?: Array<{
        header: string;
        children: string[];
    }>;
    /** Per-column static formatting */
    columnFormatting?: Record<string, CellFormatting>;
    /** Color threshold rules (field → array of {operator, value, bgColor, textColor}) */
    colorThresholds?: Record<string, Array<{
        operator: string;
        value: unknown;
        bgColor?: string;
        textColor?: string;
    }>>;
    /** Include formatting in export */
    includeFormatting?: boolean;
    dateFormats?: Record<string, string>;
    numberFormats?: Record<string, {
        decimals?: number;
        display?: string;
        prefix?: string;
        suffix?: string;
    }>;
    statusColors?: Record<string, {
        bg: string;
        color: string;
    }>;
    barThresholds?: Array<{
        min: number;
        color: string;
    }>;
    columnTypes?: Record<string, string>;
    groupRows?: ExportGroupRow[];
    /** Grid line mode for border export */
    gridLines?: 'none' | 'horizontal' | 'vertical' | 'both';
    /** Grid line color for border export */
    gridLineColor?: string;
    /** Compact number formatting */
    compactNumbers?: boolean;
    /** Criteria metadata for header rows */
    criteriaMetadata?: CriteriaExportMetadata;
    /** DataSet metadata — auto-populates source/date header rows when present. */
    dataSetMeta?: DataSetMeta;
    /** Fields to exclude from export (e.g., restricted columns). */
    excludeFields?: Set<string>;
    /** Mask functions for sensitive columns — value is replaced with mask output. */
    maskFields?: Map<string, (value: unknown) => string>;
    /** Pre-filtered rows to export (overrides gridApi.getSortedRowModel().rows).
     *  Use when client-side search filter should be respected in exports. */
    rows?: RowData[];
}
/** Evaluate whether a cell value matches a threshold condition */
export declare function matchesThreshold(value: unknown, operator: string, threshold: unknown): boolean;
interface StyleEntry {
    fillColor?: string;
    textColor?: string;
    bold?: boolean;
    borderId?: number;
}
export interface BorderDef {
    left?: {
        style: string;
        color: string;
    };
    right?: {
        style: string;
        color: string;
    };
    top?: {
        style: string;
        color: string;
    };
    bottom?: {
        style: string;
        color: string;
    };
}
export declare class StyleRegistry {
    private fills;
    private fillIndexMap;
    private fonts;
    private fontIndexMap;
    private borders;
    private borderIndexMap;
    private xfs;
    private xfIndexMap;
    getOrCreateBorderId(border: BorderDef): number;
    getOrCreateStyleIndex(entry: StyleEntry): number;
    private getOrCreateFillId;
    private getOrCreateFontId;
    private renderBorderSide;
    buildStylesXml(): string;
}
export declare function exportToExcel(gridApi: GridApi, columnDefs: ColumnDefinition[], options?: ExcelExportOptions): Blob;
export declare function downloadExcel(gridApi: GridApi, columnDefs: ColumnDefinition[], options?: ExcelExportOptions): void;
export {};
//# sourceMappingURL=excel-exporter.d.ts.map