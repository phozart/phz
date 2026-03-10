/**
 * report-editor-wiring — Pure functions that translate data source panel
 * events into report editor state transitions.
 *
 * These bridge the gap between <phz-data-source-panel> events and
 * the report editor's state machine. Extracted for testability.
 *
 * Tasks: 1.1, 1.4 (WB-002, WB-003)
 */
import { addColumn, removeColumn, } from './report-editor-state.js';
/**
 * Handle a field-add event from the data source panel.
 * Adds the field as a column in the report editor state.
 */
export function handleFieldAdd(state, fieldName, metadata) {
    return addColumn(state, fieldName, metadata.name);
}
/**
 * Handle a field-remove event from the data source panel.
 * Removes the field column from the report editor state.
 */
export function handleFieldRemove(state, fieldName) {
    return removeColumn(state, fieldName);
}
/**
 * Convert schema fields to the availableFields format expected by
 * the report editor's "Add Column" UI.
 */
export function buildAvailableFieldsFromSchema(fields) {
    return fields.map(f => ({ field: f.name, label: f.name }));
}
//# sourceMappingURL=report-editor-wiring.js.map