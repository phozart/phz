/**
 * @phozart/phz-engine — Report Presentation Types
 *
 * Canonical types for how a report _looks_: table settings, column formatting,
 * number formats, export settings, status colors, etc.
 * These live in engine (pure TS, no DOM deps) so they can be persisted
 * alongside ReportConfig and shared across packages.
 */
export interface GenerateDashboardConfig {
    href?: string;
    label?: string;
}
export interface ColumnColorThreshold {
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'contains';
    value: string;
    bgColor: string;
    textColor: string;
}
export interface ColumnFormatting {
    fontFamily?: string;
    fontSize?: number;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    hAlign?: 'left' | 'center' | 'right';
    vAlign?: 'top' | 'middle' | 'bottom';
    bgColor?: string;
    textColor?: string;
    colorThresholds?: ColumnColorThreshold[];
}
export interface NumberFormat {
    decimals?: number;
    display?: string;
    prefix?: string;
    suffix?: string;
}
export interface ExportSettings {
    format: 'csv' | 'excel';
    includeHeaders: boolean;
    includeFormatting: boolean;
    includeGroupHeaders: boolean;
    separator: string;
    selectedColumns: string[];
    fileName?: string;
}
export interface TableSettings {
    containerShadow: 'none' | 'sm' | 'md' | 'lg';
    containerRadius: number;
    showTitleBar: boolean;
    titleText: string;
    subtitleText: string;
    titleFontFamily: string;
    titleFontSize: number;
    subtitleFontSize: number;
    titleBarBg: string;
    titleBarText: string;
    titleIcon: string;
    showToolbar: boolean;
    showSearch: boolean;
    showDensityToggle: boolean;
    showColumnEditor: boolean;
    showCsvExport: boolean;
    showExcelExport: boolean;
    density: 'comfortable' | 'compact' | 'dense';
    loadingMode: 'paginate' | 'lazy';
    pageSize: number;
    headerWrapping: boolean;
    showColumnGroups: boolean;
    columnGroups: Array<{
        header: string;
        children: string[];
    }>;
    allowFiltering: boolean;
    allowSorting: boolean;
    autoSizeColumns: boolean;
    defaultSortField: string;
    defaultSortDirection: 'asc' | 'desc';
    rowBanding: boolean;
    showPagination: boolean;
    showCheckboxes: boolean;
    virtualization: boolean;
    scrollMode: 'paginate' | 'virtual';
    virtualScrollThreshold: number;
    fetchPageSize: number;
    prefetchPages: number;
    editMode: 'none' | 'cell' | 'row' | 'dblclick';
    selectionMode: 'none' | 'single' | 'multi' | 'range';
    showRowActions: boolean;
    showSelectionActions: boolean;
    showEditActions: boolean;
    showCopyActions: boolean;
    showGenerateDashboard: boolean;
    fontFamily: string;
    fontSize: number;
    fontBold: boolean;
    fontItalic: boolean;
    fontUnderline: boolean;
    hAlign: 'left' | 'center' | 'right';
    vAlign: 'top' | 'middle' | 'bottom';
    headerHAlign: 'left' | 'center' | 'right';
    numberAlign: 'left' | 'center' | 'right';
    textAlign: 'left' | 'center' | 'right';
    dateAlign: 'left' | 'center' | 'right';
    booleanAlign: 'left' | 'center' | 'right';
    groupByFields: string[];
    groupByLevels: string[][];
    groupTotals: boolean;
    groupTotalsFn: 'sum' | 'avg' | 'min' | 'max' | 'count';
    groupTotalsOverrides: Record<string, 'sum' | 'avg' | 'min' | 'max' | 'count' | 'none'>;
    showAggregation: boolean;
    aggregationPosition: 'top' | 'bottom' | 'both';
    aggregationFn: 'sum' | 'avg' | 'min' | 'max' | 'count';
    aggregationOverrides: Record<string, 'sum' | 'avg' | 'min' | 'max' | 'count' | 'none'>;
    gridLines: 'none' | 'horizontal' | 'vertical' | 'both';
    gridLineColor: string;
    gridLineWidth: 'thin' | 'medium';
    bandingColor: string;
    hoverHighlight: boolean;
    cellTextOverflow: 'ellipsis' | 'clip' | 'wrap';
    compactNumbers: boolean;
    titleBarBgColor: string;
    titleBarTextColor: string;
    headerBg: string;
    headerText: string;
    bodyBg: string;
    bodyText: string;
    footerBg: string;
    footerText: string;
}
export declare const DEFAULT_TABLE_SETTINGS: TableSettings;
export interface ReportPresentation {
    tableSettings?: Partial<TableSettings>;
    columnFormatting?: Record<string, ColumnFormatting>;
    numberFormats?: Record<string, NumberFormat>;
    filterPresets?: Record<string, {
        name: string;
        filters: Array<{
            field: string;
            operator: string;
            value: string;
        }>;
    }>;
    exportSettings?: ExportSettings;
    columnTypes?: Record<string, string>;
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
    linkTemplates?: Record<string, string>;
}
export declare const DEFAULT_REPORT_PRESENTATION: ReportPresentation;
//# sourceMappingURL=report-presentation.d.ts.map