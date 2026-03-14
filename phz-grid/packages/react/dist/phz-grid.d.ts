/**
 * @phozart/react — PhzGrid React Component
 *
 * Wraps the <phz-grid> Web Component for React using @lit/react's
 * createComponent() for automatic property bridging. Event handlers
 * extract CustomEvent.detail for backward-compatible callback signatures.
 */
import React, { type ReactNode } from 'react';
import type { GridApi, ColumnDefinition, ConditionalFormattingRule, CellClickEvent, CellDoubleClickEvent, SelectionChangeEvent, SortChangeEvent, FilterChangeEvent, CellEditStartEvent, CellEditCommitEvent, CellEditCancelEvent, ScrollEvent, StateChangeEvent, QueryBackend, ProgressiveLoadConfig, DataSet, AsyncDataSource, DrillThroughConfig, GridRowDrillSource, GenerateDashboardConfig, ColumnFormatting } from '@phozart/core';
import { type RowAction, type ComputedColumnDef, type ColumnProfile, type RowActionEventDetail, type GenerateDashboardEventDetail } from '@phozart/grid';
export interface PhzGridProps {
    data: readonly unknown[];
    columns: readonly ColumnDefinition[];
    theme?: string;
    locale?: string;
    responsive?: boolean;
    virtualization?: boolean;
    selectionMode?: 'none' | 'single' | 'multi' | 'range';
    editMode?: 'none' | 'click' | 'dblclick' | 'manual';
    loading?: boolean;
    height?: string | number;
    width?: string | number;
    density?: 'comfortable' | 'compact' | 'dense';
    gridTitle?: string;
    gridSubtitle?: string;
    scrollMode?: 'paginate' | 'virtual';
    pageSize?: number;
    pageSizeOptions?: number[];
    showToolbar?: boolean;
    showDensityToggle?: boolean;
    showColumnEditor?: boolean;
    showAdminSettings?: boolean;
    showPagination?: boolean;
    paginationAlign?: 'left' | 'center' | 'right';
    showCheckboxes?: boolean;
    showRowActions?: boolean;
    showSelectionActions?: boolean;
    showEditActions?: boolean;
    showCopyActions?: boolean;
    rowBanding?: boolean;
    statusColors?: Record<string, {
        bg: string;
        color: string;
        dot: string;
    }>;
    barThresholds?: Array<{
        min: number;
        color: string;
    }>;
    dateFormats?: Record<string, string>;
    numberFormats?: Record<string, {
        decimals?: number;
        display?: string;
        prefix?: string;
        suffix?: string;
    }>;
    columnStyles?: Record<string, string>;
    gridLines?: 'none' | 'horizontal' | 'vertical' | 'both';
    gridLineColor?: string;
    gridLineWidth?: 'thin' | 'medium';
    bandingColor?: string;
    hoverHighlight?: boolean;
    cellTextOverflow?: 'ellipsis' | 'clip' | 'wrap';
    compactNumbers?: boolean;
    autoSizeColumns?: boolean;
    aggregation?: boolean;
    aggregationFn?: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'none';
    aggregationPosition?: 'top' | 'bottom' | 'both';
    groupBy?: string[];
    groupByLevels?: string[][];
    groupTotals?: boolean;
    groupTotalsFn?: 'sum' | 'avg' | 'min' | 'max' | 'count';
    conditionalFormattingRules?: ConditionalFormattingRule[];
    columnGroups?: Array<{
        header: string;
        children: string[];
    }>;
    userRole?: 'viewer' | 'user' | 'editor' | 'admin';
    copyHeaders?: boolean;
    copyFormatted?: boolean;
    loadingMode?: 'paginate' | 'lazy';
    virtualScrollThreshold?: number;
    fetchPageSize?: number;
    prefetchPages?: number;
    showSearch?: boolean;
    showCsvExport?: boolean;
    showExcelExport?: boolean;
    showTitleBar?: boolean;
    titleIcon?: string;
    titleBarBg?: string;
    titleBarText?: string;
    headerBg?: string;
    headerText?: string;
    bodyBg?: string;
    bodyText?: string;
    footerBg?: string;
    footerText?: string;
    headerWrapping?: boolean;
    containerShadow?: 'none' | 'sm' | 'md' | 'lg';
    containerRadius?: number;
    fontFamily?: string;
    fontSize?: number;
    titleFontFamily?: string;
    titleFontSize?: number;
    subtitleFontSize?: number;
    maxCopyRows?: number;
    excludeFieldsFromCopy?: string[];
    enableAnomalyDetection?: boolean;
    columnFormatting?: Record<string, ColumnFormatting>;
    computedColumns?: ComputedColumnDef[];
    columnProfiles?: ColumnProfile[];
    rowActions?: RowAction[];
    drillThroughConfig?: DrillThroughConfig;
    generateDashboardConfig?: GenerateDashboardConfig;
    reportId?: string;
    reportName?: string;
    dataSet?: DataSet;
    remoteDataSource?: AsyncDataSource;
    virtualRowHeight?: number;
    groupTotalsOverrides?: Record<string, 'sum' | 'avg' | 'min' | 'max' | 'count' | 'none'>;
    allowFiltering?: boolean;
    allowSorting?: boolean;
    defaultSortField?: string;
    defaultSortDirection?: 'asc' | 'desc';
    queryBackend?: QueryBackend;
    progressiveLoad?: ProgressiveLoadConfig;
    onGridReady?: (gridInstance: GridApi) => void;
    onStateChange?: (event: StateChangeEvent) => void;
    onCellClick?: (event: CellClickEvent) => void;
    onCellDoubleClick?: (event: CellDoubleClickEvent) => void;
    onSelectionChange?: (event: SelectionChangeEvent) => void;
    onSortChange?: (event: SortChangeEvent) => void;
    onFilterChange?: (event: FilterChangeEvent) => void;
    onEditStart?: (event: CellEditStartEvent) => void;
    onEditCommit?: (event: CellEditCommitEvent) => void;
    onEditCancel?: (event: CellEditCancelEvent) => void;
    onScroll?: (event: ScrollEvent) => void;
    onRowAction?: (detail: RowActionEventDetail) => void;
    onDrillThrough?: (detail: {
        source: GridRowDrillSource;
        config: DrillThroughConfig;
        field: string;
        value: unknown;
    }) => void;
    onCopy?: (detail: {
        text: string;
        rowCount: number;
        colCount: number;
        source: 'cell' | 'range' | 'rows';
    }) => void;
    onGenerateDashboard?: (detail: GenerateDashboardEventDetail) => void;
    onVirtualScroll?: (detail: {
        startIndex: number;
        endIndex: number;
        totalCount: number;
    }) => void;
    onRemoteDataLoad?: (detail: {
        offset: number;
        count: number;
        totalCount: number;
    }) => void;
    onRemoteDataError?: (detail: {
        error: Error;
        offset: number;
    }) => void;
    onAdminSettings?: (detail: Record<string, never>) => void;
    children?: ReactNode;
    header?: ReactNode;
    footer?: ReactNode;
    emptyState?: ReactNode;
    loadingIndicator?: ReactNode;
    toolbar?: ReactNode;
    className?: string;
    style?: React.CSSProperties;
}
export declare const PhzGrid: React.ForwardRefExoticComponent<PhzGridProps & React.RefAttributes<GridApi<any>>>;
//# sourceMappingURL=phz-grid.d.ts.map