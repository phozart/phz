/**
 * @phozart/shared — Preview Context State (C-2.11)
 *
 * State for "preview as viewer" functionality. Allows admins/authors
 * to impersonate a viewer role and see the dashboard as that user would.
 *
 * Pure functions only — no side effects, no DOM.
 */
import type { ViewerContext } from '../adapters/data-adapter.js';
export interface PreviewContextState {
    /** Whether preview mode is currently active. */
    enabled: boolean;
    /** The viewer context being previewed (null when not previewing). */
    previewContext: ViewerContext | null;
    /** Available roles that can be previewed. */
    availableRoles: string[];
    /** Currently selected role for preview. */
    selectedRole: string | null;
    /** Custom user ID to impersonate. */
    customUserId: string;
}
/**
 * Create a fresh PreviewContextState.
 */
export declare function createPreviewContextState(overrides?: Partial<PreviewContextState>): PreviewContextState;
/**
 * Enable preview mode with a specific viewer context.
 */
export declare function enablePreview(state: PreviewContextState, context: ViewerContext): PreviewContextState;
/**
 * Disable preview mode and clear the preview context.
 */
export declare function disablePreview(state: PreviewContextState): PreviewContextState;
/**
 * Select a role for preview. Automatically updates the preview context
 * if preview is enabled.
 */
export declare function selectRole(state: PreviewContextState, role: string): PreviewContextState;
/**
 * Set the custom user ID for impersonation.
 */
export declare function setCustomUserId(state: PreviewContextState, userId: string): PreviewContextState;
/**
 * Set the available roles list.
 */
export declare function setAvailableRoles(state: PreviewContextState, roles: string[]): PreviewContextState;
/**
 * Build a ViewerContext from the current state for passing to DataAdapter.
 * Returns null if preview is not enabled.
 */
export declare function getEffectiveContext(state: PreviewContextState): ViewerContext | null;
//# sourceMappingURL=preview-context-state.d.ts.map