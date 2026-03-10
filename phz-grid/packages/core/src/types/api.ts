/**
 * @phozart/phz-core — Grid API Types
 */

import type { RowId, RowData } from './row.js';
import type { CellPosition } from './cell.js';
import type {
  GridState,
  SortState,
  FilterState,
  FilterOperator,
  SelectionState,
  EditState,
  ColumnState,
  SerializedGridState,
} from './state.js';
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

export interface GridApi<TData = any> {
  // Data Operations
  getData(): ReadonlyArray<RowData<TData>>;
  setData(data: unknown[]): void;
  updateRow(id: RowId, data: Partial<Record<string, unknown>>): void;
  updateRows(updates: Array<{ id: RowId; data: Partial<Record<string, unknown>> }>): void;
  deleteRow(id: RowId): void;
  deleteRows(ids: RowId[]): void;
  addRow(data: Record<string, unknown>, position?: number): RowId;
  addRows(data: Array<Record<string, unknown>>, position?: number): RowId[];

  // State Management
  getState(): Readonly<GridState<TData>>;
  exportState(): SerializedGridState;
  importState(state: SerializedGridState): void;

  // Undo/Redo
  undo(): boolean;
  redo(): boolean;
  canUndo(): boolean;
  canRedo(): boolean;

  // Sorting
  sort(field: string, direction: 'asc' | 'desc' | null): void;
  multiSort(sorts: Array<{ field: string; direction: 'asc' | 'desc' }>): void;
  clearSort(): void;
  getSortState(): SortState;

  // Filtering
  filter(field: string, operator: FilterOperator, value: unknown): void;
  addFilter(field: string, operator: FilterOperator, value: unknown): void;
  setFilters(filters: Array<{ field: string; operator: FilterOperator; value: unknown }>): void;
  removeFilter(field: string): void;
  clearFilters(): void;
  getFilterState(): FilterState;
  saveFilterPreset(name: string): void;
  loadFilterPreset(name: string): void;
  deleteFilterPreset(name: string): void;

  // Selection
  select(rowIds: RowId | RowId[]): void;
  deselect(rowIds: RowId | RowId[]): void;
  selectAll(): void;
  deselectAll(): void;
  getSelection(): { rows: RowId[]; cells: CellPosition[] };
  selectRange(start: CellPosition, end: CellPosition): void;
  selectRow(id: RowId): void;
  selectRows(ids: RowId[]): void;

  // Editing
  startEdit(position: CellPosition): void;
  commitEdit(position: CellPosition, value: unknown): Promise<boolean>;
  cancelEdit(position: CellPosition): void;
  getEditState(): EditState;
  isDirty(): boolean;
  getDirtyRows(): RowId[];

  // Column Management
  setColumnOrder(fields: string[]): void;
  setColumnWidth(field: string, width: number): void;
  setColumnVisibility(field: string, visible: boolean): void;
  getColumnState(): ColumnState;
  resetColumns(): void;
  getAccessibleColumns(): ReadonlyArray<ColumnDefinition>;
  getRestrictedFields(): ReadonlySet<string>;
  getMaskedFields(): ReadonlySet<string>;

  // Grouping
  groupBy(fields: string | string[]): void;
  ungroupBy(fields?: string | string[]): void;
  expandGroup(groupKey: string): void;
  collapseGroup(groupKey: string): void;
  expandAllGroups(): void;
  collapseAllGroups(): void;

  // Row Model Pipeline
  getCoreRowModel(): CoreRowModel<TData>;
  getFilteredRowModel(): CoreRowModel<TData>;
  getSortedRowModel(): CoreRowModel<TData>;
  getGroupedRowModel(): GroupedRowModel<TData>;
  getFlattenedRowModel(): CoreRowModel<TData>;
  getVirtualRowModel(config?: VirtualizerConfig): CoreRowModel<TData>;

  // Viewport Control
  scrollToRow(id: RowId, options?: ScrollToOptions): void;
  scrollToColumn(field: string, options?: ScrollToOptions): void;
  scrollToCell(position: CellPosition, options?: ScrollToOptions): void;

  // Event System
  on<K extends keyof GridEventMap>(event: K, handler: GridEventHandler<K>): Unsubscribe;
  once<K extends keyof GridEventMap>(event: K, handler: GridEventHandler<K>): Unsubscribe;
  off<K extends keyof GridEventMap>(event: K, handler: GridEventHandler<K>): void;

  // Plugin System
  registerPlugin(plugin: Plugin): void;
  unregisterPlugin(id: string): void;
  getPlugin(id: string): Plugin | undefined;

  // State Change Listener
  subscribe(listener: StateChangeListener<TData>): Unsubscribe;
  subscribeSelector<T>(
    selector: (state: GridState<TData>) => T,
    callback: (selected: T, prev: T) => void,
    equalityFn?: (a: T, b: T) => boolean,
  ): Unsubscribe;

  // Views
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

  // Export
  exportCsv(options?: ExportCsvOptions): string;
  exportExcel?(options?: ExportExcelOptions): Blob;

  // QueryBackend
  setQueryBackend(backend: QueryBackend | null): void;
  getQueryBackend(): QueryBackend | null;
  isLoading(): boolean;

  /** Monotonic counter incremented on every setData() call. Used by the
   *  component layer to detect when external code (e.g. DuckDB bridge)
   *  has pushed data, so prop-driven overwrites can be skipped. */
  getDataVersion(): number;

  // Progressive Loading
  getProgressiveState(): ProgressiveLoadInfo | null;
  refreshData(): void;

  // Lifecycle
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
