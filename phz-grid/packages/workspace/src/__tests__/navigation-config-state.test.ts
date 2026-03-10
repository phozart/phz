import { describe, it, expect, beforeEach } from 'vitest';
import type { ArtifactMeta } from '../types.js';
import {
  initialNavigationConfigState,
  setNavSearch,
  getFilteredLinks,
  createLink,
  updateLink,
  deleteLink,
  selectLink,
  clearLinkSelection,
  setEditingTarget,
  setEditingLabel,
  setEditingOpenBehavior,
  setEditingTriggerType,
  addEditingFilterMapping,
  removeEditingFilterMapping,
  generateAutoMappingSuggestions,
  checkCircularNavigation,
  testLink,
  testAllLinks,
  validateNavigationConfig,
  _resetLinkCounter,
} from '../navigation/navigation-config-state.js';

beforeEach(() => _resetLinkCounter());

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const artifacts: ArtifactMeta[] = [
  { id: 'art-1', type: 'report', name: 'Sales Report', createdAt: 1000, updatedAt: 2000 },
  { id: 'art-2', type: 'dashboard', name: 'Dashboard', createdAt: 1000, updatedAt: 2000 },
  { id: 'art-3', type: 'report', name: 'Detail Report', createdAt: 1000, updatedAt: 2000 },
];

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

describe('initialNavigationConfigState', () => {
  it('creates empty state', () => {
    const state = initialNavigationConfigState();
    expect(state.links).toHaveLength(0);
    expect(state.search).toBe('');
  });

  it('accepts artifacts', () => {
    const state = initialNavigationConfigState(artifacts);
    expect(state.artifacts).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

describe('search', () => {
  it('filters by label', () => {
    let state = initialNavigationConfigState(artifacts);
    state = createLink(state, 'art-1', 'art-2', 'dashboard', 'Go to Dashboard');
    state = createLink(state, 'art-2', 'art-3', 'report', 'View Details');
    state = setNavSearch(state, 'dashboard');
    expect(getFilteredLinks(state)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

describe('CRUD', () => {
  it('creates a link', () => {
    let state = initialNavigationConfigState(artifacts);
    state = createLink(state, 'art-1', 'art-2', 'dashboard', 'Go to Dashboard');
    expect(state.links).toHaveLength(1);
    expect(state.selectedLinkId).toBe(state.links[0].id);
    expect(state.editingLink).toBeDefined();
  });

  it('updates a link', () => {
    let state = initialNavigationConfigState(artifacts);
    state = createLink(state, 'art-1', 'art-2', 'dashboard', 'Go to Dashboard');
    const updated = { ...state.links[0], label: 'Updated' };
    state = updateLink(state, updated);
    expect(state.links[0].label).toBe('Updated');
  });

  it('deletes a link', () => {
    let state = initialNavigationConfigState(artifacts);
    state = createLink(state, 'art-1', 'art-2', 'dashboard', 'Test');
    state = deleteLink(state, state.links[0].id);
    expect(state.links).toHaveLength(0);
    expect(state.selectedLinkId).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Selection / editing
// ---------------------------------------------------------------------------

describe('selection', () => {
  it('selects and clears', () => {
    let state = initialNavigationConfigState(artifacts);
    state = createLink(state, 'art-1', 'art-2', 'dashboard', 'Test');
    const id = state.links[0].id;
    state = clearLinkSelection(state);
    expect(state.selectedLinkId).toBeUndefined();
    state = selectLink(state, id);
    expect(state.selectedLinkId).toBe(id);
    expect(state.editingLink).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Edit operations
// ---------------------------------------------------------------------------

describe('edit operations', () => {
  it('sets editing target', () => {
    let state = initialNavigationConfigState(artifacts);
    state = createLink(state, 'art-1', 'art-2', 'dashboard', 'Test');
    state = setEditingTarget(state, 'art-3', 'report');
    expect(state.editingLink!.targetArtifactId).toBe('art-3');
    expect(state.editingLink!.targetArtifactType).toBe('report');
  });

  it('sets editing label', () => {
    let state = initialNavigationConfigState(artifacts);
    state = createLink(state, 'art-1', 'art-2', 'dashboard', 'Test');
    state = setEditingLabel(state, 'New Label');
    expect(state.editingLink!.label).toBe('New Label');
  });

  it('sets open behavior', () => {
    let state = initialNavigationConfigState(artifacts);
    state = createLink(state, 'art-1', 'art-2', 'dashboard', 'Test');
    state = setEditingOpenBehavior(state, 'new-tab');
    expect(state.editingLink!.openBehavior).toBe('new-tab');
  });

  it('sets trigger type', () => {
    let state = initialNavigationConfigState(artifacts);
    state = createLink(state, 'art-1', 'art-2', 'dashboard', 'Test');
    state = setEditingTriggerType(state, 'double-click');
    expect(state.editingLink!.triggerType).toBe('double-click');
  });

  it('adds and removes filter mappings', () => {
    let state = initialNavigationConfigState(artifacts);
    state = createLink(state, 'art-1', 'art-2', 'dashboard', 'Test');
    state = addEditingFilterMapping(state, { sourceField: 'region', targetFilterDefinitionId: 'fd-1', transform: 'passthrough' });
    expect(state.editingLink!.filterMappings).toHaveLength(1);
    state = removeEditingFilterMapping(state, 0);
    expect(state.editingLink!.filterMappings).toHaveLength(0);
  });

  it('edit operations do nothing without editingLink', () => {
    const state = initialNavigationConfigState(artifacts);
    expect(setEditingLabel(state, 'x')).toBe(state);
    expect(setEditingTarget(state, 'y', 'report')).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// Auto-mapping
// ---------------------------------------------------------------------------

describe('auto-mapping', () => {
  it('generates high-confidence exact match', () => {
    const suggestions = generateAutoMappingSuggestions(
      ['region', 'revenue'],
      [{ id: 'f1', label: 'Region', field: 'region' }],
    );
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].confidence).toBe('high');
    expect(suggestions[0].sourceField).toBe('region');
  });

  it('generates medium-confidence suffix match', () => {
    const suggestions = generateAutoMappingSuggestions(
      ['order_id'],
      [{ id: 'f1', label: 'ID', field: 'id' }],
    );
    const mediums = suggestions.filter(s => s.confidence === 'medium');
    expect(mediums.length).toBeGreaterThan(0);
  });

  it('returns empty when no matches', () => {
    const suggestions = generateAutoMappingSuggestions(
      ['xyz'],
      [{ id: 'f1', label: 'ABC', field: 'abc' }],
    );
    expect(suggestions).toHaveLength(0);
  });

  it('sorts by confidence', () => {
    const suggestions = generateAutoMappingSuggestions(
      ['region', 'order_id'],
      [
        { id: 'f1', label: 'Region', field: 'region' },
        { id: 'f2', label: 'ID', field: 'id' },
      ],
    );
    expect(suggestions[0].confidence).toBe('high');
  });
});

// ---------------------------------------------------------------------------
// Circular detection
// ---------------------------------------------------------------------------

describe('circular detection', () => {
  it('detects circular links', () => {
    let state = initialNavigationConfigState(artifacts);
    state = createLink(state, 'art-1', 'art-2', 'dashboard', 'Link 1');
    state = createLink(state, 'art-2', 'art-1', 'report', 'Link 2');
    const cycles = checkCircularNavigation(state.links);
    expect(cycles.length).toBeGreaterThan(0);
  });

  it('no circular when linear', () => {
    let state = initialNavigationConfigState(artifacts);
    state = createLink(state, 'art-1', 'art-2', 'dashboard', 'Link 1');
    state = createLink(state, 'art-2', 'art-3', 'report', 'Link 2');
    const cycles = checkCircularNavigation(state.links);
    expect(cycles).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Link testing
// ---------------------------------------------------------------------------

describe('link testing', () => {
  it('tests a valid link', () => {
    let state = initialNavigationConfigState(artifacts);
    state = createLink(state, 'art-1', 'art-2', 'dashboard', 'Link');
    state = testLink(state, state.links[0].id);
    const result = state.testResults.get(state.links[0].id);
    expect(result).toBeDefined();
    expect(result!.reachable).toBe(true);
    expect(result!.circularDetected).toBe(false);
  });

  it('detects unreachable target', () => {
    let state = initialNavigationConfigState(artifacts);
    state = createLink(state, 'art-1', 'nonexistent', 'report', 'Bad Link');
    state = testLink(state, state.links[0].id);
    const result = state.testResults.get(state.links[0].id);
    expect(result!.reachable).toBe(false);
    expect(result!.errors.length).toBeGreaterThan(0);
  });

  it('tests all links', () => {
    let state = initialNavigationConfigState(artifacts);
    state = createLink(state, 'art-1', 'art-2', 'dashboard', 'Link 1');
    state = createLink(state, 'art-2', 'art-3', 'report', 'Link 2');
    state = testAllLinks(state);
    expect(state.testResults.size).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

describe('validation', () => {
  it('valid with proper links', () => {
    let state = initialNavigationConfigState(artifacts);
    state = createLink(state, 'art-1', 'art-2', 'dashboard', 'Link');
    const result = validateNavigationConfig(state);
    expect(result.valid).toBe(true);
  });

  it('fails with empty label', () => {
    let state = initialNavigationConfigState(artifacts);
    state = createLink(state, 'art-1', 'art-2', 'dashboard', '');
    const result = validateNavigationConfig(state);
    expect(result.valid).toBe(false);
  });

  it('fails with circular navigation', () => {
    let state = initialNavigationConfigState(artifacts);
    state = createLink(state, 'art-1', 'art-2', 'dashboard', 'Link 1');
    state = createLink(state, 'art-2', 'art-1', 'report', 'Link 2');
    const result = validateNavigationConfig(state);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Circular'))).toBe(true);
  });
});
