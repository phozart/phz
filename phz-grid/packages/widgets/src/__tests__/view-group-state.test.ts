/**
 * @phozart/phz-widgets — View Group State Tests
 */
import { describe, it, expect } from 'vitest';
import type { WidgetViewGroup } from '@phozart/phz-shared/types';
import {
  createViewGroupState,
  switchGroup,
  switchView,
  getActiveView,
  getActiveGroup,
  getAllViewIds,
  findGroupForView,
} from '../view-group-state.js';

function makeGroups(): WidgetViewGroup[] {
  return [
    {
      id: 'g1',
      label: 'Charts',
      views: [
        { id: 'v1', label: 'Bar Chart', widgetType: 'bar-chart', config: {} },
        { id: 'v2', label: 'Line Chart', widgetType: 'line-chart', config: {} },
      ],
      defaultViewId: 'v1',
      switchingMode: 'tabs',
    },
    {
      id: 'g2',
      label: 'Metrics',
      views: [
        { id: 'v3', label: 'KPI Card', widgetType: 'kpi-card', config: {} },
        { id: 'v4', label: 'Gauge', widgetType: 'gauge', config: {} },
      ],
      defaultViewId: 'v3',
      switchingMode: 'toggle',
    },
  ];
}

describe('createViewGroupState', () => {
  it('selects first group and its default view', () => {
    const state = createViewGroupState(makeGroups());
    expect(state.activeGroupId).toBe('g1');
    expect(state.activeViewId).toBe('v1');
    expect(state.switchingMode).toBe('tabs');
  });

  it('handles empty groups array', () => {
    const state = createViewGroupState([]);
    expect(state.activeGroupId).toBeNull();
    expect(state.activeViewId).toBeNull();
    expect(state.switchingMode).toBe('auto');
  });
});

describe('switchGroup', () => {
  it('switches to another group and activates its default view', () => {
    const state = createViewGroupState(makeGroups());
    const switched = switchGroup(state, 'g2');
    expect(switched.activeGroupId).toBe('g2');
    expect(switched.activeViewId).toBe('v3');
    expect(switched.switchingMode).toBe('toggle');
  });

  it('is a no-op for unknown group ID', () => {
    const state = createViewGroupState(makeGroups());
    const same = switchGroup(state, 'nonexistent');
    expect(same).toBe(state);
  });
});

describe('switchView', () => {
  it('switches to a different view within the active group', () => {
    const state = createViewGroupState(makeGroups());
    const switched = switchView(state, 'v2');
    expect(switched.activeViewId).toBe('v2');
    expect(switched.activeGroupId).toBe('g1'); // group unchanged
  });

  it('is a no-op for a view not in the active group', () => {
    const state = createViewGroupState(makeGroups());
    // v3 is in g2, but active group is g1
    const same = switchView(state, 'v3');
    expect(same).toBe(state);
  });

  it('is a no-op for an unknown view ID', () => {
    const state = createViewGroupState(makeGroups());
    const same = switchView(state, 'nonexistent');
    expect(same).toBe(state);
  });

  it('is a no-op when no active group', () => {
    const state = createViewGroupState([]);
    const same = switchView(state, 'v1');
    expect(same).toBe(state);
  });
});

describe('getActiveView', () => {
  it('returns the active view object', () => {
    const state = createViewGroupState(makeGroups());
    const view = getActiveView(state);
    expect(view).not.toBeNull();
    expect(view!.id).toBe('v1');
    expect(view!.widgetType).toBe('bar-chart');
  });

  it('returns null when no groups', () => {
    const state = createViewGroupState([]);
    expect(getActiveView(state)).toBeNull();
  });

  it('returns correct view after switching', () => {
    const state = createViewGroupState(makeGroups());
    const switched = switchView(state, 'v2');
    const view = getActiveView(switched);
    expect(view!.id).toBe('v2');
    expect(view!.widgetType).toBe('line-chart');
  });
});

describe('getActiveGroup', () => {
  it('returns the active group', () => {
    const state = createViewGroupState(makeGroups());
    const group = getActiveGroup(state);
    expect(group).not.toBeNull();
    expect(group!.id).toBe('g1');
    expect(group!.label).toBe('Charts');
  });

  it('returns null when no groups', () => {
    const state = createViewGroupState([]);
    expect(getActiveGroup(state)).toBeNull();
  });
});

describe('getAllViewIds', () => {
  it('returns all view IDs across all groups', () => {
    const state = createViewGroupState(makeGroups());
    const ids = getAllViewIds(state);
    expect(ids).toEqual(['v1', 'v2', 'v3', 'v4']);
  });

  it('returns empty array for no groups', () => {
    const state = createViewGroupState([]);
    expect(getAllViewIds(state)).toEqual([]);
  });
});

describe('findGroupForView', () => {
  it('finds the group containing a view', () => {
    const state = createViewGroupState(makeGroups());
    const group = findGroupForView(state, 'v3');
    expect(group).not.toBeNull();
    expect(group!.id).toBe('g2');
  });

  it('returns null for unknown view', () => {
    const state = createViewGroupState(makeGroups());
    expect(findGroupForView(state, 'unknown')).toBeNull();
  });

  it('finds group for first view', () => {
    const state = createViewGroupState(makeGroups());
    const group = findGroupForView(state, 'v1');
    expect(group!.id).toBe('g1');
  });
});

// ========================================================================
// Additional edge-case coverage for Wave 2
// ========================================================================

describe('createViewGroupState — additional', () => {
  it('stores all groups', () => {
    const groups = makeGroups();
    const state = createViewGroupState(groups);
    expect(state.groups).toHaveLength(2);
  });

  it('single group with single view', () => {
    const groups: WidgetViewGroup[] = [{
      id: 'g1',
      label: 'Solo',
      views: [{ id: 'v1', label: 'Only', widgetType: 'bar', config: {} }],
      defaultViewId: 'v1',
      switchingMode: 'toggle',
    }];
    const state = createViewGroupState(groups);
    expect(state.activeGroupId).toBe('g1');
    expect(state.activeViewId).toBe('v1');
  });
});

describe('switchGroup — additional', () => {
  it('returns a new state (immutable)', () => {
    const state = createViewGroupState(makeGroups());
    const next = switchGroup(state, 'g2');
    expect(next).not.toBe(state);
  });

  it('updates switchingMode from the new group', () => {
    const state = createViewGroupState(makeGroups());
    expect(state.switchingMode).toBe('tabs'); // g1
    const switched = switchGroup(state, 'g2');
    expect(switched.switchingMode).toBe('toggle'); // g2
  });
});

describe('switchView — additional', () => {
  it('returns a new state when switching to valid view', () => {
    const state = createViewGroupState(makeGroups());
    const next = switchView(state, 'v2');
    expect(next).not.toBe(state);
  });

  it('preserves switchingMode when switching views within group', () => {
    const state = createViewGroupState(makeGroups());
    const switched = switchView(state, 'v2');
    expect(switched.switchingMode).toBe('tabs');
  });
});

describe('getActiveView — additional', () => {
  it('returns correct view after switching group then view', () => {
    let state = createViewGroupState(makeGroups());
    state = switchGroup(state, 'g2');
    state = switchView(state, 'v4');
    const view = getActiveView(state);
    expect(view!.id).toBe('v4');
    expect(view!.widgetType).toBe('gauge');
  });
});

describe('getActiveGroup — additional', () => {
  it('returns correct group after switching', () => {
    let state = createViewGroupState(makeGroups());
    state = switchGroup(state, 'g2');
    const group = getActiveGroup(state);
    expect(group!.id).toBe('g2');
    expect(group!.label).toBe('Metrics');
  });
});

describe('getAllViewIds — with single group', () => {
  it('returns views from single group', () => {
    const groups: WidgetViewGroup[] = [{
      id: 'g1',
      label: 'Solo',
      views: [{ id: 'v1', label: 'Only', widgetType: 'bar', config: {} }],
      defaultViewId: 'v1',
      switchingMode: 'toggle',
    }];
    const state = createViewGroupState(groups);
    expect(getAllViewIds(state)).toEqual(['v1']);
  });
});
