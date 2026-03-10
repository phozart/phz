'use client';
/**
 * @phozart/phz-react — PhzGrid React Component
 *
 * Wraps the <phz-grid> Web Component for React using @lit/react's
 * createComponent() for automatic property bridging. Event handlers
 * extract CustomEvent.detail for backward-compatible callback signatures.
 */
import React, {
  createElement,
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  type ReactNode,
} from 'react';
import { createComponent, type EventName } from '@lit/react';
import type {
  GridApi,
  ColumnDefinition,
  ConditionalFormattingRule,
  CellClickEvent,
  CellDoubleClickEvent,
  SelectionChangeEvent,
  SortChangeEvent,
  FilterChangeEvent,
  CellEditStartEvent,
  CellEditCommitEvent,
  CellEditCancelEvent,
  ScrollEvent,
  StateChangeEvent,
  QueryBackend,
  ProgressiveLoadConfig,
} from '@phozart/phz-core';
import { PhzGrid as PhzGridElement } from '@phozart/phz-grid';

// ---------------------------------------------------------------------------
// @lit/react base component — auto-bridges Lit @property fields to React props
// and maps React event callbacks to DOM CustomEvents.
// ---------------------------------------------------------------------------
const PhzGridLit = createComponent({
  tagName: 'phz-grid',
  elementClass: PhzGridElement,
  react: React,
  events: {
    onGridReady: 'grid-ready' as EventName<CustomEvent<{ gridInstance: GridApi }>>,
    onStateChange: 'state-change' as EventName<CustomEvent<StateChangeEvent>>,
    onCellClick: 'cell-click' as EventName<CustomEvent<CellClickEvent>>,
    onCellDoubleClick: 'cell-dblclick' as EventName<CustomEvent<CellDoubleClickEvent>>,
    onSelectionChange: 'selection-change' as EventName<CustomEvent<SelectionChangeEvent>>,
    onSortChange: 'sort-change' as EventName<CustomEvent<SortChangeEvent>>,
    onFilterChange: 'filter-change' as EventName<CustomEvent<FilterChangeEvent>>,
    onEditStart: 'edit-start' as EventName<CustomEvent<CellEditStartEvent>>,
    onEditCommit: 'edit-commit' as EventName<CustomEvent<CellEditCommitEvent>>,
    onEditCancel: 'edit-cancel' as EventName<CustomEvent<CellEditCancelEvent>>,
    onScroll: 'scroll' as EventName<CustomEvent<ScrollEvent>>,
    onRowAction: 'row-action' as EventName<CustomEvent>,
    onDrillThrough: 'drill-through' as EventName<CustomEvent>,
    onCopy: 'copy' as EventName<CustomEvent>,
    onGenerateDashboard: 'generate-dashboard' as EventName<CustomEvent>,
    onVirtualScroll: 'virtual-scroll' as EventName<CustomEvent>,
    onRemoteDataLoad: 'remote-data-load' as EventName<CustomEvent>,
    onRemoteDataError: 'remote-data-error' as EventName<CustomEvent>,
    onAdminSettings: 'admin-settings' as EventName<CustomEvent>,
    onBulkDelete: 'bulk-delete' as EventName<CustomEvent>,
    onRowClick: 'row-click' as EventName<CustomEvent>,
    onResize: 'resize' as EventName<CustomEvent>,
  },
});

// ---------------------------------------------------------------------------
// Public Props interface — backward-compatible, unchanged from the old wrapper
// ---------------------------------------------------------------------------
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

  // Grid display properties
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
  statusColors?: Record<string, { bg: string; color: string; dot: string }>;
  barThresholds?: Array<{ min: number; color: string }>;
  dateFormats?: Record<string, string>;
  numberFormats?: Record<string, { decimals?: number; display?: string; prefix?: string; suffix?: string }>;
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
  columnGroups?: Array<{ header: string; children: string[] }>;
  userRole?: 'viewer' | 'user' | 'editor' | 'admin';
  copyHeaders?: boolean;
  copyFormatted?: boolean;
  loadingMode?: 'paginate' | 'lazy';
  virtualScrollThreshold?: number;
  fetchPageSize?: number;
  prefetchPages?: number;

  // Extended display properties
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
  columnFormatting?: Record<string, any>;
  computedColumns?: any[];
  columnProfiles?: any[];
  rowActions?: any[];
  drillThroughConfig?: any;
  generateDashboardConfig?: any;
  reportId?: string;
  reportName?: string;
  dataSet?: any;
  remoteDataSource?: any;
  virtualRowHeight?: number;
  groupTotalsOverrides?: Record<string, 'sum' | 'avg' | 'min' | 'max' | 'count' | 'none'>;
  allowFiltering?: boolean;
  allowSorting?: boolean;
  defaultSortField?: string;
  defaultSortDirection?: 'asc' | 'desc';
  queryBackend?: QueryBackend;
  progressiveLoad?: ProgressiveLoadConfig;

  // Event handlers — receive unwrapped detail, NOT CustomEvent
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

  // Extended event handlers
  onRowAction?: (detail: any) => void;
  onDrillThrough?: (detail: any) => void;
  onCopy?: (detail: any) => void;
  onGenerateDashboard?: (detail: any) => void;
  onVirtualScroll?: (detail: any) => void;
  onRemoteDataLoad?: (detail: any) => void;
  onRemoteDataError?: (detail: any) => void;
  onAdminSettings?: (detail: any) => void;

  // Slots as children
  children?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  emptyState?: ReactNode;
  loadingIndicator?: ReactNode;
  toolbar?: ReactNode;

  className?: string;
  style?: React.CSSProperties;
}

// ---------------------------------------------------------------------------
// Helper: wrap a detail-extracting callback for createComponent's CustomEvent
// ---------------------------------------------------------------------------
function wrapDetail<T>(handler: ((detail: T) => void) | undefined) {
  return handler ? (e: CustomEvent<T>) => handler(e.detail) : undefined;
}

// ---------------------------------------------------------------------------
// PhzGrid — public React component with forwardRef for GridApi access
// ---------------------------------------------------------------------------
export const PhzGrid = forwardRef<GridApi, PhzGridProps>(
  function PhzGrid(props, ref) {
    const elementRef = useRef<PhzGridElement | null>(null);
    const gridApiRef = useRef<GridApi | null>(null);

    // Expose GridApi via ref using the new getGridApi() public method
    useImperativeHandle(ref, () => {
      if (gridApiRef.current) return gridApiRef.current;
      const el = elementRef.current;
      if (el) {
        gridApiRef.current = el.getGridApi() ?? null;
      }
      return gridApiRef.current!;
    });

    // grid-ready handler: capture GridApi and call user callback with detail
    const handleGridReady = useCallback(
      (e: CustomEvent<{ gridInstance: GridApi }>) => {
        gridApiRef.current = e.detail.gridInstance;
        props.onGridReady?.(e.detail.gridInstance);
      },
      [props.onGridReady],
    );

    // Map PhzGridProps to PhzGridLit element props
    // Most props map 1:1. The exceptions:
    //   height → gridHeight (with px conversion)
    //   width  → gridWidth  (with px conversion)
    //   className → class (handled by @lit/react automatically)
    //   Events → wrapped to extract .detail
    const elementProps: Record<string, unknown> = {
      ref: elementRef,
      className: props.className,
      style: props.style,

      // Core data
      data: props.data,
      columns: props.columns,

      // Display config — 1:1 property mappings
      theme: props.theme,
      locale: props.locale,
      responsive: props.responsive,
      virtualization: props.virtualization,
      selectionMode: props.selectionMode,
      editMode: props.editMode,
      loading: props.loading,
      density: props.density,
      gridTitle: props.gridTitle,
      gridSubtitle: props.gridSubtitle,
      scrollMode: props.scrollMode,
      pageSize: props.pageSize,
      pageSizeOptions: props.pageSizeOptions,
      showToolbar: props.showToolbar,
      showDensityToggle: props.showDensityToggle,
      showColumnEditor: props.showColumnEditor,
      showAdminSettings: props.showAdminSettings,
      showPagination: props.showPagination,
      paginationAlign: props.paginationAlign,
      showCheckboxes: props.showCheckboxes,
      showRowActions: props.showRowActions,
      showSelectionActions: props.showSelectionActions,
      showEditActions: props.showEditActions,
      showCopyActions: props.showCopyActions,
      rowBanding: props.rowBanding,
      statusColors: props.statusColors,
      barThresholds: props.barThresholds,
      dateFormats: props.dateFormats,
      numberFormats: props.numberFormats,
      columnStyles: props.columnStyles,
      gridLines: props.gridLines,
      gridLineColor: props.gridLineColor,
      gridLineWidth: props.gridLineWidth,
      bandingColor: props.bandingColor,
      hoverHighlight: props.hoverHighlight,
      cellTextOverflow: props.cellTextOverflow,
      compactNumbers: props.compactNumbers,
      autoSizeColumns: props.autoSizeColumns,
      aggregation: props.aggregation,
      aggregationFn: props.aggregationFn,
      aggregationPosition: props.aggregationPosition,
      groupBy: props.groupBy,
      groupByLevels: props.groupByLevels,
      groupTotals: props.groupTotals,
      groupTotalsFn: props.groupTotalsFn,
      conditionalFormattingRules: props.conditionalFormattingRules,
      columnGroups: props.columnGroups,
      userRole: props.userRole,
      copyHeaders: props.copyHeaders,
      copyFormatted: props.copyFormatted,
      loadingMode: props.loadingMode,
      virtualScrollThreshold: props.virtualScrollThreshold,
      fetchPageSize: props.fetchPageSize,
      prefetchPages: props.prefetchPages,
      showSearch: props.showSearch,
      showCsvExport: props.showCsvExport,
      showExcelExport: props.showExcelExport,
      showTitleBar: props.showTitleBar,
      titleIcon: props.titleIcon,
      titleBarBg: props.titleBarBg,
      titleBarText: props.titleBarText,
      headerBg: props.headerBg,
      headerText: props.headerText,
      bodyBg: props.bodyBg,
      bodyText: props.bodyText,
      footerBg: props.footerBg,
      footerText: props.footerText,
      headerWrapping: props.headerWrapping,
      containerShadow: props.containerShadow,
      containerRadius: props.containerRadius,
      fontFamily: props.fontFamily,
      fontSize: props.fontSize,
      titleFontFamily: props.titleFontFamily,
      titleFontSize: props.titleFontSize,
      subtitleFontSize: props.subtitleFontSize,
      maxCopyRows: props.maxCopyRows,
      excludeFieldsFromCopy: props.excludeFieldsFromCopy,
      enableAnomalyDetection: props.enableAnomalyDetection,
      columnFormatting: props.columnFormatting,
      computedColumns: props.computedColumns,
      columnProfiles: props.columnProfiles,
      rowActions: props.rowActions,
      drillThroughConfig: props.drillThroughConfig,
      generateDashboardConfig: props.generateDashboardConfig,
      reportId: props.reportId,
      reportName: props.reportName,
      dataSet: props.dataSet,
      remoteDataSource: props.remoteDataSource,
      virtualRowHeight: props.virtualRowHeight,
      groupTotalsOverrides: props.groupTotalsOverrides,
      allowFiltering: props.allowFiltering,
      allowSorting: props.allowSorting,
      defaultSortField: props.defaultSortField,
      defaultSortDirection: props.defaultSortDirection,
      queryBackend: props.queryBackend,
      progressiveLoad: props.progressiveLoad,

      // Renamed props: height/width → gridHeight/gridWidth
      gridHeight: props.height != null
        ? (typeof props.height === 'number' ? `${props.height}px` : props.height)
        : undefined,
      gridWidth: props.width != null
        ? (typeof props.width === 'number' ? `${props.width}px` : props.width)
        : undefined,

      // Events — grid-ready has special handling for GridApi capture
      onGridReady: handleGridReady,
      // All other events: wrap to extract .detail for backward compat
      onStateChange: wrapDetail(props.onStateChange),
      onCellClick: wrapDetail(props.onCellClick),
      onCellDoubleClick: wrapDetail(props.onCellDoubleClick),
      onSelectionChange: wrapDetail(props.onSelectionChange),
      onSortChange: wrapDetail(props.onSortChange),
      onFilterChange: wrapDetail(props.onFilterChange),
      onEditStart: wrapDetail(props.onEditStart),
      onEditCommit: wrapDetail(props.onEditCommit),
      onEditCancel: wrapDetail(props.onEditCancel),
      onScroll: wrapDetail(props.onScroll),
      onRowAction: wrapDetail(props.onRowAction),
      onDrillThrough: wrapDetail(props.onDrillThrough),
      onCopy: wrapDetail(props.onCopy),
      onGenerateDashboard: wrapDetail(props.onGenerateDashboard),
      onVirtualScroll: wrapDetail(props.onVirtualScroll),
      onRemoteDataLoad: wrapDetail(props.onRemoteDataLoad),
      onRemoteDataError: wrapDetail(props.onRemoteDataError),
      onAdminSettings: wrapDetail(props.onAdminSettings),
    };

    // Remove undefined values so @lit/react doesn't set them as properties
    for (const key of Object.keys(elementProps)) {
      if (elementProps[key] === undefined) {
        delete elementProps[key];
      }
    }

    return createElement(
      PhzGridLit,
      elementProps,
      props.toolbar && createElement('div', { slot: 'toolbar' }, props.toolbar),
      props.header && createElement('div', { slot: 'header' }, props.header),
      props.footer && createElement('div', { slot: 'footer' }, props.footer),
      props.emptyState && createElement('div', { slot: 'empty-state' }, props.emptyState),
      props.loadingIndicator && createElement('div', { slot: 'loading' }, props.loadingIndicator),
      props.children,
    );
  },
);
