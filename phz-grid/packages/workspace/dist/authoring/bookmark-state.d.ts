/**
 * @phozart/phz-workspace — Bookmark State Machine
 *
 * Pure functions for managing dashboard bookmark CRUD and interaction
 * state capture/restore. No side effects, no DOM.
 */
import type { DashboardBookmark, DashboardInteractionState, SerializedDrillDownState } from '@phozart/phz-shared';
export interface BookmarkState {
    bookmarks: DashboardBookmark[];
    activeBookmarkId?: string;
    editingBookmarkId?: string;
    editingDraft?: Partial<DashboardBookmark>;
}
/**
 * Add a new bookmark. When isDefault is true, all previous defaults are unset.
 */
export declare function createBookmark(state: BookmarkState, name: string, interactionState: DashboardInteractionState, isDefault?: boolean): BookmarkState;
/**
 * Update fields on an existing bookmark. Returns state unchanged if ID not found.
 */
export declare function updateBookmark(state: BookmarkState, bookmarkId: string, updates: Partial<Pick<DashboardBookmark, 'name' | 'description' | 'state' | 'isDefault'>>): BookmarkState;
/**
 * Remove a bookmark. Clears activeBookmarkId if it matches the deleted bookmark.
 */
export declare function deleteBookmark(state: BookmarkState, bookmarkId: string): BookmarkState;
/**
 * Set one bookmark as the default, unsetting ALL previous defaults.
 * Returns state unchanged if the bookmarkId is not found.
 */
export declare function setDefaultBookmark(state: BookmarkState, bookmarkId: string): BookmarkState;
/**
 * Set the active bookmark ID.
 */
export declare function setActiveBookmark(state: BookmarkState, bookmarkId: string): BookmarkState;
/**
 * Capture individual interaction values into a DashboardInteractionState.
 */
export declare function captureInteractionState(filterValues: Record<string, unknown>, expandedWidgets: string[], drillStates: Record<string, SerializedDrillDownState>, crossFilterSelections: Record<string, unknown>, viewGroupSelections: Record<string, string>, scrollPosition?: {
    x: number;
    y: number;
}): DashboardInteractionState;
/**
 * Extract the interaction state from a bookmark.
 */
export declare function restoreInteractionState(bookmark: DashboardBookmark): DashboardInteractionState;
/**
 * Generate a human-readable description of an interaction state.
 * E.g. "2 filters active, drilled into 1 widget, 2 expanded"
 */
export declare function generateBookmarkDescription(state: DashboardInteractionState): string;
/**
 * Determine the initial interaction state for a dashboard.
 * Priority: default bookmark > lastState > empty.
 */
export declare function resolveInitialState(bookmarks: DashboardBookmark[], lastState?: DashboardInteractionState): DashboardInteractionState;
//# sourceMappingURL=bookmark-state.d.ts.map