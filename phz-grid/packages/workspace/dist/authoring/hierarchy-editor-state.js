/**
 * @phozart/phz-workspace — Hierarchy Editor State
 *
 * CRUD state machine for hierarchy definitions in the authoring environment.
 * Includes auto-detection of date fields from data source schema.
 *
 * Pure functions only — no side effects, no DOM.
 */
import { generateDateHierarchy } from '@phozart/phz-engine';
// ========================================================================
// Factory
// ========================================================================
export function initialHierarchyEditorState() {
    return {
        hierarchies: [],
        editingId: undefined,
        editingDraft: undefined,
        autoDetectedDate: undefined,
    };
}
// ========================================================================
// CRUD Operations
// ========================================================================
export function addHierarchy(state, hierarchy) {
    return {
        ...state,
        hierarchies: [...state.hierarchies, hierarchy],
    };
}
export function removeHierarchy(state, hierarchyId) {
    return {
        ...state,
        hierarchies: state.hierarchies.filter(h => h.id !== hierarchyId),
    };
}
export function updateHierarchy(state, updated) {
    return {
        ...state,
        hierarchies: state.hierarchies.map(h => (h.id === updated.id ? updated : h)),
    };
}
// ========================================================================
// Edit Flow
// ========================================================================
export function startEdit(state, hierarchyId) {
    const target = state.hierarchies.find(h => h.id === hierarchyId);
    if (!target)
        return state;
    return {
        ...state,
        editingId: hierarchyId,
        editingDraft: { ...target, levels: [...target.levels] },
    };
}
export function commitEdit(state) {
    if (!state.editingId || !state.editingDraft)
        return state;
    return {
        ...state,
        hierarchies: state.hierarchies.map(h => h.id === state.editingId ? state.editingDraft : h),
        editingId: undefined,
        editingDraft: undefined,
    };
}
// ========================================================================
// Auto-Detection
// ========================================================================
/**
 * Scan field metadata for the first date-type field and auto-generate
 * a date hierarchy from it. Returns unchanged state if no date fields found.
 */
export function autoDetectDateHierarchy(state, fields) {
    const dateField = fields.find(f => f.dataType === 'date');
    if (!dateField)
        return state;
    const hierarchy = generateDateHierarchy(dateField.name);
    return {
        ...state,
        autoDetectedDate: dateField.name,
        hierarchies: [...state.hierarchies, hierarchy],
    };
}
//# sourceMappingURL=hierarchy-editor-state.js.map