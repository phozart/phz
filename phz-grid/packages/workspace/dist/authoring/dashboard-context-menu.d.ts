/**
 * @phozart/phz-workspace — Dashboard Context Menu
 *
 * Pure functions generating context menus for dashboard editing targets.
 */
import type { ContextMenuItem } from './report-context-menu.js';
import type { DashboardEditorState } from './dashboard-editor-state.js';
export type DashboardContextTarget = {
    type: 'widget';
    widgetId: string;
} | {
    type: 'canvas';
    position: {
        row: number;
        col: number;
    };
} | {
    type: 'chart-segment';
    widgetId: string;
    segmentIndex: number;
    value: unknown;
} | {
    type: 'kpi-value';
    widgetId: string;
};
export declare function getWidgetMenu(state: DashboardEditorState, widgetId: string): ContextMenuItem[];
export declare function getCanvasMenu(_state: DashboardEditorState, _position: {
    row: number;
    col: number;
}): ContextMenuItem[];
export declare function getChartSegmentMenu(_state: DashboardEditorState, target: {
    type: 'chart-segment';
    widgetId: string;
    segmentIndex: number;
    value: unknown;
}): ContextMenuItem[];
export declare function getDashboardContextMenu(state: DashboardEditorState, target: DashboardContextTarget): ContextMenuItem[];
//# sourceMappingURL=dashboard-context-menu.d.ts.map