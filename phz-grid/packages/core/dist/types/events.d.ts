/**
 * @phozart/phz-core — Event Types
 */
import type { RowId, RowData } from './row.js';
import type { CellPosition } from './cell.js';
import type { SortState, FilterState, FilterPreset } from './state.js';
export interface GridEvent {
    readonly type: string;
    readonly timestamp: number;
}
export type EventSource = 'user' | 'api' | 'plugin' | 'system';
export interface StateChangeEvent<TData = any> extends GridEvent {
    readonly type: 'state:change';
    readonly delta: StateChangeDelta<TData>;
}
export interface StateChangeDelta<TData = any> {
    [key: string]: unknown;
}
export interface CellEvent extends GridEvent {
    readonly position: CellPosition;
}
export interface CellClickEvent extends GridEvent {
    readonly type: 'cell:click';
    readonly position: CellPosition;
    readonly data: unknown;
    readonly nativeEvent: MouseEvent;
}
export interface CellDoubleClickEvent extends GridEvent {
    readonly type: 'cell:dblclick';
    readonly position: CellPosition;
    readonly data: unknown;
    readonly nativeEvent: MouseEvent;
}
export interface CellContextMenuEvent extends GridEvent {
    readonly type: 'cell:contextmenu';
    readonly position: CellPosition;
    readonly data: unknown;
    readonly nativeEvent: MouseEvent;
}
export interface CellEditStartEvent extends GridEvent {
    readonly type: 'edit:start';
    readonly position: CellPosition;
    readonly currentValue: unknown;
}
export interface CellEditCommitEvent extends GridEvent {
    readonly type: 'edit:commit';
    readonly position: CellPosition;
    readonly oldValue: unknown;
    readonly newValue: unknown;
}
export interface CellEditCancelEvent extends GridEvent {
    readonly type: 'edit:cancel';
    readonly position: CellPosition;
}
export interface CellValidateEvent extends GridEvent {
    readonly type: 'edit:validation:error';
    readonly position: CellPosition;
    readonly value: unknown;
    readonly error: string;
}
export interface SelectionChangeEvent extends GridEvent {
    readonly type: 'selection:change';
    readonly selectedRows: RowId[];
    readonly selectedCells: CellPosition[];
    readonly delta: {
        addedRows: RowId[];
        removedRows: RowId[];
        addedCells: CellPosition[];
        removedCells: CellPosition[];
    };
}
export interface SortChangeEvent extends GridEvent {
    readonly type: 'sort:change';
    readonly sort: SortState;
}
export interface FilterChangeEvent extends GridEvent {
    readonly type: 'filter:change';
    readonly filter: FilterState;
}
export interface ScrollEvent extends GridEvent {
    readonly type: 'viewport:scroll';
    readonly scrollTop: number;
    readonly scrollLeft: number;
}
export interface RowEvent extends GridEvent {
    readonly rowId: RowId;
}
export interface RowClickEvent extends GridEvent {
    readonly type: 'row:click';
    readonly rowId: RowId;
    readonly data: RowData;
    readonly nativeEvent: MouseEvent;
}
export interface RowDoubleClickEvent extends GridEvent {
    readonly type: 'row:dblclick';
    readonly rowId: RowId;
    readonly data: RowData;
    readonly nativeEvent: MouseEvent;
}
export interface ColumnEvent extends GridEvent {
    readonly field: string;
}
export interface ColumnResizeEvent extends GridEvent {
    readonly type: 'column:resize';
    readonly field: string;
    readonly oldWidth: number;
    readonly newWidth: number;
}
export interface ColumnMoveEvent extends GridEvent {
    readonly type: 'column:reorder';
    readonly field: string;
    readonly oldIndex: number;
    readonly newIndex: number;
}
export interface ColumnVisibilityChangeEvent extends GridEvent {
    readonly type: 'column:visibility:change';
    readonly field: string;
    readonly visible: boolean;
}
export interface ColumnAccessDeniedEvent extends GridEvent {
    readonly type: 'column:access:denied';
    readonly field: string;
    readonly userRole: string;
    readonly requiredRoles: string[];
}
export interface DataLoadEvent extends GridEvent {
    readonly type: 'data:change';
    readonly rowCount: number;
}
export interface DataErrorEvent extends GridEvent {
    readonly type: 'data:error';
    readonly error: Error;
}
export interface DataProgressEvent extends GridEvent {
    readonly type: 'data:progress';
    readonly loadedRowCount: number;
    readonly estimatedTotalCount: number;
    readonly phase: string;
}
export interface GridReadyEvent extends GridEvent {
    readonly type: 'grid:ready';
    readonly rowCount: number;
    readonly columnCount: number;
}
export interface GridDestroyEvent extends GridEvent {
    readonly type: 'grid:destroy';
}
export interface RowAddEvent extends GridEvent {
    readonly type: 'row:add';
    readonly rowId: RowId;
    readonly data: RowData;
    readonly position: number;
}
export interface RowUpdateEvent extends GridEvent {
    readonly type: 'row:update';
    readonly rowId: RowId;
    readonly changes: Partial<Record<string, unknown>>;
    readonly oldData: RowData;
    readonly newData: RowData;
}
export interface RowDeleteEvent extends GridEvent {
    readonly type: 'row:delete';
    readonly rowId: RowId;
    readonly data: RowData;
}
export interface GroupExpandEvent extends GridEvent {
    readonly type: 'group:expand';
    readonly groupKey: string;
}
export interface GroupCollapseEvent extends GridEvent {
    readonly type: 'group:collapse';
    readonly groupKey: string;
}
export interface SortClearEvent extends GridEvent {
    readonly type: 'sort:clear';
}
export interface FilterClearEvent extends GridEvent {
    readonly type: 'filter:clear';
}
export interface FilterPresetSaveEvent extends GridEvent {
    readonly type: 'filter:preset:save';
    readonly presetName: string;
    readonly preset: FilterPreset;
}
export interface FilterPresetLoadEvent extends GridEvent {
    readonly type: 'filter:preset:load';
    readonly presetName: string;
    readonly preset: FilterPreset;
}
export interface RowSelectEvent extends GridEvent {
    readonly type: 'row:select';
    readonly rowId: RowId;
}
export interface RowDeselectEvent extends GridEvent {
    readonly type: 'row:deselect';
    readonly rowId: RowId;
}
export interface CellSelectEvent extends GridEvent {
    readonly type: 'cell:select';
    readonly position: CellPosition;
}
export interface ViewportChangeEvent extends GridEvent {
    readonly type: 'viewport:change';
    readonly visibleRowRange: [number, number];
    readonly visibleColumnRange: [number, number];
}
export interface ExportStartEvent extends GridEvent {
    readonly type: 'export:start';
    readonly format: 'csv' | 'excel';
    readonly rowCount: number;
    readonly columnCount: number;
}
export interface ExportCompleteEvent extends GridEvent {
    readonly type: 'export:complete';
    readonly format: 'csv' | 'excel';
    readonly rowCount: number;
}
export interface ViewSaveEvent extends GridEvent {
    readonly type: 'view:save';
    readonly viewId: string;
    readonly viewName: string;
}
export interface ViewLoadEvent extends GridEvent {
    readonly type: 'view:load';
    readonly viewId: string;
}
export interface ViewDeleteEvent extends GridEvent {
    readonly type: 'view:delete';
    readonly viewId: string;
}
export interface GridEventMap {
    'grid:ready': GridReadyEvent;
    'grid:destroy': GridDestroyEvent;
    'data:change': DataLoadEvent;
    'data:error': DataErrorEvent;
    'data:progress': DataProgressEvent;
    'row:add': RowAddEvent;
    'row:update': RowUpdateEvent;
    'row:delete': RowDeleteEvent;
    'state:change': StateChangeEvent;
    'sort:change': SortChangeEvent;
    'sort:clear': SortClearEvent;
    'filter:change': FilterChangeEvent;
    'filter:clear': FilterClearEvent;
    'filter:preset:save': FilterPresetSaveEvent;
    'filter:preset:load': FilterPresetLoadEvent;
    'selection:change': SelectionChangeEvent;
    'row:select': RowSelectEvent;
    'row:deselect': RowDeselectEvent;
    'cell:select': CellSelectEvent;
    'edit:start': CellEditStartEvent;
    'edit:commit': CellEditCommitEvent;
    'edit:cancel': CellEditCancelEvent;
    'edit:validation:error': CellValidateEvent;
    'column:resize': ColumnResizeEvent;
    'column:reorder': ColumnMoveEvent;
    'column:visibility:change': ColumnVisibilityChangeEvent;
    'column:access:denied': ColumnAccessDeniedEvent;
    'viewport:scroll': ScrollEvent;
    'viewport:change': ViewportChangeEvent;
    'group:expand': GroupExpandEvent;
    'group:collapse': GroupCollapseEvent;
    'cell:click': CellClickEvent;
    'cell:dblclick': CellDoubleClickEvent;
    'row:click': RowClickEvent;
    'row:dblclick': RowDoubleClickEvent;
    'export:start': ExportStartEvent;
    'export:complete': ExportCompleteEvent;
    'view:save': ViewSaveEvent;
    'view:load': ViewLoadEvent;
    'view:delete': ViewDeleteEvent;
}
export type GridEventHandler<K extends keyof GridEventMap> = (event: GridEventMap[K]) => void | boolean;
//# sourceMappingURL=events.d.ts.map