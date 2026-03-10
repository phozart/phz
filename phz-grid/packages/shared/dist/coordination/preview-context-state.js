/**
 * @phozart/phz-shared — Preview Context State (C-2.11)
 *
 * State for "preview as viewer" functionality. Allows admins/authors
 * to impersonate a viewer role and see the dashboard as that user would.
 *
 * Pure functions only — no side effects, no DOM.
 */
// ========================================================================
// Factory
// ========================================================================
/**
 * Create a fresh PreviewContextState.
 */
export function createPreviewContextState(overrides) {
    return {
        enabled: false,
        previewContext: null,
        availableRoles: [],
        selectedRole: null,
        customUserId: '',
        ...overrides,
    };
}
// ========================================================================
// State transitions
// ========================================================================
/**
 * Enable preview mode with a specific viewer context.
 */
export function enablePreview(state, context) {
    return {
        ...state,
        enabled: true,
        previewContext: context,
        selectedRole: context.roles?.[0] ?? state.selectedRole,
        customUserId: context.userId ?? state.customUserId,
    };
}
/**
 * Disable preview mode and clear the preview context.
 */
export function disablePreview(state) {
    return {
        ...state,
        enabled: false,
        previewContext: null,
    };
}
/**
 * Select a role for preview. Automatically updates the preview context
 * if preview is enabled.
 */
export function selectRole(state, role) {
    const newState = { ...state, selectedRole: role };
    if (state.enabled && state.previewContext) {
        newState.previewContext = {
            ...state.previewContext,
            roles: [role],
        };
    }
    return newState;
}
/**
 * Set the custom user ID for impersonation.
 */
export function setCustomUserId(state, userId) {
    const newState = { ...state, customUserId: userId };
    if (state.enabled && state.previewContext) {
        newState.previewContext = {
            ...state.previewContext,
            userId,
        };
    }
    return newState;
}
/**
 * Set the available roles list.
 */
export function setAvailableRoles(state, roles) {
    return { ...state, availableRoles: roles };
}
/**
 * Build a ViewerContext from the current state for passing to DataAdapter.
 * Returns null if preview is not enabled.
 */
export function getEffectiveContext(state) {
    if (!state.enabled)
        return null;
    return state.previewContext;
}
//# sourceMappingURL=preview-context-state.js.map