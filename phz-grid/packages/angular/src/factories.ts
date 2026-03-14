/**
 * @phozart/angular — Factory functions
 *
 * Creates Angular components and services without hard dependency on Angular decorators.
 * These factories accept the Angular runtime to create properly decorated components.
 *
 * Usage in Angular app:
 *   import { Component, Input, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
 *   import { BehaviorSubject, Subject } from 'rxjs';
 *   import { createPhzGridComponent, createSelectionService } from '@phozart/angular';
 *
 *   const PhzGridComponent = createPhzGridComponent({ Component, Input, Output, EventEmitter });
 *   const selectionService = createSelectionService({ BehaviorSubject, Subject });
 */
import type { GridApi, ColumnDefinition, RowId, CellPosition, FilterOperator, SortState, FilterState, EditState } from '@phozart/core';
import type {
  PhzGridInputs, PhzGridOutputs, GridServiceConfig,
  RxJSRuntime, BehaviorSubjectLike,
  SelectionServiceReturn, SortServiceReturn, FilterServiceReturn,
  EditServiceReturn, DataServiceReturn,
} from './types.js';

// Side-effect import to register custom element
import '@phozart/grid';

/**
 * Minimal Angular runtime interface needed by the factories.
 */
export interface AngularRuntime {
  Component: any;
  Input: any;
  Output: any;
  EventEmitter: any;
  Injectable?: any;
  ElementRef?: any;
  OnInit?: any;
  OnDestroy?: any;
  OnChanges?: any;
  CUSTOM_ELEMENTS_SCHEMA?: any;
}

/**
 * Creates an Angular standalone component that wraps <phz-grid>.
 *
 * Includes full lifecycle: OnInit sets up event listeners,
 * OnChanges propagates property changes, OnDestroy cleans up.
 */
export function createPhzGridComponent(ng: AngularRuntime): any {
  class PhzGridComponent {
    // Inputs
    data: unknown[] = [];
    columns: ColumnDefinition[] = [];
    theme: string = 'auto';
    locale: string = 'en-US';
    responsive: boolean = true;
    virtualization: boolean = true;
    selectionMode: 'none' | 'single' | 'multi' | 'range' = 'single';
    editMode: 'none' | 'click' | 'dblclick' | 'manual' = 'dblclick';
    loading: boolean = false;
    height: string | number = 'auto';
    width: string | number = '100%';

    // Grid display inputs
    density: 'comfortable' | 'compact' | 'dense' = 'compact';
    gridTitle: string = '';
    gridSubtitle: string = '';
    scrollMode: 'paginate' | 'virtual' = 'paginate';
    pageSize: number = 10;
    pageSizeOptions: number[] = [5, 10, 20, 50];
    showToolbar: boolean = true;
    showDensityToggle: boolean = true;
    showColumnEditor: boolean = true;
    showAdminSettings: boolean = false;
    showPagination: boolean = true;
    showCheckboxes: boolean = false;
    showRowActions: boolean = false;
    showSelectionActions: boolean = true;
    showEditActions: boolean = true;
    showCopyActions: boolean = true;
    rowBanding: boolean = false;
    statusColors: Record<string, { bg: string; color: string; dot: string }> = {};
    barThresholds: Array<{ min: number; color: string }> = [];
    dateFormats: Record<string, string> = {};
    numberFormats: Record<string, { decimals?: number; display?: string; prefix?: string; suffix?: string }> = {};
    columnStyles: Record<string, string> = {};
    gridLines: 'none' | 'horizontal' | 'vertical' | 'both' = 'horizontal';
    gridLineColor: string = '#E7E5E4';
    gridLineWidth: 'thin' | 'medium' = 'thin';
    bandingColor: string = '#FAFAF9';
    hoverHighlight: boolean = true;
    cellTextOverflow: 'ellipsis' | 'clip' | 'wrap' = 'wrap';
    compactNumbers: boolean = false;
    autoSizeColumns: boolean = false;
    aggregation: boolean = false;
    aggregationFn: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'none' = 'sum';
    aggregationPosition: 'top' | 'bottom' | 'both' = 'bottom';
    groupBy: string[] = [];
    groupByLevels: string[][] = [];
    groupTotals: boolean = false;
    groupTotalsFn: 'sum' | 'avg' | 'min' | 'max' | 'count' = 'sum';
    conditionalFormattingRules: any[] = [];
    columnGroups: Array<{ header: string; children: string[] }> = [];
    userRole: 'viewer' | 'user' | 'editor' | 'admin' = 'user';
    copyHeaders: boolean = true;
    copyFormatted: boolean = false;
    loadingMode: 'paginate' | 'lazy' = 'paginate';
    virtualScrollThreshold: number = 0;
    fetchPageSize: number = 100;
    prefetchPages: number = 2;

    // Outputs
    gridReady = new ng.EventEmitter();
    stateChange = new ng.EventEmitter();
    cellClick = new ng.EventEmitter();
    selectionChange = new ng.EventEmitter();
    sortChange = new ng.EventEmitter();
    filterChange = new ng.EventEmitter();
    editCommit = new ng.EventEmitter();

    private gridApi: GridApi | null = null;
    private elementRef: any = null;
    private cleanupHandlers: Array<() => void> = [];

    constructor(elementRef?: any) {
      this.elementRef = elementRef;
    }

    /** OnInit — wire event listeners on the <phz-grid> element */
    ngOnInit(): void {
      const host = this.elementRef?.nativeElement;
      if (!host) return;
      const el = host.querySelector('phz-grid') ?? host;

      const listen = (event: string, emitter: any) => {
        const handler = (e: Event) => emitter.emit((e as CustomEvent).detail);
        el.addEventListener(event, handler);
        this.cleanupHandlers.push(() => el.removeEventListener(event, handler));
      };

      el.addEventListener('grid-ready', (e: Event) => {
        this.gridApi = (e as CustomEvent).detail.gridInstance;
        this.gridReady.emit(this.gridApi);
      });

      listen('state-change', this.stateChange);
      listen('cell-click', this.cellClick);
      listen('selection-change', this.selectionChange);
      listen('sort-change', this.sortChange);
      listen('filter-change', this.filterChange);
      listen('edit-commit', this.editCommit);

      // Set initial properties
      this.syncProperties(el);
    }

    /** OnChanges — propagate Input changes to the Web Component */
    ngOnChanges(changes: any): void {
      const host = this.elementRef?.nativeElement;
      if (!host) return;
      const el = host.querySelector('phz-grid') ?? host;
      this.syncProperties(el);
    }

    /** OnDestroy — clean up listeners */
    ngOnDestroy(): void {
      for (const cleanup of this.cleanupHandlers) cleanup();
      this.cleanupHandlers = [];
      this.gridApi = null;
    }

    getGridInstance(): GridApi | null {
      return this.gridApi;
    }

    private syncProperties(el: any): void {
      el.data = this.data;
      el.columns = this.columns;
      if (this.theme != null) el.theme = this.theme;
      if (this.locale != null) el.locale = this.locale;
      if (this.responsive != null) el.responsive = this.responsive;
      if (this.virtualization != null) el.virtualization = this.virtualization;
      if (this.selectionMode != null) el.setAttribute('selection-mode', this.selectionMode);
      if (this.editMode != null) el.setAttribute('edit-mode', this.editMode);
      if (this.loading != null) el.loading = this.loading;
      if (this.height != null) {
        el.setAttribute('grid-height', typeof this.height === 'number' ? `${this.height}px` : this.height);
      }
      if (this.width != null) {
        el.setAttribute('grid-width', typeof this.width === 'number' ? `${this.width}px` : this.width);
      }

      // Grid display properties
      if (this.density != null) el.density = this.density;
      if (this.gridTitle != null) el.setAttribute('grid-title', this.gridTitle);
      if (this.gridSubtitle != null) el.setAttribute('grid-subtitle', this.gridSubtitle);
      if (this.scrollMode != null) el.setAttribute('scroll-mode', this.scrollMode);
      if (this.pageSize != null) el.setAttribute('page-size', String(this.pageSize));
      if (this.pageSizeOptions != null) el.pageSizeOptions = this.pageSizeOptions;
      if (this.showToolbar != null) el.showToolbar = this.showToolbar;
      if (this.showDensityToggle != null) el.showDensityToggle = this.showDensityToggle;
      if (this.showColumnEditor != null) el.showColumnEditor = this.showColumnEditor;
      if (this.showAdminSettings != null) el.showAdminSettings = this.showAdminSettings;
      if (this.showPagination != null) el.showPagination = this.showPagination;
      if (this.showCheckboxes != null) el.showCheckboxes = this.showCheckboxes;
      if (this.showRowActions != null) el.showRowActions = this.showRowActions;
      if (this.showSelectionActions != null) el.showSelectionActions = this.showSelectionActions;
      if (this.showEditActions != null) el.showEditActions = this.showEditActions;
      if (this.showCopyActions != null) el.showCopyActions = this.showCopyActions;
      if (this.rowBanding != null) el.rowBanding = this.rowBanding;
      if (this.statusColors != null) el.statusColors = this.statusColors;
      if (this.barThresholds != null) el.barThresholds = this.barThresholds;
      if (this.dateFormats != null) el.dateFormats = this.dateFormats;
      if (this.numberFormats != null) el.numberFormats = this.numberFormats;
      if (this.columnStyles != null) el.columnStyles = this.columnStyles;
      if (this.gridLines != null) el.setAttribute('grid-lines', this.gridLines);
      if (this.gridLineColor != null) el.setAttribute('grid-line-color', this.gridLineColor);
      if (this.gridLineWidth != null) el.setAttribute('grid-line-width', this.gridLineWidth);
      if (this.bandingColor != null) el.setAttribute('banding-color', this.bandingColor);
      if (this.hoverHighlight != null) el.hoverHighlight = this.hoverHighlight;
      if (this.cellTextOverflow != null) el.setAttribute('cell-text-overflow', this.cellTextOverflow);
      if (this.compactNumbers != null) el.compactNumbers = this.compactNumbers;
      if (this.autoSizeColumns != null) el.autoSizeColumns = this.autoSizeColumns;
      if (this.aggregation != null) el.aggregation = this.aggregation;
      if (this.aggregationFn != null) el.setAttribute('aggregation-fn', this.aggregationFn);
      if (this.aggregationPosition != null) el.setAttribute('aggregation-position', this.aggregationPosition);
      if (this.groupBy != null) el.groupBy = this.groupBy;
      if (this.groupByLevels != null) el.groupByLevels = this.groupByLevels;
      if (this.groupTotals != null) el.groupTotals = this.groupTotals;
      if (this.groupTotalsFn != null) el.groupTotalsFn = this.groupTotalsFn;
      if (this.conditionalFormattingRules != null) el.conditionalFormattingRules = this.conditionalFormattingRules;
      if (this.columnGroups != null) el.columnGroups = this.columnGroups;
      if (this.userRole != null) el.setAttribute('user-role', this.userRole);
      if (this.copyHeaders != null) el.copyHeaders = this.copyHeaders;
      if (this.copyFormatted != null) el.copyFormatted = this.copyFormatted;
      if (this.loadingMode != null) el.setAttribute('loading-mode', this.loadingMode);
      if (this.virtualScrollThreshold != null) el.setAttribute('virtual-scroll-threshold', String(this.virtualScrollThreshold));
      if (this.fetchPageSize != null) el.setAttribute('fetch-page-size', String(this.fetchPageSize));
      if (this.prefetchPages != null) el.setAttribute('prefetch-pages', String(this.prefetchPages));
    }
  }

  return PhzGridComponent;
}

/**
 * Creates an Angular injectable GridService for managing grid state.
 *
 * Usage:
 *   const GridService = createGridService(Injectable);
 *   providers: [GridService]
 */
export function createGridService(ng: AngularRuntime): any {
  class GridService {
    private gridApi: GridApi | null = null;

    setGridApi(api: GridApi): void {
      this.gridApi = api;
    }

    getState() { return this.gridApi?.getState() ?? null; }
    getSortState() { return this.gridApi?.getSortState() ?? null; }
    getFilterState() { return this.gridApi?.getFilterState() ?? null; }
    getEditState() { return this.gridApi?.getEditState() ?? null; }
    getSelection() { return this.gridApi?.getSelection() ?? { rows: [], cells: [] }; }

    sort(field: string, direction: 'asc' | 'desc' | null) { this.gridApi?.sort(field, direction); }
    clearSort() { this.gridApi?.clearSort(); }
    addFilter(field: string, operator: FilterOperator, value: unknown) { this.gridApi?.addFilter(field, operator, value); }
    removeFilter(field: string) { this.gridApi?.removeFilter(field); }
    clearFilters() { this.gridApi?.clearFilters(); }
    select(ids: RowId | RowId[]) { this.gridApi?.select(ids); }
    deselect(ids: RowId | RowId[]) { this.gridApi?.deselect(ids); }
    selectAll() { this.gridApi?.selectAll(); }
    deselectAll() { this.gridApi?.deselectAll(); }
    startEdit(position: CellPosition) { this.gridApi?.startEdit(position); }
    commitEdit(position: CellPosition, value: unknown) { return this.gridApi?.commitEdit(position, value); }
    cancelEdit(position: CellPosition) { this.gridApi?.cancelEdit(position); }
    exportCsv(options?: any) { return this.gridApi?.exportCsv(options) ?? ''; }
    destroy() { this.gridApi?.destroy(); this.gridApi = null; }
  }

  return GridService;
}

// --- RxJS-based Service Factories ---

/**
 * Creates a reactive selection service backed by BehaviorSubjects.
 */
export function createSelectionService(rxjs: RxJSRuntime) {
  return function selectionService(gridApi: GridApi): SelectionServiceReturn {
    const selectedRows$ = new rxjs.BehaviorSubject<RowId[]>([]);
    const selectedCells$ = new rxjs.BehaviorSubject<CellPosition[]>([]);

    const sync = () => {
      const sel = gridApi.getSelection();
      selectedRows$.next(sel.rows);
      selectedCells$.next(sel.cells);
    };

    sync();
    const unsub = gridApi.on('selection:change', sync);

    return {
      selectedRows$: selectedRows$.asObservable(),
      selectedCells$: selectedCells$.asObservable(),
      select: (ids) => gridApi.select(ids),
      deselect: (ids) => gridApi.deselect(ids),
      selectAll: () => gridApi.selectAll(),
      deselectAll: () => gridApi.deselectAll(),
      destroy() {
        unsub();
        selectedRows$.complete();
        selectedCells$.complete();
      },
    };
  };
}

/**
 * Creates a reactive sort service backed by BehaviorSubject.
 */
export function createSortService(rxjs: RxJSRuntime) {
  return function sortService(gridApi: GridApi): SortServiceReturn {
    const sortState$ = new rxjs.BehaviorSubject<SortState | null>(gridApi.getSortState());

    const unsub = gridApi.on('sort:change', () => {
      sortState$.next(gridApi.getSortState());
    });

    return {
      sortState$: sortState$.asObservable(),
      sort: (field, direction) => gridApi.sort(field, direction),
      multiSort: (sorts) => gridApi.multiSort(sorts),
      clearSort: () => gridApi.clearSort(),
      destroy() {
        unsub();
        sortState$.complete();
      },
    };
  };
}

/**
 * Creates a reactive filter service backed by BehaviorSubject.
 */
export function createFilterService(rxjs: RxJSRuntime) {
  return function filterService(gridApi: GridApi): FilterServiceReturn {
    const filterState$ = new rxjs.BehaviorSubject<FilterState | null>(gridApi.getFilterState());

    const unsub = gridApi.on('filter:change', () => {
      filterState$.next(gridApi.getFilterState());
    });

    return {
      filterState$: filterState$.asObservable(),
      addFilter: (field, operator, value) => gridApi.addFilter(field, operator, value),
      removeFilter: (field) => gridApi.removeFilter(field),
      clearFilters: () => gridApi.clearFilters(),
      destroy() {
        unsub();
        filterState$.complete();
      },
    };
  };
}

/**
 * Creates a reactive edit service backed by BehaviorSubjects.
 */
export function createEditService(rxjs: RxJSRuntime) {
  return function editService(gridApi: GridApi): EditServiceReturn {
    const editState$ = new rxjs.BehaviorSubject<EditState | null>(gridApi.getEditState());
    const isDirty$ = new rxjs.BehaviorSubject<boolean>(gridApi.isDirty());
    const dirtyRows$ = new rxjs.BehaviorSubject<RowId[]>(gridApi.getDirtyRows());

    const unsub = gridApi.subscribe(() => {
      editState$.next(gridApi.getEditState());
      isDirty$.next(gridApi.isDirty());
      dirtyRows$.next(gridApi.getDirtyRows());
    });

    return {
      editState$: editState$.asObservable(),
      isDirty$: isDirty$.asObservable(),
      dirtyRows$: dirtyRows$.asObservable(),
      startEdit: (position) => gridApi.startEdit(position),
      commitEdit: (position, value) => gridApi.commitEdit(position, value) ?? Promise.resolve(false),
      cancelEdit: (position) => gridApi.cancelEdit(position),
      destroy() {
        unsub();
        editState$.complete();
        isDirty$.complete();
        dirtyRows$.complete();
      },
    };
  };
}

/**
 * Creates a reactive data service backed by BehaviorSubject.
 */
export function createDataService(rxjs: RxJSRuntime) {
  return function dataService(gridApi: GridApi): DataServiceReturn {
    const data$ = new rxjs.BehaviorSubject<unknown[]>([...gridApi.getData()]);

    const unsub = gridApi.subscribe(() => {
      data$.next([...gridApi.getData()]);
    });

    return {
      data$: data$.asObservable(),
      setData: (newData) => gridApi.setData(newData),
      addRow: (rowData, position?) => gridApi.addRow(rowData, position) ?? '',
      updateRow: (id, rowData) => gridApi.updateRow(id, rowData),
      deleteRow: (id) => gridApi.deleteRow(id),
      destroy() {
        unsub();
        data$.complete();
      },
    };
  };
}
