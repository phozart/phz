/**
 * @phozart/phz-workspace — Auto-save Controller (L.12)
 *
 * Pure state machine for auto-saving drafts.
 * Saves after 30s of inactivity, with conflict detection.
 */
export const AUTO_SAVE_DELAY_MS = 30_000;
export function createAutoSaveState() {
    return {
        dirty: false,
        conflict: false,
    };
}
export function markDirty(state, data) {
    return {
        ...state,
        dirty: true,
        draft: {
            data,
            dirtyAt: Date.now(),
        },
    };
}
export function markSaved(state) {
    return {
        ...state,
        dirty: false,
        draft: undefined,
        lastSavedAt: Date.now(),
        conflict: false,
        conflictMessage: undefined,
    };
}
export function markConflict(state, message) {
    return {
        ...state,
        conflict: true,
        conflictMessage: message,
    };
}
export function shouldAutoSave(state, now) {
    if (!state.dirty || !state.draft)
        return false;
    if (state.conflict)
        return false;
    return now - state.draft.dirtyAt >= AUTO_SAVE_DELAY_MS;
}
export function resumeDraft(state) {
    return state.draft?.data;
}
export function discardDraft(state) {
    return {
        ...state,
        dirty: false,
        draft: undefined,
    };
}
//# sourceMappingURL=auto-save-controller.js.map