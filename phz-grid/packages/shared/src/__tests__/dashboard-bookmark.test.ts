/**
 * Tests for DashboardBookmark types and utility functions.
 *
 * Covers:
 * - createBookmarkId generates unique IDs
 * - isValidBookmark type guard validates shape
 * - mergeInteractionState overlays partial state onto base
 * - Edge cases: empty state, missing fields, invalid input
 */
import {
  createBookmarkId,
  isValidBookmark,
  mergeInteractionState,
  type DashboardBookmark,
  type DashboardInteractionState,
} from '../types/dashboard-bookmark.js';

// ========================================================================
// Helpers
// ========================================================================

function emptyInteractionState(): DashboardInteractionState {
  return {
    filterValues: {},
    expandedWidgets: [],
    drillStates: {},
    crossFilterSelections: {},
    viewGroupSelections: {},
  };
}

function sampleBookmark(overrides?: Partial<DashboardBookmark>): DashboardBookmark {
  return {
    id: 'bk_001',
    name: 'Q1 View',
    dashboardId: 'dash_001',
    state: emptyInteractionState(),
    isDefault: false,
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

// ========================================================================
// createBookmarkId
// ========================================================================

describe('createBookmarkId', () => {
  it('returns a non-empty string', () => {
    const id = createBookmarkId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('generates unique IDs on consecutive calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => createBookmarkId()));
    expect(ids.size).toBe(100);
  });
});

// ========================================================================
// isValidBookmark
// ========================================================================

describe('isValidBookmark', () => {
  it('returns true for a valid bookmark', () => {
    expect(isValidBookmark(sampleBookmark())).toBe(true);
  });

  it('returns false for null', () => {
    expect(isValidBookmark(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isValidBookmark(undefined)).toBe(false);
  });

  it('returns false for a string', () => {
    expect(isValidBookmark('not a bookmark')).toBe(false);
  });

  it('returns false when required fields are missing', () => {
    expect(isValidBookmark({ id: 'x', name: 'y' })).toBe(false);
  });

  it('returns false when id is not a string', () => {
    expect(isValidBookmark({ ...sampleBookmark(), id: 123 })).toBe(false);
  });

  it('returns false when isDefault is not a boolean', () => {
    expect(isValidBookmark({ ...sampleBookmark(), isDefault: 'yes' })).toBe(false);
  });

  it('returns true for a bookmark with optional fields', () => {
    const bk = sampleBookmark({
      description: 'My description',
      userId: 'user_001',
    });
    expect(isValidBookmark(bk)).toBe(true);
  });
});

// ========================================================================
// mergeInteractionState
// ========================================================================

describe('mergeInteractionState', () => {
  it('returns base unchanged when overlay is empty', () => {
    const base = emptyInteractionState();
    const result = mergeInteractionState(base, {});
    expect(result).toEqual(base);
  });

  it('overlays filterValues onto base', () => {
    const base = emptyInteractionState();
    const result = mergeInteractionState(base, {
      filterValues: { region: 'US' },
    });
    expect(result.filterValues).toEqual({ region: 'US' });
    expect(result.expandedWidgets).toEqual([]);
  });

  it('replaces expandedWidgets array entirely', () => {
    const base: DashboardInteractionState = {
      ...emptyInteractionState(),
      expandedWidgets: ['w1'],
    };
    const result = mergeInteractionState(base, {
      expandedWidgets: ['w2', 'w3'],
    });
    expect(result.expandedWidgets).toEqual(['w2', 'w3']);
  });

  it('preserves base fields not present in overlay', () => {
    const base: DashboardInteractionState = {
      ...emptyInteractionState(),
      viewGroupSelections: { group1: 'tab-a' },
      scrollPosition: { x: 100, y: 200 },
    };
    const result = mergeInteractionState(base, {
      filterValues: { year: 2024 },
    });
    expect(result.viewGroupSelections).toEqual({ group1: 'tab-a' });
    expect(result.scrollPosition).toEqual({ x: 100, y: 200 });
  });
});
