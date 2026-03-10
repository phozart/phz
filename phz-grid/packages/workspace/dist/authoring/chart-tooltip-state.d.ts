/**
 * @phozart/phz-workspace — Chart Tooltip Editor State
 *
 * Pure state machine for CRUD operations on chart tooltip configuration
 * within the dashboard/report authoring environment.
 */
import type { AutoTooltipConfig, TooltipField } from '@phozart/phz-engine';
export interface ChartTooltipEditorState {
    mode: 'auto' | 'custom';
    autoConfig: AutoTooltipConfig;
    customFields: TooltipField[];
    editingFieldIndex?: number;
}
export declare function initialChartTooltipEditorState(): ChartTooltipEditorState;
export declare function setTooltipMode(state: ChartTooltipEditorState, mode: 'auto' | 'custom'): ChartTooltipEditorState;
export declare function updateAutoConfig(state: ChartTooltipEditorState, patch: Partial<AutoTooltipConfig>): ChartTooltipEditorState;
export declare function addCustomField(state: ChartTooltipEditorState, field: TooltipField): ChartTooltipEditorState;
export declare function removeCustomField(state: ChartTooltipEditorState, index: number): ChartTooltipEditorState;
export declare function updateCustomField(state: ChartTooltipEditorState, index: number, patch: Partial<TooltipField>): ChartTooltipEditorState;
export declare function reorderCustomFields(state: ChartTooltipEditorState, newOrder: number[]): ChartTooltipEditorState;
export declare function startEditField(state: ChartTooltipEditorState, index: number): ChartTooltipEditorState;
export declare function commitField(state: ChartTooltipEditorState): ChartTooltipEditorState;
//# sourceMappingURL=chart-tooltip-state.d.ts.map