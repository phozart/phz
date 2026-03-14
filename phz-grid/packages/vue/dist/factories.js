// Side-effect import to register custom element
import '@phozart/grid';
export function createPhzGridComponent(vue) {
    return vue.defineComponent({
        name: 'PhzGrid',
        props: {
            data: { type: Array, required: true },
            columns: { type: Array, required: true },
            theme: { type: String, default: 'auto' },
            locale: { type: String, default: 'en-US' },
            responsive: { type: Boolean, default: true },
            virtualization: { type: Boolean, default: true },
            selectionMode: { type: String, default: 'single' },
            editMode: { type: String, default: 'dblclick' },
            loading: { type: Boolean, default: false },
            height: { type: [String, Number], default: 'auto' },
            width: { type: [String, Number], default: '100%' },
            modelValue: { type: Array, default: undefined },
            density: { type: String, default: 'compact' },
            gridTitle: { type: String, default: '' },
            gridSubtitle: { type: String, default: '' },
            scrollMode: { type: String, default: 'paginate' },
            pageSize: { type: Number, default: 10 },
            pageSizeOptions: { type: Array, default: () => [5, 10, 20, 50] },
            showToolbar: { type: Boolean, default: true },
            showDensityToggle: { type: Boolean, default: true },
            showColumnEditor: { type: Boolean, default: true },
            showAdminSettings: { type: Boolean, default: false },
            showPagination: { type: Boolean, default: true },
            showCheckboxes: { type: Boolean, default: false },
            showRowActions: { type: Boolean, default: false },
            showSelectionActions: { type: Boolean, default: true },
            showEditActions: { type: Boolean, default: true },
            showCopyActions: { type: Boolean, default: true },
            rowBanding: { type: Boolean, default: false },
            statusColors: { type: Object, default: () => ({}) },
            barThresholds: { type: Array, default: () => [] },
            dateFormats: { type: Object, default: () => ({}) },
            numberFormats: { type: Object, default: () => ({}) },
            columnStyles: { type: Object, default: () => ({}) },
            gridLines: { type: String, default: 'horizontal' },
            gridLineColor: { type: String, default: '#E7E5E4' },
            gridLineWidth: { type: String, default: 'thin' },
            bandingColor: { type: String, default: '#FAFAF9' },
            hoverHighlight: { type: Boolean, default: true },
            cellTextOverflow: { type: String, default: 'wrap' },
            compactNumbers: { type: Boolean, default: false },
            autoSizeColumns: { type: Boolean, default: false },
            aggregation: { type: Boolean, default: false },
            aggregationFn: { type: String, default: 'sum' },
            aggregationPosition: { type: String, default: 'bottom' },
            groupBy: { type: Array, default: () => [] },
            groupByLevels: { type: Array, default: () => [] },
            groupTotals: { type: Boolean, default: false },
            groupTotalsFn: { type: String, default: 'sum' },
            conditionalFormattingRules: { type: Array, default: () => [] },
            columnGroups: { type: Array, default: () => [] },
            userRole: { type: String, default: 'user' },
            copyHeaders: { type: Boolean, default: true },
            copyFormatted: { type: Boolean, default: false },
            loadingMode: { type: String, default: 'paginate' },
            virtualScrollThreshold: { type: Number, default: 0 },
            fetchPageSize: { type: Number, default: 100 },
            prefetchPages: { type: Number, default: 2 },
        },
        emits: [
            'update:modelValue',
            'grid-ready',
            'selection-change',
            'sort-change',
            'filter-change',
            'edit-commit',
            'cell-click',
        ],
        setup(props, { emit, slots }) {
            const gridRef = vue.ref(null);
            const gridApi = vue.ref(null);
            function syncAllProperties(el) {
                el.data = props.data;
                el.columns = props.columns;
                if (props.pageSizeOptions != null)
                    el.pageSizeOptions = props.pageSizeOptions;
                if (props.showToolbar != null)
                    el.showToolbar = props.showToolbar;
                if (props.showDensityToggle != null)
                    el.showDensityToggle = props.showDensityToggle;
                if (props.showColumnEditor != null)
                    el.showColumnEditor = props.showColumnEditor;
                if (props.showAdminSettings != null)
                    el.showAdminSettings = props.showAdminSettings;
                if (props.showPagination != null)
                    el.showPagination = props.showPagination;
                if (props.showCheckboxes != null)
                    el.showCheckboxes = props.showCheckboxes;
                if (props.showRowActions != null)
                    el.showRowActions = props.showRowActions;
                if (props.showSelectionActions != null)
                    el.showSelectionActions = props.showSelectionActions;
                if (props.showEditActions != null)
                    el.showEditActions = props.showEditActions;
                if (props.showCopyActions != null)
                    el.showCopyActions = props.showCopyActions;
                if (props.rowBanding != null)
                    el.rowBanding = props.rowBanding;
                if (props.statusColors != null)
                    el.statusColors = props.statusColors;
                if (props.barThresholds != null)
                    el.barThresholds = props.barThresholds;
                if (props.dateFormats != null)
                    el.dateFormats = props.dateFormats;
                if (props.numberFormats != null)
                    el.numberFormats = props.numberFormats;
                if (props.columnStyles != null)
                    el.columnStyles = props.columnStyles;
                if (props.hoverHighlight != null)
                    el.hoverHighlight = props.hoverHighlight;
                if (props.compactNumbers != null)
                    el.compactNumbers = props.compactNumbers;
                if (props.autoSizeColumns != null)
                    el.autoSizeColumns = props.autoSizeColumns;
                if (props.aggregation != null)
                    el.aggregation = props.aggregation;
                if (props.groupBy != null)
                    el.groupBy = props.groupBy;
                if (props.groupByLevels != null)
                    el.groupByLevels = props.groupByLevels;
                if (props.groupTotals != null)
                    el.groupTotals = props.groupTotals;
                if (props.groupTotalsFn != null)
                    el.groupTotalsFn = props.groupTotalsFn;
                if (props.conditionalFormattingRules != null)
                    el.conditionalFormattingRules = props.conditionalFormattingRules;
                if (props.columnGroups != null)
                    el.columnGroups = props.columnGroups;
                if (props.copyHeaders != null)
                    el.copyHeaders = props.copyHeaders;
                if (props.copyFormatted != null)
                    el.copyFormatted = props.copyFormatted;
            }
            vue.onMounted(() => {
                const el = gridRef.value;
                if (!el)
                    return;
                syncAllProperties(el);
                el.addEventListener('grid-ready', (e) => {
                    gridApi.value = e.detail.gridInstance;
                    emit('grid-ready', e.detail.gridInstance);
                });
                el.addEventListener('selection-change', (e) => {
                    emit('selection-change', e.detail);
                    if (props.modelValue !== undefined) {
                        emit('update:modelValue', e.detail.selectedRows ?? []);
                    }
                });
                el.addEventListener('sort-change', (e) => emit('sort-change', e.detail));
                el.addEventListener('filter-change', (e) => emit('filter-change', e.detail));
                el.addEventListener('edit-commit', (e) => emit('edit-commit', e.detail));
                el.addEventListener('cell-click', (e) => emit('cell-click', e.detail));
            });
            vue.watch(() => props.data, (newData) => {
                const el = gridRef.value;
                if (el)
                    el.data = newData;
            });
            vue.watch(() => props.columns, (newCols) => {
                const el = gridRef.value;
                if (el)
                    el.columns = newCols;
            });
            return () => {
                const height = typeof props.height === 'number' ? `${props.height}px` : props.height;
                const width = typeof props.width === 'number' ? `${props.width}px` : props.width;
                return vue.h('phz-grid', {
                    ref: gridRef,
                    'selection-mode': props.selectionMode,
                    'edit-mode': props.editMode,
                    'grid-height': height,
                    'grid-width': width,
                    theme: props.theme,
                    locale: props.locale,
                    density: props.density,
                    'grid-title': props.gridTitle,
                    'grid-subtitle': props.gridSubtitle,
                    'scroll-mode': props.scrollMode,
                    'page-size': props.pageSize,
                    'grid-lines': props.gridLines,
                    'grid-line-color': props.gridLineColor,
                    'grid-line-width': props.gridLineWidth,
                    'banding-color': props.bandingColor,
                    'cell-text-overflow': props.cellTextOverflow,
                    'aggregation-fn': props.aggregationFn,
                    'aggregation-position': props.aggregationPosition,
                    'user-role': props.userRole,
                    'loading-mode': props.loadingMode,
                    'virtual-scroll-threshold': props.virtualScrollThreshold,
                    'fetch-page-size': props.fetchPageSize,
                    'prefetch-pages': props.prefetchPages,
                }, slots.default?.());
            };
        },
    });
}
export function createUseGrid(vue) {
    return function useGrid() {
        const gridInstance = vue.ref(null);
        const state = vue.ref(null);
        return {
            gridInstance,
            state,
            exportState: () => gridInstance.value?.exportState() ?? null,
            importState: (s) => gridInstance.value?.importState(s),
        };
    };
}
export function createUseGridSelection(vue) {
    return function useGridSelection(gridInstance) {
        const selectedRows = vue.ref([]);
        const selectedCells = vue.ref([]);
        if (gridInstance) {
            vue.watch(() => gridInstance.value, (grid) => {
                if (!grid)
                    return;
                const sync = () => {
                    const sel = grid.getSelection();
                    selectedRows.value = sel.rows;
                    selectedCells.value = sel.cells;
                };
                sync();
                grid.on('selection:change', sync);
            });
        }
        return {
            selectedRows,
            selectedCells,
            select: (ids) => gridInstance?.value?.select(ids),
            deselect: (ids) => gridInstance?.value?.deselect(ids),
            selectAll: () => gridInstance?.value?.selectAll(),
            deselectAll: () => gridInstance?.value?.deselectAll(),
            selectRange: (s, e) => gridInstance?.value?.selectRange(s, e),
        };
    };
}
export function createUseGridSort(vue) {
    return function useGridSort(gridInstance) {
        const sortState = vue.ref(null);
        if (gridInstance) {
            vue.watch(() => gridInstance.value, (grid) => {
                if (!grid)
                    return;
                sortState.value = grid.getSortState();
                grid.on('sort:change', () => { sortState.value = grid.getSortState(); });
            });
        }
        return {
            sortState,
            sort: (f, d) => gridInstance?.value?.sort(f, d),
            multiSort: (s) => gridInstance?.value?.multiSort(s),
            clearSort: () => gridInstance?.value?.clearSort(),
        };
    };
}
export function createUseGridFilter(vue) {
    return function useGridFilter(gridInstance) {
        const filterState = vue.ref(null);
        if (gridInstance) {
            vue.watch(() => gridInstance.value, (grid) => {
                if (!grid)
                    return;
                filterState.value = grid.getFilterState();
                grid.on('filter:change', () => { filterState.value = grid.getFilterState(); });
            });
        }
        return {
            filterState,
            addFilter: (f, o, v) => gridInstance?.value?.addFilter(f, o, v),
            removeFilter: (f) => gridInstance?.value?.removeFilter(f),
            clearFilters: () => gridInstance?.value?.clearFilters(),
            savePreset: (n) => gridInstance?.value?.saveFilterPreset(n),
            loadPreset: (n) => gridInstance?.value?.loadFilterPreset(n),
        };
    };
}
export function createUseGridEdit(vue) {
    return function useGridEdit(gridInstance) {
        const editState = vue.ref(null);
        const isDirty = vue.ref(false);
        const dirtyRows = vue.ref([]);
        if (gridInstance) {
            vue.watch(() => gridInstance.value, (grid) => {
                if (!grid)
                    return;
                const sync = () => {
                    editState.value = grid.getEditState();
                    isDirty.value = grid.isDirty();
                    dirtyRows.value = grid.getDirtyRows();
                };
                sync();
                grid.subscribe(sync);
            });
        }
        return {
            editState,
            startEdit: (p) => gridInstance?.value?.startEdit(p),
            commitEdit: (p, v) => gridInstance?.value?.commitEdit(p, v) ?? Promise.resolve(false),
            cancelEdit: (p) => gridInstance?.value?.cancelEdit(p),
            isDirty,
            dirtyRows,
        };
    };
}
//# sourceMappingURL=factories.js.map