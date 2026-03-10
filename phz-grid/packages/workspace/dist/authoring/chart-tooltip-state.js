/**
 * @phozart/phz-workspace — Chart Tooltip Editor State
 *
 * Pure state machine for CRUD operations on chart tooltip configuration
 * within the dashboard/report authoring environment.
 */
// ========================================================================
// Factory
// ========================================================================
export function initialChartTooltipEditorState() {
    return {
        mode: 'auto',
        autoConfig: {
            showCategory: true,
            showValue: true,
            showPercentage: false,
            showDelta: false,
        },
        customFields: [],
    };
}
// ========================================================================
// Mode
// ========================================================================
export function setTooltipMode(state, mode) {
    if (state.mode === mode)
        return state;
    return { ...state, mode };
}
// ========================================================================
// Auto Config
// ========================================================================
export function updateAutoConfig(state, patch) {
    return { ...state, autoConfig: { ...state.autoConfig, ...patch } };
}
// ========================================================================
// Custom Fields CRUD
// ========================================================================
export function addCustomField(state, field) {
    return { ...state, customFields: [...state.customFields, field] };
}
export function removeCustomField(state, index) {
    if (index < 0 || index >= state.customFields.length)
        return state;
    const next = state.customFields.filter((_, i) => i !== index);
    return { ...state, customFields: next };
}
export function updateCustomField(state, index, patch) {
    if (index < 0 || index >= state.customFields.length)
        return state;
    const next = state.customFields.map((f, i) => (i === index ? { ...f, ...patch } : f));
    return { ...state, customFields: next };
}
export function reorderCustomFields(state, newOrder) {
    const reordered = newOrder
        .filter(i => i >= 0 && i < state.customFields.length)
        .map((srcIdx, newIdx) => ({ ...state.customFields[srcIdx], order: newIdx }));
    return { ...state, customFields: reordered };
}
// ========================================================================
// Edit Tracking
// ========================================================================
export function startEditField(state, index) {
    return { ...state, editingFieldIndex: index };
}
export function commitField(state) {
    return { ...state, editingFieldIndex: undefined };
}
//# sourceMappingURL=chart-tooltip-state.js.map