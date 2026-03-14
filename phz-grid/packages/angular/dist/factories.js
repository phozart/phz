// Side-effect import to register custom element
import '@phozart/grid';
/**
 * Creates an Angular standalone component that wraps <phz-grid>.
 *
 * Includes full lifecycle: OnInit sets up event listeners,
 * OnChanges propagates property changes, OnDestroy cleans up.
 */
export function createPhzGridComponent(ng) {
    class PhzGridComponent {
        // Inputs
        data = [];
        columns = [];
        theme = 'auto';
        locale = 'en-US';
        responsive = true;
        virtualization = true;
        selectionMode = 'single';
        editMode = 'dblclick';
        loading = false;
        height = 'auto';
        width = '100%';
        // Grid display inputs
        density = 'compact';
        gridTitle = '';
        gridSubtitle = '';
        scrollMode = 'paginate';
        pageSize = 10;
        pageSizeOptions = [5, 10, 20, 50];
        showToolbar = true;
        showDensityToggle = true;
        showColumnEditor = true;
        showAdminSettings = false;
        showPagination = true;
        showCheckboxes = false;
        showRowActions = false;
        showSelectionActions = true;
        showEditActions = true;
        showCopyActions = true;
        rowBanding = false;
        statusColors = {};
        barThresholds = [];
        dateFormats = {};
        numberFormats = {};
        columnStyles = {};
        gridLines = 'horizontal';
        gridLineColor = '#E7E5E4';
        gridLineWidth = 'thin';
        bandingColor = '#FAFAF9';
        hoverHighlight = true;
        cellTextOverflow = 'wrap';
        compactNumbers = false;
        autoSizeColumns = false;
        aggregation = false;
        aggregationFn = 'sum';
        aggregationPosition = 'bottom';
        groupBy = [];
        groupByLevels = [];
        groupTotals = false;
        groupTotalsFn = 'sum';
        conditionalFormattingRules = [];
        columnGroups = [];
        userRole = 'user';
        copyHeaders = true;
        copyFormatted = false;
        loadingMode = 'paginate';
        virtualScrollThreshold = 0;
        fetchPageSize = 100;
        prefetchPages = 2;
        // Outputs
        gridReady = new ng.EventEmitter();
        stateChange = new ng.EventEmitter();
        cellClick = new ng.EventEmitter();
        selectionChange = new ng.EventEmitter();
        sortChange = new ng.EventEmitter();
        filterChange = new ng.EventEmitter();
        editCommit = new ng.EventEmitter();
        gridApi = null;
        elementRef = null;
        cleanupHandlers = [];
        constructor(elementRef) {
            this.elementRef = elementRef;
        }
        /** OnInit — wire event listeners on the <phz-grid> element */
        ngOnInit() {
            const host = this.elementRef?.nativeElement;
            if (!host)
                return;
            const el = host.querySelector('phz-grid') ?? host;
            const listen = (event, emitter) => {
                const handler = (e) => emitter.emit(e.detail);
                el.addEventListener(event, handler);
                this.cleanupHandlers.push(() => el.removeEventListener(event, handler));
            };
            el.addEventListener('grid-ready', (e) => {
                this.gridApi = e.detail.gridInstance;
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
        ngOnChanges(changes) {
            const host = this.elementRef?.nativeElement;
            if (!host)
                return;
            const el = host.querySelector('phz-grid') ?? host;
            this.syncProperties(el);
        }
        /** OnDestroy — clean up listeners */
        ngOnDestroy() {
            for (const cleanup of this.cleanupHandlers)
                cleanup();
            this.cleanupHandlers = [];
            this.gridApi = null;
        }
        getGridInstance() {
            return this.gridApi;
        }
        syncProperties(el) {
            el.data = this.data;
            el.columns = this.columns;
            if (this.theme != null)
                el.theme = this.theme;
            if (this.locale != null)
                el.locale = this.locale;
            if (this.responsive != null)
                el.responsive = this.responsive;
            if (this.virtualization != null)
                el.virtualization = this.virtualization;
            if (this.selectionMode != null)
                el.setAttribute('selection-mode', this.selectionMode);
            if (this.editMode != null)
                el.setAttribute('edit-mode', this.editMode);
            if (this.loading != null)
                el.loading = this.loading;
            if (this.height != null) {
                el.setAttribute('grid-height', typeof this.height === 'number' ? `${this.height}px` : this.height);
            }
            if (this.width != null) {
                el.setAttribute('grid-width', typeof this.width === 'number' ? `${this.width}px` : this.width);
            }
            // Grid display properties
            if (this.density != null)
                el.density = this.density;
            if (this.gridTitle != null)
                el.setAttribute('grid-title', this.gridTitle);
            if (this.gridSubtitle != null)
                el.setAttribute('grid-subtitle', this.gridSubtitle);
            if (this.scrollMode != null)
                el.setAttribute('scroll-mode', this.scrollMode);
            if (this.pageSize != null)
                el.setAttribute('page-size', String(this.pageSize));
            if (this.pageSizeOptions != null)
                el.pageSizeOptions = this.pageSizeOptions;
            if (this.showToolbar != null)
                el.showToolbar = this.showToolbar;
            if (this.showDensityToggle != null)
                el.showDensityToggle = this.showDensityToggle;
            if (this.showColumnEditor != null)
                el.showColumnEditor = this.showColumnEditor;
            if (this.showAdminSettings != null)
                el.showAdminSettings = this.showAdminSettings;
            if (this.showPagination != null)
                el.showPagination = this.showPagination;
            if (this.showCheckboxes != null)
                el.showCheckboxes = this.showCheckboxes;
            if (this.showRowActions != null)
                el.showRowActions = this.showRowActions;
            if (this.showSelectionActions != null)
                el.showSelectionActions = this.showSelectionActions;
            if (this.showEditActions != null)
                el.showEditActions = this.showEditActions;
            if (this.showCopyActions != null)
                el.showCopyActions = this.showCopyActions;
            if (this.rowBanding != null)
                el.rowBanding = this.rowBanding;
            if (this.statusColors != null)
                el.statusColors = this.statusColors;
            if (this.barThresholds != null)
                el.barThresholds = this.barThresholds;
            if (this.dateFormats != null)
                el.dateFormats = this.dateFormats;
            if (this.numberFormats != null)
                el.numberFormats = this.numberFormats;
            if (this.columnStyles != null)
                el.columnStyles = this.columnStyles;
            if (this.gridLines != null)
                el.setAttribute('grid-lines', this.gridLines);
            if (this.gridLineColor != null)
                el.setAttribute('grid-line-color', this.gridLineColor);
            if (this.gridLineWidth != null)
                el.setAttribute('grid-line-width', this.gridLineWidth);
            if (this.bandingColor != null)
                el.setAttribute('banding-color', this.bandingColor);
            if (this.hoverHighlight != null)
                el.hoverHighlight = this.hoverHighlight;
            if (this.cellTextOverflow != null)
                el.setAttribute('cell-text-overflow', this.cellTextOverflow);
            if (this.compactNumbers != null)
                el.compactNumbers = this.compactNumbers;
            if (this.autoSizeColumns != null)
                el.autoSizeColumns = this.autoSizeColumns;
            if (this.aggregation != null)
                el.aggregation = this.aggregation;
            if (this.aggregationFn != null)
                el.setAttribute('aggregation-fn', this.aggregationFn);
            if (this.aggregationPosition != null)
                el.setAttribute('aggregation-position', this.aggregationPosition);
            if (this.groupBy != null)
                el.groupBy = this.groupBy;
            if (this.groupByLevels != null)
                el.groupByLevels = this.groupByLevels;
            if (this.groupTotals != null)
                el.groupTotals = this.groupTotals;
            if (this.groupTotalsFn != null)
                el.groupTotalsFn = this.groupTotalsFn;
            if (this.conditionalFormattingRules != null)
                el.conditionalFormattingRules = this.conditionalFormattingRules;
            if (this.columnGroups != null)
                el.columnGroups = this.columnGroups;
            if (this.userRole != null)
                el.setAttribute('user-role', this.userRole);
            if (this.copyHeaders != null)
                el.copyHeaders = this.copyHeaders;
            if (this.copyFormatted != null)
                el.copyFormatted = this.copyFormatted;
            if (this.loadingMode != null)
                el.setAttribute('loading-mode', this.loadingMode);
            if (this.virtualScrollThreshold != null)
                el.setAttribute('virtual-scroll-threshold', String(this.virtualScrollThreshold));
            if (this.fetchPageSize != null)
                el.setAttribute('fetch-page-size', String(this.fetchPageSize));
            if (this.prefetchPages != null)
                el.setAttribute('prefetch-pages', String(this.prefetchPages));
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
export function createGridService(ng) {
    class GridService {
        gridApi = null;
        setGridApi(api) {
            this.gridApi = api;
        }
        getState() { return this.gridApi?.getState() ?? null; }
        getSortState() { return this.gridApi?.getSortState() ?? null; }
        getFilterState() { return this.gridApi?.getFilterState() ?? null; }
        getEditState() { return this.gridApi?.getEditState() ?? null; }
        getSelection() { return this.gridApi?.getSelection() ?? { rows: [], cells: [] }; }
        sort(field, direction) { this.gridApi?.sort(field, direction); }
        clearSort() { this.gridApi?.clearSort(); }
        addFilter(field, operator, value) { this.gridApi?.addFilter(field, operator, value); }
        removeFilter(field) { this.gridApi?.removeFilter(field); }
        clearFilters() { this.gridApi?.clearFilters(); }
        select(ids) { this.gridApi?.select(ids); }
        deselect(ids) { this.gridApi?.deselect(ids); }
        selectAll() { this.gridApi?.selectAll(); }
        deselectAll() { this.gridApi?.deselectAll(); }
        startEdit(position) { this.gridApi?.startEdit(position); }
        commitEdit(position, value) { return this.gridApi?.commitEdit(position, value); }
        cancelEdit(position) { this.gridApi?.cancelEdit(position); }
        exportCsv(options) { return this.gridApi?.exportCsv(options) ?? ''; }
        destroy() { this.gridApi?.destroy(); this.gridApi = null; }
    }
    return GridService;
}
// --- RxJS-based Service Factories ---
/**
 * Creates a reactive selection service backed by BehaviorSubjects.
 */
export function createSelectionService(rxjs) {
    return function selectionService(gridApi) {
        const selectedRows$ = new rxjs.BehaviorSubject([]);
        const selectedCells$ = new rxjs.BehaviorSubject([]);
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
export function createSortService(rxjs) {
    return function sortService(gridApi) {
        const sortState$ = new rxjs.BehaviorSubject(gridApi.getSortState());
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
export function createFilterService(rxjs) {
    return function filterService(gridApi) {
        const filterState$ = new rxjs.BehaviorSubject(gridApi.getFilterState());
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
export function createEditService(rxjs) {
    return function editService(gridApi) {
        const editState$ = new rxjs.BehaviorSubject(gridApi.getEditState());
        const isDirty$ = new rxjs.BehaviorSubject(gridApi.isDirty());
        const dirtyRows$ = new rxjs.BehaviorSubject(gridApi.getDirtyRows());
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
export function createDataService(rxjs) {
    return function dataService(gridApi) {
        const data$ = new rxjs.BehaviorSubject([...gridApi.getData()]);
        const unsub = gridApi.subscribe(() => {
            data$.next([...gridApi.getData()]);
        });
        return {
            data$: data$.asObservable(),
            setData: (newData) => gridApi.setData(newData),
            addRow: (rowData, position) => gridApi.addRow(rowData, position) ?? '',
            updateRow: (id, rowData) => gridApi.updateRow(id, rowData),
            deleteRow: (id) => gridApi.deleteRow(id),
            destroy() {
                unsub();
                data$.complete();
            },
        };
    };
}
//# sourceMappingURL=factories.js.map