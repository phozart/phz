/**
 * @phozart/workspace — Preview-as Utils (L.19)
 *
 * Immutable state for viewer context simulation ("preview as" role/user).
 */
const MAX_RECENT = 5;
export function createPreviewAsState() {
    return { active: false, context: undefined, recentContexts: [] };
}
export function setPreviewContext(state, context) {
    // Remove duplicate (match by userId) and add to end
    const filtered = state.recentContexts.filter(c => c.userId !== context.userId);
    const recents = [...filtered, context];
    // Keep only the last MAX_RECENT
    const trimmed = recents.length > MAX_RECENT
        ? recents.slice(recents.length - MAX_RECENT)
        : recents;
    return {
        active: true,
        context,
        recentContexts: trimmed,
    };
}
export function clearPreviewContext(state) {
    return {
        ...state,
        active: false,
        context: undefined,
    };
}
//# sourceMappingURL=preview-as-utils.js.map