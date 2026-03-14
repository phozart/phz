/**
 * @phozart/engine — Report Presentation Types
 *
 * Canonical types for how a report _looks_: table settings, column formatting,
 * number formats, export settings, status colors, etc.
 * These live in engine (pure TS, no DOM deps) so they can be persisted
 * alongside ReportConfig and shared across packages.
 */

// ── Generate Dashboard Config ──

export interface GenerateDashboardConfig {
  href?: string;   // URL template with {reportId}, {dataMode} tokens
  label?: string;  // Custom menu label (default: "Dashboard from …")
}

// ── Column-level formatting ──

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

// ── Table-level settings ──

export interface TableSettings {
  // Container
  containerShadow: 'none' | 'sm' | 'md' | 'lg';
  containerRadius: number;

  // Title Bar
  showTitleBar: boolean;
  titleText: string;
  subtitleText: string;
  titleFontFamily: string;
  titleFontSize: number;
  subtitleFontSize: number;
  titleBarBg: string;
  titleBarText: string;
  titleIcon: string;

  // Toolbar
  showToolbar: boolean;
  showSearch: boolean;
  showDensityToggle: boolean;
  showColumnEditor: boolean;
  showCsvExport: boolean;
  showExcelExport: boolean;

  // Grid Options
  density: 'comfortable' | 'compact' | 'dense';
  loadingMode: 'paginate' | 'lazy';
  pageSize: number;
  headerWrapping: boolean;
  showColumnGroups: boolean;
  columnGroups: Array<{ header: string; children: string[] }>;
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

  // Default Typography
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

  // Row Grouping
  groupByFields: string[];
  groupByLevels: string[][];
  groupTotals: boolean;
  groupTotalsFn: 'sum' | 'avg' | 'min' | 'max' | 'count';
  groupTotalsOverrides: Record<string, 'sum' | 'avg' | 'min' | 'max' | 'count' | 'none'>;

  // Aggregation / Summary Row
  showAggregation: boolean;
  aggregationPosition: 'top' | 'bottom' | 'both';
  aggregationFn: 'sum' | 'avg' | 'min' | 'max' | 'count';
  aggregationOverrides: Record<string, 'sum' | 'avg' | 'min' | 'max' | 'count' | 'none'>;

  // Grid Lines & Display
  gridLines: 'none' | 'horizontal' | 'vertical' | 'both';
  gridLineColor: string;
  gridLineWidth: 'thin' | 'medium';
  bandingColor: string;
  hoverHighlight: boolean;
  cellTextOverflow: 'ellipsis' | 'clip' | 'wrap';
  compactNumbers: boolean;

  // Section Colors
  titleBarBgColor: string;
  titleBarTextColor: string;
  headerBg: string;
  headerText: string;
  bodyBg: string;
  bodyText: string;
  footerBg: string;
  footerText: string;
}

export const DEFAULT_TABLE_SETTINGS: TableSettings = {
  containerShadow: 'md',
  containerRadius: 8,
  showTitleBar: true,
  titleText: '',
  subtitleText: '',
  titleFontFamily: 'inherit',
  titleFontSize: 14,
  subtitleFontSize: 13,
  titleBarBg: '#1C1917',
  titleBarText: '#FEFDFB',
  titleIcon: '',
  showToolbar: true,
  showSearch: true,
  showDensityToggle: true,
  showColumnEditor: true,
  showCsvExport: true,
  showExcelExport: true,
  density: 'compact',
  loadingMode: 'paginate',
  pageSize: 25,
  headerWrapping: false,
  showColumnGroups: false,
  columnGroups: [],
  groupByFields: [],
  groupByLevels: [],
  groupTotals: false,
  groupTotalsFn: 'sum',
  groupTotalsOverrides: {},
  autoSizeColumns: false,
  allowFiltering: true,
  allowSorting: true,
  defaultSortField: '',
  defaultSortDirection: 'asc',
  rowBanding: true,
  showPagination: true,
  showCheckboxes: false,
  virtualization: false,
  scrollMode: 'paginate',
  virtualScrollThreshold: 0,
  fetchPageSize: 100,
  prefetchPages: 2,
  editMode: 'none',
  selectionMode: 'single',
  showRowActions: false,
  showSelectionActions: true,
  showEditActions: true,
  showCopyActions: true,
  showGenerateDashboard: false,
  fontFamily: 'inherit',
  fontSize: 13,
  fontBold: false,
  fontItalic: false,
  fontUnderline: false,
  hAlign: 'left',
  vAlign: 'middle',
  headerHAlign: 'left',
  numberAlign: 'right',
  textAlign: 'left',
  dateAlign: 'left',
  booleanAlign: 'center',
  showAggregation: false,
  aggregationPosition: 'bottom',
  aggregationFn: 'sum',
  aggregationOverrides: {},
  gridLines: 'horizontal',
  gridLineColor: '#E7E5E4',
  gridLineWidth: 'thin',
  bandingColor: '#FAFAF9',
  hoverHighlight: true,
  cellTextOverflow: 'wrap',
  compactNumbers: false,
  titleBarBgColor: '#1C1917',
  titleBarTextColor: '#FEFDFB',
  headerBg: '#FAFAF9',
  headerText: '#A8A29E',
  bodyBg: '#FFFFFF',
  bodyText: '#1C1917',
  footerBg: '#FAFAF9',
  footerText: '#78716C',
};

// ── Report Presentation bundle ──

export interface ReportPresentation {
  tableSettings?: Partial<TableSettings>;
  columnFormatting?: Record<string, ColumnFormatting>;
  numberFormats?: Record<string, NumberFormat>;
  filterPresets?: Record<string, { name: string; filters: Array<{ field: string; operator: string; value: string }> }>;
  exportSettings?: ExportSettings;
  columnTypes?: Record<string, string>;
  statusColors?: Record<string, { bg: string; color: string; dot: string }>;
  barThresholds?: Array<{ min: number; color: string }>;
  dateFormats?: Record<string, string>;
  linkTemplates?: Record<string, string>;
}

export const DEFAULT_REPORT_PRESENTATION: ReportPresentation = {
  tableSettings: { ...DEFAULT_TABLE_SETTINGS },
};
