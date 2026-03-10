/**
 * @phozart/phz-workspace — Bookmark State Machine
 *
 * Pure functions for managing dashboard bookmark CRUD and interaction
 * state capture/restore. No side effects, no DOM.
 */
import { createBookmarkId } from '@phozart/phz-shared';
// ========================================================================
// CRUD
// ========================================================================
/**
 * Add a new bookmark. When isDefault is true, all previous defaults are unset.
 */
export function createBookmark(state, name, interactionState, isDefault = false) {
    const now = Date.now();
    const bookmark = {
        id: createBookmarkId(),
        name,
        dashboardId: '',
        state: interactionState,
        isDefault: false,
        createdAt: now,
        updatedAt: now,
    };
    let bookmarks = [...state.bookmarks, bookmark];
    if (isDefault) {
        bookmarks = bookmarks.map(b => b.id === bookmark.id ? { ...b, isDefault: true } : { ...b, isDefault: false });
    }
    return { ...state, bookmarks };
}
/**
 * Update fields on an existing bookmark. Returns state unchanged if ID not found.
 */
export function updateBookmark(state, bookmarkId, updates) {
    const exists = state.bookmarks.some(b => b.id === bookmarkId);
    if (!exists)
        return state;
    return {
        ...state,
        bookmarks: state.bookmarks.map(b => b.id === bookmarkId ? { ...b, ...updates, updatedAt: Date.now() } : b),
    };
}
/**
 * Remove a bookmark. Clears activeBookmarkId if it matches the deleted bookmark.
 */
export function deleteBookmark(state, bookmarkId) {
    return {
        ...state,
        bookmarks: state.bookmarks.filter(b => b.id !== bookmarkId),
        activeBookmarkId: state.activeBookmarkId === bookmarkId ? undefined : state.activeBookmarkId,
    };
}
/**
 * Set one bookmark as the default, unsetting ALL previous defaults.
 * Returns state unchanged if the bookmarkId is not found.
 */
export function setDefaultBookmark(state, bookmarkId) {
    const exists = state.bookmarks.some(b => b.id === bookmarkId);
    if (!exists)
        return state;
    return {
        ...state,
        bookmarks: state.bookmarks.map(b => ({
            ...b,
            isDefault: b.id === bookmarkId,
        })),
    };
}
/**
 * Set the active bookmark ID.
 */
export function setActiveBookmark(state, bookmarkId) {
    return { ...state, activeBookmarkId: bookmarkId };
}
// ========================================================================
// Capture / Restore
// ========================================================================
/**
 * Capture individual interaction values into a DashboardInteractionState.
 */
export function captureInteractionState(filterValues, expandedWidgets, drillStates, crossFilterSelections, viewGroupSelections, scrollPosition) {
    const state = {
        filterValues,
        expandedWidgets,
        drillStates,
        crossFilterSelections,
        viewGroupSelections,
    };
    if (scrollPosition !== undefined) {
        state.scrollPosition = scrollPosition;
    }
    return state;
}
/**
 * Extract the interaction state from a bookmark.
 */
export function restoreInteractionState(bookmark) {
    return bookmark.state;
}
// ========================================================================
// Description
// ========================================================================
/**
 * Generate a human-readable description of an interaction state.
 * E.g. "2 filters active, drilled into 1 widget, 2 expanded"
 */
export function generateBookmarkDescription(state) {
    const parts = [];
    const filterCount = Object.keys(state.filterValues).length;
    if (filterCount > 0) {
        parts.push(`${filterCount} filter${filterCount !== 1 ? 's' : ''} active`);
    }
    const drillCount = Object.keys(state.drillStates).length;
    if (drillCount > 0) {
        parts.push(`drilled into ${drillCount} widget${drillCount !== 1 ? 's' : ''}`);
    }
    const expandedCount = state.expandedWidgets.length;
    if (expandedCount > 0) {
        parts.push(`${expandedCount} expanded`);
    }
    const crossFilterCount = Object.keys(state.crossFilterSelections).length;
    if (crossFilterCount > 0) {
        parts.push(`${crossFilterCount} cross-filter${crossFilterCount !== 1 ? 's' : ''}`);
    }
    return parts.length > 0 ? parts.join(', ') : 'Default state';
}
// ========================================================================
// Resolve Initial State
// ========================================================================
/**
 * Determine the initial interaction state for a dashboard.
 * Priority: default bookmark > lastState > empty.
 */
export function resolveInitialState(bookmarks, lastState) {
    const defaultBookmark = bookmarks.find(b => b.isDefault);
    if (defaultBookmark) {
        return defaultBookmark.state;
    }
    if (lastState) {
        return lastState;
    }
    return {
        filterValues: {},
        expandedWidgets: [],
        drillStates: {},
        crossFilterSelections: {},
        viewGroupSelections: {},
    };
}
//# sourceMappingURL=bookmark-state.js.map