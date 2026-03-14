/**
 * report-editor-wiring — Pure functions that translate data source panel
 * events into report editor state transitions.
 *
 * These bridge the gap between <phz-data-source-panel> events and
 * the report editor's state machine. Extracted for testability.
 *
 * Tasks: 1.1, 1.4 (WB-002, WB-003)
 */
import type { FieldMetadata } from '@phozart/shared';
import { type ReportEditorState } from './report-editor-state.js';
/**
 * Handle a field-add event from the data source panel.
 * Adds the field as a column in the report editor state.
 */
export declare function handleFieldAdd(state: ReportEditorState, fieldName: string, metadata: Pick<FieldMetadata, 'name' | 'dataType'>): ReportEditorState;
/**
 * Handle a field-remove event from the data source panel.
 * Removes the field column from the report editor state.
 */
export declare function handleFieldRemove(state: ReportEditorState, fieldName: string): ReportEditorState;
/**
 * Convert schema fields to the availableFields format expected by
 * the report editor's "Add Column" UI.
 */
export declare function buildAvailableFieldsFromSchema(fields: Array<Pick<FieldMetadata, 'name' | 'dataType'>>): Array<{
    field: string;
    label: string;
}>;
//# sourceMappingURL=report-editor-wiring.d.ts.map