/**
 * @phozart/phz-workspace — Visibility Dialog State
 *
 * Pure functions for managing the publish/share visibility dialog.
 * Handles visibility transitions (personal -> shared -> published),
 * share target management, and confirmation workflows.
 */
import type { ArtifactVisibility } from '@phozart/phz-shared/artifacts';
export interface VisibilityShareTarget {
    id: string;
    type: 'user' | 'role' | 'team';
    label: string;
}
export interface VisibilityTransitionDraft {
    from: ArtifactVisibility;
    to: ArtifactVisibility;
    shareTargets: VisibilityShareTarget[];
}
export interface VisibilityDialogState {
    visibility: ArtifactVisibility;
    shareTargets: VisibilityShareTarget[];
    confirmationRequired: boolean;
    transitionDraft?: VisibilityTransitionDraft;
}
export declare function initialVisibilityDialogState(visibility?: ArtifactVisibility): VisibilityDialogState;
export declare function setVisibility(state: VisibilityDialogState, visibility: ArtifactVisibility): VisibilityDialogState;
export declare function addShareTarget(state: VisibilityDialogState, target: VisibilityShareTarget): VisibilityDialogState;
export declare function removeShareTarget(state: VisibilityDialogState, targetId: string): VisibilityDialogState;
export declare function prepareTransition(state: VisibilityDialogState, to: ArtifactVisibility): VisibilityDialogState;
export declare function confirmTransition(state: VisibilityDialogState): VisibilityDialogState;
export interface VisibilityValidationResult {
    valid: boolean;
    errors: string[];
}
export declare function validateTransition(state: VisibilityDialogState, to: ArtifactVisibility): VisibilityValidationResult;
//# sourceMappingURL=visibility-dialog-state.d.ts.map