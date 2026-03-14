/**
 * @phozart/workspace — Report Drill Config State
 *
 * Pure functions for managing drill-through action configuration
 * on report columns. Supports CRUD operations on drill actions
 * with draft editing and validation.
 */
export function initialReportDrillConfigState() {
    return {
        drillActions: [],
    };
}
export function addDrillAction(state, action) {
    if (state.drillActions.some(a => a.id === action.id))
        return state;
    return { ...state, drillActions: [...state.drillActions, action] };
}
export function removeDrillAction(state, actionId) {
    return {
        ...state,
        drillActions: state.drillActions.filter(a => a.id !== actionId),
        // Clear editing state if removing the action being edited
        editingDrillId: state.editingDrillId === actionId ? undefined : state.editingDrillId,
        drillDraft: state.editingDrillId === actionId ? undefined : state.drillDraft,
    };
}
export function updateDrillAction(state, actionId, updates) {
    return {
        ...state,
        drillActions: state.drillActions.map(a => a.id === actionId ? { ...a, ...updates, id: a.id } : a),
    };
}
export function startEditDrill(state, actionId) {
    const action = state.drillActions.find(a => a.id === actionId);
    if (!action)
        return state;
    return {
        ...state,
        editingDrillId: actionId,
        drillDraft: { ...action },
    };
}
export function commitDrill(state) {
    if (!state.editingDrillId || !state.drillDraft)
        return state;
    const editId = state.editingDrillId;
    return {
        ...state,
        drillActions: state.drillActions.map(a => a.id === editId ? { ...a, ...state.drillDraft, id: a.id } : a),
        editingDrillId: undefined,
        drillDraft: undefined,
    };
}
export function validateDrillConfig(action) {
    const errors = [];
    if (!action.label?.trim())
        errors.push('Label is required');
    if (!action.targetArtifactId?.trim())
        errors.push('Target artifact is required');
    if (!action.sourceField?.trim())
        errors.push('Source field is required');
    if (!action.targetArtifactType)
        errors.push('Target artifact type is required');
    return { valid: errors.length === 0, errors };
}
//# sourceMappingURL=report-drill-config-state.js.map