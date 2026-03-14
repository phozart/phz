var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * @phozart/grid — <phz-grid> Custom Element
 *
 * God Object refactored into Lit Reactive Controllers.
 * Rendering and public API live here; behaviour delegates to controllers.
 */
import { LitElement, html, nothing } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { KeyboardNavigator } from '../a11y/keyboard-navigator.js';
import { ForcedColorsAdapter } from '../a11y/forced-colors-adapter.js';
import { dispatchGridEvent } from '../events.js';
import { formatCellValue } from '../formatters/cell-formatter.js';
// Controllers
import { ToastController, ColumnResizeController, EditController, SortController, SelectionController, FilterController, VirtualScrollController, ExportController, ContextMenuController, ClipboardController, ConditionalFormattingController, AggregationController, GroupController, ColumnChooserController, ComputedColumnsController, GridCoreController, TooltipController, } from '../controllers/index.js';
// Styles & templates
import { phzGridStyles } from './phz-grid.styles.js';
import { renderTitleBar, renderPagination, renderGroupedRows, renderColumnGroupHeader } from './phz-grid.templates.js';
import { splitPinnedColumns, computePinnedOffsets, getPinnedStyle } from '../utils/column-pinning.js';
// Eager sub-component (always rendered when toolbar is visible)
import './phz-toolbar.js';
let PhzGrid = class PhzGrid extends LitElement {
    constructor() {
        // --- Public properties ---
        super(...arguments);
        this.data = [];
        this.columns = [];
        this.theme = 'auto';
        this.locale = 'en-US';
        this.responsive = true;
        this.virtualization = true;
        this.selectionMode = 'single';
        this.editMode = 'dblclick';
        this.ariaLabels = {};
        this.loading = false;
        this.gridHeight = 'auto';
        this.gridWidth = '100%';
        this.density = 'compact';
        this.fontFamily = 'inherit';
        this.fontSize = 13;
        this.containerShadow = 'lg';
        this.containerRadius = 16;
        this.aggregation = false;
        this.aggregationFn = 'sum';
        this.showRowActions = false;
        this.showCheckboxes = false;
        this.enableAnomalyDetection = false;
        this.conditionalFormattingRules = [];
        this.columnProfiles = [];
        this.showToolbar = true;
        this.showDensityToggle = true;
        this.showColumnEditor = true;
        this.showSearch = true;
        this.showCsvExport = true;
        this.showExcelExport = true;
        this.showAdminSettings = false;
        this.showPagination = true;
        this.paginationAlign = 'right';
        this.pageSizeOptions = [5, 10, 20, 50];
        this.pageSize = 10;
        this.gridTitle = '';
        this.gridSubtitle = '';
        this.titleFontFamily = 'inherit';
        this.titleFontSize = 14;
        this.subtitleFontSize = 13;
        this.titleBarBg = '#1C1917';
        this.titleBarText = '#FEFDFB';
        this.titleIcon = '';
        this.showTitleBar = true;
        this.showSelectionActions = true;
        this.loadingMode = 'paginate';
        this.scrollMode = 'paginate';
        this.fetchPageSize = 100;
        this.prefetchPages = 2;
        this.virtualScrollThreshold = 0;
        this.allowFiltering = true;
        this.allowSorting = true;
        this.defaultSortField = '';
        this.defaultSortDirection = 'asc';
        this.sortDebounceMs = 0;
        this.headerWrapping = false;
        this.autoSizeColumns = false;
        this.columnGroups = [];
        this.rowBanding = false;
        this.statusColors = {};
        this.barThresholds = [];
        this.dateFormats = {};
        this.columnStyles = {};
        this.numberFormats = {};
        this.columnFormatting = {};
        this.userRole = 'user';
        this.computedColumns = [];
        this.copyHeaders = true;
        this.copyFormatted = false;
        this.showEditActions = true;
        this.showCopyActions = true;
        this.maxCopyRows = 0;
        this.excludeFieldsFromCopy = [];
        this.groupBy = [];
        this.groupByLevels = [];
        this.groupTotals = false;
        this.groupTotalsFn = 'sum';
        this.groupTotalsOverrides = {};
        this.gridLines = 'horizontal';
        this.gridLineColor = '#E7E5E4';
        this.gridLineWidth = 'thin';
        this.bandingColor = '#FAFAF9';
        this.hoverHighlight = true;
        this.cellTextOverflow = 'wrap';
        this.compactNumbers = false;
        this.headerBg = '#FAFAF9';
        this.headerText = '#A8A29E';
        this.bodyBg = '#FFFFFF';
        this.bodyText = '#1C1917';
        this.footerBg = '#FAFAF9';
        this.footerText = '#78716C';
        this.aggregationPosition = 'bottom';
        this.showSummary = false;
        this.summaryFunction = 'sum';
        this.rowActions = [];
        this.enableCellTooltips = true;
        this.tooltipDelay = 300;
        // --- Internal state ---
        this.visibleRows = [];
        this.columnDefs = [];
        this.selectedRowIds = new Set();
        this.sortColumns = [];
        this.totalRowCount = 0;
        this.isInitialized = false;
        this.activeFilters = new Map();
        this.currentPage = 0;
        this.internalPageSize = 10;
        this.focusedRowId = null;
        this.chartOpen = false;
        this.chartField = '';
        this.chartHeader = '';
        this.chartValues = [];
        this.chartLabels = [];
        this._progressMessage = '';
        // Grouped rows (mirrored from GroupController for render)
        this.groups = [];
        this.isGrouped = false;
        this.keyboardNav = null;
        this.forcedColorsCleanup = null;
        this.resizeObserver = null;
        // --- Controllers ---
        this.toast = new ToastController(this);
        this.columnResize = new ColumnResizeController(this);
        this.edit = new EditController(this);
        this.sort = new SortController(this);
        this.selection = new SelectionController(this);
        this.filter = new FilterController(this);
        this.virtualScroll = new VirtualScrollController(this);
        this.exportCtrl = new ExportController(this);
        this.contextMenu = new ContextMenuController(this);
        this.clipboard = new ClipboardController(this);
        this.cfCtrl = new ConditionalFormattingController(this);
        this.aggCtrl = new AggregationController(this);
        this.groupCtrl = new GroupController(this);
        this.columnChooser = new ColumnChooserController(this);
        this.computedColumnsCtrl = new ComputedColumnsController(this);
        this.gridCore = new GridCoreController(this);
        this.tooltipCtrl = new TooltipController(this);
    }
    // DataSet-derived state (delegated to GridCoreController)
    get _dataSetMeta() { return this.gridCore._dataSetMeta; }
    get cellRangeAnchor() { return this.selection?.cellRangeAnchor ?? null; }
    get cellRangeEnd() { return this.selection?.cellRangeEnd ?? null; }
    // --- Internal references ---
    get gridApi() { return this.gridCore.gridApi; }
    /** Public method for framework wrappers to access the GridApi. */
    getGridApi() {
        return this.gridApi;
    }
    get ariaManager() { return this.gridCore.ariaManager; }
    static { this.slots = {
        header: 'Custom header bar content',
        footer: 'Custom footer content',
        'empty-state': 'Content shown when no data',
        loading: 'Custom loading indicator',
        toolbar: 'Custom toolbar (overrides built-in)',
    }; }
    static { this.styles = phzGridStyles; }
    // --- Controller host accessors ---
    get effectiveRowActions() {
        return this.rowActions ?? [];
    }
    get filteredRowCount() {
        return this.filter.filteredRows.length;
    }
    setColumnDefs(defs) {
        this.columnDefs = defs;
        this.requestUpdate();
    }
    get filteredRows() {
        return this.filter.filteredRows;
    }
    onStateSync(payload) {
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
    onProgressUpdate(phase, message) {
        this._progressivePhase = phase;
        this._progressMessage = message;
        this.requestUpdate();
    }
    onInitialized() {
        if (this.autoSizeColumns) {
            this.updateComplete.then(() => this.columnResize.autoSizeAllColumns());
        }
        this.virtualScroll.applyEffectiveScrollMode(this.filter.filteredRows.length);
    }
    /** Command bus for ContextMenuController */
    get commands() {
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
                if (row)
                    this.selection.toggleRowSelection(row);
            },
            selectAll: () => this._selectAll(),
            handleRowAction: (actionId, row) => this._handleRowAction(actionId, row),
        };
    }
    connectedCallback() {
        super.connectedCallback();
        if (ForcedColorsAdapter.detect()) {
            ForcedColorsAdapter.applyForcedColorsStyles(this);
        }
        this.forcedColorsCleanup = ForcedColorsAdapter.onChange((active) => {
            if (active)
                ForcedColorsAdapter.applyForcedColorsStyles(this);
            else
                ForcedColorsAdapter.removeForcedColorsStyles(this);
        }) ?? null;
        this.resizeObserver = new ResizeObserver(() => this.requestUpdate());
        this.resizeObserver.observe(this);
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        this.forcedColorsCleanup?.();
        this.resizeObserver?.disconnect();
        this.keyboardNav?.detach();
    }
    firstUpdated(changed) {
        this.gridCore.initializeGrid();
        this.isInitialized = this.gridCore.isInitialized;
        this.columnDefs = this.gridCore.resolveColumnDefs();
        if (this.gridApi) {
            this.keyboardNav = new KeyboardNavigator(this.gridApi, this.columnDefs, this._keyboardCallbacks());
        }
    }
    /** Sync derived @state before render — avoids "update scheduled after update" warning */
    willUpdate(changed) {
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
    updated(changed) {
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
    _keyboardCallbacks() {
        return {
            onCopy: () => {
                if (this.selection.cellRangeAnchor && this.selection.cellRangeEnd) {
                    this.clipboard.copyCellRange(false);
                }
                else if (this.selectedRowIds.size > 0) {
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
    _sortBy(field, dir) {
        if (!this.gridApi)
            return;
        if (dir === null) {
            this.gridApi.clearSort();
        }
        else {
            this.gridApi.sort(field, dir);
        }
        this.filter.invalidateCache();
        this.currentPage = 0;
        this.ariaManager?.announceChange(`Sort ${field} ${dir ?? 'cleared'}`);
    }
    async _ensureContextMenu() {
        if (!customElements.get('phz-context-menu'))
            await import('./phz-context-menu.js');
    }
    async _ensureFilterPopover() {
        if (!customElements.get('phz-filter-popover'))
            await import('./phz-filter-popover.js');
    }
    async _ensureColumnChooser() {
        if (!customElements.get('phz-column-chooser'))
            await import('./phz-column-chooser.js');
    }
    async _ensureChartPopover() {
        if (!customElements.get('phz-chart-popover'))
            await import('./phz-chart-popover.js');
    }
    async _openFilterForField(field, e) {
        if (!this.gridApi || !this.allowFiltering)
            return;
        await this._ensureFilterPopover();
        this.filter.openFilterPopover(field, e);
    }
    _removeFilter(field) {
        if (!this.gridApi)
            return;
        this.gridApi.removeFilter(field);
        this.activeFilters.delete(field);
        this.filter.invalidateCache();
        this.currentPage = 0;
        this.requestUpdate();
    }
    _clearAllFilters() {
        if (!this.gridApi)
            return;
        this.gridApi.clearFilters();
        this.activeFilters.clear();
        this.filter.invalidateCache();
        this.currentPage = 0;
        this.requestUpdate();
    }
    _handleFilterApply(e) {
        this.filter.handleFilterApply(e.detail, () => { this.currentPage = 0; });
        this.activeFilters = this.filter.activeFilters;
    }
    _handleSearchInput(e) {
        this.filter.onSearchChange = () => { this.currentPage = 0; };
        this.filter.handleSearchInput(e.target.value);
    }
    //Grouping (delegates to GroupController)
    _syncGrouping() {
        this.groupCtrl.applyGrouping();
        this.groups = this.groupCtrl.groups;
        this.isGrouped = this.groupCtrl.isGrouped;
    }
    async _openChart(field) {
        await this._ensureChartPopover();
        const col = this.columnDefs.find(c => c.field === field);
        this.chartField = field;
        this.chartHeader = col?.header ?? field;
        this.chartValues = this.visibleRows.map(r => Number(r[field])).filter(n => !isNaN(n));
        this.chartLabels = this.visibleRows.map((r, i) => String(r['label'] ?? r['name'] ?? i));
        this.chartOpen = true;
    }
    //Row actions / selection
    _handleRowAction(actionId, row) {
        dispatchGridEvent(this, 'row-action', { actionId, rowId: row.__id, rowData: row, isBulk: false });
    }
    _selectAll() {
        if (!this.gridApi)
            return;
        this.gridApi.selectAll();
    }
    get _displayRows() {
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
    get _totalPages() {
        return Math.ceil(this.filter.filteredRows.length / this.internalPageSize);
    }
    render() {
        if (!this.isInitialized)
            return html `<div class="phz-loading-placeholder"></div>`;
        const displayRows = this._displayRows;
        // Effective loading: explicit loading prop, remote data loading, or remote source configured but manager not ready
        const isEffectivelyLoading = this.loading
            || this.virtualScroll.remoteLoading
            || (!!this.remoteDataSource && !this.virtualScroll.hasRemoteManager);
        return html `
      ${this.gridTitle && this.showTitleBar ? this._renderTitleBar() : nothing}
      ${this.showToolbar ? this._renderToolbar() : nothing}
      ${this.showSelectionActions && this.selectedRowIds.size > 0 ? this._renderSelectionBar() : nothing}

      <div class="phz-grid__container"
           style="height:${this.gridHeight};width:${this.gridWidth};"
>

        ${isEffectivelyLoading && (!this.progressiveLoad || displayRows.length === 0) ? html `<div class="phz-loading-overlay" aria-busy="true" aria-label="Loading data">
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

        ${!this.isGrouped && displayRows.length === 0 && !isEffectivelyLoading ? html `<div class="phz-empty-state" role="status">
          <slot name="empty-state">
            <div class="phz-empty-state__icon">\u2298</div>
            <div class="phz-empty-state__text">No data to display</div>
          </slot>
        </div>` : nothing}
      </div>

      ${this._progressivePhase === 'streaming' || this._progressivePhase === 'refreshing'
            ? html `<div class="phz-progress-bar" role="status" aria-live="polite">
            <span class="phz-loading-spinner phz-loading-spinner--small"></span>
            ${this._progressMessage}
          </div>`
            : nothing}

      ${this.showPagination && !this.virtualScroll.isVirtual ? this._renderPagination() : nothing}

      ${this.contextMenu.ctxMenuOpen ? html `
        <phz-context-menu
          .open=${this.contextMenu.ctxMenuOpen}
          .items=${this.contextMenu.ctxMenuItems}
          .x=${this.contextMenu.ctxMenuX}
          .y=${this.contextMenu.ctxMenuY}
          @select=${(e) => { this.contextMenu.handleContextMenuSelect(e.detail); this.contextMenu.close(); }}
          @close=${() => this.contextMenu.close()}>
        </phz-context-menu>` : nothing}

      ${this.filter.filterOpen ? html `
        <phz-filter-popover
          .open=${this.filter.filterOpen}
          .field=${this.filter.filterField}
          .values=${this.filter.filterValues}
          .columnType=${this.filter.filterColumnType}
          .anchorRect=${this.filter.filterAnchorRect}
          .activeFilter=${this.activeFilters.get(this.filter.filterField)}
          @filter-apply=${(e) => this._handleFilterApply(e)}
          @close=${() => { this.filter.filterOpen = false; }}>
        </phz-filter-popover>` : nothing}

      ${this.columnChooser.columnChooserOpen ? html `
        <phz-column-chooser
          .open=${this.columnChooser.columnChooserOpen}
          .columns=${this.columnDefs}
          .columnProfiles=${this.columnProfiles}
          .userRole=${this.userRole}
          @change=${(e) => this.columnChooser.handleColumnChooserChange(e.detail)}
          @close=${() => this.columnChooser.close()}>
        </phz-column-chooser>` : nothing}

      ${this.chartOpen ? html `
        <phz-chart-popover
          .open=${this.chartOpen}
          .field=${this.chartField}
          .header=${this.chartHeader}
          .values=${this.chartValues}
          .labels=${this.chartLabels}
          @close=${() => { this.chartOpen = false; }}>
        </phz-chart-popover>` : nothing}

      ${this.toast.toast ? html `
        <div class="phz-toast phz-toast--${this.toast.toast.type}" role="alert" aria-live="assertive">
          ${this.toast.toast.icon ? html `<svg class="phz-toast__icon" aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">${this._toastIconPath(this.toast.toast.icon)}</svg>` : html `<span class="phz-toast__dot"></span>`}
          <span class="phz-toast__message">${this.toast.toast.message}</span>
          ${this.toast.toast.dismissible ? html `<button class="phz-toast__close" aria-label="Dismiss" @click=${() => this.toast.dismiss()}>\u00D7</button>` : nothing}
        </div>` : nothing}
    `;
    }
    _toastIconPath(icon) {
        switch (icon) {
            case 'copy':
                return html `<path d="M5 2H11C11.55 2 12 2.45 12 3V11C12 11.55 11.55 12 11 12H5C4.45 12 4 11.55 4 11V3C4 2.45 4.45 2 5 2Z" stroke="currentColor" stroke-width="1.5"/><path d="M8 5H14C14.55 5 15 5.45 15 6V14C15 14.55 14.55 15 14 15H8C7.45 15 7 14.55 7 14V6C7 5.45 7.45 5 8 5Z" stroke="currentColor" stroke-width="1.5" fill="var(--phz-toast-icon-fill, none)"/>`;
            case 'export':
                return html `<path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 12V13C3 13.55 3.45 14 4 14H12C12.55 14 13 13.55 13 13V12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`;
            case 'check':
                return html `<path d="M3 8.5L6.5 12L13 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
            case 'error':
                return html `<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M8 5V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="11.5" r="0.75" fill="currentColor"/>`;
            case 'info':
                return html `<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M8 7V12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="4.5" r="0.75" fill="currentColor"/>`;
            default:
                return html ``;
        }
    }
    _renderTitleBar() {
        return renderTitleBar({
            titleBarBg: this.titleBarBg, titleBarText: this.titleBarText, titleFontFamily: this.titleFontFamily,
            titleIcon: this.titleIcon, titleFontSize: this.titleFontSize, gridTitle: this.gridTitle,
            gridSubtitle: this.gridSubtitle, subtitleFontSize: this.subtitleFontSize, totalRowCount: this.totalRowCount, filteredRowCount: this.filteredRowCount,
        });
    }
    _renderToolbar() {
        return html `
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
        @toolbar-search=${(e) => { this.filter.onSearchChange = () => { this.currentPage = 0; }; this.filter.handleSearchInput(e.detail.query); }}
        @toolbar-filter-remove=${(e) => this._removeFilter(e.detail.field)}
        @toolbar-filter-clear-all=${() => this._clearAllFilters()}
        @toolbar-density-change=${(e) => { this.density = e.detail.density; }}
        @toolbar-columns-open=${async () => { await this._ensureColumnChooser(); this.columnChooser.open(); }}
        @toolbar-export-csv=${() => this.exportCtrl.exportCSV()}
        @toolbar-export-excel=${() => this.exportCtrl.exportExcel()}
        @toolbar-export-formatting-change=${(e) => { this.exportCtrl.exportIncludeFormatting = e.detail; }}
        @toolbar-export-group-headers-change=${(e) => { this.exportCtrl.exportIncludeGroupHeaders = e.detail; }}
        @toolbar-generate-dashboard=${(e) => dispatchGridEvent(this, 'generate-dashboard', e.detail)}>
      </phz-toolbar>`;
    }
    _renderSelectionBar() {
        const count = this.selectedRowIds.size;
        return html `
      <div class="phz-selection-bar" role="status" aria-live="polite">
        <div class="phz-selection-bar__group">
          <span class="phz-selection-bar__count">${count} row${count !== 1 ? 's' : ''} selected</span>
        </div>
        <div class="phz-selection-bar__actions">
          ${this.showCopyActions ? html `
            <button class="phz-selection-bar__btn phz-selection-bar__btn--secondary"
                    @click=${() => this.clipboard.copySelectedRows(false)}>Copy</button>
            <button class="phz-selection-bar__btn phz-selection-bar__btn--secondary"
                    @click=${() => this.clipboard.copySelectedRows(true)}>Copy with Headers</button>` : nothing}
          ${this.showEditActions ? html `
            <div class="phz-selection-bar__separator"></div>
            <button class="phz-selection-bar__btn phz-selection-bar__btn--danger"
                    @click=${() => dispatchGridEvent(this, 'bulk-delete', { rowIds: [...this.selectedRowIds] })}>
              Delete
            </button>` : nothing}
          ${this.effectiveRowActions.filter(a => a.bulkEnabled).map(action => html `
            <button class="phz-selection-bar__btn phz-selection-bar__btn--default"
                    @click=${() => dispatchGridEvent(this, 'row-action', { actionId: action.id, rowId: '', rowData: {}, isBulk: true, rowIds: [...this.selectedRowIds] })}>
              ${action.label}
            </button>`)}
          <button class="phz-selection-bar__btn phz-selection-bar__btn--secondary"
                  @click=${() => { this.selectedRowIds = new Set(); this.gridApi?.deselectAll(); this.requestUpdate(); }}>
            Clear
          </button>
        </div>
      </div>`;
    }
    _renderColumnGroupHeader() {
        return renderColumnGroupHeader({
            showCheckboxes: this.showCheckboxes, showRowActions: this.showRowActions,
            effectiveRowActions: this.effectiveRowActions, columnGroups: this.columnGroups, columnDefs: this.columnDefs,
        });
    }
    _renderHeader() {
        const visibleCols = this.columnDefs.filter(c => !c.hidden);
        const pinOverrides = this.gridApi?.getState()?.columns?.pinOverrides;
        const pinned = splitPinnedColumns(this.columnDefs, pinOverrides);
        const leftOffsets = computePinnedOffsets(pinned.left, 'left');
        const rightOffsets = computePinnedOffsets(pinned.right, 'right');
        return html `
      <tr class="phz-thead-row">
        ${this.showCheckboxes ? html `
          <th class="phz-header-cell phz-header-cell--checkbox" style="width:40px">
            <input type="checkbox"
                   aria-label="Select all rows"
                   .checked=${this.selectedRowIds.size === this.visibleRows.length && this.visibleRows.length > 0}
                   @change=${(e) => {
            if (e.target.checked)
                this._selectAll();
            else {
                this.selectedRowIds = new Set();
                this.gridApi?.deselectAll();
                this.requestUpdate();
            }
        }}>
          </th>` : nothing}
        ${visibleCols.map((col, idx) => this._renderHeaderCell(col, idx, pinned.left, leftOffsets, pinned.right, rightOffsets))}
        ${(this.showRowActions && this.effectiveRowActions.length > 0) ? html `<th class="phz-header-cell" style="width:40px"></th>` : nothing}
      </tr>`;
    }
    _renderHeaderCell(col, idx, leftCols = [], leftOffsets = [], rightCols = [], rightOffsets = []) {
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
        return html `
      <th class="phz-header-cell${pinClass}${borderClass}"
          data-field=${col.field}
          data-col=${idx}
          aria-sort=${sortInfo ? (sortInfo.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
          style="${colWidth}${pinStyle}"
          @click=${this.allowSorting ? (e) => this.sort.handleHeaderClick(col, e) : nothing}
          @contextmenu=${async (e) => { e.preventDefault(); await this._ensureContextMenu(); this.contextMenu.handleHeaderContextMenu(e, col); }}>
        <div class="phz-header-inner">
          <span class="phz-header-label">${col.header ?? col.field}</span>
          ${sortIcon ? html `<span class="phz-sort-icon" aria-hidden="true">${sortIcon}</span>` : nothing}
          ${this.allowFiltering ? html `
            <button class="phz-filter-btn ${isFiltered ? 'phz-filter-btn--active' : ''}"
                    aria-label="Filter ${col.header ?? col.field}"
                    aria-pressed=${isFiltered}
                    @click=${(e) => { e.stopPropagation(); this._openFilterForField(col.field, e); }}>
              \u25BD
            </button>` : nothing}
        </div>
        <div class="phz-resize-handle"
             @mousedown=${(e) => this.columnResize.startResize(e, col.field)}>
        </div>
      </th>`;
    }
    _renderBodyRows(rows) {
        return html `${repeat(rows, r => r.__id, (row, rowIdx) => this._renderRow(row, rowIdx))}`;
    }
    _renderRow(row, rowIdx) {
        const isSelected = this.selectedRowIds.has(row.__id);
        const isFocused = this.focusedRowId === row.__id;
        const visibleCols = this.columnDefs.filter(c => !c.hidden);
        const pinOverrides = this.gridApi?.getState()?.columns?.pinOverrides;
        const pinned = splitPinnedColumns(this.columnDefs, pinOverrides);
        const leftOffsets = computePinnedOffsets(pinned.left, 'left');
        const rightOffsets = computePinnedOffsets(pinned.right, 'right');
        return html `
      <tr class="phz-data-row ${isSelected ? 'phz-data-row--selected' : ''} ${isFocused ? 'phz-data-row--focused' : ''}"
          aria-selected=${isSelected}
          aria-rowindex=${rowIdx + 1}
          data-row-id=${row.__id}
          @click=${(e) => { this.focusedRowId = row.__id; this.selection.handleRowClick(e, row); }}
          @dblclick=${(e) => { if (this.editMode === 'dblclick') {
            const td = e.target.closest('td[data-field]');
            const field = td?.getAttribute('data-field') ?? visibleCols[0]?.field ?? '';
            this.edit.startInlineEdit(row, field);
        } }}
          @contextmenu=${async (e) => { e.preventDefault(); await this._ensureContextMenu(); this.contextMenu.handleBodyContextMenu(e, row); }}>
        ${this.showCheckboxes ? html `
          <td class="phz-data-cell phz-data-cell--checkbox">
            <input type="checkbox" aria-label="Select row"
                   .checked=${isSelected}
                   @change=${() => this.selection.toggleRowSelection(row)}>
          </td>` : nothing}
        ${visibleCols.map((col, colIdx) => this._renderCell(row, col, rowIdx, colIdx, pinned.left, leftOffsets, pinned.right, rightOffsets))}
        ${(this.showRowActions && this.effectiveRowActions.length > 0) ? this._renderRowActionsCell(row) : nothing}
      </tr>`;
    }
    _renderCell(row, col, rowIdx, colIdx, leftCols = [], leftOffsets = [], rightCols = [], rightOffsets = []) {
        const isEditing = this.edit.isEditing(row.__id, col.field);
        const isInRange = this.selection.isCellInRange(rowIdx, colIdx);
        const cfStyle = this.cfCtrl.getCellConditionalStyle(col.valueGetter ? col.valueGetter(row) : row[col.field], col.field, row) ?? {};
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
            return html `
        <td class="phz-data-cell phz-data-cell--editing${pinClass}${borderClass}" data-col=${colIdx}
            style="${pinStyle}">
          <input class="phz-cell-editor"
                 .value=${this.edit.editValue}
                 @input=${(e) => { this.edit.editValue = e.target.value; }}
                 @blur=${(e) => this.edit.commitInlineEdit(e.target.value)}
                 @keydown=${(e) => {
                if (e.key === 'Enter')
                    this.edit.commitInlineEdit(e.target.value);
                if (e.key === 'Escape')
                    this.edit.cancelInlineEdit();
            }}>
        </td>`;
        }
        const rawVal = col.valueGetter ? col.valueGetter(row) : row[col.field];
        const displayVal = this._formatCellValue(rawVal, col);
        return html `
      <td class="phz-data-cell${pinClass}${borderClass} ${isInRange ? 'phz-data-cell--in-range' : ''} ${anomaly?.type === 'outlier' ? 'phz-data-cell--anomaly' : ''}"
          data-col=${colIdx}
          data-field=${col.field}
          style="${pinStyle}${customStyle}${cfStyle.backgroundColor ? `background:${cfStyle.backgroundColor};` : ''}${cfStyle.color ? `color:${cfStyle.color};` : ''}"
          @mousedown=${(e) => { this.selection.handleCellMouseDown(e, rowIdx, colIdx); this._focusBody(); }}
          @mousemove=${(e) => this.selection.handleCellMouseMove(e, rowIdx, colIdx)}
          @click=${() => { if (this.editMode === 'click')
            this.edit.startInlineEdit(row, col.field); this._handleCellDrillThrough(row, col); }}>
        ${displayVal}
      </td>`;
    }
    _renderRowActionsCell(row) {
        return html `
      <td class="phz-data-cell phz-data-cell--actions">
        ${this.effectiveRowActions.slice(0, 3).map(action => html `
          <button class="phz-row-action-btn phz-row-action-btn--${action.variant ?? 'default'}"
                  title=${action.label}
                  aria-label=${action.label}
                  @click=${(e) => { e.stopPropagation(); this._handleRowAction(action.id, row); }}>
            ${action.icon ?? action.label}
          </button>`)}
      </td>`;
    }
    _renderGroupedRows() {
        return renderGroupedRows({
            groups: this.groups, columnDefs: this.columnDefs, groupTotals: this.groupTotals,
            groupTotalsFn: this.groupTotalsFn, groupTotalsOverrides: this.groupTotalsOverrides,
            aggCtrl: this.aggCtrl, renderRow: (row, idx) => this._renderRow(row, idx),
        });
    }
    _renderAggregationRow(position) {
        const visibleCols = this.columnDefs.filter(c => !c.hidden);
        const rows = this.filter.filteredRows;
        return html `
      <tr class="phz-aggregation-row phz-aggregation-row--${position}">
        ${this.showCheckboxes ? html `<td class="phz-data-cell"></td>` : nothing}
        ${visibleCols.map(col => {
            const val = this.aggCtrl.computeColumnAgg(rows, col, this.aggregationFn);
            return html `<td class="phz-data-cell phz-data-cell--agg">${val}</td>`;
        })}
        ${(this.showRowActions && this.effectiveRowActions.length > 0) ? html `<td class="phz-data-cell"></td>` : nothing}
      </tr>`;
    }
    _renderPagination() {
        return renderPagination({
            filteredRowCount: this.filter.filteredRows.length, currentPage: this.currentPage,
            totalPages: this._totalPages, pageSize: this.internalPageSize, pageSizeOptions: this.pageSizeOptions,
            align: this.paginationAlign,
            onPageChange: (p) => { this.currentPage = p; },
            onPageSizeChange: (s) => { this.internalPageSize = s; this.currentPage = 0; },
        });
    }
    _formatCellValue(value, col) {
        return formatCellValue(value, col, {
            numberFormats: this.numberFormats,
            dateFormats: this.dateFormats,
            compactNumbers: this.compactNumbers,
            locale: this.locale,
        });
    }
    //Drill-through
    _handleCellDrillThrough(row, col) {
        if (!this.drillThroughConfig)
            return;
        const drillFields = this.drillThroughConfig.filterFields ?? [];
        if (drillFields.length > 0 && !drillFields.includes(col.field))
            return;
        const source = { type: 'grid-row', rowData: row, field: col.field, value: row[col.field] };
        dispatchGridEvent(this, 'drill-through', { source, config: this.drillThroughConfig, field: col.field, value: row[col.field] });
    }
    _handleBodyKeyDown(e) {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'c') {
                e.preventDefault(); // Always prevent native copy inside grid body
                if (this.selection.cellRangeAnchor && this.selection.cellRangeEnd) {
                    this.clipboard.copyCellRange(false);
                }
                else if (this.selectedRowIds.size > 0) {
                    this.clipboard.copySelectedRows(false);
                }
                else if (this.focusedRowId) {
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
    _focusBody() {
        const body = this.renderRoot.querySelector('.phz-grid__body');
        if (body && document.activeElement !== body)
            body.focus({ preventScroll: true });
    }
    getVisibleRows() { return this.visibleRows; }
};
__decorate([
    property({ attribute: false })
], PhzGrid.prototype, "data", void 0);
__decorate([
    property({ attribute: false })
], PhzGrid.prototype, "columns", void 0);
__decorate([
    property({ type: String, reflect: true })
], PhzGrid.prototype, "theme", void 0);
__decorate([
    property({ type: String })
], PhzGrid.prototype, "locale", void 0);
__decorate([
    property({ type: Boolean })
], PhzGrid.prototype, "responsive", void 0);
__decorate([
    property({ type: Boolean })
], PhzGrid.prototype, "virtualization", void 0);
__decorate([
    property({ type: String, attribute: 'selection-mode' })
], PhzGrid.prototype, "selectionMode", void 0);
__decorate([
    property({ type: String, attribute: 'edit-mode' })
], PhzGrid.prototype, "editMode", void 0);
__decorate([
    property({ attribute: false })
], PhzGrid.prototype, "ariaLabels", void 0);
__decorate([
    property({ type: Boolean })
], PhzGrid.prototype, "loading", void 0);
__decorate([
    property({ type: String, attribute: 'grid-height' })
], PhzGrid.prototype, "gridHeight", void 0);
__decorate([
    property({ type: String, attribute: 'grid-width' })
], PhzGrid.prototype, "gridWidth", void 0);
__decorate([
    property({ type: String, reflect: true })
], PhzGrid.prototype, "density", void 0);
__decorate([
    property({ type: String, attribute: 'font-family' })
], PhzGrid.prototype, "fontFamily", void 0);
__decorate([
    property({ type: Number, attribute: 'font-size' })
], PhzGrid.prototype, "fontSize", void 0);
__decorate([
    property({ type: String, attribute: 'container-shadow' })
], PhzGrid.prototype, "containerShadow", void 0);
__decorate([
    property({ type: Number, attribute: 'container-radius' })
], PhzGrid.prototype, "containerRadius", void 0);
__decorate([
    property({ type: Boolean })
], PhzGrid.prototype, "aggregation", void 0);
__decorate([
    property({ type: String, attribute: 'aggregation-fn' })
], PhzGrid.prototype, "aggregationFn", void 0);
__decorate([
    property({ type: Boolean, attribute: 'show-row-actions' })
], PhzGrid.prototype, "showRowActions", void 0);
__decorate([
    property({ type: Boolean, attribute: 'show-checkboxes' })
], PhzGrid.prototype, "showCheckboxes", void 0);
__decorate([
    property({ type: Boolean, attribute: 'enable-anomaly-detection' })
], PhzGrid.prototype, "enableAnomalyDetection", void 0);
__decorate([
    property({ attribute: false })
], PhzGrid.prototype, "conditionalFormattingRules", void 0);
__decorate([
    property({ attribute: false })
], PhzGrid.prototype, "columnProfiles", void 0);
__decorate([
    property({ type: Boolean, attribute: 'show-toolbar' })
], PhzGrid.prototype, "showToolbar", void 0);
__decorate([
    property({ type: Boolean, attribute: 'show-density-toggle' })
], PhzGrid.prototype, "showDensityToggle", void 0);
__decorate([
    property({ type: Boolean, attribute: 'show-column-editor' })
], PhzGrid.prototype, "showColumnEditor", void 0);
__decorate([
    property({ type: Boolean, attribute: 'show-search' })
], PhzGrid.prototype, "showSearch", void 0);
__decorate([
    property({ type: Boolean, attribute: 'show-csv-export' })
], PhzGrid.prototype, "showCsvExport", void 0);
__decorate([
    property({ type: Boolean, attribute: 'show-excel-export' })
], PhzGrid.prototype, "showExcelExport", void 0);
__decorate([
    property({ type: Boolean, attribute: 'show-admin-settings' })
], PhzGrid.prototype, "showAdminSettings", void 0);
__decorate([
    property({ type: Boolean, attribute: 'show-pagination' })
], PhzGrid.prototype, "showPagination", void 0);
__decorate([
    property({ type: String, attribute: 'pagination-align' })
], PhzGrid.prototype, "paginationAlign", void 0);
__decorate([
    property({ attribute: false })
], PhzGrid.prototype, "pageSizeOptions", void 0);
__decorate([
    property({ type: Number, attribute: 'page-size' })
], PhzGrid.prototype, "pageSize", void 0);
__decorate([
    property({ type: String, attribute: 'grid-title' })
], PhzGrid.prototype, "gridTitle", void 0);
__decorate([
    property({ type: String, attribute: 'grid-subtitle' })
], PhzGrid.prototype, "gridSubtitle", void 0);
__decorate([
    property({ type: String, attribute: 'title-font-family' })
], PhzGrid.prototype, "titleFontFamily", void 0);
__decorate([
    property({ type: Number, attribute: 'title-font-size' })
], PhzGrid.prototype, "titleFontSize", void 0);
__decorate([
    property({ type: Number, attribute: 'subtitle-font-size' })
], PhzGrid.prototype, "subtitleFontSize", void 0);
__decorate([
    property({ type: String, attribute: 'title-bar-bg' })
], PhzGrid.prototype, "titleBarBg", void 0);
__decorate([
    property({ type: String, attribute: 'title-bar-text' })
], PhzGrid.prototype, "titleBarText", void 0);
__decorate([
    property({ type: String, attribute: 'title-icon' })
], PhzGrid.prototype, "titleIcon", void 0);
__decorate([
    property({ type: Boolean, attribute: 'show-title-bar' })
], PhzGrid.prototype, "showTitleBar", void 0);
__decorate([
    property({ type: Boolean, attribute: 'show-selection-actions' })
], PhzGrid.prototype, "showSelectionActions", void 0);
__decorate([
    property({ type: String, attribute: 'loading-mode' })
], PhzGrid.prototype, "loadingMode", void 0);
__decorate([
    property({ type: String, attribute: 'scroll-mode' })
], PhzGrid.prototype, "scrollMode", void 0);
__decorate([
    property({ attribute: false })
], PhzGrid.prototype, "remoteDataSource", void 0);
__decorate([
    property({ type: Number, attribute: 'fetch-page-size' })
], PhzGrid.prototype, "fetchPageSize", void 0);
__decorate([
    property({ type: Number, attribute: 'prefetch-pages' })
], PhzGrid.prototype, "prefetchPages", void 0);
__decorate([
    property({ type: Number, attribute: 'virtual-row-height' })
], PhzGrid.prototype, "virtualRowHeight", void 0);
__decorate([
    property({ type: Number, attribute: 'virtual-scroll-threshold' })
], PhzGrid.prototype, "virtualScrollThreshold", void 0);
__decorate([
    property({ type: Boolean, attribute: 'allow-filtering' })
], PhzGrid.prototype, "allowFiltering", void 0);
__decorate([
    property({ type: Boolean, attribute: 'allow-sorting' })
], PhzGrid.prototype, "allowSorting", void 0);
__decorate([
    property({ type: String, attribute: 'default-sort-field' })
], PhzGrid.prototype, "defaultSortField", void 0);
__decorate([
    property({ type: String, attribute: 'default-sort-direction' })
], PhzGrid.prototype, "defaultSortDirection", void 0);
__decorate([
    property({ type: Number, attribute: 'sort-debounce-ms' })
], PhzGrid.prototype, "sortDebounceMs", void 0);
__decorate([
    property({ type: Boolean, attribute: 'header-wrapping' })
], PhzGrid.prototype, "headerWrapping", void 0);
__decorate([
    property({ type: Boolean, attribute: 'auto-size-columns' })
], PhzGrid.prototype, "autoSizeColumns", void 0);
__decorate([
    property({ attribute: false })
], PhzGrid.prototype, "columnGroups", void 0);
__decorate([
    property({ type: Boolean, attribute: 'row-banding' })
], PhzGrid.prototype, "rowBanding", void 0);
__decorate([
    property({ attribute: false })
], PhzGrid.prototype, "statusColors", void 0);
__decorate([
    property({ attribute: false })
], PhzGrid.prototype, "barThresholds", void 0);
__decorate([
    property({ attribute: false })
], PhzGrid.prototype, "dateFormats", void 0);
__decorate([
    property({ attribute: false })
], PhzGrid.prototype, "columnStyles", void 0);
__decorate([
    property({ attribute: false })
], PhzGrid.prototype, "numberFormats", void 0);
__decorate([
    property({ attribute: false })
], PhzGrid.prototype, "columnFormatting", void 0);
__decorate([
    property({ type: String, attribute: 'user-role' })
], PhzGrid.prototype, "userRole", void 0);
__decorate([
    property({ attribute: false })
], PhzGrid.prototype, "computedColumns", void 0);
__decorate([
    property({ type: Boolean, attribute: 'copy-headers' })
], PhzGrid.prototype, "copyHeaders", void 0);
__decorate([
    property({ type: Boolean, attribute: 'copy-formatted' })
], PhzGrid.prototype, "copyFormatted", void 0);
__decorate([
    property({ type: Boolean, attribute: 'show-edit-actions' })
], PhzGrid.prototype, "showEditActions", void 0);
__decorate([
    property({ type: Boolean, attribute: 'show-copy-actions' })
], PhzGrid.prototype, "showCopyActions", void 0);
__decorate([
    property({ type: Number, attribute: 'max-copy-rows' })
], PhzGrid.prototype, "maxCopyRows", void 0);
__decorate([
    property({ attribute: false })
], PhzGrid.prototype, "excludeFieldsFromCopy", void 0);
__decorate([
    property({ attribute: false })
], PhzGrid.prototype, "groupBy", void 0);
__decorate([
    property({ attribute: false })
], PhzGrid.prototype, "groupByLevels", void 0);
__decorate([
    property({ type: Boolean })
], PhzGrid.prototype, "groupTotals", void 0);
__decorate([
    property({ type: String })
], PhzGrid.prototype, "groupTotalsFn", void 0);
__decorate([
    property({ attribute: false })
], PhzGrid.prototype, "groupTotalsOverrides", void 0);
__decorate([
    property({ type: String, attribute: 'grid-lines' })
], PhzGrid.prototype, "gridLines", void 0);
__decorate([
    property({ type: String, attribute: 'grid-line-color' })
], PhzGrid.prototype, "gridLineColor", void 0);
__decorate([
    property({ type: String, attribute: 'grid-line-width' })
], PhzGrid.prototype, "gridLineWidth", void 0);
__decorate([
    property({ type: String, attribute: 'banding-color' })
], PhzGrid.prototype, "bandingColor", void 0);
__decorate([
    property({ type: Boolean, attribute: 'hover-highlight' })
], PhzGrid.prototype, "hoverHighlight", void 0);
__decorate([
    property({ type: String, attribute: 'cell-text-overflow' })
], PhzGrid.prototype, "cellTextOverflow", void 0);
__decorate([
    property({ type: Boolean, attribute: 'compact-numbers' })
], PhzGrid.prototype, "compactNumbers", void 0);
__decorate([
    property({ type: String, attribute: 'header-bg' })
], PhzGrid.prototype, "headerBg", void 0);
__decorate([
    property({ type: String, attribute: 'header-text' })
], PhzGrid.prototype, "headerText", void 0);
__decorate([
    property({ type: String, attribute: 'body-bg' })
], PhzGrid.prototype, "bodyBg", void 0);
__decorate([
    property({ type: String, attribute: 'body-text' })
], PhzGrid.prototype, "bodyText", void 0);
__decorate([
    property({ type: String, attribute: 'footer-bg' })
], PhzGrid.prototype, "footerBg", void 0);
__decorate([
    property({ type: String, attribute: 'footer-text' })
], PhzGrid.prototype, "footerText", void 0);
__decorate([
    property({ attribute: false })
], PhzGrid.prototype, "drillThroughConfig", void 0);
__decorate([
    property({ type: String, attribute: 'aggregation-position' })
], PhzGrid.prototype, "aggregationPosition", void 0);
__decorate([
    property({ type: Boolean, attribute: 'show-summary' })
], PhzGrid.prototype, "showSummary", void 0);
__decorate([
    property({ type: String, attribute: 'summary-function' })
], PhzGrid.prototype, "summaryFunction", void 0);
__decorate([
    property({ attribute: false })
], PhzGrid.prototype, "rowActions", void 0);
__decorate([
    property({ attribute: false })
], PhzGrid.prototype, "generateDashboardConfig", void 0);
__decorate([
    property({ type: String, attribute: 'report-id' })
], PhzGrid.prototype, "reportId", void 0);
__decorate([
    property({ type: String, attribute: 'report-name' })
], PhzGrid.prototype, "reportName", void 0);
__decorate([
    property({ attribute: false })
], PhzGrid.prototype, "dataSet", void 0);
__decorate([
    property({ attribute: false })
], PhzGrid.prototype, "queryBackend", void 0);
__decorate([
    property({ attribute: false })
], PhzGrid.prototype, "progressiveLoad", void 0);
__decorate([
    property({ type: Boolean, attribute: 'enable-cell-tooltips' })
], PhzGrid.prototype, "enableCellTooltips", void 0);
__decorate([
    property({ type: Number, attribute: 'tooltip-delay' })
], PhzGrid.prototype, "tooltipDelay", void 0);
__decorate([
    state()
], PhzGrid.prototype, "visibleRows", void 0);
__decorate([
    state()
], PhzGrid.prototype, "columnDefs", void 0);
__decorate([
    state()
], PhzGrid.prototype, "selectedRowIds", void 0);
__decorate([
    state()
], PhzGrid.prototype, "sortColumns", void 0);
__decorate([
    state()
], PhzGrid.prototype, "totalRowCount", void 0);
__decorate([
    state()
], PhzGrid.prototype, "isInitialized", void 0);
__decorate([
    state()
], PhzGrid.prototype, "activeFilters", void 0);
__decorate([
    state()
], PhzGrid.prototype, "currentPage", void 0);
__decorate([
    state()
], PhzGrid.prototype, "internalPageSize", void 0);
__decorate([
    state()
], PhzGrid.prototype, "focusedRowId", void 0);
__decorate([
    state()
], PhzGrid.prototype, "chartOpen", void 0);
__decorate([
    state()
], PhzGrid.prototype, "chartField", void 0);
__decorate([
    state()
], PhzGrid.prototype, "chartHeader", void 0);
__decorate([
    state()
], PhzGrid.prototype, "chartValues", void 0);
__decorate([
    state()
], PhzGrid.prototype, "chartLabels", void 0);
__decorate([
    state()
], PhzGrid.prototype, "_progressivePhase", void 0);
__decorate([
    state()
], PhzGrid.prototype, "_progressMessage", void 0);
__decorate([
    state()
], PhzGrid.prototype, "groups", void 0);
__decorate([
    state()
], PhzGrid.prototype, "isGrouped", void 0);
__decorate([
    query('.phz-grid__body')
], PhzGrid.prototype, "bodyEl", void 0);
PhzGrid = __decorate([
    customElement('phz-grid')
], PhzGrid);
export { PhzGrid };
//# sourceMappingURL=phz-grid.js.map