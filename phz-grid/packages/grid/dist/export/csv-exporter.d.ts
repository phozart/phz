/**
 * @phozart/grid — CSV Exporter
 *
 * Exports grid data to CSV format. Respects current sort/filter state
 * (exports what the user sees). Triggers browser download.
 */
import type { GridApi, ColumnDefinition, RowData, CriteriaExportMetadata, DataSetMeta } from '@phozart/core';
export interface ExportGroupRow {
    type: 'group-header' | 'data';
    label?: string;
    depth?: number;
    aggregations?: Record<string, string>;
    data?: RowData;
}
export interface CsvExportOptions {
    includeHeaders?: boolean;
    separator?: string;
    filename?: string;
    selectedOnly?: boolean;
    columns?: string[];
    columnGroups?: Array<{
        header: string;
        children: string[];
    }>;
    includeFormatting?: boolean;
    dateFormats?: Record<string, string>;
    numberFormats?: Record<string, {
        decimals?: number;
        display?: string;
        prefix?: string;
        suffix?: string;
    }>;
    columnTypes?: Record<string, string>;
    groupRows?: ExportGroupRow[];
    compactNumbers?: boolean;
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
/** Format a number in compact form: 1234 → 1.2K, 1500000 → 1.5M, 2000000000 → 2B */
export declare function formatCompactNumber(n: number): string;
export declare function exportToCSV(gridApi: GridApi, columnDefs: ColumnDefinition[], options?: CsvExportOptions): string;
export declare function downloadCSV(gridApi: GridApi, columnDefs: ColumnDefinition[], options?: CsvExportOptions): void;
//# sourceMappingURL=csv-exporter.d.ts.map