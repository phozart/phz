/**
 * @phozart/phz-workspace — Visibility Dialog State
 *
 * Pure functions for managing the publish/share visibility dialog.
 * Handles visibility transitions (personal -> shared -> published),
 * share target management, and confirmation workflows.
 */
export function initialVisibilityDialogState(visibility = 'personal') {
    return {
        visibility,
        shareTargets: [],
        confirmationRequired: false,
    };
}
export function setVisibility(state, visibility) {
    return { ...state, visibility };
}
export function addShareTarget(state, target) {
    if (state.shareTargets.some(t => t.id === target.id))
        return state;
    return { ...state, shareTargets: [...state.shareTargets, target] };
}
export function removeShareTarget(state, targetId) {
    return {
        ...state,
        shareTargets: state.shareTargets.filter(t => t.id !== targetId),
    };
}
export function prepareTransition(state, to) {
    if (state.visibility === to)
        return state;
    // Transition to published or from shared/published requires confirmation
    const requiresConfirmation = to === 'published' || state.visibility === 'published';
    return {
        ...state,
        confirmationRequired: requiresConfirmation,
        transitionDraft: {
            from: state.visibility,
            to,
            shareTargets: to === 'shared' ? [...state.shareTargets] : [],
        },
    };
}
export function confirmTransition(state) {
    if (!state.transitionDraft)
        return state;
    return {
        ...state,
        visibility: state.transitionDraft.to,
        shareTargets: state.transitionDraft.to === 'shared'
            ? state.transitionDraft.shareTargets
            : state.shareTargets,
        confirmationRequired: false,
        transitionDraft: undefined,
    };
}
export function validateTransition(state, to) {
    const errors = [];
    if (state.visibility === to) {
        errors.push('Already at target visibility');
    }
    if (to === 'shared' && state.shareTargets.length === 0) {
        errors.push('At least one share target is required for shared visibility');
    }
    return { valid: errors.length === 0, errors };
}
//# sourceMappingURL=visibility-dialog-state.js.map