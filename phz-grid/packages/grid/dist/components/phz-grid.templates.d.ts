/**
 * Extracted render templates for phz-grid.
 * These are pure template functions that take data parameters
 * and return Lit TemplateResult.
 */
import { type TemplateResult } from 'lit';
import type { ColumnDefinition, RowData, RowGroup } from '@phozart/phz-core';
import type { RowAction } from '../types.js';
import type { AggregationController } from '../controllers/aggregation.controller.js';
type AggregationFn = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'none';
export interface TitleBarOpts {
    titleBarBg: string;
    titleBarText: string;
    titleFontFamily: string;
    titleIcon: string;
    titleFontSize: number;
    gridTitle: string;
    gridSubtitle: string;
    subtitleFontSize: number;
    totalRowCount: number;
    filteredRowCount?: number;
}
export declare function renderTitleBar(opts: TitleBarOpts): TemplateResult;
export interface PaginationOpts {
    filteredRowCount: number;
    currentPage: number;
    totalPages: number;
    pageSize: number;
    pageSizeOptions: number[];
    align?: 'left' | 'center' | 'right';
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}
export declare function renderPagination(opts: PaginationOpts): TemplateResult;
export interface GroupedRowsOpts {
    groups: RowGroup[];
    columnDefs: ColumnDefinition[];
    groupTotals: boolean;
    groupTotalsFn: AggregationFn;
    groupTotalsOverrides: Record<string, AggregationFn>;
    aggCtrl: AggregationController;
    renderRow: (row: RowData, rowIdx: number) => TemplateResult;
}
export declare function renderGroupedRows(opts: GroupedRowsOpts): TemplateResult;
export interface ColumnGroupHeaderOpts {
    showCheckboxes: boolean;
    showRowActions: boolean;
    effectiveRowActions: RowAction[];
    columnGroups: Array<{
        header: string;
        children: string[];
    }>;
    columnDefs: ColumnDefinition[];
}
export declare function renderColumnGroupHeader(opts: ColumnGroupHeaderOpts): TemplateResult;
export {};
//# sourceMappingURL=phz-grid.templates.d.ts.map