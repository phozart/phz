import { describe, it, expect } from 'vitest';
import type { ArtifactMeta } from '../types.js';
import {
  initialCommandPaletteState,
  openPalette,
  closePalette,
  togglePalette,
  registerAction,
  unregisterAction,
  setQuery,
  moveSelectionUp,
  moveSelectionDown,
  getSelectedResult,
  executeSelected,
  getResultsByCategory,
  filterResultsByCategory,
  type CommandAction,
} from '../shell/command-palette-state.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const noop = () => {};

const actions: CommandAction[] = [
  { id: 'new-report', label: 'New Report', category: 'create', keywords: ['create', 'report'], handler: noop },
  { id: 'new-dashboard', label: 'New Dashboard', category: 'create', keywords: ['create', 'dashboard'], handler: noop },
  { id: 'settings', label: 'Open Settings', category: 'configure', keywords: ['settings', 'config'], handler: noop },
  { id: 'help', label: 'Show Help', category: 'help', keywords: ['help', 'docs'], handler: noop },
];

const artifacts: ArtifactMeta[] = [
  { id: '1', type: 'report', name: 'Sales Report', createdAt: 1000, updatedAt: 3000 },
  { id: '2', type: 'dashboard', name: 'Executive Dashboard', createdAt: 2000, updatedAt: 2000 },
];

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

describe('initialCommandPaletteState', () => {
  it('creates closed palette', () => {
    const state = initialCommandPaletteState();
    expect(state.open).toBe(false);
    expect(state.query).toBe('');
    expect(state.results).toHaveLength(0);
  });

  it('accepts initial actions', () => {
    const state = initialCommandPaletteState(actions);
    expect(state.registeredActions).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// Open / close
// ---------------------------------------------------------------------------

describe('open/close', () => {
  it('opens palette', () => {
    const state = openPalette(initialCommandPaletteState());
    expect(state.open).toBe(true);
    expect(state.query).toBe('');
  });

  it('closes palette', () => {
    let state = openPalette(initialCommandPaletteState());
    state = closePalette(state);
    expect(state.open).toBe(false);
  });

  it('toggles palette', () => {
    let state = initialCommandPaletteState();
    state = togglePalette(state);
    expect(state.open).toBe(true);
    state = togglePalette(state);
    expect(state.open).toBe(false);
  });

  it('shows recent items when opening', () => {
    let state = initialCommandPaletteState(actions);
    state = openPalette(state);
    state = setQuery(state, 'report', artifacts);
    state = executeSelected(state); // adds to recent
    state = openPalette(state);
    expect(state.results.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

describe('action registration', () => {
  it('registers an action', () => {
    let state = initialCommandPaletteState();
    state = registerAction(state, actions[0]);
    expect(state.registeredActions).toHaveLength(1);
  });

  it('replaces existing action with same id', () => {
    let state = initialCommandPaletteState(actions);
    state = registerAction(state, { ...actions[0], label: 'Updated' });
    expect(state.registeredActions.length).toBe(4);
    expect(state.registeredActions.find(a => a.id === 'new-report')?.label).toBe('Updated');
  });

  it('unregisters an action', () => {
    let state = initialCommandPaletteState(actions);
    state = unregisterAction(state, 'help');
    expect(state.registeredActions).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

describe('search', () => {
  it('finds artifacts by name', () => {
    let state = initialCommandPaletteState(actions);
    state = openPalette(state);
    state = setQuery(state, 'sales', artifacts);
    expect(state.results.some(r => r.type === 'artifact' && r.artifact?.name === 'Sales Report')).toBe(true);
  });

  it('finds actions by label', () => {
    let state = initialCommandPaletteState(actions);
    state = openPalette(state);
    state = setQuery(state, 'settings', artifacts);
    expect(state.results.some(r => r.type === 'action' && r.action?.id === 'settings')).toBe(true);
  });

  it('finds actions by keyword', () => {
    let state = initialCommandPaletteState(actions);
    state = setQuery(state, 'create', artifacts);
    const createResults = state.results.filter(r => r.type === 'action');
    expect(createResults.length).toBe(2);
  });

  it('returns empty for no match', () => {
    let state = initialCommandPaletteState(actions);
    state = setQuery(state, 'zzzzz', artifacts);
    expect(state.results).toHaveLength(0);
  });

  it('returns empty for empty query', () => {
    let state = initialCommandPaletteState(actions);
    state = setQuery(state, '', artifacts);
    expect(state.results).toHaveLength(0);
  });

  it('resets selectedIndex on new query', () => {
    let state = initialCommandPaletteState(actions);
    state = setQuery(state, 'report', artifacts);
    state = moveSelectionDown(state);
    state = setQuery(state, 'sales', artifacts);
    expect(state.selectedIndex).toBe(0);
  });

  it('results are sorted by score', () => {
    let state = initialCommandPaletteState(actions);
    state = setQuery(state, 'report', artifacts);
    // Exact label match should score higher
    expect(state.results.length).toBeGreaterThan(0);
    for (let i = 0; i < state.results.length - 1; i++) {
      expect(state.results[i].score).toBeGreaterThanOrEqual(state.results[i + 1].score);
    }
  });
});

// ---------------------------------------------------------------------------
// Keyboard navigation
// ---------------------------------------------------------------------------

describe('keyboard navigation', () => {
  it('moves selection down', () => {
    let state = initialCommandPaletteState(actions);
    state = setQuery(state, 'new', artifacts);
    expect(state.selectedIndex).toBe(0);
    state = moveSelectionDown(state);
    expect(state.selectedIndex).toBe(1);
  });

  it('wraps selection down to top', () => {
    let state = initialCommandPaletteState(actions);
    state = setQuery(state, 'new', artifacts);
    const count = state.results.length;
    for (let i = 0; i < count; i++) {
      state = moveSelectionDown(state);
    }
    expect(state.selectedIndex).toBe(0);
  });

  it('moves selection up', () => {
    let state = initialCommandPaletteState(actions);
    state = setQuery(state, 'new', artifacts);
    state = moveSelectionUp(state);
    expect(state.selectedIndex).toBe(state.results.length - 1);
  });

  it('getSelectedResult returns current', () => {
    let state = initialCommandPaletteState(actions);
    state = setQuery(state, 'report', artifacts);
    expect(getSelectedResult(state)).toBeDefined();
  });

  it('getSelectedResult returns undefined when empty', () => {
    const state = initialCommandPaletteState();
    expect(getSelectedResult(state)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Execute
// ---------------------------------------------------------------------------

describe('execute', () => {
  it('closes palette and adds to recent', () => {
    let state = initialCommandPaletteState(actions);
    state = setQuery(state, 'settings', artifacts);
    state = executeSelected(state);
    expect(state.open).toBe(false);
    expect(state.recentItems.length).toBe(1);
  });

  it('deduplicates recent items', () => {
    let state = initialCommandPaletteState(actions);
    state = setQuery(state, 'settings', artifacts);
    state = executeSelected(state);
    state = openPalette(state);
    state = setQuery(state, 'settings', artifacts);
    state = executeSelected(state);
    expect(state.recentItems.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Category grouping
// ---------------------------------------------------------------------------

describe('category grouping', () => {
  it('groups results by category', () => {
    let state = initialCommandPaletteState(actions);
    state = setQuery(state, 'new', artifacts);
    const groups = getResultsByCategory(state.results);
    expect(groups.size).toBeGreaterThan(0);
  });

  it('filters by category', () => {
    let state = initialCommandPaletteState(actions);
    state = setQuery(state, 'new', artifacts);
    const createResults = filterResultsByCategory(state, 'create');
    expect(createResults.every(r => r.action?.category === 'create')).toBe(true);
  });
});
