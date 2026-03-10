/**
 * @phozart/phz-workspace — Authoring State Machine
 *
 * Top-level state machine driving all authoring flows.
 * Pure immutable transitions — no side effects.
 */
export interface AuthoringState {
    mode: 'home' | 'creating' | 'editing-report' | 'editing-dashboard';
    artifactId?: string;
    artifactType?: 'report' | 'dashboard';
    dirty: boolean;
    publishStatus: 'draft' | 'review' | 'published';
    lastSavedAt?: number;
}
export declare function initialAuthoringState(): AuthoringState;
export declare function startCreation(state: AuthoringState, type: 'report' | 'dashboard'): AuthoringState;
export declare function openArtifact(state: AuthoringState, id: string, type: 'report' | 'dashboard'): AuthoringState;
export declare function markDirty(state: AuthoringState): AuthoringState;
export declare function markSaved(state: AuthoringState): AuthoringState;
export declare function setPublishStatus(state: AuthoringState, status: 'draft' | 'review' | 'published'): AuthoringState;
export declare function returnHome(state: AuthoringState): AuthoringState;
export declare function canTransitionTo(state: AuthoringState, target: AuthoringState['mode']): boolean;
//# sourceMappingURL=authoring-state.d.ts.map