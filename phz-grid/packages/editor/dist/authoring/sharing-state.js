/**
 * @phozart/editor — Sharing Flow State (B-2.11)
 *
 * State machine for the sharing workflow. Authors manage artifact
 * visibility (personal/shared/published) and select share targets
 * (users, roles, teams).
 */
// ========================================================================
// Factory
// ========================================================================
export function createSharingFlowState(artifactId, visibility, overrides) {
    return {
        artifactId,
        currentVisibility: visibility,
        targetVisibility: visibility,
        shareTargets: [],
        searchQuery: '',
        searchResults: [],
        canPublish: false,
        saving: false,
        dirty: false,
        error: null,
        ...overrides,
    };
}
// ========================================================================
// Visibility transitions
// ========================================================================
/**
 * Set the target visibility.
 */
export function setTargetVisibility(state, visibility) {
    return {
        ...state,
        targetVisibility: visibility,
        dirty: visibility !== state.currentVisibility || state.shareTargets.length > 0,
    };
}
// ========================================================================
// Share target management
// ========================================================================
/**
 * Add a share target.
 */
export function addShareTarget(state, target) {
    // Prevent duplicates
    const isDuplicate = state.shareTargets.some(t => {
        if (t.type !== target.type)
            return false;
        switch (t.type) {
            case 'user':
                return target.type === 'user' && t.userId === target.userId;
            case 'role':
                return target.type === 'role' && t.roleName === target.roleName;
            case 'team':
                return target.type === 'team' && t.teamId === target.teamId;
            case 'everyone':
                return target.type === 'everyone';
        }
    });
    if (isDuplicate)
        return state;
    return {
        ...state,
        shareTargets: [...state.shareTargets, target],
        dirty: true,
    };
}
/**
 * Remove a share target by index.
 */
export function removeShareTarget(state, index) {
    if (index < 0 || index >= state.shareTargets.length)
        return state;
    const shareTargets = [...state.shareTargets];
    shareTargets.splice(index, 1);
    return {
        ...state,
        shareTargets,
        dirty: true,
    };
}
/**
 * Clear all share targets.
 */
export function clearShareTargets(state) {
    return { ...state, shareTargets: [], dirty: true };
}
// ========================================================================
// Search
// ========================================================================
/**
 * Update the search query.
 */
export function setShareSearchQuery(state, query) {
    return { ...state, searchQuery: query };
}
/**
 * Set the search results.
 */
export function setShareSearchResults(state, results) {
    return { ...state, searchResults: results };
}
// ========================================================================
// Save state
// ========================================================================
/**
 * Mark the sharing flow as saving.
 */
export function setSharingSaving(state, saving) {
    return { ...state, saving };
}
/**
 * Mark sharing as successfully saved.
 */
export function markSharingSaved(state) {
    return {
        ...state,
        currentVisibility: state.targetVisibility,
        saving: false,
        dirty: false,
        error: null,
    };
}
/**
 * Set the sharing error.
 */
export function setSharingError(state, error) {
    return { ...state, error, saving: false };
}
// ========================================================================
// Permissions
// ========================================================================
/**
 * Set whether the user can publish.
 */
export function setCanPublish(state, canPublish) {
    return { ...state, canPublish };
}
// ========================================================================
// Helpers
// ========================================================================
/**
 * Whether the visibility has changed from the original.
 */
export function hasVisibilityChanged(state) {
    return state.targetVisibility !== state.currentVisibility;
}
/**
 * Whether the sharing configuration is ready to save
 * (visibility changed or share targets added, and visibility is valid).
 */
export function canSaveSharing(state) {
    if (!state.dirty)
        return false;
    if (state.saving)
        return false;
    // If changing to 'published', must have canPublish permission
    if (state.targetVisibility === 'published' && !state.canPublish)
        return false;
    // If changing to 'shared', must have at least one share target
    if (state.targetVisibility === 'shared' && state.shareTargets.length === 0)
        return false;
    return true;
}
//# sourceMappingURL=sharing-state.js.map