/**
 * @phozart/grid — <phz-grid> Custom Element
 *
 * God Object refactored into Lit Reactive Controllers.
 * Rendering and public API live here; behaviour delegates to controllers.
 */
import { LitElement, html, nothing, type TemplateResult, type PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import {
  type GridApi,
  type ColumnDefinition,
  type RowData,
  type RowId,
  type SortDirection,
  type DataSet,
  type DataSetMeta,
  type QueryBackend,
  type ProgressiveLoadConfig,
  type ProgressivePhase,
} from '@phozart/core';
import type { AriaManager } from '../a11y/aria-manager.js';
import { KeyboardNavigator, type KeyboardNavigatorCallbacks } from '../a11y/keyboard-navigator.js';
import { ForcedColorsAdapter } from '../a11y/forced-colors-adapter.js';
import { dispatchGridEvent, type RowActionEventDetail, type GenerateDashboardEventDetail } from '../events.js';

import type { FilterApplyEvent } from './phz-filter-popover.js';
import type { ColumnChooserChangeEvent, ColumnProfile, ComputedColumnDef } from './phz-column-chooser.js';
import type { ConditionalFormattingRule, RowGroup, ColumnFormatting } from '@phozart/core';
import type { DrillThroughConfig, GridRowDrillSource, GenerateDashboardConfig } from '@phozart/core';

import type { Density, FilterInfo, RowAction, ScrollMode } from '../types.js';
import { formatCellValue } from '../formatters/cell-formatter.js';
import type { AsyncDataSource } from '@phozart/core';
import type { ComputedCellStyle } from '../features/conditional-formatting.js';

// Controllers
import {
  ToastController,
  ColumnResizeController,
  EditController,
  SortController,
  SelectionController,
  FilterController,
  VirtualScrollController,
  ExportController,
  ContextMenuController,
  ClipboardController,
  ConditionalFormattingController,
  AggregationController,
  GroupController,
  ColumnChooserController,
  ComputedColumnsController,
  GridCoreController,
  TooltipController,
} from '../controllers/index.js';
import type { ContextMenuCommands, StateSyncPayload, TooltipHost, ToastIcon } from '../controllers/index.js';

// Styles & templates
import { phzGridStyles } from './phz-grid.styles.js';
import { renderTitleBar, renderPagination, renderGroupedRows, renderColumnGroupHeader, renderSummaryRow } from './phz-grid.templates.js';
import { splitPinnedColumns, computePinnedOffsets, getPinnedStyle } from '../utils/column-pinning.js';

// Eager sub-component (always rendered when toolbar is visible)
import './phz-toolbar.js';

// Lazy sub-components — loaded on first use
// phz-context-menu, phz-filter-popover, phz-column-chooser, phz-chart-popover

type AggregationFn = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'none';

@customElement('phz-grid')
export class PhzGrid extends LitElement {
  // --- Public properties ---

  @property({ attribute: false })
  data: unknown[] = [];
  @property({ attribute: false })
  columns: ColumnDefinition[] = [];
  @property({ type: String, reflect: true })
  theme: string = 'auto';
  @property({ type: String })
  locale: string = 'en-US';
  @property({ type: Boolean })
  responsive: boolean = true;
  @property({ type: Boolean })
  virtualization: boolean = true;
  @property({ type: String, attribute: 'selection-mode' })
  selectionMode: 'none' | 'single' | 'multi' | 'range' = 'single';
  @property({ type: String, attribute: 'edit-mode' })
  editMode: 'none' | 'click' | 'dblclick' | 'manual' = 'dblclick';
  @property({ attribute: false })
  ariaLabels: import('@phozart/core').AriaLabels = {};
  @property({ type: Boolean })
  loading: boolean = false;
  @property({ type: String, attribute: 'grid-height' })
  gridHeight: string = 'auto';
  @property({ type: String, attribute: 'grid-width' })
  gridWidth: string = '100%';
  @property({ type: String, reflect: true })
  density: Density = 'compact';
  @property({ type: String, attribute: 'font-family' })
  fontFamily: string = 'inherit';
  @property({ type: Number, attribute: 'font-size' })
  fontSize: number = 13;
  @property({ type: String, attribute: 'container-shadow' })
  containerShadow: 'none' | 'sm' | 'md' | 'lg' = 'lg';
  @property({ type: Number, attribute: 'container-radius' })
  containerRadius: number = 16;
  @property({ type: Boolean })
  aggregation: boolean = false;
  @property({ type: String, attribute: 'aggregation-fn' })
  aggregationFn: AggregationFn = 'sum';
  @property({ type: Boolean, attribute: 'show-row-actions' })
  showRowActions: boolean = false;
  @property({ type: Boolean, attribute: 'show-checkboxes' })
  showCheckboxes: boolean = false;
  @property({ type: Boolean, attribute: 'enable-anomaly-detection' })
  enableAnomalyDetection: boolean = false;
  @property({ attribute: false })
  conditionalFormattingRules: ConditionalFormattingRule[] = [];
  @property({ attribute: false })
  columnProfiles: ColumnProfile[] = [];
  @property({ type: Boolean, attribute: 'show-toolbar' })
  showToolbar: boolean = true;
  @property({ type: Boolean, attribute: 'show-density-toggle' })
  showDensityToggle: boolean = true;
  @property({ type: Boolean, attribute: 'show-column-editor' })
  showColumnEditor: boolean = true;
  @property({ type: Boolean, attribute: 'show-search' })
  showSearch: boolean = true;
  @property({ type: Boolean, attribute: 'show-csv-export' })
  showCsvExport: boolean = true;
  @property({ type: Boolean, attribute: 'show-excel-export' })
  showExcelExport: boolean = true;
  @property({ type: Boolean, attribute: 'show-admin-settings' })
  showAdminSettings: boolean = false;
  @property({ type: Boolean, attribute: 'show-pagination' })
  showPagination: boolean = true;
  @property({ type: String, attribute: 'pagination-align' })
  paginationAlign: 'left' | 'center' | 'right' = 'right';
  @property({ attribute: false })
  pageSizeOptions: number[] = [5, 10, 20, 50];
  @property({ type: Number, attribute: 'page-size' })
  pageSize: number = 10;
  @property({ type: String, attribute: 'grid-title' })
  gridTitle: string = '';
  @property({ type: String, attribute: 'grid-subtitle' })
  gridSubtitle: string = '';
  @property({ type: String, attribute: 'title-font-family' })
  titleFontFamily: string = 'inherit';
  @property({ type: Number, attribute: 'title-font-size' })
  titleFontSize: number = 14;
  @property({ type: Number, attribute: 'subtitle-font-size' })
  subtitleFontSize: number = 13;
  @property({ type: String, attribute: 'title-bar-bg' })
  titleBarBg: string = '#1C1917';
  @property({ type: String, attribute: 'title-bar-text' })
  titleBarText: string = '#FEFDFB';
  @property({ type: String, attribute: 'title-icon' })
  titleIcon: string = '';
  @property({ type: Boolean, attribute: 'show-title-bar' })
  showTitleBar: boolean = true;
  @property({ type: Boolean, attribute: 'show-selection-actions' })
  showSelectionActions: boolean = true;
  @property({ type: String, attribute: 'loading-mode' })
  loadingMode: 'paginate' | 'lazy' = 'paginate';
  @property({ type: String, attribute: 'scroll-mode' })
  scrollMode: ScrollMode = 'paginate';
  @property({ attribute: false })
  remoteDataSource?: AsyncDataSource;
  @property({ type: Number, attribute: 'fetch-page-size' })
  fetchPageSize: number = 100;
  @property({ type: Number, attribute: 'prefetch-pages' })
  prefetchPages: number = 2;
  @property({ type: Number, attribute: 'virtual-row-height' })
  virtualRowHeight?: number;
  @property({ type: Number, attribute: 'virtual-scroll-threshold' })
  virtualScrollThreshold: number = 0;
  @property({ type: Boolean, attribute: 'allow-filtering' })
  allowFiltering: boolean = true;
  @property({ type: Boolean, attribute: 'allow-sorting' })
  allowSorting: boolean = true;
  @property({ type: String, attribute: 'default-sort-field' })
  defaultSortField: string = '';
  @property({ type: String, attribute: 'default-sort-direction' })
  defaultSortDirection: 'asc' | 'desc' = 'asc';
  @property({ type: Number, attribute: 'sort-debounce-ms' })
  sortDebounceMs = 0;
  @property({ type: Boolean, attribute: 'header-wrapping' })
  headerWrapping: boolean = false;
  @property({ type: Boolean, attribute: 'auto-size-columns' })
  autoSizeColumns: boolean = false;
  @property({ attribute: false })
  columnGroups: Array<{ header: string; children: string[] }> = [];
  @property({ type: Boolean, attribute: 'row-banding' })
  rowBanding: boolean = false;
  @property({ attribute: false })
  statusColors: Record<string, { bg: string; color: string; dot: string }> = {};
  @property({ attribute: false })
  barThresholds: Array<{ min: number; color: string }> = [];
  @property({ attribute: false })
  dateFormats: Record<string, string> = {};
  @property({ attribute: false })
  columnStyles: Record<string, string> = {};
  @property({ attribute: false })
  numberFormats: Record<string, { decimals?: number; display?: 'number' | 'percent' | 'currency'; prefix?: string; suffix?: string }> = {};
  @property({ attribute: false })
  columnFormatting: Record<string, ColumnFormatting> = {};
  @property({ type: String, attribute: 'user-role' })
  userRole: 'viewer' | 'user' | 'editor' | 'admin' = 'user';
  @property({ attribute: false })
  computedColumns: ComputedColumnDef[] = [];
  @property({ type: Boolean, attribute: 'copy-headers' })
  copyHeaders: boolean = true;
  @property({ type: Boolean, attribute: 'copy-formatted' })
  copyFormatted: boolean = false;
  @property({ type: Boolean, attribute: 'show-edit-actions' })
  showEditActions: boolean = true;
  @property({ type: Boolean, attribute: 'show-copy-actions' })
  showCopyActions: boolean = true;
  @property({ type: Number, attribute: 'max-copy-rows' })
  maxCopyRows: number = 0;
  @property({ attribute: false })
  excludeFieldsFromCopy: string[] = [];
  @property({ attribute: false })
  groupBy: string[] = [];
  @property({ attribute: false })
  groupByLevels: string[][] = [];
  @property({ type: Boolean }) groupTotals: boolean = false;
  @property({ type: String }) groupTotalsFn: AggregationFn = 'sum';
  @property({ attribute: false }) groupTotalsOverrides: Record<string, AggregationFn> = {};
  @property({ type: String, attribute: 'grid-lines' })
  gridLines: 'none' | 'horizontal' | 'vertical' | 'both' = 'horizontal';
  @property({ type: String, attribute: 'grid-line-color' })
  gridLineColor: string = '#E7E5E4';
  @property({ type: String, attribute: 'grid-line-width' })
  gridLineWidth: 'thin' | 'medium' = 'thin';
  @property({ type: String, attribute: 'banding-color' })
  bandingColor: string = '#FAFAF9';
  @property({ type: Boolean, attribute: 'hover-highlight' })
  hoverHighlight: boolean = true;
  @property({ type: String, attribute: 'cell-text-overflow' })
  cellTextOverflow: 'ellipsis' | 'clip' | 'wrap' = 'wrap';
  @property({ type: Boolean, attribute: 'compact-numbers' })
  compactNumbers: boolean = false;
  @property({ type: String, attribute: 'header-bg' })
  headerBg: string = '#FAFAF9';
  @property({ type: String, attribute: 'header-text' })
  headerText: string = '#A8A29E';
  @property({ type: String, attribute: 'body-bg' })
  bodyBg: string = '#FFFFFF';
  @property({ type: String, attribute: 'body-text' })
  bodyText: string = '#1C1917';
  @property({ type: String, attribute: 'footer-bg' })
  footerBg: string = '#FAFAF9';
  @property({ type: String, attribute: 'footer-text' })
  footerText: string = '#78716C';
  @property({ attribute: false })
  drillThroughConfig?: DrillThroughConfig;
  @property({ type: String, attribute: 'aggregation-position' })
  aggregationPosition: 'top' | 'bottom' | 'both' = 'bottom';
  @property({ type: Boolean, attribute: 'show-summary' })
  showSummary: boolean = false;
  @property({ type: String, attribute: 'summary-function' })
  summaryFunction: 'sum' | 'avg' | 'min' | 'max' | 'count' = 'sum';
  @property({ attribute: false })
  rowActions: RowAction[] = [];
  @property({ attribute: false })
  generateDashboardConfig?: GenerateDashboardConfig;
  @property({ type: String, attribute: 'report-id' })
  reportId?: string;
  @property({ type: String, attribute: 'report-name' })
  reportName?: string;
  @property({ attribute: false })
  dataSet?: DataSet;
  @property({ attribute: false })
  queryBackend?: QueryBackend;
  @property({ attribute: false })
  progressiveLoad?: ProgressiveLoadConfig;
  @property({ type: Boolean, attribute: 'enable-cell-tooltips' })
  enableCellTooltips: boolean = true;
  @property({ type: Number, attribute: 'tooltip-delay' })
  tooltipDelay: number = 300;

  // --- Internal state ---

  @state() visibleRows: RowData[] = [];
  @state() columnDefs: ColumnDefinition[] = [];
  @state() selectedRowIds: Set<RowId> = new Set();
  @state() sortColumns: Array<{ field: string; direction: SortDirection }> = [];
  @state() totalRowCount: number = 0;
  @state() private isInitialized: boolean = false;
  @state() activeFilters: Map<string, FilterInfo> = new Map();
  @state() private currentPage: number = 0;
  @state() private internalPageSize: number = 10;
  @state() private focusedRowId: RowId | null = null;
  @state() private chartOpen = false;
  @state() private chartField = '';
  @state() private chartHeader = '';
  @state() private chartValues: number[] = [];
  @state() private chartLabels: string[] = [];
  @state() private _progressivePhase?: ProgressivePhase;
  @state() private _progressMessage: string = '';

  // Grouped rows (mirrored from GroupController for render)
  @state() groups: RowGroup[] = [];
  @state() isGrouped = false;

  // DataSet-derived state (delegated to GridCoreController)
  get _dataSetMeta(): DataSetMeta | undefined { return this.gridCore._dataSetMeta; }

  get cellRangeAnchor() { return this.selection?.cellRangeAnchor ?? null; }
  get cellRangeEnd() { return this.selection?.cellRangeEnd ?? null; }

  // --- Internal references ---

  get gridApi(): GridApi | null { return this.gridCore.gridApi; }

  /** Public method for framework wrappers to access the GridApi. */
  public getGridApi(): GridApi | null {
    return this.gridApi;
  }

  get ariaManager(): AriaManager | null { return this.gridCore.ariaManager; }
  private keyboardNav: KeyboardNavigator | null = null;
  private forcedColorsCleanup: (() => void) | null = null;
  private resizeObserver: ResizeObserver | null = null;

  @query('.phz-grid__body') private bodyEl!: HTMLElement;

  // --- Controllers ---
  readonly toast = new ToastController(this);
  readonly columnResize = new ColumnResizeController(this);
  readonly edit = new EditController(this);
  readonly sort = new SortController(this);
  readonly selection = new SelectionController(this);
  readonly filter = new FilterController(this);
  readonly virtualScroll = new VirtualScrollController(this);
  readonly exportCtrl = new ExportController(this);
  readonly contextMenu = new ContextMenuController(this);
  readonly clipboard = new ClipboardController(this);
  readonly cfCtrl = new ConditionalFormattingController(this);
  readonly aggCtrl = new AggregationController(this);
  readonly groupCtrl = new GroupController(this);
  readonly columnChooser = new ColumnChooserController(this);
  readonly computedColumnsCtrl = new ComputedColumnsController(this);
  readonly gridCore = new GridCoreController(this);
  readonly tooltipCtrl = new TooltipController(this as unknown as TooltipHost);

  static readonly slots = {
    header: 'Custom header bar content',
    footer: 'Custom footer content',
    'empty-state': 'Content shown when no data',
    loading: 'Custom loading indicator',
    toolbar: 'Custom toolbar (overrides built-in)',
  } as const;

  static override styles = phzGridStyles;

  // --- Controller host accessors ---

  get effectiveRowActions(): RowAction[] {
    return this.rowActions ?? [];
  }

  get filteredRowCount(): number {
    return this.filter.filteredRows.length;
  }

  setColumnDefs(defs: ColumnDefinition[]): void {
    this.columnDefs = defs;
    this.requestUpdate();
  }

  get filteredRows(): RowData[] {
    return this.filter.filteredRows;
  }

  onStateSync(payload: StateSyncPayload): void {
    this.visibleRows = payload.visibleRows;
    this.sortColumns = payload.sortColumns;
    this.totalRowCount = payload.totalRowCount;
    this.selection.syncFromGridState(payload.selectedRowIds);
    this.selectedRowIds = this.selection.selectedRowIds;
    this.filter.syncFromGridState(payload.filters);
    this.activeFilters = this.filter.activeFilters;
    this.columnDefs = payload.columnDefs;
    this.requestUpdate();
  }

  onProgressUpdate(phase: ProgressivePhase | undefined, message: string): void {
    this._progressivePhase = phase;
    this._progressMessage = message;
    this.requestUpdate();
  }

  onInitialized(): void {
    if (this.autoSizeColumns) {
      this.updateComplete.then(() => this.columnResize.autoSizeAllColumns());
    }
    this.virtualScroll.applyEffectiveScrollMode(this.filter.filteredRows.length);
  }

  /** Command bus for ContextMenuController */
  get commands(): ContextMenuCommands {
    return {
      sort: (field, dir) => this._sortBy(field, dir),
      announceSort: (field, dir) => this.ariaManager?.announceChange(`Sort ${field} ${dir ?? 'cleared'}`),
      openFilter: (field) => this._openFilterForField(field),
      removeFilter: (field) => this._removeFilter(field),
      hideColumn: (field) => this.columnChooser.hideColumn(field),
      autoFitColumn: (field) => this.columnResize.autoFitColumn(new MouseEvent('click'), field),
      groupBy: (field) => this.groupCtrl.groupByField(field),
      ungroupBy: () => this.groupCtrl.ungroupBy(),
      openChart: (field) => this._openChart(field),
      detectAnomalies: (field) => {
        this.cfCtrl.runAnomalyDetection(field);
        const results = this.cfCtrl.anomalies.get(field) ?? [];
        this.toast.show(`Detected ${results.filter(a => a.type === 'outlier').length} anomalies in ${field}`, 'info');
      },
      openColumnChooser: async () => { await this._ensureColumnChooser(); this.columnChooser.open(); },
      exportCSV: () => this.exportCtrl.exportCSV(),
      exportExcel: () => this.exportCtrl.exportExcel(),
      copyCell: (rowId, field) => this.clipboard.copyCell(rowId, field),
      copyRow: (rowId) => this.clipboard.copyRow(rowId),
      copyCellRange: (includeHeaders) => this.clipboard.copyCellRange(includeHeaders),
      copySelectedRows: (includeHeaders) => this.clipboard.copySelectedRows(includeHeaders),
      selectRow: (rowId) => {
        const row = this.visibleRows.find(r => r.__id === rowId);
        if (row) this.selection.toggleRowSelection(row);
      },
      selectAll: () => this._selectAll(),
      handleRowAction: (actionId, row) => this._handleRowAction(actionId, row),
    };
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (ForcedColorsAdapter.detect()) {
      ForcedColorsAdapter.applyForcedColorsStyles(this as unknown as HTMLElement);
    }
    this.forcedColorsCleanup = ForcedColorsAdapter.onChange((active) => {
      if (active) ForcedColorsAdapter.applyForcedColorsStyles(this as unknown as HTMLElement);
      else ForcedColorsAdapter.removeForcedColorsStyles(this as unknown as HTMLElement);
    }) ?? null;
    this.resizeObserver = new ResizeObserver(() => this.requestUpdate());
    this.resizeObserver.observe(this);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.forcedColorsCleanup?.();
    this.resizeObserver?.disconnect();
    this.keyboardNav?.detach();
  }

  override firstUpdated(changed: PropertyValues): void {
    this.gridCore.initializeGrid();
    this.isInitialized = this.gridCore.isInitialized;
    this.columnDefs = this.gridCore.resolveColumnDefs();
    if (this.gridApi) {
      this.keyboardNav = new KeyboardNavigator(this.gridApi, this.columnDefs, this._keyboardCallbacks());
    }
  }

  /** Sync derived @state before render — avoids "update scheduled after update" warning */
  override willUpdate(changed: PropertyValues): void {
    const dataChanged = changed.has('data') || changed.has('dataSet');
    const columnsChanged = changed.has('columns');
    if (dataChanged || columnsChanged) {
      this.gridCore.onDataOrColumnsChanged(dataChanged);
      this.columnDefs = this.gridCore.resolveColumnDefs();
      this.filter.invalidateCache();
      this._syncGrouping();
    }
    if (changed.has('groupBy') || changed.has('groupByLevels')) {
      this._syncGrouping();
    }
  }

  override updated(changed: PropertyValues): void {
    if (changed.has('data') || changed.has('columns') || changed.has('dataSet')) {
      // Update virtual scroller when data changes
      if (this.virtualScroll.isVirtual) {
        this.virtualScroll.setTotalRows(this.filter.filteredRows.length);
      }
    }
    if (changed.has('queryBackend') && this.gridApi) {
      this.gridApi.setQueryBackend(this.queryBackend ?? null);
    }
    if (changed.has('progressiveLoad') && this.gridApi) {
      // Progressive load config changes require re-initialization through setQueryBackend
      if (this.queryBackend) {
        this.gridApi.setQueryBackend(this.queryBackend);
      }
    }
    if (changed.has('conditionalFormattingRules')) {
      this.cfCtrl.setRules(this.conditionalFormattingRules);
    }
    if (changed.has('remoteDataSource') || changed.has('scrollMode') || changed.has('fetchPageSize') || changed.has('prefetchPages')) {
      this.virtualScroll.applyEffectiveScrollMode(this.filter.filteredRows.length);
    }
  }

  private _keyboardCallbacks(): KeyboardNavigatorCallbacks {
    return {
      onCopy: () => {
        if (this.selection.cellRangeAnchor && this.selection.cellRangeEnd) {
          this.clipboard.copyCellRange(false);
        } else if (this.selectedRowIds.size > 0) {
          this.clipboard.copySelectedRows(false);
        }
      },
      onSelectAll: () => this._selectAll(),
      onRangeExtend: (dir) => this.selection.extendCellRange(dir, this.visibleRows.length, this.columnDefs.filter(c => !c.hidden).length),
      onEscape: () => {
        this.edit.cancelInlineEdit();
        this.contextMenu.close();
        this.filter.filterOpen = false;
      },
    };
  }

  private _sortBy(field: string, dir: 'asc' | 'desc' | null): void {
    if (!this.gridApi) return;
    if (dir === null) {
      this.gridApi.clearSort();
    } else {
      this.gridApi.sort(field, dir);
    }
    this.filter.invalidateCache();
    this.currentPage = 0;
    this.ariaManager?.announceChange(`Sort ${field} ${dir ?? 'cleared'}`);
  }

  private async _ensureContextMenu(): Promise<void> {
    if (!customElements.get('phz-context-menu')) await import('./phz-context-menu.js');
  }
  private async _ensureFilterPopover(): Promise<void> {
    if (!customElements.get('phz-filter-popover')) await import('./phz-filter-popover.js');
  }
  private async _ensureColumnChooser(): Promise<void> {
    if (!customElements.get('phz-column-chooser')) await import('./phz-column-chooser.js');
  }
  private async _ensureChartPopover(): Promise<void> {
    if (!customElements.get('phz-chart-popover')) await import('./phz-chart-popover.js');
  }

  private async _openFilterForField(field: string, e?: MouseEvent): Promise<void> {
    if (!this.gridApi || !this.allowFiltering) return;
    await this._ensureFilterPopover();
    this.filter.openFilterPopover(field, e);
  }

  private _removeFilter(field: string): void {
    if (!this.gridApi) return;
    this.gridApi.removeFilter(field);
    this.activeFilters.delete(field);
    this.filter.invalidateCache();
    this.currentPage = 0;
    this.requestUpdate();
  }

  private _clearAllFilters(): void {
    if (!this.gridApi) return;
    this.gridApi.clearFilters();
    this.activeFilters.clear();
    this.filter.invalidateCache();
    this.currentPage = 0;
    this.requestUpdate();
  }

  private _handleFilterApply(e: CustomEvent<FilterApplyEvent>): void {
    this.filter.handleFilterApply(e.detail, () => { this.currentPage = 0; });
    this.activeFilters = this.filter.activeFilters;
  }

  private _handleSearchInput(e: Event): void {
    this.filter.onSearchChange = () => { this.currentPage = 0; };
    this.filter.handleSearchInput((e.target as HTMLInputElement).value);
  }

  //Grouping (delegates to GroupController)

  private _syncGrouping(): void {
    this.groupCtrl.applyGrouping();
    this.groups = this.groupCtrl.groups;
    this.isGrouped = this.groupCtrl.isGrouped;
  }

  private async _openChart(field: string): Promise<void> {
    await this._ensureChartPopover();
    const col = this.columnDefs.find(c => c.field === field);
    this.chartField = field;
    this.chartHeader = col?.header ?? field;
    this.chartValues = this.visibleRows.map(r => Number(r[field])).filter(n => !isNaN(n));
    this.chartLabels = this.visibleRows.map((r, i) => String(r['label'] ?? r['name'] ?? i));
    this.chartOpen = true;
  }

  //Row actions / selection

  private _handleRowAction(actionId: string, row: RowData): void {
    dispatchGridEvent(this, 'row-action', { actionId, rowId: row.__id, rowData: row as Record<string, unknown>, isBulk: false } as RowActionEventDetail);
  }

  private _selectAll(): void {
    if (!this.gridApi) return;
    this.gridApi.selectAll();
  }

  private get _displayRows(): RowData[] {
    if (this.virtualScroll.isVirtual) {
      if (this.remoteDataSource) {
        return this.virtualScroll.getRows(this.virtualScroll.virtualStartIndex, this.virtualScroll.virtualEndIndex);
      }
      return this.visibleRows.slice(this.virtualScroll.virtualStartIndex, this.virtualScroll.virtualEndIndex + 1);
    }
    const rows = this.filter.filteredRows;
    const start = this.currentPage * this.internalPageSize;
    return rows.slice(start, start + this.internalPageSize);
  }

  private get _totalPages(): number {
    return Math.ceil(this.filter.filteredRows.length / this.internalPageSize);
  }

  override render(): TemplateResult {
    if (!this.isInitialized) return html`<div class="phz-loading-placeholder"></div>`;

    const displayRows = this._displayRows;
    // Effective loading: explicit loading prop, remote data loading, or remote source configured but manager not ready
    const isEffectivelyLoading = this.loading
      || this.virtualScroll.remoteLoading
      || (!!this.remoteDataSource && !this.virtualScroll.hasRemoteManager);

    return html`
      ${this.gridTitle && this.showTitleBar ? this._renderTitleBar() : nothing}
      ${this.showToolbar ? this._renderToolbar() : nothing}
      ${this.showSelectionActions && this.selectedRowIds.size > 0 ? this._renderSelectionBar() : nothing}

      <div class="phz-grid__container"
           style="height:${this.gridHeight};width:${this.gridWidth};"
>

        ${isEffectivelyLoading && (!this.progressiveLoad || displayRows.length === 0) ? html`<div class="phz-loading-overlay" aria-busy="true" aria-label="Loading data">
          <slot name="loading"><div class="phz-loading-spinner"></div></slot>
        </div>` : nothing}

        <div class="phz-virtual-scroll-area"
             style=${this.virtualScroll.isVirtual ? `min-height:${this.virtualScroll.totalHeight}px;position:relative` : ''}>
        <table class="phz-table" role="grid"
               aria-label=${this.ariaLabels?.grid ?? 'Data grid'}
               aria-rowcount=${this.totalRowCount}
               aria-colcount=${this.columnDefs.filter(c => !c.hidden).length}
               style=${this.virtualScroll.isVirtual ? `position:absolute;top:${this.virtualScroll.virtualStartIndex * this.virtualScroll.getDensityRowHeight()}px;left:0;right:0` : ''}>
          <thead>
            ${this.columnGroups.length > 0 ? this._renderColumnGroupHeader() : nothing}
            ${this._renderHeader()}
          </thead>
          <tbody class="phz-grid__body"
                 tabindex="0"
                 @keydown=${this._handleBodyKeyDown}
                 @mouseup=${() => this.selection.handleCellMouseUp()}>
            ${this.isGrouped ? this._renderGroupedRows() : this._renderBodyRows(displayRows)}
            ${(this.aggregation && (this.aggregationPosition === 'top' || this.aggregationPosition === 'both')) ? this._renderAggregationRow('top') : nothing}
            ${(this.aggregation && (this.aggregationPosition === 'bottom' || this.aggregationPosition === 'both')) ? this._renderAggregationRow('bottom') : nothing}
          </tbody>
        </table>
        </div>

        ${!this.isGrouped && displayRows.length === 0 && !isEffectivelyLoading ? html`<div class="phz-empty-state" role="status">
          <slot name="empty-state">
            <div class="phz-empty-state__icon">\u2298</div>
            <div class="phz-empty-state__text">No data to display</div>
          </slot>
        </div>` : nothing}
      </div>

      ${this._progressivePhase === 'streaming' || this._progressivePhase === 'refreshing'
        ? html`<div class="phz-progress-bar" role="status" aria-live="polite">
            <span class="phz-loading-spinner phz-loading-spinner--small"></span>
            ${this._progressMessage}
          </div>`
        : nothing}

      ${this.showPagination && !this.virtualScroll.isVirtual ? this._renderPagination() : nothing}

      ${this.contextMenu.ctxMenuOpen ? html`
        <phz-context-menu
          .open=${this.contextMenu.ctxMenuOpen}
          .items=${this.contextMenu.ctxMenuItems}
          .x=${this.contextMenu.ctxMenuX}
          .y=${this.contextMenu.ctxMenuY}
          @select=${(e: CustomEvent<string>) => { this.contextMenu.handleContextMenuSelect(e.detail); this.contextMenu.close(); }}
          @close=${() => this.contextMenu.close()}>
        </phz-context-menu>` : nothing}

      ${this.filter.filterOpen ? html`
        <phz-filter-popover
          .open=${this.filter.filterOpen}
          .field=${this.filter.filterField}
          .values=${this.filter.filterValues}
          .columnType=${this.filter.filterColumnType}
          .anchorRect=${this.filter.filterAnchorRect}
          .activeFilter=${this.activeFilters.get(this.filter.filterField)}
          @filter-apply=${(e: CustomEvent<FilterApplyEvent>) => this._handleFilterApply(e)}
          @close=${() => { this.filter.filterOpen = false; }}>
        </phz-filter-popover>` : nothing}

      ${this.columnChooser.columnChooserOpen ? html`
        <phz-column-chooser
          .open=${this.columnChooser.columnChooserOpen}
          .columns=${this.columnDefs}
          .columnProfiles=${this.columnProfiles}
          .userRole=${this.userRole}
          @change=${(e: CustomEvent<ColumnChooserChangeEvent>) => this.columnChooser.handleColumnChooserChange(e.detail)}
          @close=${() => this.columnChooser.close()}>
        </phz-column-chooser>` : nothing}

      ${this.chartOpen ? html`
        <phz-chart-popover
          .open=${this.chartOpen}
          .field=${this.chartField}
          .header=${this.chartHeader}
          .values=${this.chartValues}
          .labels=${this.chartLabels}
          @close=${() => { this.chartOpen = false; }}>
        </phz-chart-popover>` : nothing}

      ${this.toast.toast ? html`
        <div class="phz-toast phz-toast--${this.toast.toast.type}" role="alert" aria-live="assertive">
          ${this.toast.toast.icon ? html`<svg class="phz-toast__icon" aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">${this._toastIconPath(this.toast.toast.icon)}</svg>` : html`<span class="phz-toast__dot"></span>`}
          <span class="phz-toast__message">${this.toast.toast.message}</span>
          ${this.toast.toast.dismissible ? html`<button class="phz-toast__close" aria-label="Dismiss" @click=${() => this.toast.dismiss()}>\u00D7</button>` : nothing}
        </div>` : nothing}
    `;
  }

  private _toastIconPath(icon: ToastIcon): TemplateResult {
    switch (icon) {
      case 'copy':
        return html`<path d="M5 2H11C11.55 2 12 2.45 12 3V11C12 11.55 11.55 12 11 12H5C4.45 12 4 11.55 4 11V3C4 2.45 4.45 2 5 2Z" stroke="currentColor" stroke-width="1.5"/><path d="M8 5H14C14.55 5 15 5.45 15 6V14C15 14.55 14.55 15 14 15H8C7.45 15 7 14.55 7 14V6C7 5.45 7.45 5 8 5Z" stroke="currentColor" stroke-width="1.5" fill="var(--phz-toast-icon-fill, none)"/>`;
      case 'export':
        return html`<path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 12V13C3 13.55 3.45 14 4 14H12C12.55 14 13 13.55 13 13V12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`;
      case 'check':
        return html`<path d="M3 8.5L6.5 12L13 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
      case 'error':
        return html`<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M8 5V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="11.5" r="0.75" fill="currentColor"/>`;
      case 'info':
        return html`<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M8 7V12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="4.5" r="0.75" fill="currentColor"/>`;
      default:
        return html``;
    }
  }

  private _renderTitleBar(): TemplateResult {
    return renderTitleBar({
      titleBarBg: this.titleBarBg, titleBarText: this.titleBarText, titleFontFamily: this.titleFontFamily,
      titleIcon: this.titleIcon, titleFontSize: this.titleFontSize, gridTitle: this.gridTitle,
      gridSubtitle: this.gridSubtitle, subtitleFontSize: this.subtitleFontSize, totalRowCount: this.totalRowCount, filteredRowCount: this.filteredRowCount,
    });
  }

  private _renderToolbar(): TemplateResult {
    return html`
      <phz-toolbar
        .grid=${this}
        .searchQuery=${this.filter.searchQuery}
        .activeFilters=${this.activeFilters}
        .density=${this.density}
        .showSearch=${this.showSearch}
        .showDensityToggle=${this.showDensityToggle}
        .showColumnEditor=${this.showColumnEditor}
        .showCsvExport=${this.showCsvExport}
        .showExcelExport=${this.showExcelExport}
        .showAdminSettings=${this.showAdminSettings}
        .exportIncludeFormatting=${this.exportCtrl.exportIncludeFormatting}
        .exportIncludeGroupHeaders=${this.exportCtrl.exportIncludeGroupHeaders}
        .generateDashboardConfig=${this.generateDashboardConfig}
        @toolbar-search=${(e: CustomEvent<{query: string}>) => { this.filter.onSearchChange = () => { this.currentPage = 0; }; this.filter.handleSearchInput(e.detail.query); }}
        @toolbar-filter-remove=${(e: CustomEvent<{field: string}>) => this._removeFilter(e.detail.field)}
        @toolbar-filter-clear-all=${() => this._clearAllFilters()}
        @toolbar-density-change=${(e: CustomEvent<{density: Density}>) => { this.density = e.detail.density; }}
        @toolbar-columns-open=${async () => { await this._ensureColumnChooser(); this.columnChooser.open(); }}
        @toolbar-export-csv=${() => this.exportCtrl.exportCSV()}
        @toolbar-export-excel=${() => this.exportCtrl.exportExcel()}
        @toolbar-export-formatting-change=${(e: CustomEvent<boolean>) => { this.exportCtrl.exportIncludeFormatting = e.detail; }}
        @toolbar-export-group-headers-change=${(e: CustomEvent<boolean>) => { this.exportCtrl.exportIncludeGroupHeaders = e.detail; }}
        @toolbar-generate-dashboard=${(e: CustomEvent<GenerateDashboardEventDetail>) => dispatchGridEvent(this, 'generate-dashboard', e.detail)}>
      </phz-toolbar>`;
  }

  private _renderSelectionBar(): TemplateResult {
    const count = this.selectedRowIds.size;
    return html`
      <div class="phz-selection-bar" role="status" aria-live="polite">
        <div class="phz-selection-bar__group">
          <span class="phz-selection-bar__count">${count} row${count !== 1 ? 's' : ''} selected</span>
        </div>
        <div class="phz-selection-bar__actions">
          ${this.showCopyActions ? html`
            <button class="phz-selection-bar__btn phz-selection-bar__btn--secondary"
                    @click=${() => this.clipboard.copySelectedRows(false)}>Copy</button>
            <button class="phz-selection-bar__btn phz-selection-bar__btn--secondary"
                    @click=${() => this.clipboard.copySelectedRows(true)}>Copy with Headers</button>` : nothing}
          ${this.showEditActions ? html`
            <div class="phz-selection-bar__separator"></div>
            <button class="phz-selection-bar__btn phz-selection-bar__btn--danger"
                    @click=${() => dispatchGridEvent(this, 'bulk-delete', { rowIds: [...this.selectedRowIds] })}>
              Delete
            </button>` : nothing}
          ${this.effectiveRowActions.filter(a => a.bulkEnabled).map(action => html`
            <button class="phz-selection-bar__btn phz-selection-bar__btn--default"
                    @click=${() => dispatchGridEvent(this, 'row-action', { actionId: action.id, rowId: '', rowData: {}, isBulk: true, rowIds: [...this.selectedRowIds] } as RowActionEventDetail)}>
              ${action.label}
            </button>`)}
          <button class="phz-selection-bar__btn phz-selection-bar__btn--secondary"
                  @click=${() => { this.selectedRowIds = new Set(); this.gridApi?.deselectAll(); this.requestUpdate(); }}>
            Clear
          </button>
        </div>
      </div>`;
  }

  private _renderColumnGroupHeader(): TemplateResult {
    return renderColumnGroupHeader({
      showCheckboxes: this.showCheckboxes, showRowActions: this.showRowActions,
      effectiveRowActions: this.effectiveRowActions, columnGroups: this.columnGroups, columnDefs: this.columnDefs,
    });
  }

  private _renderHeader(): TemplateResult {
    const visibleCols = this.columnDefs.filter(c => !c.hidden);
    const pinOverrides = this.gridApi?.getState()?.columns?.pinOverrides;
    const pinned = splitPinnedColumns(this.columnDefs, pinOverrides);
    const leftOffsets = computePinnedOffsets(pinned.left, 'left');
    const rightOffsets = computePinnedOffsets(pinned.right, 'right');
    return html`
      <tr class="phz-thead-row">
        ${this.showCheckboxes ? html`
          <th class="phz-header-cell phz-header-cell--checkbox" style="width:40px">
            <input type="checkbox"
                   aria-label="Select all rows"
                   .checked=${this.selectedRowIds.size === this.visibleRows.length && this.visibleRows.length > 0}
                   @change=${(e: Event) => {
                     if ((e.target as HTMLInputElement).checked) this._selectAll();
                     else { this.selectedRowIds = new Set(); this.gridApi?.deselectAll(); this.requestUpdate(); }
                   }}>
          </th>` : nothing}
        ${visibleCols.map((col, idx) => this._renderHeaderCell(col, idx, pinned.left, leftOffsets, pinned.right, rightOffsets))}
        ${(this.showRowActions && this.effectiveRowActions.length > 0) ? html`<th class="phz-header-cell" style="width:40px"></th>` : nothing}
      </tr>`;
  }

  private _renderHeaderCell(
    col: ColumnDefinition, idx: number,
    leftCols: ColumnDefinition[] = [], leftOffsets: number[] = [],
    rightCols: ColumnDefinition[] = [], rightOffsets: number[] = [],
  ): TemplateResult {
    const sortInfo = this.sortColumns.find(s => s.field === col.field);
    const sortIcon = sortInfo?.direction === 'asc' ? '\u2191' : sortInfo?.direction === 'desc' ? '\u2193' : '';
    const isFiltered = this.activeFilters.has(col.field);
    const colWidth = col.width ? `width:${col.width}px;min-width:${col.width}px` : '';
    const leftIdx = leftCols.findIndex(c => c.field === col.field);
    const rightIdx = rightCols.findIndex(c => c.field === col.field);
    const pinStyle = leftIdx >= 0 ? getPinnedStyle(col, leftOffsets[leftIdx], 'left')
      : rightIdx >= 0 ? getPinnedStyle(col, rightOffsets[rightIdx], 'right') : '';
    const pinClass = leftIdx >= 0 ? ' phz-header-cell--pinned-left'
      : rightIdx >= 0 ? ' phz-header-cell--pinned-right' : '';
    const isLastLeft = leftIdx >= 0 && leftIdx === leftCols.length - 1;
    const isFirstRight = rightIdx === 0;
    const borderClass = isLastLeft ? ' phz-header-cell--pinned-last-left'
      : isFirstRight ? ' phz-header-cell--pinned-first-right' : '';
    return html`
      <th class="phz-header-cell${pinClass}${borderClass}"
          data-field=${col.field}
          data-col=${idx}
          aria-sort=${sortInfo ? (sortInfo.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
          style="${colWidth}${pinStyle}"
          @click=${this.allowSorting ? (e: MouseEvent) => this.sort.handleHeaderClick(col, e) : nothing}
          @contextmenu=${async (e: MouseEvent) => { e.preventDefault(); await this._ensureContextMenu(); this.contextMenu.handleHeaderContextMenu(e, col); }}>
        <div class="phz-header-inner">
          <span class="phz-header-label">${col.header ?? col.field}</span>
          ${sortIcon ? html`<span class="phz-sort-icon" aria-hidden="true">${sortIcon}</span>` : nothing}
          ${this.allowFiltering ? html`
            <button class="phz-filter-btn ${isFiltered ? 'phz-filter-btn--active' : ''}"
                    aria-label="Filter ${col.header ?? col.field}"
                    aria-pressed=${isFiltered}
                    @click=${(e: MouseEvent) => { e.stopPropagation(); this._openFilterForField(col.field, e); }}>
              \u25BD
            </button>` : nothing}
        </div>
        <div class="phz-resize-handle"
             @mousedown=${(e: MouseEvent) => this.columnResize.startResize(e, col.field)}>
        </div>
      </th>`;
  }

  private _renderBodyRows(rows: RowData[]): TemplateResult {
    return html`${repeat(rows, r => r.__id, (row, rowIdx) => this._renderRow(row, rowIdx))}`;
  }

  private _renderRow(row: RowData, rowIdx: number): TemplateResult {
    const isSelected = this.selectedRowIds.has(row.__id);
    const isFocused = this.focusedRowId === row.__id;
    const visibleCols = this.columnDefs.filter(c => !c.hidden);
    const pinOverrides = this.gridApi?.getState()?.columns?.pinOverrides;
    const pinned = splitPinnedColumns(this.columnDefs, pinOverrides);
    const leftOffsets = computePinnedOffsets(pinned.left, 'left');
    const rightOffsets = computePinnedOffsets(pinned.right, 'right');
    return html`
      <tr class="phz-data-row ${isSelected ? 'phz-data-row--selected' : ''} ${isFocused ? 'phz-data-row--focused' : ''}"
          aria-selected=${isSelected}
          aria-rowindex=${rowIdx + 1}
          data-row-id=${row.__id}
          @click=${(e: MouseEvent) => { this.focusedRowId = row.__id; this.selection.handleRowClick(e, row); }}
          @dblclick=${(e: MouseEvent) => { if (this.editMode === 'dblclick') { const td = (e.target as HTMLElement).closest('td[data-field]'); const field = td?.getAttribute('data-field') ?? visibleCols[0]?.field ?? ''; this.edit.startInlineEdit(row, field); } }}
          @contextmenu=${async (e: MouseEvent) => { e.preventDefault(); await this._ensureContextMenu(); this.contextMenu.handleBodyContextMenu(e, row); }}>
        ${this.showCheckboxes ? html`
          <td class="phz-data-cell phz-data-cell--checkbox">
            <input type="checkbox" aria-label="Select row"
                   .checked=${isSelected}
                   @change=${() => this.selection.toggleRowSelection(row)}>
          </td>` : nothing}
        ${visibleCols.map((col, colIdx) => this._renderCell(row, col, rowIdx, colIdx, pinned.left, leftOffsets, pinned.right, rightOffsets))}
        ${(this.showRowActions && this.effectiveRowActions.length > 0) ? this._renderRowActionsCell(row) : nothing}
      </tr>`;
  }

  private _renderCell(
    row: RowData, col: ColumnDefinition, rowIdx: number, colIdx: number,
    leftCols: ColumnDefinition[] = [], leftOffsets: number[] = [],
    rightCols: ColumnDefinition[] = [], rightOffsets: number[] = [],
  ): TemplateResult {
    const isEditing = this.edit.isEditing(row.__id, col.field);
    const isInRange = this.selection.isCellInRange(rowIdx, colIdx);
    const cfStyle: ComputedCellStyle = this.cfCtrl.getCellConditionalStyle(col.valueGetter ? col.valueGetter(row as any) : row[col.field], col.field, row) ?? {};
    const anomaly = this.cfCtrl.getAnomalyResult(row.__id, col.field);
    const customStyle = this.columnStyles[col.field] ?? '';
    const leftIdx = leftCols.findIndex(c => c.field === col.field);
    const rightIdx = rightCols.findIndex(c => c.field === col.field);
    const pinStyle = leftIdx >= 0 ? getPinnedStyle(col, leftOffsets[leftIdx], 'left')
      : rightIdx >= 0 ? getPinnedStyle(col, rightOffsets[rightIdx], 'right') : '';
    const pinClass = leftIdx >= 0 ? ' phz-data-cell--pinned-left'
      : rightIdx >= 0 ? ' phz-data-cell--pinned-right' : '';
    const isLastLeft = leftIdx >= 0 && leftIdx === leftCols.length - 1;
    const isFirstRight = rightIdx === 0;
    const borderClass = isLastLeft ? ' phz-data-cell--pinned-last-left'
      : isFirstRight ? ' phz-data-cell--pinned-first-right' : '';

    if (isEditing) {
      return html`
        <td class="phz-data-cell phz-data-cell--editing${pinClass}${borderClass}" data-col=${colIdx}
            style="${pinStyle}">
          <input class="phz-cell-editor"
                 .value=${this.edit.editValue}
                 @input=${(e: Event) => { this.edit.editValue = (e.target as HTMLInputElement).value; }}
                 @blur=${(e: FocusEvent) => this.edit.commitInlineEdit((e.target as HTMLInputElement).value)}
                 @keydown=${(e: KeyboardEvent) => {
                   if (e.key === 'Enter') this.edit.commitInlineEdit((e.target as HTMLInputElement).value);
                   if (e.key === 'Escape') this.edit.cancelInlineEdit();
                 }}>
        </td>`;
    }

    const rawVal = col.valueGetter ? col.valueGetter(row as any) : row[col.field];
    const displayVal = this._formatCellValue(rawVal, col);

    return html`
      <td class="phz-data-cell${pinClass}${borderClass} ${isInRange ? 'phz-data-cell--in-range' : ''} ${anomaly?.type === 'outlier' ? 'phz-data-cell--anomaly' : ''}"
          data-col=${colIdx}
          data-field=${col.field}
          style="${pinStyle}${customStyle}${cfStyle.backgroundColor ? `background:${cfStyle.backgroundColor};` : ''}${cfStyle.color ? `color:${cfStyle.color};` : ''}"
          @mousedown=${(e: MouseEvent) => { this.selection.handleCellMouseDown(e, rowIdx, colIdx); this._focusBody(); }}
          @mousemove=${(e: MouseEvent) => this.selection.handleCellMouseMove(e, rowIdx, colIdx)}
          @click=${() => { if (this.editMode === 'click') this.edit.startInlineEdit(row, col.field); this._handleCellDrillThrough(row, col); }}>
        ${displayVal}
      </td>`;
  }

  private _renderRowActionsCell(row: RowData): TemplateResult {
    return html`
      <td class="phz-data-cell phz-data-cell--actions">
        ${this.effectiveRowActions.slice(0, 3).map(action => html`
          <button class="phz-row-action-btn phz-row-action-btn--${action.variant ?? 'default'}"
                  title=${action.label}
                  aria-label=${action.label}
                  @click=${(e: MouseEvent) => { e.stopPropagation(); this._handleRowAction(action.id, row); }}>
            ${action.icon ?? action.label}
          </button>`)}
      </td>`;
  }

  private _renderGroupedRows(): TemplateResult {
    return renderGroupedRows({
      groups: this.groups, columnDefs: this.columnDefs, groupTotals: this.groupTotals,
      groupTotalsFn: this.groupTotalsFn, groupTotalsOverrides: this.groupTotalsOverrides,
      aggCtrl: this.aggCtrl, renderRow: (row, idx) => this._renderRow(row, idx),
    });
  }

  private _renderAggregationRow(position: 'top' | 'bottom'): TemplateResult {
    const visibleCols = this.columnDefs.filter(c => !c.hidden);
    const rows = this.filter.filteredRows as Record<string, unknown>[];
    return html`
      <tr class="phz-aggregation-row phz-aggregation-row--${position}">
        ${this.showCheckboxes ? html`<td class="phz-data-cell"></td>` : nothing}
        ${visibleCols.map(col => {
          const val = this.aggCtrl.computeColumnAgg(rows, col, this.aggregationFn);
          return html`<td class="phz-data-cell phz-data-cell--agg">${val}</td>`;
        })}
        ${(this.showRowActions && this.effectiveRowActions.length > 0) ? html`<td class="phz-data-cell"></td>` : nothing}
      </tr>`;
  }

  private _renderPagination(): TemplateResult {
    return renderPagination({
      filteredRowCount: this.filter.filteredRows.length, currentPage: this.currentPage,
      totalPages: this._totalPages, pageSize: this.internalPageSize, pageSizeOptions: this.pageSizeOptions,
      align: this.paginationAlign,
      onPageChange: (p) => { this.currentPage = p; },
      onPageSizeChange: (s) => { this.internalPageSize = s; this.currentPage = 0; },
    });
  }




  private _formatCellValue(value: unknown, col: ColumnDefinition): string {
    return formatCellValue(value, col, {
      numberFormats: this.numberFormats,
      dateFormats: this.dateFormats,
      compactNumbers: this.compactNumbers,
      locale: this.locale,
    });
  }

  //Drill-through

  private _handleCellDrillThrough(row: RowData, col: ColumnDefinition): void {
    if (!this.drillThroughConfig) return;
    const drillFields = this.drillThroughConfig.filterFields ?? [];
    if (drillFields.length > 0 && !drillFields.includes(col.field)) return;
    const source: GridRowDrillSource = { type: 'grid-row', rowData: row as Record<string, unknown>, field: col.field, value: row[col.field] };
    dispatchGridEvent(this, 'drill-through', { source, config: this.drillThroughConfig, field: col.field, value: row[col.field] });
  }

  private _handleBodyKeyDown(e: KeyboardEvent): void {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'c') {
        e.preventDefault(); // Always prevent native copy inside grid body
        if (this.selection.cellRangeAnchor && this.selection.cellRangeEnd) {
          this.clipboard.copyCellRange(false);
        } else if (this.selectedRowIds.size > 0) {
          this.clipboard.copySelectedRows(false);
        } else if (this.focusedRowId) {
          // Fallback: copy the focused/clicked row when no explicit selection
          this.clipboard.copyRow(this.focusedRowId);
        }
        return;
      }
      if (e.key === 'a') {
        e.preventDefault();
        this._selectAll();
        return;
      }
    }
    this.keyboardNav?.handleKeyDown(e);
  }

  /** Focus the tbody so keyboard shortcuts (Ctrl+C, arrow keys, etc.) work. */
  private _focusBody(): void {
    const body = this.renderRoot.querySelector('.phz-grid__body') as HTMLElement | null;
    if (body && document.activeElement !== body) body.focus({ preventScroll: true });
  }

  getVisibleRows(): RowData[] { return this.visibleRows; }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-grid': PhzGrid;
  }
}
