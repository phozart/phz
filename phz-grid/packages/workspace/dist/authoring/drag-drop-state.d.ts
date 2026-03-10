/**
 * @phozart/phz-workspace — Drag-and-Drop State
 *
 * Pure state management for drag-and-drop operations in the dashboard editor.
 */
import type { DashboardEditorState } from './dashboard-editor-state.js';
export type DragSource = {
    type: 'field-palette';
    field: string;
    dataType: string;
    semanticHint?: string;
} | {
    type: 'widget-library';
    widgetType: string;
} | {
    type: 'existing-widget';
    widgetId: string;
} | {
    type: 'filter-chip';
    filterId: string;
};
export type DropTarget = {
    type: 'canvas-cell';
    row: number;
    col: number;
} | {
    type: 'widget-data-zone';
    widgetId: string;
    zone: 'dimensions' | 'measures' | 'filters';
} | {
    type: 'filter-bar';
} | {
    type: 'widget-swap';
    widgetId: string;
};
export interface DragDropState {
    dragging?: DragSource;
    hovering?: DropTarget;
    validTargets: DropTarget[];
}
export declare function initialDragDropState(): DragDropState;
export declare function startDrag(state: DragDropState, source: DragSource): DragDropState;
export declare function hoverTarget(state: DragDropState, target: DropTarget | undefined): DragDropState;
export declare function cancelDrag(_state: DragDropState): DragDropState;
export declare function computeValidTargets(source: DragSource, dashboardState: DashboardEditorState): DropTarget[];
export declare function executeDrop(dashboardState: DashboardEditorState, source: DragSource, target: DropTarget): DashboardEditorState;
//# sourceMappingURL=drag-drop-state.d.ts.map