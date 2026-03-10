import { describe, it, expect, vi } from 'vitest';
import {
  buildDependencyGraph,
  resolveCascadingDependency,
} from '../filters/cascading-resolver.js';
import type { FilterDependency, DashboardFilterDef } from '../types.js';
import type { DataAdapter } from '../data-adapter.js';

function mockDataAdapter(values: unknown[] = ['A', 'B', 'C']): DataAdapter {
  return {
    execute: vi.fn().mockResolvedValue({ columns: [], rows: [], metadata: { totalRows: 0, truncated: false, queryTimeMs: 0 } }),
    getSchema: vi.fn().mockResolvedValue({ id: 'test', name: 'Test', fields: [] }),
    listDataSources: vi.fn().mockResolvedValue([]),
    getDistinctValues: vi.fn().mockResolvedValue({ values, totalCount: values.length, truncated: false }),
    getFieldStats: vi.fn().mockResolvedValue({ distinctCount: 0, nullCount: 0, totalCount: 0 }),
  };
}

describe('CascadingResolver (O.2)', () => {
  describe('buildDependencyGraph', () => {
    it('builds a DAG from dependencies', () => {
      const deps: FilterDependency[] = [
        { parentFilterId: 'country', childFilterId: 'state', constraintType: 'data-driven' },
        { parentFilterId: 'state', childFilterId: 'city', constraintType: 'data-driven' },
      ];
      const graph = buildDependencyGraph(deps);
      expect(graph.order).toEqual(['country', 'state', 'city']);
      expect(graph.children.get('country')).toEqual(['state']);
      expect(graph.children.get('state')).toEqual(['city']);
    });

    it('returns topologically sorted order', () => {
      const deps: FilterDependency[] = [
        { parentFilterId: 'a', childFilterId: 'b', constraintType: 'data-driven' },
        { parentFilterId: 'a', childFilterId: 'c', constraintType: 'data-driven' },
        { parentFilterId: 'b', childFilterId: 'd', constraintType: 'data-driven' },
        { parentFilterId: 'c', childFilterId: 'd', constraintType: 'data-driven' },
      ];
      const graph = buildDependencyGraph(deps);
      const aIdx = graph.order.indexOf('a');
      const bIdx = graph.order.indexOf('b');
      const cIdx = graph.order.indexOf('c');
      const dIdx = graph.order.indexOf('d');
      expect(aIdx).toBeLessThan(bIdx);
      expect(aIdx).toBeLessThan(cIdx);
      expect(bIdx).toBeLessThan(dIdx);
      expect(cIdx).toBeLessThan(dIdx);
    });

    it('detects cycles and throws', () => {
      const deps: FilterDependency[] = [
        { parentFilterId: 'a', childFilterId: 'b', constraintType: 'data-driven' },
        { parentFilterId: 'b', childFilterId: 'c', constraintType: 'data-driven' },
        { parentFilterId: 'c', childFilterId: 'a', constraintType: 'data-driven' },
      ];
      expect(() => buildDependencyGraph(deps)).toThrow(/cycle/i);
    });

    it('handles empty dependencies', () => {
      const graph = buildDependencyGraph([]);
      expect(graph.order).toEqual([]);
      expect(graph.children.size).toBe(0);
    });

    it('handles independent chains', () => {
      const deps: FilterDependency[] = [
        { parentFilterId: 'x', childFilterId: 'y', constraintType: 'data-driven' },
        { parentFilterId: 'a', childFilterId: 'b', constraintType: 'data-driven' },
      ];
      const graph = buildDependencyGraph(deps);
      expect(graph.order).toHaveLength(4);
    });
  });

  describe('resolveCascadingDependency', () => {
    it('fetches child options using parent value as filter', async () => {
      const adapter = mockDataAdapter(['CA', 'NY', 'TX']);
      const filterDef: DashboardFilterDef = {
        id: 'state',
        field: 'state',
        dataSourceId: 'sales',
        label: 'State',
        filterType: 'select',
        required: false,
        appliesTo: ['*'],
      };
      const dep: FilterDependency = {
        parentFilterId: 'country',
        childFilterId: 'state',
        constraintType: 'data-driven',
      };

      const result = await resolveCascadingDependency(
        adapter,
        filterDef,
        dep,
        'US', // parent value
      );

      expect(result.values).toEqual(['CA', 'NY', 'TX']);
      expect(adapter.getDistinctValues).toHaveBeenCalledWith(
        'sales',
        'state',
        expect.objectContaining({ filters: expect.anything() }),
      );
    });

    it('returns empty when parent value is null', async () => {
      const adapter = mockDataAdapter();
      const filterDef: DashboardFilterDef = {
        id: 'state',
        field: 'state',
        dataSourceId: 'sales',
        label: 'State',
        filterType: 'select',
        required: false,
        appliesTo: ['*'],
      };
      const dep: FilterDependency = {
        parentFilterId: 'country',
        childFilterId: 'state',
        constraintType: 'data-driven',
      };

      const result = await resolveCascadingDependency(adapter, filterDef, dep, null);
      expect(result.values).toEqual([]);
      expect(adapter.getDistinctValues).not.toHaveBeenCalled();
    });

    it('passes search option through', async () => {
      const adapter = mockDataAdapter(['California']);
      const filterDef: DashboardFilterDef = {
        id: 'state',
        field: 'state',
        dataSourceId: 'sales',
        label: 'State',
        filterType: 'select',
        required: false,
        appliesTo: ['*'],
      };
      const dep: FilterDependency = {
        parentFilterId: 'country',
        childFilterId: 'state',
        constraintType: 'data-driven',
      };

      await resolveCascadingDependency(adapter, filterDef, dep, 'US', { search: 'Cal' });
      expect(adapter.getDistinctValues).toHaveBeenCalledWith(
        'sales',
        'state',
        expect.objectContaining({ search: 'Cal' }),
      );
    });
  });
});
