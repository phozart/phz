/**
 * @phozart/core — Grid API Types
 */
import type { RowId, RowData } from './row.js';
import type { CellPosition } from './cell.js';
import type { GridState, SortState, FilterState, FilterOperator, EditState, ColumnState, SerializedGridState } from './state.js';
import type { GridEventMap, GridEventHandler } from './events.js';
import type { Plugin } from './plugin.js';
import type { CoreRowModel, GroupedRowModel } from './row-model.js';
import type { Unsubscribe } from './common.js';
import type { ColumnDefinition } from './column.js';
import type { SavedView, ViewsSummary, SaveViewOptions } from './views.js';
import type { QueryBackend } from './query-backend.js';
import type { ProgressivePhase } from '../progressive-load.js';
export interface ProgressiveLoadInfo {
    phase: ProgressivePhase;
    loadedRowCount: number;
    estimatedTotalCount: number;
}
/**
 * The headless grid API returned by {@link createGrid}.
 *
 * Provides complete programmatic control over data, sorting, filtering,
 * selection, editing, grouping, column management, views, events, and
 * the row-model pipeline. All operations are synchronous unless noted.
 *
 * @typeParam TData - Row data shape.
 *
 * @example
 * ```ts
 * import { createGrid } from '@phozart/core';
 *
 * const grid = createGrid({ data: rows });
 *
 * grid.sort('revenue', 'desc');
 * grid.filter('region', 'eq', 'EMEA');
 *
 * const unsub = grid.on('sort:change', (e) => console.log(e));
 * // later:
 * unsub();
 * grid.destroy();
 * ```
 */
export interface GridApi<TData = any> {
    /** Return all rows after the current pipeline (filter -> sort -> group -> flatten). */
    getData(): ReadonlyArray<RowData<TData>>;
    /**
     * Replace the grid's data entirely.
     * @param data - Array of row objects. Each row is parsed and assigned a row ID.
     */
    setData(data: unknown[]): void;
    /** Update a single row by its ID. Only the supplied fields are merged. */
    updateRow(id: RowId, data: Partial<Record<string, unknown>>): void;
    /** Batch-update multiple rows. */
    updateRows(updates: Array<{
        id: RowId;
        data: Partial<Record<string, unknown>>;
    }>): void;
    /** Delete a single row by ID. */
    deleteRow(id: RowId): void;
    /** Delete multiple rows by their IDs. */
    deleteRows(ids: RowId[]): void;
    /** Insert a row and return its generated ID. Optionally specify a position index. */
    addRow(data: Record<string, unknown>, position?: number): RowId;
    /** Insert multiple rows and return their generated IDs. */
    addRows(data: Array<Record<string, unknown>>, position?: number): RowId[];
    /** Return the current immutable grid state snapshot. */
    getState(): Readonly<GridState<TData>>;
    /** Serialize the grid state to a plain JSON-safe object (for persistence). */
    exportState(): SerializedGridState;
    /** Restore a previously serialized grid state. */
    importState(state: SerializedGridState): void;
    /** Undo the last state change. Returns `true` if undo was applied. */
    undo(): boolean;
    /** Redo the last undone state change. Returns `true` if redo was applied. */
    redo(): boolean;
    canUndo(): boolean;
    canRedo(): boolean;
    /**
     * Sort by a single field.
     * @param field - Column field name.
     * @param direction - Sort direction, or `null` to remove this sort.
     */
    sort(field: string, direction: 'asc' | 'desc' | null): void;
    /** Apply multiple sort criteria simultaneously (replaces existing sorts). */
    multiSort(sorts: Array<{
        field: string;
        direction: 'asc' | 'desc';
    }>): void;
    /** Remove all active sorts. */
    clearSort(): void;
    /** Return the current sort state. */
    getSortState(): SortState;
    /**
     * Set a single filter (replaces any existing filter on that field).
     * @param field - Column field name.
     * @param operator - Filter operator (e.g. 'eq', 'contains', 'gt').
     * @param value - Filter value.
     */
    filter(field: string, operator: FilterOperator, value: unknown): void;
    /** Add a filter without removing existing filters on other fields. */
    addFilter(field: string, operator: FilterOperator, value: unknown): void;
    /** Replace all filters at once. */
    setFilters(filters: Array<{
        field: string;
        operator: FilterOperator;
        value: unknown;
    }>): void;
    /** Remove the filter on a specific field. */
    removeFilter(field: string): void;
    /** Remove all active filters. */
    clearFilters(): void;
    /** Return the current filter state. */
    getFilterState(): FilterState;
    /** Save the current filter state as a named preset. */
    saveFilterPreset(name: string): void;
    /** Load and apply a saved filter preset by name. */
    loadFilterPreset(name: string): void;
    /** Delete a saved filter preset. */
    deleteFilterPreset(name: string): void;
    /** Select one or more rows by ID. */
    select(rowIds: RowId | RowId[]): void;
    /** Deselect one or more rows by ID. */
    deselect(rowIds: RowId | RowId[]): void;
    /** Select all rows. */
    selectAll(): void;
    /** Deselect all rows and cells. */
    deselectAll(): void;
    /** Return the current selection (row IDs and cell positions). */
    getSelection(): {
        rows: RowId[];
        cells: CellPosition[];
    };
    selectRange(start: CellPosition, end: CellPosition): void;
    selectRow(id: RowId): void;
    selectRows(ids: RowId[]): void;
    startEdit(position: CellPosition): void;
    commitEdit(position: CellPosition, value: unknown): Promise<boolean>;
    cancelEdit(position: CellPosition): void;
    getEditState(): EditState;
    /** Returns `true` if any row has uncommitted edits. */
    isDirty(): boolean;
    /** Return IDs of rows with uncommitted edits. */
    getDirtyRows(): RowId[];
    /** Reorder columns by providing the full ordered list of field names. */
    setColumnOrder(fields: string[]): void;
    /** Set the pixel width for a column. */
    setColumnWidth(field: string, width: number): void;
    /** Show or hide a column. */
    setColumnVisibility(field: string, visible: boolean): void;
    /** Return the current column state (order, widths, visibility). */
    getColumnState(): ColumnState;
    /** Reset columns to their initial configuration. */
    resetColumns(): void;
    /** Return columns the current user is allowed to see (respects `access` config). */
    getAccessibleColumns(): ReadonlyArray<ColumnDefinition>;
    /** Return field names that are hidden due to role-based access control. */
    getRestrictedFields(): ReadonlySet<string>;
    /** Return field names that are masked (values replaced with mask characters). */
    getMaskedFields(): ReadonlySet<string>;
    /** Group rows by one or more fields. */
    groupBy(fields: string | string[]): void;
    /** Remove grouping for the specified field(s), or all grouping if omitted. */
    ungroupBy(fields?: string | string[]): void;
    expandGroup(groupKey: string): void;
    collapseGroup(groupKey: string): void;
    expandAllGroups(): void;
    collapseAllGroups(): void;
    getCoreRowModel(): CoreRowModel<TData>;
    getFilteredRowModel(): CoreRowModel<TData>;
    getSortedRowModel(): CoreRowModel<TData>;
    getGroupedRowModel(): GroupedRowModel<TData>;
    getFlattenedRowModel(): CoreRowModel<TData>;
    getVirtualRowModel(config?: VirtualizerConfig): CoreRowModel<TData>;
    scrollToRow(id: RowId, options?: ScrollToOptions): void;
    scrollToColumn(field: string, options?: ScrollToOptions): void;
    scrollToCell(position: CellPosition, options?: ScrollToOptions): void;
    /**
     * Subscribe to a grid event.
     * @param event - Event name (e.g. `'sort:change'`, `'data:change'`, `'selection:change'`).
     * @param handler - Callback invoked when the event fires.
     * @returns An unsubscribe function.
     */
    on<K extends keyof GridEventMap>(event: K, handler: GridEventHandler<K>): Unsubscribe;
    /** Subscribe to an event, automatically unsubscribing after the first invocation. */
    once<K extends keyof GridEventMap>(event: K, handler: GridEventHandler<K>): Unsubscribe;
    /** Remove a specific event handler. */
    off<K extends keyof GridEventMap>(event: K, handler: GridEventHandler<K>): void;
    /** Register a plugin on this grid instance. */
    registerPlugin(plugin: Plugin): void;
    /** Remove a registered plugin by its ID. */
    unregisterPlugin(id: string): void;
    /** Retrieve a registered plugin by ID. */
    getPlugin(id: string): Plugin | undefined;
    /** Subscribe to all state changes. Returns an unsubscribe function. */
    subscribe(listener: StateChangeListener<TData>): Unsubscribe;
    /**
     * Subscribe to a derived slice of state. The callback fires only when
     * the selector's return value changes (compared via `equalityFn` or `===`).
     */
    subscribeSelector<T>(selector: (state: GridState<TData>) => T, callback: (selected: T, prev: T) => void, equalityFn?: (a: T, b: T) => boolean): Unsubscribe;
    saveView(name: string, options?: SaveViewOptions): SavedView;
    loadView(id: string): void;
    deleteView(id: string): void;
    renameView(id: string, name: string): void;
    getView(id: string): SavedView | undefined;
    listViews(): ViewsSummary[];
    getActiveViewId(): string | null;
    setDefaultView(id: string | null): void;
    isViewDirty(): boolean;
    saveCurrentToView(viewId: string): SavedView;
    importViews(views: SavedView[]): void;
    exportViews(): SavedView[];
    /** Export the grid data to CSV format. */
    exportCsv(options?: ExportCsvOptions): string;
    /** Export the grid data to Excel format (optional — requires plugin). */
    exportExcel?(options?: ExportExcelOptions): Blob;
    /** Set or remove an async query backend for server-side operations. */
    setQueryBackend(backend: QueryBackend | null): void;
    getQueryBackend(): QueryBackend | null;
    /** Returns `true` while an async query is in flight. */
    isLoading(): boolean;
    /** Monotonic counter incremented on every setData() call. Used by the
     *  component layer to detect when external code (e.g. DuckDB bridge)
     *  has pushed data, so prop-driven overwrites can be skipped. */
    getDataVersion(): number;
    /** Return the current progressive loading state, or `null` if not configured. */
    getProgressiveState(): ProgressiveLoadInfo | null;
    /** Trigger a data refresh (re-fetches from the query backend). */
    refreshData(): void;
    /** Tear down the grid instance, releasing all subscriptions and resources. */
    destroy(): void;
}
export type StateChangeListener<TData = any> = (state: GridState<TData>) => void;
export interface VirtualizerConfig {
    overscan?: number;
    estimateRowHeight?: (index: number) => number;
    enableDynamicRowHeight?: boolean;
    enableColumnVirtualization?: boolean;
}
export interface ScrollToOptions {
    behavior?: 'auto' | 'smooth';
    block?: 'start' | 'center' | 'end';
    inline?: 'start' | 'center' | 'end';
}
export interface ExportCsvOptions {
    separator?: string;
    includeHeaders?: boolean;
    selectedOnly?: boolean;
    columns?: string[];
}
export interface ExportExcelOptions {
    sheetName?: string;
    includeHeaders?: boolean;
    selectedOnly?: boolean;
    columns?: string[];
}
//# sourceMappingURL=api.d.ts.map