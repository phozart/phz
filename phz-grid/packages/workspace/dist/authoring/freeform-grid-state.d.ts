/**
 * @phozart/workspace — Freeform Grid Dashboard State (B-3.04)
 *
 * Pure functions for CSS Grid-based freeform layout in the dashboard editor.
 * Supports snap-to-grid positioning, widget resize handles, drag operations,
 * z-ordering, multi-select, alignment, distribution, zoom, collision resolution,
 * and grid gap / column count configuration.
 */
export interface FreeformGridConfig {
    columns: number;
    rows: number;
    gapPx: number;
    cellSizePx: number;
    snapToGrid: boolean;
}
export interface WidgetPlacement {
    id: string;
    col: number;
    row: number;
    colSpan: number;
    rowSpan: number;
    zIndex?: number;
    locked?: boolean;
}
export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
export interface ResizeOperation {
    widgetId: string;
    handle: ResizeHandle;
    startPlacement: WidgetPlacement;
    currentPlacement: WidgetPlacement;
}
export interface DragOperation {
    widgetId: string;
    startPlacement: WidgetPlacement;
    currentPlacement: WidgetPlacement;
}
export interface FreeformGridState {
    grid: FreeformGridConfig;
    widgets: WidgetPlacement[];
    selectedWidgetIds: string[];
    resizing?: ResizeOperation;
    dragOperation?: DragOperation;
    zoom: number;
}
export declare function initialFreeformGridState(gridOverrides?: Partial<FreeformGridConfig>): FreeformGridState;
export declare function setGridColumns(state: FreeformGridState, columns: number): FreeformGridState;
export declare function setGridRows(state: FreeformGridState, rows: number): FreeformGridState;
export declare function setGridGap(state: FreeformGridState, gapPx: number): FreeformGridState;
export declare function setGridCellSize(state: FreeformGridState, cellSizePx: number): FreeformGridState;
export declare function toggleSnapToGrid(state: FreeformGridState): FreeformGridState;
export declare function snapToGrid(value: number, cellSize: number, gap: number): number;
export declare function snapPlacement(placement: WidgetPlacement, grid: FreeformGridConfig): WidgetPlacement;
export declare function addFreeformWidget(state: FreeformGridState, id: string, placement?: Partial<WidgetPlacement>): FreeformGridState;
export declare function removeFreeformWidget(state: FreeformGridState, id: string): FreeformGridState;
export declare function moveFreeformWidget(state: FreeformGridState, id: string, col: number, row: number): FreeformGridState;
export declare function selectFreeformWidget(state: FreeformGridState, id: string): FreeformGridState;
export declare function deselectFreeformWidget(state: FreeformGridState): FreeformGridState;
export declare function selectMultipleFreeformWidgets(state: FreeformGridState, widgetIds: string[]): FreeformGridState;
export declare function toggleFreeformWidgetSelection(state: FreeformGridState, widgetId: string): FreeformGridState;
export declare function startFreeformDrag(state: FreeformGridState, widgetId: string): FreeformGridState;
export declare function updateFreeformDrag(state: FreeformGridState, deltaCol: number, deltaRow: number): FreeformGridState;
export declare function commitFreeformDrag(state: FreeformGridState): FreeformGridState;
export declare function cancelFreeformDrag(state: FreeformGridState): FreeformGridState;
export declare function startResize(state: FreeformGridState, widgetId: string, handle: ResizeHandle): FreeformGridState;
export declare function updateResize(state: FreeformGridState, deltaCol: number, deltaRow: number): FreeformGridState;
export declare function commitResize(state: FreeformGridState): FreeformGridState;
export declare function cancelResize(state: FreeformGridState): FreeformGridState;
export declare function bringToFront(state: FreeformGridState, widgetId: string): FreeformGridState;
export declare function sendToBack(state: FreeformGridState, widgetId: string): FreeformGridState;
export declare function lockFreeformWidget(state: FreeformGridState, widgetId: string): FreeformGridState;
export declare function unlockFreeformWidget(state: FreeformGridState, widgetId: string): FreeformGridState;
export declare function alignFreeformWidgets(state: FreeformGridState, alignment: 'left' | 'right' | 'top' | 'bottom' | 'center-h' | 'center-v'): FreeformGridState;
export declare function distributeFreeformWidgets(state: FreeformGridState, direction: 'horizontal' | 'vertical'): FreeformGridState;
export declare function setFreeformZoom(state: FreeformGridState, zoom: number): FreeformGridState;
export declare function findOpenPosition(state: FreeformGridState, colSpan: number, rowSpan: number): {
    col: number;
    row: number;
};
export declare function autoExpandRows(state: FreeformGridState): FreeformGridState;
export declare function detectCollisions(state: FreeformGridState, target: WidgetPlacement): WidgetPlacement[];
export declare function resolveCollisions(state: FreeformGridState, movedWidgetId: string): FreeformGridState;
export declare function pixelToGrid(px: number, cellSize: number, gap: number): number;
export declare function gridToPixel(cell: number, cellSize: number, gap: number): number;
export declare function toCSSGridStyle(grid: FreeformGridConfig): Record<string, string>;
export declare function toWidgetStyle(widget: WidgetPlacement): Record<string, string>;
//# sourceMappingURL=freeform-grid-state.d.ts.map