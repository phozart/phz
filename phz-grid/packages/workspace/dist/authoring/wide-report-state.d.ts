/**
 * @phozart/phz-workspace — Wide Report Editor State (B-3.03)
 *
 * Pure functions for managing reports with 30+ columns.
 * Supports column groups, horizontal scroll with frozen columns,
 * column search/filter in the configurator, and drag-and-drop reorder.
 */
export interface WideColumnConfig {
    field: string;
    label: string;
    width: number;
    visible: boolean;
    pinned?: 'left' | 'right';
    groupId?: string;
    format?: string;
    aggregation?: string;
}
export interface ColumnGroup {
    id: string;
    label: string;
    collapsed: boolean;
}
export interface WideReportState {
    columns: WideColumnConfig[];
    groups: ColumnGroup[];
    frozenLeftCount: number;
    frozenRightCount: number;
    columnSearch: string;
    selectedColumnField?: string;
    dragSourceIndex?: number;
    dragTargetIndex?: number;
}
export declare function initialWideReportState(columns?: WideColumnConfig[], groups?: ColumnGroup[]): WideReportState;
export declare function addColumnGroup(state: WideReportState, group: ColumnGroup): WideReportState;
export declare function removeColumnGroup(state: WideReportState, groupId: string): WideReportState;
export declare function toggleGroupCollapsed(state: WideReportState, groupId: string): WideReportState;
export declare function assignColumnToGroup(state: WideReportState, field: string, groupId: string | undefined): WideReportState;
export declare function getColumnsInGroup(state: WideReportState, groupId: string): WideColumnConfig[];
export declare function getUngroupedColumns(state: WideReportState): WideColumnConfig[];
export declare function setFrozenLeft(state: WideReportState, count: number): WideReportState;
export declare function setFrozenRight(state: WideReportState, count: number): WideReportState;
export declare function getFrozenLeftColumns(state: WideReportState): WideColumnConfig[];
export declare function getFrozenRightColumns(state: WideReportState): WideColumnConfig[];
export declare function getScrollableColumns(state: WideReportState): WideColumnConfig[];
export declare function setColumnSearch(state: WideReportState, search: string): WideReportState;
export declare function getFilteredColumns(state: WideReportState): WideColumnConfig[];
export declare function getVisibleColumns(state: WideReportState): WideColumnConfig[];
export declare function startColumnDrag(state: WideReportState, fromIndex: number): WideReportState;
export declare function hoverColumnTarget(state: WideReportState, targetIndex: number): WideReportState;
export declare function dropColumn(state: WideReportState): WideReportState;
export declare function cancelColumnDrag(state: WideReportState): WideReportState;
export declare function addWideColumn(state: WideReportState, column: WideColumnConfig): WideReportState;
export declare function removeWideColumn(state: WideReportState, field: string): WideReportState;
export declare function updateWideColumn(state: WideReportState, field: string, updates: Partial<WideColumnConfig>): WideReportState;
export declare function toggleWideColumnVisibility(state: WideReportState, field: string): WideReportState;
//# sourceMappingURL=wide-report-state.d.ts.map