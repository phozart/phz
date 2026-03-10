/**
 * @phozart/phz-workspace — Authoring State Machine
 *
 * Top-level state machine driving all authoring flows.
 * Pure immutable transitions — no side effects.
 */
export function initialAuthoringState() {
    return { mode: 'home', dirty: false, publishStatus: 'draft' };
}
export function startCreation(state, type) {
    return { ...state, mode: 'creating', artifactType: type, dirty: false };
}
export function openArtifact(state, id, type) {
    return {
        ...state,
        mode: type === 'report' ? 'editing-report' : 'editing-dashboard',
        artifactId: id,
        artifactType: type,
        dirty: false,
    };
}
export function markDirty(state) {
    return { ...state, dirty: true };
}
export function markSaved(state) {
    return { ...state, dirty: false, lastSavedAt: Date.now() };
}
export function setPublishStatus(state, status) {
    return { ...state, publishStatus: status };
}
export function returnHome(state) {
    return { ...state, mode: 'home', artifactId: undefined, artifactType: undefined, dirty: false };
}
export function canTransitionTo(state, target) {
    // Guard: warn if dirty when leaving edit mode
    if (state.dirty && (target === 'home' || target === 'creating')) {
        return false;
    }
    // Can't go to editing without openArtifact
    if ((target === 'editing-report' || target === 'editing-dashboard') && state.mode === 'home') {
        return false;
    }
    return true;
}
//# sourceMappingURL=authoring-state.js.map