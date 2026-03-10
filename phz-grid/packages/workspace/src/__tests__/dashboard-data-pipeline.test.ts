/**
 * T.4 — Dashboard data loading pipeline
 * Parallel preload/full-load, state transitions, tier distribution, invalidation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  DashboardDataConfig,
  DashboardLoadingState,
} from '../types.js';
import type { DataAdapter, DataResult } from '../data-adapter.js';
import { createFilterContext } from '../filters/filter-context.js';
import {
  createDashboardDataPipeline,
  type DashboardDataPipeline,
} from '../coordination/dashboard-data-pipeline.js';

function mockDataAdapter(overrides?: Partial<DataAdapter>): DataAdapter {
  return {
    execute: vi.fn(async () => ({
      columns: [{ name: 'region', dataType: 'string' }, { name: 'revenue', dataType: 'number' }],
      rows: [['US', 1000], ['EU', 2000]],
      metadata: { totalRows: 2, truncated: false, queryTimeMs: 5 },
    })),
    getSchema: vi.fn(async () => ({ id: 'test', name: 'Test', fields: [] })),
    listDataSources: vi.fn(async () => []),
    getDistinctValues: vi.fn(async () => ({ values: [], totalCount: 0, truncated: false })),
    getFieldStats: vi.fn(async () => ({ distinctCount: 0, nullCount: 0, totalCount: 0 })),
    ...overrides,
  };
}

function makeConfig(): DashboardDataConfig {
  return {
    preload: {
      query: { source: 'sales', fields: ['region', 'revenue'] },
    },
    fullLoad: {
      query: { source: 'sales', fields: ['region', 'revenue', 'date', 'product', 'amount'] },
      applyCurrentFilters: true,
      maxRows: 50000,
    },
  };
}

describe('DashboardDataPipeline (T.4)', () => {
  let adapter: DataAdapter;
  let pipeline: DashboardDataPipeline;

  beforeEach(() => {
    adapter = mockDataAdapter();
    const filterContext = createFilterContext();
    pipeline = createDashboardDataPipeline(makeConfig(), adapter, filterContext);
  });

  describe('initial state', () => {
    it('starts in idle phase', () => {
      expect(pipeline.state.phase).toBe('idle');
    });
  });

  describe('start()', () => {
    it('transitions through loading phases', async () => {
      const phases: DashboardLoadingState['phase'][] = [];
      pipeline.onStateChange(s => phases.push(s.phase));

      await pipeline.start();

      // Should have gone through preloading -> preload-complete -> full-loading -> full-complete
      expect(phases).toContain('preloading');
      expect(phases).toContain('full-complete');
      expect(pipeline.state.phase).toBe('full-complete');
    });

    it('fires preload and full-load queries', async () => {
      await pipeline.start();
      // execute should be called at least twice (preload + full)
      expect(adapter.execute).toHaveBeenCalledTimes(2);
    });

    it('calls preload query with correct source', async () => {
      await pipeline.start();
      const calls = (adapter.execute as ReturnType<typeof vi.fn>).mock.calls;
      const sources = calls.map((c: unknown[]) => (c[0] as { source: string }).source);
      expect(sources).toContain('sales');
    });
  });

  describe('state transitions', () => {
    it('notifies listeners on state change', async () => {
      const listener = vi.fn();
      pipeline.onStateChange(listener);

      await pipeline.start();

      expect(listener).toHaveBeenCalled();
      // listener should be called with DashboardLoadingState objects
      const firstCall = listener.mock.calls[0][0] as DashboardLoadingState;
      expect(firstCall).toHaveProperty('phase');
    });

    it('unsubscribe stops notifications', async () => {
      const listener = vi.fn();
      const unsub = pipeline.onStateChange(listener);
      unsub();

      await pipeline.start();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('getWidgetData', () => {
    it('returns undefined before start()', () => {
      expect(pipeline.getWidgetData('w1', 'preload')).toBeUndefined();
    });

    it('returns data after start()', async () => {
      await pipeline.start();
      // After full load, both tiers should be available
      const data = pipeline.getWidgetData('w1', 'full');
      expect(data).toBeDefined();
      expect(data?.rows).toBeDefined();
    });

    it('returns preload data for preload tier', async () => {
      await pipeline.start();
      const data = pipeline.getWidgetData('w1', 'preload');
      expect(data).toBeDefined();
    });
  });

  describe('invalidate()', () => {
    it('re-triggers loads', async () => {
      await pipeline.start();
      expect(adapter.execute).toHaveBeenCalledTimes(2);

      await pipeline.invalidate();
      // Should have triggered 2 more calls
      expect(adapter.execute).toHaveBeenCalledTimes(4);
    });

    it('transitions back through loading phases', async () => {
      await pipeline.start();

      const phases: DashboardLoadingState['phase'][] = [];
      pipeline.onStateChange(s => phases.push(s.phase));

      await pipeline.invalidate();

      expect(phases).toContain('preloading');
      expect(pipeline.state.phase).toBe('full-complete');
    });
  });

  describe('error handling', () => {
    it('transitions to error phase when adapter fails', async () => {
      const failAdapter = mockDataAdapter({
        execute: vi.fn(async () => { throw new Error('Network error'); }),
      });
      const filterContext = createFilterContext();
      const failPipeline = createDashboardDataPipeline(makeConfig(), failAdapter, filterContext);

      await failPipeline.start();

      expect(failPipeline.state.phase).toBe('error');
      expect(failPipeline.state.error).toBe('Network error');
    });
  });

  describe('destroy()', () => {
    it('cleans up listeners', async () => {
      const listener = vi.fn();
      pipeline.onStateChange(listener);
      pipeline.destroy();

      // After destroy, starting should not notify
      await pipeline.start().catch(() => {});
      // listener was added before destroy, so it should not be called after
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
