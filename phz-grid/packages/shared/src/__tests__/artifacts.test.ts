/**
 * Tests for Artifact types — visibility, default presentation,
 * personal view, and grid artifact.
 */
import {
  isVisibleToViewer,
  canTransition,
  transitionVisibility,
  groupByVisibility,
  duplicateWithVisibility,
  createDefaultPresentation,
  mergePresentation,
  createPersonalView,
  applyPersonalView,
  createGridArtifact,
  isGridArtifact,
  gridArtifactToMeta,
} from '@phozart/shared/artifacts';
import type {
  VisibilityMeta,
  ViewerContext,
  DefaultPresentation,
  PersonalView,
  GridArtifact,
} from '@phozart/shared/artifacts';

// ========================================================================
// isVisibleToViewer
// ========================================================================

describe('isVisibleToViewer', () => {
  const baseMeta: VisibilityMeta = {
    id: 'a1',
    type: 'report',
    name: 'Report 1',
    visibility: 'published',
    ownerId: 'owner-1',
  };

  it('published artifacts are visible to everyone', () => {
    expect(isVisibleToViewer(baseMeta, undefined)).toBe(true);
    expect(isVisibleToViewer(baseMeta, { userId: 'u1' })).toBe(true);
  });

  it('personal artifacts are visible only to the owner', () => {
    const meta: VisibilityMeta = { ...baseMeta, visibility: 'personal' };
    expect(isVisibleToViewer(meta, { userId: 'owner-1' })).toBe(true);
    expect(isVisibleToViewer(meta, { userId: 'other' })).toBe(false);
    expect(isVisibleToViewer(meta, undefined)).toBe(false);
    expect(isVisibleToViewer(meta, {})).toBe(false);
  });

  it('shared artifacts are visible to the owner', () => {
    const meta: VisibilityMeta = { ...baseMeta, visibility: 'shared', sharedWith: ['admin'] };
    expect(isVisibleToViewer(meta, { userId: 'owner-1' })).toBe(true);
  });

  it('shared artifacts are visible to users with matching roles (legacy)', () => {
    const meta: VisibilityMeta = { ...baseMeta, visibility: 'shared', sharedWith: ['admin', 'editor'] };
    expect(isVisibleToViewer(meta, { userId: 'u2', roles: ['admin'] })).toBe(true);
    expect(isVisibleToViewer(meta, { userId: 'u2', roles: ['viewer'] })).toBe(false);
  });

  it('shared artifacts use ShareTargets when present', () => {
    const meta: VisibilityMeta = {
      ...baseMeta,
      visibility: 'shared',
      shareTargets: [
        { type: 'team', teamId: 't1' },
        { type: 'user', userId: 'u5' },
      ],
    };
    expect(isVisibleToViewer(meta, { userId: 'u5' })).toBe(true);
    expect(isVisibleToViewer(meta, { userId: 'u9', teams: ['t1'] })).toBe(true);
    expect(isVisibleToViewer(meta, { userId: 'u9' })).toBe(false);
  });

  it('shared artifacts not visible when no userId on viewer', () => {
    const meta: VisibilityMeta = { ...baseMeta, visibility: 'shared' };
    expect(isVisibleToViewer(meta, undefined)).toBe(false);
    expect(isVisibleToViewer(meta, {})).toBe(false);
  });

  it('shared artifacts with empty sharedWith and no shareTargets are not visible to non-owner', () => {
    const meta: VisibilityMeta = { ...baseMeta, visibility: 'shared' };
    expect(isVisibleToViewer(meta, { userId: 'other', roles: [] })).toBe(false);
  });
});

// ========================================================================
// groupByVisibility
// ========================================================================

describe('groupByVisibility', () => {
  it('groups artifacts into personal, shared, published', () => {
    const artifacts: VisibilityMeta[] = [
      { id: '1', type: 'report', name: 'R1', visibility: 'personal', ownerId: 'u1' },
      { id: '2', type: 'dashboard', name: 'D1', visibility: 'shared', ownerId: 'u1' },
      { id: '3', type: 'report', name: 'R2', visibility: 'published', ownerId: 'u1' },
      { id: '4', type: 'kpi', name: 'K1', visibility: 'personal', ownerId: 'u2' },
    ];
    const groups = groupByVisibility(artifacts);
    expect(groups.personal).toHaveLength(2);
    expect(groups.shared).toHaveLength(1);
    expect(groups.published).toHaveLength(1);
  });

  it('returns empty groups for empty input', () => {
    const groups = groupByVisibility([]);
    expect(groups.personal).toEqual([]);
    expect(groups.shared).toEqual([]);
    expect(groups.published).toEqual([]);
  });
});

// ========================================================================
// canTransition
// ========================================================================

describe('canTransition', () => {
  it('allows personal -> shared', () => {
    expect(canTransition('personal', 'shared')).toBe(true);
  });

  it('allows personal -> published', () => {
    expect(canTransition('personal', 'published')).toBe(true);
  });

  it('allows shared -> personal', () => {
    expect(canTransition('shared', 'personal')).toBe(true);
  });

  it('allows shared -> published', () => {
    expect(canTransition('shared', 'published')).toBe(true);
  });

  it('allows published -> shared', () => {
    expect(canTransition('published', 'shared')).toBe(true);
  });

  it('allows published -> personal', () => {
    expect(canTransition('published', 'personal')).toBe(true);
  });

  it('does not allow same-to-same transitions', () => {
    expect(canTransition('personal', 'personal')).toBe(false);
    expect(canTransition('shared', 'shared')).toBe(false);
    expect(canTransition('published', 'published')).toBe(false);
  });
});

// ========================================================================
// transitionVisibility
// ========================================================================

describe('transitionVisibility', () => {
  const meta: VisibilityMeta = {
    id: 'a1',
    type: 'report',
    name: 'R1',
    visibility: 'personal',
    ownerId: 'u1',
  };

  it('transitions personal -> shared with sharedWith', () => {
    const result = transitionVisibility(meta, 'shared', ['admin']);
    expect(result.visibility).toBe('shared');
    expect(result.sharedWith).toEqual(['admin']);
  });

  it('transitions personal -> published', () => {
    const result = transitionVisibility(meta, 'published');
    expect(result.visibility).toBe('published');
  });

  it('returns original meta for invalid transition (same state)', () => {
    const result = transitionVisibility(meta, 'personal');
    expect(result).toBe(meta);
  });

  it('preserves existing sharedWith when transitioning to shared with no new list', () => {
    const sharedMeta: VisibilityMeta = { ...meta, visibility: 'published', sharedWith: ['editor'] };
    const result = transitionVisibility(sharedMeta, 'shared');
    expect(result.sharedWith).toEqual(['editor']);
  });
});

// ========================================================================
// duplicateWithVisibility
// ========================================================================

describe('duplicateWithVisibility', () => {
  it('creates a copy with personal visibility and new owner', () => {
    const meta: VisibilityMeta = {
      id: 'a1',
      type: 'dashboard',
      name: 'Dashboard',
      visibility: 'published',
      ownerId: 'u1',
      sharedWith: ['admin'],
      shareTargets: [{ type: 'everyone' }],
    };
    const dup = duplicateWithVisibility(meta, 'u2');
    expect(dup.id).not.toBe(meta.id);
    expect(dup.name).toBe('Dashboard (Copy)');
    expect(dup.visibility).toBe('personal');
    expect(dup.ownerId).toBe('u2');
    expect(dup.sharedWith).toBeUndefined();
    expect(dup.shareTargets).toBeUndefined();
    expect(dup.type).toBe('dashboard');
  });
});

// ========================================================================
// createDefaultPresentation
// ========================================================================

describe('createDefaultPresentation', () => {
  it('creates defaults with empty overrides', () => {
    const pres = createDefaultPresentation({});
    expect(pres.density).toBe('comfortable');
    expect(pres.theme).toBe('light');
    expect(pres.columnOrder).toEqual([]);
    expect(pres.columnWidths).toEqual({});
    expect(pres.hiddenColumns).toEqual([]);
    expect(pres.frozenColumns).toBeUndefined();
    expect(pres.sortState).toBeUndefined();
  });

  it('applies all overrides', () => {
    const pres = createDefaultPresentation({
      density: 'compact',
      theme: 'dark',
      columnOrder: ['a', 'b'],
      columnWidths: { a: 100 },
      hiddenColumns: ['c'],
      frozenColumns: 2,
      sortState: [{ field: 'a', direction: 'asc' }],
    });
    expect(pres.density).toBe('compact');
    expect(pres.theme).toBe('dark');
    expect(pres.columnOrder).toEqual(['a', 'b']);
    expect(pres.columnWidths).toEqual({ a: 100 });
    expect(pres.hiddenColumns).toEqual(['c']);
    expect(pres.frozenColumns).toBe(2);
    expect(pres.sortState).toEqual([{ field: 'a', direction: 'asc' }]);
  });

  it('creates defensive copies of arrays and objects', () => {
    const order = ['a', 'b'];
    const widths = { a: 100 };
    const pres = createDefaultPresentation({ columnOrder: order, columnWidths: widths });
    order.push('c');
    widths.a = 999;
    expect(pres.columnOrder).toEqual(['a', 'b']);
    expect(pres.columnWidths).toEqual({ a: 100 });
  });
});

// ========================================================================
// mergePresentation
// ========================================================================

describe('mergePresentation', () => {
  const admin: DefaultPresentation = {
    density: 'comfortable',
    theme: 'light',
    columnOrder: ['a', 'b', 'c'],
    columnWidths: { a: 100, b: 200 },
    hiddenColumns: ['d'],
    frozenColumns: 1,
    sortState: [{ field: 'a', direction: 'asc' }],
  };

  it('returns admin defaults when user has no overrides', () => {
    const result = mergePresentation(admin, {});
    expect(result.density).toBe('comfortable');
    expect(result.theme).toBe('light');
    expect(result.columnOrder).toEqual(['a', 'b', 'c']);
    expect(result.columnWidths).toEqual({ a: 100, b: 200 });
    expect(result.hiddenColumns).toEqual(['d']);
    expect(result.frozenColumns).toBe(1);
    expect(result.sortState).toEqual([{ field: 'a', direction: 'asc' }]);
  });

  it('user overrides take precedence', () => {
    const result = mergePresentation(admin, { density: 'compact', theme: 'dark' });
    expect(result.density).toBe('compact');
    expect(result.theme).toBe('dark');
  });

  it('column widths are merged (user overrides individual columns)', () => {
    const result = mergePresentation(admin, { columnWidths: { b: 300, c: 150 } });
    expect(result.columnWidths).toEqual({ a: 100, b: 300, c: 150 });
  });

  it('user columnOrder replaces admin columnOrder', () => {
    const result = mergePresentation(admin, { columnOrder: ['c', 'b'] });
    expect(result.columnOrder).toEqual(['c', 'b']);
  });
});

// ========================================================================
// createPersonalView
// ========================================================================

describe('createPersonalView', () => {
  it('creates a personal view with required fields', () => {
    const view = createPersonalView({
      userId: 'u1',
      artifactId: 'dash-1',
      presentation: { density: 'compact' },
    });
    expect(view.id).toMatch(/^pv_/);
    expect(view.userId).toBe('u1');
    expect(view.artifactId).toBe('dash-1');
    expect(view.presentation).toEqual({ density: 'compact' });
    expect(view.filterValues).toEqual({});
    expect(typeof view.createdAt).toBe('number');
    expect(view.createdAt).toBe(view.updatedAt);
  });

  it('includes filterValues when provided', () => {
    const view = createPersonalView({
      userId: 'u1',
      artifactId: 'dash-1',
      presentation: {},
      filterValues: { region: 'US' },
    });
    expect(view.filterValues).toEqual({ region: 'US' });
  });

  it('creates defensive copies of presentation and filterValues', () => {
    const pres = { density: 'compact' as const };
    const filters = { x: 1 };
    const view = createPersonalView({
      userId: 'u1',
      artifactId: 'a1',
      presentation: pres,
      filterValues: filters,
    });
    (pres as any).density = 'dense';
    filters.x = 999;
    expect(view.presentation.density).toBe('compact');
    expect(view.filterValues.x).toBe(1);
  });
});

// ========================================================================
// applyPersonalView
// ========================================================================

describe('applyPersonalView', () => {
  const adminDefaults: DefaultPresentation = {
    density: 'comfortable',
    theme: 'light',
    columnOrder: ['a', 'b'],
    columnWidths: { a: 100 },
    hiddenColumns: [],
  };

  it('returns admin defaults when no personal view', () => {
    const result = applyPersonalView(adminDefaults, undefined);
    expect(result.presentation).toEqual(adminDefaults);
    expect(result.filterValues).toEqual({});
  });

  it('merges personal view over admin defaults', () => {
    const pv: PersonalView = {
      id: 'pv1',
      userId: 'u1',
      artifactId: 'a1',
      presentation: { density: 'compact', theme: 'dark' },
      filterValues: { status: 'active' },
      createdAt: 1000,
      updatedAt: 1000,
    };
    const result = applyPersonalView(adminDefaults, pv);
    expect(result.presentation.density).toBe('compact');
    expect(result.presentation.theme).toBe('dark');
    expect(result.presentation.columnOrder).toEqual(['a', 'b']); // from admin
    expect(result.filterValues).toEqual({ status: 'active' });
  });
});

// ========================================================================
// createGridArtifact
// ========================================================================

describe('createGridArtifact', () => {
  it('creates a grid artifact with defaults', () => {
    const grid = createGridArtifact({
      name: 'Users Grid',
      dataSourceId: 'ds1',
      columns: [{ field: 'name' }, { field: 'email' }],
    });
    expect(grid.id).toMatch(/^grid_/);
    expect(grid.type).toBe('grid-definition');
    expect(grid.name).toBe('Users Grid');
    expect(grid.dataSourceId).toBe('ds1');
    expect(grid.columns).toHaveLength(2);
    expect(typeof grid.createdAt).toBe('number');
    expect(grid.createdAt).toBe(grid.updatedAt);
    expect(grid.defaultSort).toBeUndefined();
    expect(grid.defaultFilters).toBeUndefined();
  });

  it('uses provided ID when given', () => {
    const grid = createGridArtifact({
      id: 'custom-id',
      name: 'Grid',
      dataSourceId: 'ds1',
      columns: [],
    });
    expect(grid.id).toBe('custom-id');
  });

  it('creates defensive copies of columns', () => {
    const columns = [{ field: 'a' }];
    const grid = createGridArtifact({
      name: 'G',
      dataSourceId: 'ds1',
      columns,
    });
    columns.push({ field: 'b' });
    expect(grid.columns).toHaveLength(1);
  });

  it('includes optional fields when provided', () => {
    const grid = createGridArtifact({
      name: 'G',
      dataSourceId: 'ds1',
      columns: [],
      description: 'Test grid',
      defaultSort: [{ field: 'a', direction: 'desc' }],
      defaultFilters: { status: 'active' },
      density: 'dense',
      enableGrouping: true,
      enableExport: false,
    });
    expect(grid.description).toBe('Test grid');
    expect(grid.defaultSort).toEqual([{ field: 'a', direction: 'desc' }]);
    expect(grid.defaultFilters).toEqual({ status: 'active' });
    expect(grid.density).toBe('dense');
    expect(grid.enableGrouping).toBe(true);
    expect(grid.enableExport).toBe(false);
  });
});

// ========================================================================
// isGridArtifact
// ========================================================================

describe('isGridArtifact', () => {
  it('returns true for valid grid artifact', () => {
    const grid: GridArtifact = {
      id: 'g1',
      type: 'grid-definition',
      name: 'G',
      dataSourceId: 'ds1',
      columns: [],
      createdAt: 1000,
      updatedAt: 1000,
    };
    expect(isGridArtifact(grid)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isGridArtifact(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isGridArtifact(undefined)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isGridArtifact('string')).toBe(false);
    expect(isGridArtifact(42)).toBe(false);
  });

  it('returns false when type is wrong', () => {
    expect(isGridArtifact({ id: 'g1', type: 'report', name: 'G', dataSourceId: 'ds1', columns: [] })).toBe(false);
  });

  it('returns false when id is missing', () => {
    expect(isGridArtifact({ type: 'grid-definition', name: 'G', dataSourceId: 'ds1', columns: [] })).toBe(false);
  });

  it('returns false when columns is not an array', () => {
    expect(isGridArtifact({ id: 'g1', type: 'grid-definition', name: 'G', dataSourceId: 'ds1', columns: 'not-array' })).toBe(false);
  });

  it('returns false when dataSourceId is missing', () => {
    expect(isGridArtifact({ id: 'g1', type: 'grid-definition', name: 'G', columns: [] })).toBe(false);
  });
});

// ========================================================================
// gridArtifactToMeta
// ========================================================================

describe('gridArtifactToMeta', () => {
  it('converts a grid artifact to ArtifactMeta', () => {
    const grid: GridArtifact = {
      id: 'g1',
      type: 'grid-definition',
      name: 'Users Grid',
      description: 'A grid of users',
      dataSourceId: 'ds1',
      columns: [{ field: 'name' }],
      createdAt: 1000,
      updatedAt: 2000,
    };
    const meta = gridArtifactToMeta(grid);
    expect(meta.id).toBe('g1');
    expect(meta.type).toBe('grid-definition');
    expect(meta.name).toBe('Users Grid');
    expect(meta.description).toBe('A grid of users');
    expect(meta.createdAt).toBe(1000);
    expect(meta.updatedAt).toBe(2000);
  });
});
