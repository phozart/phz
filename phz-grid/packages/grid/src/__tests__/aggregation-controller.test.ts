import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AggregationController, type AggregationHost } from '../controllers/aggregation.controller.js';
import type { ColumnDefinition, RowData } from '@phozart/core';

function makeHost(overrides?: Partial<AggregationHost>): AggregationHost {
  return {
    filteredRows: [
      { __id: 'r1', name: 'Alice', score: 100 },
      { __id: 'r2', name: 'Bob', score: 200 },
      { __id: 'r3', name: 'Carol', score: 300 },
    ] as unknown as RowData[],
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
    ...overrides,
  };
}

describe('AggregationController', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registers with host', () => {
    const host = makeHost();
    const ctrl = new AggregationController(host);
    expect(host.addController).toHaveBeenCalledWith(ctrl);
  });

  describe('computeColumnAgg', () => {
    it('computes sum', () => {
      const host = makeHost();
      const ctrl = new AggregationController(host);
      const col = { field: 'score', header: 'Score', type: 'number' } as ColumnDefinition;
      const result = ctrl.computeColumnAgg(host.filteredRows as Record<string, unknown>[], col, 'sum');
      expect(result).toBe('600');
    });

    it('computes avg', () => {
      const host = makeHost();
      const ctrl = new AggregationController(host);
      const col = { field: 'score', header: 'Score', type: 'number' } as ColumnDefinition;
      const result = ctrl.computeColumnAgg(host.filteredRows as Record<string, unknown>[], col, 'avg');
      expect(result).toBe('200');
    });

    it('computes count', () => {
      const host = makeHost();
      const ctrl = new AggregationController(host);
      const col = { field: 'score', header: 'Score', type: 'number' } as ColumnDefinition;
      const result = ctrl.computeColumnAgg(host.filteredRows as Record<string, unknown>[], col, 'count');
      expect(result).toBe('3');
    });

    it('computes min', () => {
      const host = makeHost();
      const ctrl = new AggregationController(host);
      const col = { field: 'score', header: 'Score', type: 'number' } as ColumnDefinition;
      const result = ctrl.computeColumnAgg(host.filteredRows as Record<string, unknown>[], col, 'min');
      expect(result).toBe('100');
    });

    it('computes max', () => {
      const host = makeHost();
      const ctrl = new AggregationController(host);
      const col = { field: 'score', header: 'Score', type: 'number' } as ColumnDefinition;
      const result = ctrl.computeColumnAgg(host.filteredRows as Record<string, unknown>[], col, 'max');
      expect(result).toBe('300');
    });

    it('handles empty values for avg gracefully', () => {
      const host = makeHost({ filteredRows: [] as unknown as RowData[] });
      const ctrl = new AggregationController(host);
      const col = { field: 'score', header: 'Score' } as ColumnDefinition;
      const result = ctrl.computeColumnAgg([], col, 'avg');
      expect(result).toBe('0');
    });

    it('uses valueGetter when present', () => {
      const host = makeHost();
      const ctrl = new AggregationController(host);
      const col = { field: 'score', header: 'Score', valueGetter: (r: any) => r.score * 2 } as unknown as ColumnDefinition;
      const result = ctrl.computeColumnAgg(host.filteredRows as Record<string, unknown>[], col, 'sum');
      expect(result).toBe('1,200');
    });

    it('filters out null/empty values', () => {
      const host = makeHost({
        filteredRows: [
          { __id: 'r1', score: 100 },
          { __id: 'r2', score: null },
          { __id: 'r3', score: '' },
          { __id: 'r4', score: 200 },
        ] as unknown as RowData[],
      });
      const ctrl = new AggregationController(host);
      const col = { field: 'score', header: 'Score' } as ColumnDefinition;
      const result = ctrl.computeColumnAgg(host.filteredRows as Record<string, unknown>[], col, 'count');
      expect(result).toBe('2');
    });

    it('falls back to count for unknown aggregation fn', () => {
      const host = makeHost();
      const ctrl = new AggregationController(host);
      const col = { field: 'score', header: 'Score' } as ColumnDefinition;
      const result = ctrl.computeColumnAgg(host.filteredRows as Record<string, unknown>[], col, 'none');
      expect(result).toBe('3');
    });
  });
});
