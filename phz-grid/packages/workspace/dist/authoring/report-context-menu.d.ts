/**
 * @phozart/workspace — Report Context Menu
 *
 * Pure functions that generate context menu items for report editing.
 */
import type { ReportEditorState } from './report-editor-state.js';
export interface ContextMenuItem {
    id: string;
    label: string;
    icon?: string;
    shortcut?: string;
    disabled?: boolean;
    separator?: boolean;
    children?: ContextMenuItem[];
}
export type ReportContextTarget = {
    type: 'column-header';
    field: string;
} | {
    type: 'cell';
    field: string;
    rowIndex: number;
    value: unknown;
} | {
    type: 'row';
    rowIndex: number;
} | {
    type: 'selection';
    fields: string[];
    rowIndices: number[];
};
export declare function getColumnHeaderMenu(state: ReportEditorState, field: string): ContextMenuItem[];
export declare function getCellMenu(_state: ReportEditorState, target: {
    type: 'cell';
    field: string;
    rowIndex: number;
    value: unknown;
}): ContextMenuItem[];
export declare function getSelectionMenu(_state: ReportEditorState, _target: {
    type: 'selection';
    fields: string[];
    rowIndices: number[];
}): ContextMenuItem[];
export declare function getContextMenu(state: ReportEditorState, target: ReportContextTarget): ContextMenuItem[];
//# sourceMappingURL=report-context-menu.d.ts.map