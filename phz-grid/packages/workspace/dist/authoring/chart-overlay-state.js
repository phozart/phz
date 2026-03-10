/**
 * @phozart/phz-workspace — Chart Overlay Config Panel State Machine
 *
 * Pure state machine for managing chart analytics overlays in the
 * dashboard editor config panel. Supports CRUD operations and an
 * edit-draft-commit flow for safe in-place editing.
 */
// ========================================================================
// initialChartOverlayState
// ========================================================================
export function initialChartOverlayState(existingOverlays) {
    return {
        overlays: existingOverlays ? [...existingOverlays] : [],
        editingOverlayId: undefined,
        editingDraft: undefined,
    };
}
// ========================================================================
// addOverlay
// ========================================================================
export function addOverlay(state, overlay) {
    return {
        ...state,
        overlays: [...state.overlays, overlay],
    };
}
// ========================================================================
// removeOverlay
// ========================================================================
export function removeOverlay(state, overlayId) {
    const exists = state.overlays.some(o => o.id === overlayId);
    if (!exists)
        return state;
    const clearEditing = state.editingOverlayId === overlayId;
    return {
        ...state,
        overlays: state.overlays.filter(o => o.id !== overlayId),
        editingOverlayId: clearEditing ? undefined : state.editingOverlayId,
        editingDraft: clearEditing ? undefined : state.editingDraft,
    };
}
// ========================================================================
// updateOverlay
// ========================================================================
export function updateOverlay(state, overlayId, updates) {
    const idx = state.overlays.findIndex(o => o.id === overlayId);
    if (idx === -1)
        return state;
    const updated = [...state.overlays];
    updated[idx] = { ...updated[idx], ...updates };
    return { ...state, overlays: updated };
}
// ========================================================================
// startEditOverlay
// ========================================================================
export function startEditOverlay(state, overlayId) {
    const overlay = state.overlays.find(o => o.id === overlayId);
    if (!overlay)
        return state;
    return {
        ...state,
        editingOverlayId: overlayId,
        editingDraft: { ...overlay },
    };
}
// ========================================================================
// commitOverlay
// ========================================================================
export function commitOverlay(state) {
    if (!state.editingOverlayId || !state.editingDraft)
        return state;
    const updated = state.overlays.map(o => o.id === state.editingOverlayId ? { ...state.editingDraft } : o);
    return {
        ...state,
        overlays: updated,
        editingOverlayId: undefined,
        editingDraft: undefined,
    };
}
// ========================================================================
// cancelEditOverlay
// ========================================================================
export function cancelEditOverlay(state) {
    return {
        ...state,
        editingOverlayId: undefined,
        editingDraft: undefined,
    };
}
// ========================================================================
// reorderOverlays
// ========================================================================
export function reorderOverlays(state, newOrder) {
    const overlayMap = new Map(state.overlays.map(o => [o.id, o]));
    const reordered = [];
    for (const id of newOrder) {
        const overlay = overlayMap.get(id);
        if (overlay)
            reordered.push(overlay);
    }
    return { ...state, overlays: reordered };
}
//# sourceMappingURL=chart-overlay-state.js.map