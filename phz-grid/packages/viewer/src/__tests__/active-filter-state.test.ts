/**
 * Tests for active-filter-state.ts — Active Filter Visibility State (UX-021)
 */
import { describe, it, expect } from 'vitest';
import {
  createActiveFilterVisibilityState,
  computeFilterChips,
  formatFilterValue,
  setFilterChips,
  expandChip,
  collapseChip,
  toggleCollapsed,
  removeChip,
  getChipCount,
  getExpandedChip,
} from '../screens/active-filter-state.js';
import type {
  ActiveFilterChip,
  ActiveFilterVisibilityState,
  FilterDefinitionInput,
  FilterValueInput,
} from '../screens/active-filter-state.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const definitions: FilterDefinitionInput[] = [
  { filterId: 'status', field: 'status', label: 'Status' },
  { filterId: 'region', field: 'region', label: 'Region', removable: true },
  { filterId: 'locked', field: 'locked', label: 'Locked Filter', removable: false },
];

const filters: Record<string, FilterValueInput> = {
  status: { filterId: 'status', field: 'status', operator: 'equals', value: 'active', label: 'Active' },
  region: { filterId: 'region', field: 'region', operator: 'in', value: ['US', 'EU'], label: 'US, EU' },
};

function makeChip(overrides: Partial<ActiveFilterChip> = {}): ActiveFilterChip {
  return {
    filterId: 'status',
    field: 'status',
    label: 'Status',
    displayValue: '= active',
    operator: 'equals',
    removable: true,
    ...overrides,
  };
}

function stateWithChips(chips: ActiveFilterChip[]): ActiveFilterVisibilityState {
  return setFilterChips(createActiveFilterVisibilityState(), chips);
}

// ---------------------------------------------------------------------------
// createActiveFilterVisibilityState
// ---------------------------------------------------------------------------

describe('active-filter-state', () => {
  describe('createActiveFilterVisibilityState', () => {
    it('returns factory defaults', () => {
      const state = createActiveFilterVisibilityState();
      expect(state.chips).toEqual([]);
      expect(state.expandedChipId).toBeNull();
      expect(state.collapsed).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // formatFilterValue
  // -------------------------------------------------------------------------

  describe('formatFilterValue', () => {
    it('formats equals operator', () => {
      expect(formatFilterValue('equals', 'active')).toBe('= active');
    });

    it('formats greaterThan operator', () => {
      expect(formatFilterValue('greaterThan', 100)).toBe('> 100');
    });

    it('formats lessThan operator', () => {
      expect(formatFilterValue('lessThan', 50)).toBe('< 50');
    });

    it('formats between operator with array of 2', () => {
      expect(formatFilterValue('between', [10, 20])).toBe('10 – 20');
    });

    it('formats contains operator', () => {
      expect(formatFilterValue('contains', 'foo')).toBe('contains foo');
    });

    it('formats in operator with array', () => {
      expect(formatFilterValue('in', ['US', 'EU', 'APAC'])).toBe('US, EU, APAC');
    });

    it('formats null as "Any"', () => {
      expect(formatFilterValue('equals', null)).toBe('Any');
    });

    it('formats undefined as "Any"', () => {
      expect(formatFilterValue('equals', undefined)).toBe('Any');
    });

    it('formats boolean true as "Yes"', () => {
      expect(formatFilterValue('equals', true)).toBe('Yes');
    });

    it('formats boolean false as "No"', () => {
      expect(formatFilterValue('equals', false)).toBe('No');
    });

    it('formats number via String()', () => {
      expect(formatFilterValue('equals', 42)).toBe('= 42');
    });

    it('formats array values joined with ", "', () => {
      expect(formatFilterValue('equals', ['A', 'B'])).toBe('= A, B');
    });

    it('falls back to "operator: value" for unknown operators', () => {
      expect(formatFilterValue('startsWith', 'abc')).toBe('startsWith: abc');
    });

    it('falls back for unknown operator with null', () => {
      expect(formatFilterValue('custom', null)).toBe('Any');
    });

    it('falls back for unknown operator with boolean', () => {
      expect(formatFilterValue('custom', true)).toBe('Yes');
    });

    it('formats between with non-array as default', () => {
      // between expects an array of 2, but if given a scalar, treat as default
      expect(formatFilterValue('between', 'oops')).toBe('between: oops');
    });

    it('formats between with array of length != 2 as joined', () => {
      expect(formatFilterValue('between', [1, 2, 3])).toBe('between: 1, 2, 3');
    });
  });

  // -------------------------------------------------------------------------
  // computeFilterChips
  // -------------------------------------------------------------------------

  describe('computeFilterChips', () => {
    it('builds chips for matching filters and definitions', () => {
      const chips = computeFilterChips(filters, definitions);
      expect(chips).toHaveLength(2);
      expect(chips[0].filterId).toBe('status');
      expect(chips[0].label).toBe('Status');
      expect(chips[0].displayValue).toBe('= active');
      expect(chips[0].operator).toBe('equals');
      expect(chips[0].removable).toBe(true);

      expect(chips[1].filterId).toBe('region');
      expect(chips[1].label).toBe('Region');
      expect(chips[1].displayValue).toBe('US, EU');
    });

    it('skips filters with no matching definition', () => {
      const orphanFilters: Record<string, FilterValueInput> = {
        unknown: { filterId: 'unknown', field: 'unknown', operator: 'equals', value: 'x' },
      };
      const chips = computeFilterChips(orphanFilters, definitions);
      expect(chips).toHaveLength(0);
    });

    it('returns chips sorted by definition order', () => {
      // Provide filters in reverse order of definitions
      const reversedFilters: Record<string, FilterValueInput> = {
        region: { filterId: 'region', field: 'region', operator: 'in', value: ['US'] },
        status: { filterId: 'status', field: 'status', operator: 'equals', value: 'active' },
      };
      const chips = computeFilterChips(reversedFilters, definitions);
      expect(chips[0].filterId).toBe('status');
      expect(chips[1].filterId).toBe('region');
    });

    it('falls back to field name when definition has no label', () => {
      const defs: FilterDefinitionInput[] = [
        { filterId: 'amount', field: 'amount', label: '' },
      ];
      const f: Record<string, FilterValueInput> = {
        amount: { filterId: 'amount', field: 'amount', operator: 'greaterThan', value: 100 },
      };
      const chips = computeFilterChips(f, defs);
      expect(chips[0].label).toBe('amount');
    });

    it('defaults removable to true when definition omits it', () => {
      const defs: FilterDefinitionInput[] = [
        { filterId: 'x', field: 'x', label: 'X' },
      ];
      const f: Record<string, FilterValueInput> = {
        x: { filterId: 'x', field: 'x', operator: 'equals', value: 1 },
      };
      const chips = computeFilterChips(f, defs);
      expect(chips[0].removable).toBe(true);
    });

    it('respects removable=false from definition', () => {
      const f: Record<string, FilterValueInput> = {
        locked: { filterId: 'locked', field: 'locked', operator: 'equals', value: true },
      };
      const chips = computeFilterChips(f, definitions);
      expect(chips[0].removable).toBe(false);
    });

    it('returns empty array for empty filters', () => {
      const chips = computeFilterChips({}, definitions);
      expect(chips).toEqual([]);
    });

    it('returns empty array for empty definitions', () => {
      const chips = computeFilterChips(filters, []);
      expect(chips).toEqual([]);
    });

    it('uses "in" display for array values', () => {
      const f: Record<string, FilterValueInput> = {
        region: { filterId: 'region', field: 'region', operator: 'in', value: ['US', 'EU', 'APAC'] },
      };
      const chips = computeFilterChips(f, definitions);
      expect(chips[0].displayValue).toBe('US, EU, APAC');
    });
  });

  // -------------------------------------------------------------------------
  // setFilterChips
  // -------------------------------------------------------------------------

  describe('setFilterChips', () => {
    it('updates chips in state', () => {
      const state = createActiveFilterVisibilityState();
      const chips = [makeChip()];
      const next = setFilterChips(state, chips);
      expect(next.chips).toEqual(chips);
      expect(next).not.toBe(state);
    });

    it('preserves other state fields', () => {
      const state: ActiveFilterVisibilityState = {
        chips: [],
        expandedChipId: 'foo',
        collapsed: true,
      };
      const next = setFilterChips(state, [makeChip()]);
      expect(next.expandedChipId).toBe('foo');
      expect(next.collapsed).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // expandChip
  // -------------------------------------------------------------------------

  describe('expandChip', () => {
    it('sets expandedChipId for a chip that exists', () => {
      const chip = makeChip();
      const state = stateWithChips([chip]);
      const next = expandChip(state, 'status');
      expect(next.expandedChipId).toBe('status');
    });

    it('no-op (same ref) if chipId not in chips', () => {
      const state = stateWithChips([makeChip()]);
      const next = expandChip(state, 'nonexistent');
      expect(next).toBe(state);
    });

    it('no-op (same ref) if already expanded to same chipId', () => {
      const chip = makeChip();
      const state = { ...stateWithChips([chip]), expandedChipId: 'status' };
      const next = expandChip(state, 'status');
      expect(next).toBe(state);
    });

    it('switches to a different chip', () => {
      const chips = [makeChip(), makeChip({ filterId: 'region', field: 'region', label: 'Region' })];
      const state = { ...stateWithChips(chips), expandedChipId: 'status' };
      const next = expandChip(state, 'region');
      expect(next.expandedChipId).toBe('region');
      expect(next).not.toBe(state);
    });
  });

  // -------------------------------------------------------------------------
  // collapseChip
  // -------------------------------------------------------------------------

  describe('collapseChip', () => {
    it('clears expandedChipId', () => {
      const state: ActiveFilterVisibilityState = {
        chips: [makeChip()],
        expandedChipId: 'status',
        collapsed: false,
      };
      const next = collapseChip(state);
      expect(next.expandedChipId).toBeNull();
    });

    it('no-op (same ref) if already null', () => {
      const state = createActiveFilterVisibilityState();
      const next = collapseChip(state);
      expect(next).toBe(state);
    });
  });

  // -------------------------------------------------------------------------
  // toggleCollapsed
  // -------------------------------------------------------------------------

  describe('toggleCollapsed', () => {
    it('flips collapsed from false to true', () => {
      const state = createActiveFilterVisibilityState();
      expect(state.collapsed).toBe(false);
      const next = toggleCollapsed(state);
      expect(next.collapsed).toBe(true);
    });

    it('flips collapsed from true to false', () => {
      const state = { ...createActiveFilterVisibilityState(), collapsed: true };
      const next = toggleCollapsed(state);
      expect(next.collapsed).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // removeChip
  // -------------------------------------------------------------------------

  describe('removeChip', () => {
    it('removes chip by filterId', () => {
      const chips = [makeChip(), makeChip({ filterId: 'region', field: 'region', label: 'Region' })];
      const state = stateWithChips(chips);
      const next = removeChip(state, 'status');
      expect(next.chips).toHaveLength(1);
      expect(next.chips[0].filterId).toBe('region');
    });

    it('no-op (same ref) if chip not found', () => {
      const state = stateWithChips([makeChip()]);
      const next = removeChip(state, 'nonexistent');
      expect(next).toBe(state);
    });

    it('clears expandedChipId when removing the expanded chip', () => {
      const chip = makeChip();
      const state: ActiveFilterVisibilityState = {
        chips: [chip],
        expandedChipId: 'status',
        collapsed: false,
      };
      const next = removeChip(state, 'status');
      expect(next.expandedChipId).toBeNull();
      expect(next.chips).toHaveLength(0);
    });

    it('preserves expandedChipId when removing a different chip', () => {
      const chips = [makeChip(), makeChip({ filterId: 'region', field: 'region', label: 'Region' })];
      const state: ActiveFilterVisibilityState = {
        chips,
        expandedChipId: 'status',
        collapsed: false,
      };
      const next = removeChip(state, 'region');
      expect(next.expandedChipId).toBe('status');
      expect(next.chips).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // getChipCount
  // -------------------------------------------------------------------------

  describe('getChipCount', () => {
    it('returns 0 for empty chips', () => {
      const state = createActiveFilterVisibilityState();
      expect(getChipCount(state)).toBe(0);
    });

    it('returns correct count', () => {
      const chips = [makeChip(), makeChip({ filterId: 'region' })];
      const state = stateWithChips(chips);
      expect(getChipCount(state)).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // getExpandedChip
  // -------------------------------------------------------------------------

  describe('getExpandedChip', () => {
    it('returns null when nothing is expanded', () => {
      const state = stateWithChips([makeChip()]);
      expect(getExpandedChip(state)).toBeNull();
    });

    it('returns the expanded chip', () => {
      const chip = makeChip();
      const state: ActiveFilterVisibilityState = {
        chips: [chip],
        expandedChipId: 'status',
        collapsed: false,
      };
      expect(getExpandedChip(state)).toBe(chip);
    });

    it('returns null if expandedChipId does not match any chip', () => {
      const state: ActiveFilterVisibilityState = {
        chips: [makeChip()],
        expandedChipId: 'nonexistent',
        collapsed: false,
      };
      expect(getExpandedChip(state)).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Immutability
  // -------------------------------------------------------------------------

  describe('immutability', () => {
    it('setFilterChips returns new object', () => {
      const state = createActiveFilterVisibilityState();
      const next = setFilterChips(state, [makeChip()]);
      expect(next).not.toBe(state);
    });

    it('expandChip returns new object when actually changing', () => {
      const state = stateWithChips([makeChip()]);
      const next = expandChip(state, 'status');
      expect(next).not.toBe(state);
    });

    it('toggleCollapsed returns new object', () => {
      const state = createActiveFilterVisibilityState();
      const next = toggleCollapsed(state);
      expect(next).not.toBe(state);
    });

    it('removeChip returns new object when chip found', () => {
      const state = stateWithChips([makeChip()]);
      const next = removeChip(state, 'status');
      expect(next).not.toBe(state);
    });
  });
});
