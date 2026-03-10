/**
 * @phozart/phz-editor — Sharing Flow State (B-2.11)
 *
 * State machine for the sharing workflow. Authors manage artifact
 * visibility (personal/shared/published) and select share targets
 * (users, roles, teams).
 */
import type { ShareTarget } from '@phozart/phz-shared/types';
import type { ArtifactVisibility } from '@phozart/phz-shared/artifacts';
export interface SharingFlowState {
    /** The artifact being shared. */
    artifactId: string;
    /** Current visibility of the artifact. */
    currentVisibility: ArtifactVisibility;
    /** Target visibility (what the user wants to change to). */
    targetVisibility: ArtifactVisibility;
    /** Currently configured share targets. */
    shareTargets: ShareTarget[];
    /** Search query for finding users/roles/teams. */
    searchQuery: string;
    /** Search results. */
    searchResults: ShareTarget[];
    /** Whether the current viewer can publish (requires admin role). */
    canPublish: boolean;
    /** Whether the sharing operation is in progress. */
    saving: boolean;
    /** Whether the share configuration has changed. */
    dirty: boolean;
    /** Error state. */
    error: unknown;
}
export declare function createSharingFlowState(artifactId: string, visibility: ArtifactVisibility, overrides?: Partial<SharingFlowState>): SharingFlowState;
/**
 * Set the target visibility.
 */
export declare function setTargetVisibility(state: SharingFlowState, visibility: ArtifactVisibility): SharingFlowState;
/**
 * Add a share target.
 */
export declare function addShareTarget(state: SharingFlowState, target: ShareTarget): SharingFlowState;
/**
 * Remove a share target by index.
 */
export declare function removeShareTarget(state: SharingFlowState, index: number): SharingFlowState;
/**
 * Clear all share targets.
 */
export declare function clearShareTargets(state: SharingFlowState): SharingFlowState;
/**
 * Update the search query.
 */
export declare function setShareSearchQuery(state: SharingFlowState, query: string): SharingFlowState;
/**
 * Set the search results.
 */
export declare function setShareSearchResults(state: SharingFlowState, results: ShareTarget[]): SharingFlowState;
/**
 * Mark the sharing flow as saving.
 */
export declare function setSharingSaving(state: SharingFlowState, saving: boolean): SharingFlowState;
/**
 * Mark sharing as successfully saved.
 */
export declare function markSharingSaved(state: SharingFlowState): SharingFlowState;
/**
 * Set the sharing error.
 */
export declare function setSharingError(state: SharingFlowState, error: unknown): SharingFlowState;
/**
 * Set whether the user can publish.
 */
export declare function setCanPublish(state: SharingFlowState, canPublish: boolean): SharingFlowState;
/**
 * Whether the visibility has changed from the original.
 */
export declare function hasVisibilityChanged(state: SharingFlowState): boolean;
/**
 * Whether the sharing configuration is ready to save
 * (visibility changed or share targets added, and visibility is valid).
 */
export declare function canSaveSharing(state: SharingFlowState): boolean;
//# sourceMappingURL=sharing-state.d.ts.map