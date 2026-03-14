import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GroupController, type GroupHost } from '../controllers/group.controller.js';
import type { GridApi, RowGroup } from '@phozart/core';

function makeHost(overrides?: Partial<GroupHost>): GroupHost {
  const mockGroups: RowGroup[] = [
    { field: 'dept', value: 'Eng', rows: [{ __id: 'r1', dept: 'Eng' }, { __id: 'r2', dept: 'Eng' }] },
    { field: 'dept', value: 'Sales', rows: [{ __id: 'r3', dept: 'Sales' }] },
  ] as any[];

  return {
    gridApi: {
      groupBy: vi.fn(),
      getGroupedRowModel: vi.fn(() => ({ groups: mockGroups })),
    } as unknown as GridApi,
    groupBy: [],
    groupByLevels: [],
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
    ...overrides,
  };
}

describe('GroupController', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registers with host', () => {
    const host = makeHost();
    const ctrl = new GroupController(host);
    expect(host.addController).toHaveBeenCalledWith(ctrl);
  });

  it('starts ungrouped', () => {
    const host = makeHost();
    const ctrl = new GroupController(host);
    expect(ctrl.isGrouped).toBe(false);
    expect(ctrl.groups).toEqual([]);
  });

  describe('applyGrouping', () => {
    it('groups by single field from groupBy', () => {
      const host = makeHost({ groupBy: ['dept'] });
      const ctrl = new GroupController(host);
      ctrl.applyGrouping();

      expect(host.gridApi!.groupBy).toHaveBeenCalledWith(['dept']);
      expect(ctrl.isGrouped).toBe(true);
      expect(ctrl.groups).toHaveLength(2);
    });

    it('prefers groupByLevels.flat() over groupBy', () => {
      const host = makeHost({ groupByLevels: [['dept'], ['team']] });
      const ctrl = new GroupController(host);
      ctrl.applyGrouping();

      expect(host.gridApi!.groupBy).toHaveBeenCalledWith(['dept', 'team']);
    });

    it('does nothing without gridApi', () => {
      const host = makeHost({ gridApi: null, groupBy: ['dept'] });
      const ctrl = new GroupController(host);
      ctrl.applyGrouping();

      expect(ctrl.isGrouped).toBe(false);
    });

    it('clears grouping when no fields', () => {
      const host = makeHost({ groupBy: ['dept'] });
      const ctrl = new GroupController(host);
      ctrl.applyGrouping();
      expect(ctrl.isGrouped).toBe(true);

      host.groupBy = [];
      ctrl.applyGrouping();
      expect(ctrl.isGrouped).toBe(false);
      expect(ctrl.groups).toEqual([]);
    });
  });

  describe('groupByField / ungroupBy', () => {
    it('groupByField sets groupBy and applies', () => {
      const host = makeHost();
      const ctrl = new GroupController(host);
      ctrl.groupByField('dept');

      expect(host.gridApi!.groupBy).toHaveBeenCalledWith(['dept']);
      expect(ctrl.isGrouped).toBe(true);
    });

    it('ungroupBy clears all grouping', () => {
      const host = makeHost({ groupBy: ['dept'] });
      const ctrl = new GroupController(host);
      ctrl.applyGrouping();
      ctrl.ungroupBy();

      expect(ctrl.isGrouped).toBe(false);
      expect(ctrl.groups).toEqual([]);
    });
  });
});
