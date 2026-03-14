/**
 * Tests for BookmarkState pure functions.
 *
 * Covers:
 * - createBookmark adds a new bookmark to state
 * - updateBookmark modifies existing bookmarks
 * - deleteBookmark removes a bookmark by ID
 * - setDefaultBookmark unsets ALL previous defaults
 * - setActiveBookmark sets the active bookmark
 * - captureInteractionState creates a clean snapshot
 * - restoreInteractionState extracts state from bookmark
 * - generateBookmarkDescription produces human-readable summaries
 * - resolveInitialState follows priority: default bookmark > lastState > empty
 */
import { describe, it, expect } from 'vitest';
import {
  createBookmark,
  updateBookmark,
  deleteBookmark,
  setDefaultBookmark,
  setActiveBookmark,
  captureInteractionState,
  restoreInteractionState,
  generateBookmarkDescription,
  resolveInitialState,
  type BookmarkState,
} from '../bookmark-state.js';
import type { DashboardBookmark, DashboardInteractionState } from '@phozart/shared';

// ========================================================================
// Helpers
// ========================================================================

function emptyState(): BookmarkState {
  return { bookmarks: [] };
}

function emptyInteraction(): DashboardInteractionState {
  return {
    filterValues: {},
    expandedWidgets: [],
    drillStates: {},
    crossFilterSelections: {},
    viewGroupSelections: {},
  };
}

function sampleInteraction(): DashboardInteractionState {
  return {
    filterValues: { region: 'US', year: 2024 },
    expandedWidgets: ['w1'],
    drillStates: {
      widget1: {
        hierarchyId: 'geo',
        currentLevel: 1,
        breadcrumb: [{ level: 0, label: 'US', field: 'country', value: 'US' }],
        filterStack: [{ country: 'US' }],
      },
    },
    crossFilterSelections: { chart1: { field: 'region', value: 'US' } },
    viewGroupSelections: { group1: 'tab-b' },
    scrollPosition: { x: 0, y: 150 },
  };
}

// ========================================================================
// createBookmark
// ========================================================================

describe('createBookmark', () => {
  it('adds a bookmark with the given name and state', () => {
    const state = emptyState();
    const interaction = sampleInteraction();
    const result = createBookmark(state, 'Q1 View', interaction);
    expect(result.bookmarks).toHaveLength(1);
    expect(result.bookmarks[0].name).toBe('Q1 View');
    expect(result.bookmarks[0].state).toEqual(interaction);
    expect(result.bookmarks[0].isDefault).toBe(false);
  });

  it('creates a default bookmark when isDefault is true', () => {
    const result = createBookmark(emptyState(), 'Default', emptyInteraction(), true);
    expect(result.bookmarks[0].isDefault).toBe(true);
  });

  it('unsets previous defaults when creating a new default bookmark', () => {
    let state = createBookmark(emptyState(), 'First', emptyInteraction(), true);
    state = createBookmark(state, 'Second', emptyInteraction(), true);
    const defaults = state.bookmarks.filter(b => b.isDefault);
    expect(defaults).toHaveLength(1);
    expect(defaults[0].name).toBe('Second');
  });
});

// ========================================================================
// updateBookmark
// ========================================================================

describe('updateBookmark', () => {
  it('updates a bookmark name', () => {
    let state = createBookmark(emptyState(), 'Old Name', emptyInteraction());
    const id = state.bookmarks[0].id;
    state = updateBookmark(state, id, { name: 'New Name' });
    expect(state.bookmarks[0].name).toBe('New Name');
  });

  it('returns state unchanged for unknown bookmarkId', () => {
    const state = createBookmark(emptyState(), 'A', emptyInteraction());
    const result = updateBookmark(state, 'nonexistent', { name: 'X' });
    expect(result).toEqual(state);
  });
});

// ========================================================================
// deleteBookmark
// ========================================================================

describe('deleteBookmark', () => {
  it('removes a bookmark by ID', () => {
    let state = createBookmark(emptyState(), 'A', emptyInteraction());
    const id = state.bookmarks[0].id;
    state = deleteBookmark(state, id);
    expect(state.bookmarks).toHaveLength(0);
  });

  it('clears activeBookmarkId when deleting the active bookmark', () => {
    let state = createBookmark(emptyState(), 'A', emptyInteraction());
    const id = state.bookmarks[0].id;
    state = setActiveBookmark(state, id);
    state = deleteBookmark(state, id);
    expect(state.activeBookmarkId).toBeUndefined();
  });
});

// ========================================================================
// setDefaultBookmark
// ========================================================================

describe('setDefaultBookmark', () => {
  it('sets the specified bookmark as default', () => {
    let state = createBookmark(emptyState(), 'A', emptyInteraction());
    const id = state.bookmarks[0].id;
    state = setDefaultBookmark(state, id);
    expect(state.bookmarks[0].isDefault).toBe(true);
  });

  it('unsets ALL previous defaults (not just one)', () => {
    let state = createBookmark(emptyState(), 'A', emptyInteraction(), true);
    state = createBookmark(state, 'B', emptyInteraction());
    // Force a second default via direct mutation for testing
    state = { ...state, bookmarks: state.bookmarks.map(b => ({ ...b, isDefault: true })) };
    const targetId = state.bookmarks[1].id;
    state = setDefaultBookmark(state, targetId);
    const defaults = state.bookmarks.filter(b => b.isDefault);
    expect(defaults).toHaveLength(1);
    expect(defaults[0].id).toBe(targetId);
  });

  it('returns state unchanged for unknown bookmarkId', () => {
    const state = createBookmark(emptyState(), 'A', emptyInteraction());
    const result = setDefaultBookmark(state, 'nonexistent');
    expect(result).toEqual(state);
  });
});

// ========================================================================
// setActiveBookmark
// ========================================================================

describe('setActiveBookmark', () => {
  it('sets the activeBookmarkId', () => {
    let state = createBookmark(emptyState(), 'A', emptyInteraction());
    const id = state.bookmarks[0].id;
    state = setActiveBookmark(state, id);
    expect(state.activeBookmarkId).toBe(id);
  });
});

// ========================================================================
// captureInteractionState
// ========================================================================

describe('captureInteractionState', () => {
  it('creates a snapshot from individual parameters', () => {
    const result = captureInteractionState(
      { region: 'US' },
      ['w1'],
      { widget1: { hierarchyId: 'geo', currentLevel: 0, breadcrumb: [], filterStack: [] } },
      { chart1: { value: 'x' } },
      { group1: 'tab-a' },
      { x: 0, y: 100 },
    );
    expect(result.filterValues).toEqual({ region: 'US' });
    expect(result.expandedWidgets).toEqual(['w1']);
    expect(result.scrollPosition).toEqual({ x: 0, y: 100 });
  });

  it('omits scrollPosition when not provided', () => {
    const result = captureInteractionState({}, [], {}, {}, {});
    expect(result.scrollPosition).toBeUndefined();
  });
});

// ========================================================================
// restoreInteractionState
// ========================================================================

describe('restoreInteractionState', () => {
  it('extracts the interaction state from a bookmark', () => {
    const interaction = sampleInteraction();
    const state = createBookmark(emptyState(), 'A', interaction);
    const restored = restoreInteractionState(state.bookmarks[0]);
    expect(restored).toEqual(interaction);
  });
});

// ========================================================================
// generateBookmarkDescription
// ========================================================================

describe('generateBookmarkDescription', () => {
  it('describes filters and drill states', () => {
    const desc = generateBookmarkDescription(sampleInteraction());
    expect(desc).toContain('2 filters');
    expect(desc).toContain('drilled');
  });

  it('handles empty state gracefully', () => {
    const desc = generateBookmarkDescription(emptyInteraction());
    expect(typeof desc).toBe('string');
    expect(desc.length).toBeGreaterThan(0);
  });

  it('mentions expanded widgets when present', () => {
    const state: DashboardInteractionState = {
      ...emptyInteraction(),
      expandedWidgets: ['w1', 'w2'],
    };
    const desc = generateBookmarkDescription(state);
    expect(desc).toContain('2 expanded');
  });
});

// ========================================================================
// resolveInitialState
// ========================================================================

describe('resolveInitialState', () => {
  it('returns default bookmark state when available', () => {
    const interaction = sampleInteraction();
    let state = createBookmark(emptyState(), 'Default', interaction, true);
    const result = resolveInitialState(state.bookmarks);
    expect(result).toEqual(interaction);
  });

  it('falls back to lastState when no default bookmark', () => {
    const lastState = sampleInteraction();
    const result = resolveInitialState([], lastState);
    expect(result).toEqual(lastState);
  });

  it('returns empty state when no bookmarks and no lastState', () => {
    const result = resolveInitialState([]);
    expect(result.filterValues).toEqual({});
    expect(result.expandedWidgets).toEqual([]);
    expect(result.drillStates).toEqual({});
    expect(result.crossFilterSelections).toEqual({});
    expect(result.viewGroupSelections).toEqual({});
  });
});
