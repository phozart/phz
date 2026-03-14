/**
 * dashboard-editor-wiring — Pure functions that translate data source panel
 * events into dashboard editor state transitions.
 *
 * Bridges <phz-data-source-panel> field-add/field-remove events with the
 * dashboard editor's widget data config. When a field is added, it's placed
 * into the selected widget's dimensions or measures based on data type.
 *
 * Tasks: 1.2, 1.5 (WB-004)
 */
import type { FieldMetadata } from '@phozart/shared';
import type { WidgetManifest } from '../types.js';
import { type WidgetSuggestion } from '@phozart/engine';
import { type DashboardEditorState, type DashboardWidgetState, type DashboardSourceEntry } from './dashboard-editor-state.js';
/**
 * Handle a field-add event from the data source panel.
 * Adds the field to the selected widget's data config:
 * - number/measure → measures (with default aggregation 'sum')
 * - string/date/boolean → dimensions
 */
export declare function handleDashboardFieldAdd(state: DashboardEditorState, fieldName: string, metadata: Pick<FieldMetadata, 'name' | 'dataType' | 'semanticHint'>): DashboardEditorState;
/**
 * Handle a field-remove event from the data source panel.
 * Removes the field from the selected widget's dimensions and measures.
 */
export declare function handleDashboardFieldRemove(state: DashboardEditorState, fieldName: string): DashboardEditorState;
/**
 * Suggest a widget type to auto-create when a field is added
 * but no widget is selected. Delegates to suggestWidgetForFieldDrop()
 * for context-aware chart type selection.
 */
export declare function autoCreateWidgetForField(metadata: Pick<FieldMetadata, 'name' | 'dataType' | 'semanticHint'>, existingWidgets?: ReadonlyArray<DashboardWidgetState>, availableFields?: ReadonlyArray<FieldMetadata>): WidgetSuggestion;
/**
 * Create a widget from the palette gallery using manifest metadata.
 * Uses the manifest's preferredSize for initial placement, distinct from
 * the field-drop-based autoCreateWidgetForField path.
 */
export declare function createWidgetFromPalette(state: DashboardEditorState, widgetType: string, position: {
    row: number;
    col: number;
}, manifest?: WidgetManifest, sourceSlotId?: string): DashboardEditorState;
/**
 * Resolves the data source entry for the currently selected widget.
 * Returns the widget's bound source, or the dashboard's primary source.
 */
export declare function getSelectedWidgetSource(state: DashboardEditorState): DashboardSourceEntry | undefined;
//# sourceMappingURL=dashboard-editor-wiring.d.ts.map