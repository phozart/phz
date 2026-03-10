import { describe, it, expect } from 'vitest';
import type { ArtifactMeta } from '../../types.js';
import {
  initialCatalogState,
  filterArtifacts,
  extractTags,
  sortArtifacts,
  getArtifactsByStatus,
  type CatalogState,
} from '../catalog-state.js';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const artifacts: ArtifactMeta[] = [
  { id: '1', type: 'report', name: 'Sales Report', createdAt: 1000, updatedAt: 3000, published: true },
  { id: '2', type: 'dashboard', name: 'Executive Dashboard', description: 'C-suite overview', createdAt: 2000, updatedAt: 2000 },
  { id: '3', type: 'report', name: 'Inventory Report', createdAt: 3000, updatedAt: 1000, published: false },
  { id: '4', type: 'kpi', name: 'Revenue KPI', description: 'Monthly revenue target', createdAt: 4000, updatedAt: 4000, published: true },
  { id: '5', type: 'dashboard', name: 'Operations Dashboard', createdAt: 500, updatedAt: 500 },
];

// ---------------------------------------------------------------------------
// initialCatalogState
// ---------------------------------------------------------------------------

describe('initialCatalogState', () => {
  it('returns correct defaults with no arguments', () => {
    const state = initialCatalogState();
    expect(state.artifacts).toEqual([]);
    expect(state.search).toBe('');
    expect(state.selectedTags).toEqual([]);
    expect(state.typeFilter).toBeUndefined();
    expect(state.sortBy).toBe('updatedAt');
    expect(state.sortDir).toBe('desc');
  });

  it('accepts artifacts as initial argument', () => {
    const state = initialCatalogState(artifacts);
    expect(state.artifacts).toBe(artifacts);
    expect(state.artifacts).toHaveLength(5);
  });

  it('uses an empty array default — not the same reference', () => {
    const s1 = initialCatalogState();
    const s2 = initialCatalogState();
    expect(s1.artifacts).not.toBe(s2.artifacts);
  });
});

// ---------------------------------------------------------------------------
// filterArtifacts — typeFilter
// ---------------------------------------------------------------------------

describe('filterArtifacts — typeFilter', () => {
  it('returns all artifacts when typeFilter is undefined', () => {
    const state = initialCatalogState(artifacts);
    const result = filterArtifacts(state);
    expect(result).toHaveLength(5);
  });

  it('filters to only reports when typeFilter is "report"', () => {
    const state: CatalogState = { ...initialCatalogState(artifacts), typeFilter: 'report' };
    const result = filterArtifacts(state);
    expect(result).toHaveLength(2);
    expect(result.every(a => a.type === 'report')).toBe(true);
  });

  it('filters to only dashboards when typeFilter is "dashboard"', () => {
    const state: CatalogState = { ...initialCatalogState(artifacts), typeFilter: 'dashboard' };
    const result = filterArtifacts(state);
    expect(result).toHaveLength(2);
    expect(result.every(a => a.type === 'dashboard')).toBe(true);
  });

  it('returns empty when typeFilter matches no artifacts', () => {
    const onlyKpis: ArtifactMeta[] = [
      { id: '10', type: 'kpi', name: 'Test KPI', createdAt: 1000, updatedAt: 1000 },
    ];
    const state: CatalogState = { ...initialCatalogState(onlyKpis), typeFilter: 'report' };
    const result = filterArtifacts(state);
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// filterArtifacts — search
// ---------------------------------------------------------------------------

describe('filterArtifacts — search', () => {
  it('filters by name (case-insensitive)', () => {
    const state: CatalogState = { ...initialCatalogState(artifacts), search: 'sales' };
    const result = filterArtifacts(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('filters by description (case-insensitive)', () => {
    const state: CatalogState = { ...initialCatalogState(artifacts), search: 'c-suite' };
    const result = filterArtifacts(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('matches partial strings in name', () => {
    const state: CatalogState = { ...initialCatalogState(artifacts), search: 'report' };
    const result = filterArtifacts(state);
    expect(result).toHaveLength(2);
    expect(result.map(a => a.id).sort()).toEqual(['1', '3']);
  });

  it('returns nothing when search matches no artifacts', () => {
    const state: CatalogState = { ...initialCatalogState(artifacts), search: 'nonexistent' };
    const result = filterArtifacts(state);
    expect(result).toHaveLength(0);
  });

  it('handles empty search string (no filtering)', () => {
    const state: CatalogState = { ...initialCatalogState(artifacts), search: '' };
    const result = filterArtifacts(state);
    expect(result).toHaveLength(5);
  });

  it('matches artifacts without description — does not crash', () => {
    const state: CatalogState = { ...initialCatalogState(artifacts), search: 'operations' };
    const result = filterArtifacts(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('5');
  });
});

// ---------------------------------------------------------------------------
// filterArtifacts — selectedTags
// ---------------------------------------------------------------------------

describe('filterArtifacts — selectedTags', () => {
  it('filters by single tag (type-based)', () => {
    const state: CatalogState = { ...initialCatalogState(artifacts), selectedTags: ['report'] };
    const result = filterArtifacts(state);
    expect(result).toHaveLength(2);
    expect(result.every(a => a.type === 'report')).toBe(true);
  });

  it('filters by multiple tags (union — artifact type must be in selected tags)', () => {
    const state: CatalogState = { ...initialCatalogState(artifacts), selectedTags: ['report', 'kpi'] };
    const result = filterArtifacts(state);
    expect(result).toHaveLength(3);
  });

  it('returns all artifacts when selectedTags is empty', () => {
    const state: CatalogState = { ...initialCatalogState(artifacts), selectedTags: [] };
    const result = filterArtifacts(state);
    expect(result).toHaveLength(5);
  });

  it('returns empty when selectedTags match no artifact types', () => {
    const state: CatalogState = { ...initialCatalogState(artifacts), selectedTags: ['metric'] };
    const result = filterArtifacts(state);
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// filterArtifacts — sorting
// ---------------------------------------------------------------------------

describe('filterArtifacts — sorting', () => {
  it('sorts by name ascending', () => {
    const state: CatalogState = { ...initialCatalogState(artifacts), sortBy: 'name', sortDir: 'asc' };
    const result = filterArtifacts(state);
    const names = result.map(a => a.name);
    expect(names).toEqual([
      'Executive Dashboard',
      'Inventory Report',
      'Operations Dashboard',
      'Revenue KPI',
      'Sales Report',
    ]);
  });

  it('sorts by name descending', () => {
    const state: CatalogState = { ...initialCatalogState(artifacts), sortBy: 'name', sortDir: 'desc' };
    const result = filterArtifacts(state);
    const names = result.map(a => a.name);
    expect(names).toEqual([
      'Sales Report',
      'Revenue KPI',
      'Operations Dashboard',
      'Inventory Report',
      'Executive Dashboard',
    ]);
  });

  it('sorts by updatedAt descending (default)', () => {
    const state = initialCatalogState(artifacts);
    const result = filterArtifacts(state);
    const updatedAts = result.map(a => a.updatedAt);
    expect(updatedAts).toEqual([4000, 3000, 2000, 1000, 500]);
  });

  it('sorts by updatedAt ascending', () => {
    const state: CatalogState = { ...initialCatalogState(artifacts), sortBy: 'updatedAt', sortDir: 'asc' };
    const result = filterArtifacts(state);
    const updatedAts = result.map(a => a.updatedAt);
    expect(updatedAts).toEqual([500, 1000, 2000, 3000, 4000]);
  });

  it('sorts by createdAt descending', () => {
    const state: CatalogState = { ...initialCatalogState(artifacts), sortBy: 'createdAt', sortDir: 'desc' };
    const result = filterArtifacts(state);
    const createdAts = result.map(a => a.createdAt);
    expect(createdAts).toEqual([4000, 3000, 2000, 1000, 500]);
  });

  it('sorts by createdAt ascending', () => {
    const state: CatalogState = { ...initialCatalogState(artifacts), sortBy: 'createdAt', sortDir: 'asc' };
    const result = filterArtifacts(state);
    const createdAts = result.map(a => a.createdAt);
    expect(createdAts).toEqual([500, 1000, 2000, 3000, 4000]);
  });
});

// ---------------------------------------------------------------------------
// filterArtifacts — combined filters
// ---------------------------------------------------------------------------

describe('filterArtifacts — combined filters', () => {
  it('type + search combined', () => {
    const state: CatalogState = {
      ...initialCatalogState(artifacts),
      typeFilter: 'report',
      search: 'sales',
    };
    const result = filterArtifacts(state);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Sales Report');
  });

  it('type + search + sort combined', () => {
    const state: CatalogState = {
      ...initialCatalogState(artifacts),
      typeFilter: 'dashboard',
      search: 'dashboard',
      sortBy: 'name',
      sortDir: 'asc',
    };
    const result = filterArtifacts(state);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Executive Dashboard');
    expect(result[1].name).toBe('Operations Dashboard');
  });

  it('all filters narrow to empty set', () => {
    const state: CatalogState = {
      ...initialCatalogState(artifacts),
      typeFilter: 'report',
      search: 'dashboard',
    };
    const result = filterArtifacts(state);
    expect(result).toHaveLength(0);
  });

  it('selectedTags + search combined', () => {
    const state: CatalogState = {
      ...initialCatalogState(artifacts),
      selectedTags: ['report', 'dashboard'],
      search: 'inventory',
    };
    const result = filterArtifacts(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });
});

// ---------------------------------------------------------------------------
// extractTags
// ---------------------------------------------------------------------------

describe('extractTags', () => {
  it('returns unique sorted artifact types', () => {
    const tags = extractTags(artifacts);
    expect(tags).toEqual(['dashboard', 'kpi', 'report']);
  });

  it('returns empty array for empty artifacts list', () => {
    const tags = extractTags([]);
    expect(tags).toEqual([]);
  });

  it('returns single tag when all artifacts share the same type', () => {
    const same: ArtifactMeta[] = [
      { id: '1', type: 'report', name: 'A', createdAt: 1, updatedAt: 1 },
      { id: '2', type: 'report', name: 'B', createdAt: 2, updatedAt: 2 },
    ];
    const tags = extractTags(same);
    expect(tags).toEqual(['report']);
  });

  it('sorts tags alphabetically', () => {
    const mixed: ArtifactMeta[] = [
      { id: '1', type: 'metric', name: 'M', createdAt: 1, updatedAt: 1 },
      { id: '2', type: 'alert-rule', name: 'A', createdAt: 2, updatedAt: 2 },
      { id: '3', type: 'kpi', name: 'K', createdAt: 3, updatedAt: 3 },
    ];
    const tags = extractTags(mixed);
    expect(tags).toEqual(['alert-rule', 'kpi', 'metric']);
  });
});

// ---------------------------------------------------------------------------
// sortArtifacts
// ---------------------------------------------------------------------------

describe('sortArtifacts', () => {
  it('does not mutate the original array', () => {
    const original = [...artifacts];
    sortArtifacts(original, 'name', 'asc');
    expect(original.map(a => a.id)).toEqual(artifacts.map(a => a.id));
  });

  it('sorts by name ascending', () => {
    const sorted = sortArtifacts(artifacts, 'name', 'asc');
    expect(sorted.map(a => a.name)).toEqual([
      'Executive Dashboard',
      'Inventory Report',
      'Operations Dashboard',
      'Revenue KPI',
      'Sales Report',
    ]);
  });

  it('sorts by name descending', () => {
    const sorted = sortArtifacts(artifacts, 'name', 'desc');
    expect(sorted.map(a => a.name)).toEqual([
      'Sales Report',
      'Revenue KPI',
      'Operations Dashboard',
      'Inventory Report',
      'Executive Dashboard',
    ]);
  });

  it('sorts by updatedAt ascending', () => {
    const sorted = sortArtifacts(artifacts, 'updatedAt', 'asc');
    expect(sorted.map(a => a.updatedAt)).toEqual([500, 1000, 2000, 3000, 4000]);
  });

  it('sorts by updatedAt descending', () => {
    const sorted = sortArtifacts(artifacts, 'updatedAt', 'desc');
    expect(sorted.map(a => a.updatedAt)).toEqual([4000, 3000, 2000, 1000, 500]);
  });

  it('sorts by createdAt ascending', () => {
    const sorted = sortArtifacts(artifacts, 'createdAt', 'asc');
    expect(sorted.map(a => a.createdAt)).toEqual([500, 1000, 2000, 3000, 4000]);
  });

  it('sorts by createdAt descending', () => {
    const sorted = sortArtifacts(artifacts, 'createdAt', 'desc');
    expect(sorted.map(a => a.createdAt)).toEqual([4000, 3000, 2000, 1000, 500]);
  });

  it('returns empty array when given empty input', () => {
    const sorted = sortArtifacts([], 'name', 'asc');
    expect(sorted).toEqual([]);
  });

  it('handles single-element array', () => {
    const single: ArtifactMeta[] = [
      { id: '1', type: 'report', name: 'Only', createdAt: 1, updatedAt: 1 },
    ];
    const sorted = sortArtifacts(single, 'name', 'asc');
    expect(sorted).toHaveLength(1);
    expect(sorted[0].name).toBe('Only');
  });
});

// ---------------------------------------------------------------------------
// getArtifactsByStatus
// ---------------------------------------------------------------------------

describe('getArtifactsByStatus', () => {
  it('returns published artifacts', () => {
    const result = getArtifactsByStatus(artifacts, 'published');
    expect(result).toHaveLength(2);
    expect(result.every(a => a.published === true)).toBe(true);
    expect(result.map(a => a.id).sort()).toEqual(['1', '4']);
  });

  it('returns draft artifacts (published is false or undefined)', () => {
    const result = getArtifactsByStatus(artifacts, 'draft');
    expect(result).toHaveLength(3);
    expect(result.every(a => !a.published)).toBe(true);
    expect(result.map(a => a.id).sort()).toEqual(['2', '3', '5']);
  });

  it('returns empty array when no artifacts match status', () => {
    const allPublished: ArtifactMeta[] = [
      { id: '1', type: 'report', name: 'A', createdAt: 1, updatedAt: 1, published: true },
    ];
    const result = getArtifactsByStatus(allPublished, 'draft');
    expect(result).toHaveLength(0);
  });

  it('returns empty array for empty input', () => {
    expect(getArtifactsByStatus([], 'published')).toEqual([]);
    expect(getArtifactsByStatus([], 'draft')).toEqual([]);
  });

  it('treats published: false as draft', () => {
    const withExplicitFalse: ArtifactMeta[] = [
      { id: '1', type: 'report', name: 'A', createdAt: 1, updatedAt: 1, published: false },
    ];
    const result = getArtifactsByStatus(withExplicitFalse, 'draft');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('treats published: undefined as draft', () => {
    const withUndefined: ArtifactMeta[] = [
      { id: '1', type: 'report', name: 'A', createdAt: 1, updatedAt: 1 },
    ];
    const result = getArtifactsByStatus(withUndefined, 'draft');
    expect(result).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('filterArtifacts works with empty artifacts list', () => {
    const state = initialCatalogState([]);
    const result = filterArtifacts(state);
    expect(result).toEqual([]);
  });

  it('filterArtifacts with all filters on empty list returns empty', () => {
    const state: CatalogState = {
      artifacts: [],
      search: 'test',
      selectedTags: ['report'],
      typeFilter: 'report',
      sortBy: 'name',
      sortDir: 'asc',
    };
    const result = filterArtifacts(state);
    expect(result).toEqual([]);
  });

  it('filterArtifacts returns a new array (does not mutate state)', () => {
    const state = initialCatalogState(artifacts);
    const result = filterArtifacts(state);
    expect(result).not.toBe(state.artifacts);
  });

  it('search matches description but not name', () => {
    const state: CatalogState = { ...initialCatalogState(artifacts), search: 'monthly revenue' };
    const result = filterArtifacts(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('4');
  });
});
