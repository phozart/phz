import { describe, it, expect } from 'vitest';
import {
  createInitialDrillDownState,
  drillDown,
  drillUp,
  drillToLevel,
  getDrillQuery,
  canDrillDown,
  canDrillUp,
} from '../drill-down-state.js';
import type { DrillDownState } from '../drill-down-state.js';
import { generateDateHierarchy, createCustomHierarchy } from '../hierarchy.js';

describe('createInitialDrillDownState', () => {
  it('creates state at level 0 with empty breadcrumb', () => {
    const state = createInitialDrillDownState('h1');
    expect(state.hierarchyId).toBe('h1');
    expect(state.currentLevel).toBe(0);
    expect(state.breadcrumb).toHaveLength(0);
    expect(state.filterStack).toHaveLength(0);
  });
});

describe('drillDown', () => {
  it('advances to the next level and pushes breadcrumb entry', () => {
    const state = createInitialDrillDownState('h1');
    const next = drillDown(state, 'year', '2024');
    expect(next.currentLevel).toBe(1);
    expect(next.breadcrumb).toHaveLength(1);
    expect(next.breadcrumb[0]).toEqual({ level: 0, label: '2024', field: 'year', value: '2024' });
  });

  it('pushes filter to filterStack', () => {
    const state = createInitialDrillDownState('h1');
    const next = drillDown(state, 'region', 'North');
    expect(next.filterStack).toHaveLength(1);
    expect(next.filterStack[0]).toEqual({ region: 'North' });
  });

  it('supports multiple sequential drill-downs', () => {
    let state = createInitialDrillDownState('h1');
    state = drillDown(state, 'country', 'USA');
    state = drillDown(state, 'state', 'California');
    state = drillDown(state, 'city', 'LA');
    expect(state.currentLevel).toBe(3);
    expect(state.breadcrumb).toHaveLength(3);
    expect(state.filterStack).toHaveLength(3);
  });
});

describe('drillUp', () => {
  it('pops back to the previous level', () => {
    let state = createInitialDrillDownState('h1');
    state = drillDown(state, 'year', '2024');
    state = drillDown(state, 'quarter', 'Q1');
    const up = drillUp(state);
    expect(up.currentLevel).toBe(1);
    expect(up.breadcrumb).toHaveLength(1);
    expect(up.filterStack).toHaveLength(1);
  });

  it('is a no-op at the top level (level 0)', () => {
    const state = createInitialDrillDownState('h1');
    const same = drillUp(state);
    expect(same).toBe(state);
  });
});

describe('drillToLevel', () => {
  it('jumps to a specific level, trimming breadcrumb', () => {
    let state = createInitialDrillDownState('h1');
    state = drillDown(state, 'country', 'USA');
    state = drillDown(state, 'state', 'CA');
    state = drillDown(state, 'city', 'LA');
    const jumped = drillToLevel(state, 1);
    expect(jumped.currentLevel).toBe(1);
    expect(jumped.breadcrumb).toHaveLength(1);
    expect(jumped.filterStack).toHaveLength(1);
  });

  it('jumping to level 0 resets to initial state', () => {
    let state = createInitialDrillDownState('h1');
    state = drillDown(state, 'year', '2024');
    const reset = drillToLevel(state, 0);
    expect(reset.currentLevel).toBe(0);
    expect(reset.breadcrumb).toHaveLength(0);
    expect(reset.filterStack).toHaveLength(0);
  });

  it('is a no-op if target level equals current level', () => {
    let state = createInitialDrillDownState('h1');
    state = drillDown(state, 'year', '2024');
    const same = drillToLevel(state, 1);
    expect(same.currentLevel).toBe(1);
    expect(same.breadcrumb).toHaveLength(1);
  });
});

describe('canDrillDown / canDrillUp', () => {
  it('canDrillDown is true when not at bottom level', () => {
    const h = createCustomHierarchy('Geo', ['country', 'state', 'city']);
    const state = createInitialDrillDownState(h.id);
    expect(canDrillDown(state, h)).toBe(true);
  });

  it('canDrillDown is false at the bottom level', () => {
    const h = createCustomHierarchy('Geo', ['country', 'state']);
    let state = createInitialDrillDownState(h.id);
    state = drillDown(state, 'country', 'USA');
    // Now at level 1, which is the last level (index 1 of 2 levels)
    expect(canDrillDown(state, h)).toBe(false);
  });

  it('canDrillUp is false at level 0', () => {
    const state = createInitialDrillDownState('h1');
    expect(canDrillUp(state)).toBe(false);
  });

  it('canDrillUp is true when drilled into at least one level', () => {
    let state = createInitialDrillDownState('h1');
    state = drillDown(state, 'year', '2024');
    expect(canDrillUp(state)).toBe(true);
  });
});

describe('getDrillQuery', () => {
  it('returns the current group-by field and accumulated filters', () => {
    const h = generateDateHierarchy('orderDate');
    let state = createInitialDrillDownState(h.id);
    state = drillDown(state, h.levels[0].field, '2024');
    const query = getDrillQuery(state, h);
    expect(query.groupByField).toBe(h.levels[1].field); // quarter
    expect(query.filters).toHaveLength(1);
    expect(query.filters[0]).toEqual({ field: h.levels[0].field, operator: 'equals', value: '2024' });
  });

  it('accumulates ALL filters from the breadcrumb stack', () => {
    const h = generateDateHierarchy('date');
    let state = createInitialDrillDownState(h.id);
    state = drillDown(state, h.levels[0].field, '2024');
    state = drillDown(state, h.levels[1].field, 'Q1');
    const query = getDrillQuery(state, h);
    expect(query.filters).toHaveLength(2);
    expect(query.filters[0].value).toBe('2024');
    expect(query.filters[1].value).toBe('Q1');
    expect(query.groupByField).toBe(h.levels[2].field); // month
  });

  it('returns the top-level field when at level 0 (no filters)', () => {
    const h = createCustomHierarchy('Geo', ['country', 'state', 'city']);
    const state = createInitialDrillDownState(h.id);
    const query = getDrillQuery(state, h);
    expect(query.groupByField).toBe('country');
    expect(query.filters).toHaveLength(0);
  });
});
