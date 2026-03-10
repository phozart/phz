import { describe, it, expect, vi } from 'vitest';
import { ServerGroupManager } from '../server-group-manager.js';
import type { ServerGroupRow, ServerDataResponse } from '../types/server.js';

function createMockFetch(groups: Record<string, ServerGroupRow[]>) {
  return vi.fn(async (expandedKeys: unknown[][]): Promise<ServerGroupRow[]> => {
    // Root level
    if (expandedKeys.length === 0) {
      return groups['root'] || [];
    }
    // Return children for the last expanded key
    const lastKey = JSON.stringify(expandedKeys[expandedKeys.length - 1]);
    return groups[lastKey] || [];
  });
}

describe('WI 20: ServerGroupManager — group request shape', () => {
  it('builds correct initial group request', () => {
    const manager = new ServerGroupManager({
      groupBy: [{ field: 'country' }],
    });

    const request = manager.buildGroupRequest();
    expect(request.groupBy).toEqual([{ field: 'country' }]);
    expect(request.expandedGroupKeys).toEqual([]);
  });

  it('builds request with aggregations', () => {
    const manager = new ServerGroupManager({
      groupBy: [
        {
          field: 'country',
          aggregations: [
            { field: 'revenue', function: 'sum' },
            { field: 'count', function: 'count' },
          ],
        },
      ],
    });

    const request = manager.buildGroupRequest();
    expect(request.groupBy[0].aggregations).toHaveLength(2);
  });

  it('includes expanded keys in request', () => {
    const manager = new ServerGroupManager({
      groupBy: [{ field: 'country' }, { field: 'city' }],
    });

    manager.expandGroup(['US']);
    const request = manager.buildGroupRequest();
    expect(request.expandedGroupKeys).toEqual([['US']]);
  });
});

describe('WI 20: ServerGroupManager — expand/collapse', () => {
  it('tracks expanded groups', () => {
    const manager = new ServerGroupManager({
      groupBy: [{ field: 'country' }],
    });

    manager.expandGroup(['US']);
    manager.expandGroup(['UK']);

    expect(manager.isGroupExpanded(['US'])).toBe(true);
    expect(manager.isGroupExpanded(['UK'])).toBe(true);
    expect(manager.isGroupExpanded(['FR'])).toBe(false);
  });

  it('collapses a group', () => {
    const manager = new ServerGroupManager({
      groupBy: [{ field: 'country' }],
    });

    manager.expandGroup(['US']);
    expect(manager.isGroupExpanded(['US'])).toBe(true);

    manager.collapseGroup(['US']);
    expect(manager.isGroupExpanded(['US'])).toBe(false);
  });

  it('toggles a group', () => {
    const manager = new ServerGroupManager({
      groupBy: [{ field: 'country' }],
    });

    manager.toggleGroup(['US']);
    expect(manager.isGroupExpanded(['US'])).toBe(true);

    manager.toggleGroup(['US']);
    expect(manager.isGroupExpanded(['US'])).toBe(false);
  });

  it('collapses children when parent collapses', () => {
    const manager = new ServerGroupManager({
      groupBy: [{ field: 'country' }, { field: 'city' }],
    });

    manager.expandGroup(['US']);
    manager.expandGroup(['US', 'NYC']);
    manager.expandGroup(['US', 'LA']);
    expect(manager.isGroupExpanded(['US', 'NYC'])).toBe(true);

    // Collapse parent
    manager.collapseGroup(['US']);
    expect(manager.isGroupExpanded(['US'])).toBe(false);
    expect(manager.isGroupExpanded(['US', 'NYC'])).toBe(false);
    expect(manager.isGroupExpanded(['US', 'LA'])).toBe(false);
  });
});

describe('WI 20: ServerGroupManager — nested group expansion', () => {
  it('supports multi-level grouping', () => {
    const manager = new ServerGroupManager({
      groupBy: [
        { field: 'country' },
        { field: 'city' },
        { field: 'department' },
      ],
    });

    manager.expandGroup(['US']);
    manager.expandGroup(['US', 'NYC']);
    manager.expandGroup(['US', 'NYC', 'Engineering']);

    const request = manager.buildGroupRequest();
    expect(request.expandedGroupKeys).toEqual([
      ['US'],
      ['US', 'NYC'],
      ['US', 'NYC', 'Engineering'],
    ]);
  });
});

describe('WI 20: ServerGroupManager — group row processing', () => {
  it('stores group rows from response', () => {
    const manager = new ServerGroupManager({
      groupBy: [{ field: 'country' }],
    });

    const groupRows: ServerGroupRow[] = [
      {
        groupKey: ['US'],
        groupLabel: 'United States',
        childCount: 50,
        hasSubGroups: true,
        aggregates: { revenue: 125000 },
      },
      {
        groupKey: ['UK'],
        groupLabel: 'United Kingdom',
        childCount: 30,
        hasSubGroups: true,
        aggregates: { revenue: 75000 },
      },
    ];

    manager.setGroupRows([], groupRows);

    const stored = manager.getGroupRows([]);
    expect(stored).toHaveLength(2);
    expect(stored![0].groupLabel).toBe('United States');
    expect(stored![0].aggregates!.revenue).toBe(125000);
  });

  it('stores nested group rows', () => {
    const manager = new ServerGroupManager({
      groupBy: [{ field: 'country' }, { field: 'city' }],
    });

    const rootGroups: ServerGroupRow[] = [
      { groupKey: ['US'], groupLabel: 'US', childCount: 3, hasSubGroups: true },
    ];
    const usChildren: ServerGroupRow[] = [
      { groupKey: ['US', 'NYC'], groupLabel: 'New York', childCount: 20, hasSubGroups: false },
      { groupKey: ['US', 'LA'], groupLabel: 'Los Angeles', childCount: 15, hasSubGroups: false },
    ];

    manager.setGroupRows([], rootGroups);
    manager.setGroupRows(['US'], usChildren);

    expect(manager.getGroupRows([])).toHaveLength(1);
    expect(manager.getGroupRows(['US'])).toHaveLength(2);
    expect(manager.getGroupRows(['UK'])).toBeUndefined();
  });
});

describe('WI 20: ServerGroupManager — collapse all / expand all', () => {
  it('collapseAll clears all expanded groups', () => {
    const manager = new ServerGroupManager({
      groupBy: [{ field: 'country' }, { field: 'city' }],
    });

    manager.expandGroup(['US']);
    manager.expandGroup(['US', 'NYC']);
    manager.expandGroup(['UK']);

    manager.collapseAll();

    expect(manager.isGroupExpanded(['US'])).toBe(false);
    expect(manager.isGroupExpanded(['US', 'NYC'])).toBe(false);
    expect(manager.isGroupExpanded(['UK'])).toBe(false);
    expect(manager.buildGroupRequest().expandedGroupKeys).toEqual([]);
  });
});
