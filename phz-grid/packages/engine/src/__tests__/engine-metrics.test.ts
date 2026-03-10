/**
 * @phozart/phz-engine — EngineMetrics Tests
 *
 * TDD: Tests written first, implementation to follow.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EngineMetrics } from '../engine-metrics.js';
import type { MetricsSnapshot, OperationCategory } from '../engine-metrics.js';

describe('EngineMetrics', () => {
  let metrics: EngineMetrics;

  beforeEach(() => {
    metrics = new EngineMetrics();
  });

  describe('startTimer / stopTimer', () => {
    it('records a duration when timer is started and stopped', () => {
      const handle = metrics.startTimer('aggregation');
      metrics.stopTimer(handle);

      const snapshot = metrics.getMetrics();
      expect(snapshot.aggregation).toBeDefined();
      expect(snapshot.aggregation!.count).toBe(1);
      expect(snapshot.aggregation!.min).toBeGreaterThanOrEqual(0);
    });

    it('records multiple operations', () => {
      const h1 = metrics.startTimer('aggregation');
      metrics.stopTimer(h1);
      const h2 = metrics.startTimer('aggregation');
      metrics.stopTimer(h2);

      const snapshot = metrics.getMetrics();
      expect(snapshot.aggregation!.count).toBe(2);
    });

    it('supports different operation categories', () => {
      const h1 = metrics.startTimer('aggregation');
      metrics.stopTimer(h1);
      const h2 = metrics.startTimer('pivot');
      metrics.stopTimer(h2);

      const snapshot = metrics.getMetrics();
      expect(snapshot.aggregation!.count).toBe(1);
      expect(snapshot.pivot!.count).toBe(1);
    });

    it('ignores stopping an already-stopped timer', () => {
      const handle = metrics.startTimer('filter');
      metrics.stopTimer(handle);
      // Second stop should be a no-op
      metrics.stopTimer(handle);

      expect(metrics.getMetrics().filter!.count).toBe(1);
    });
  });

  describe('record', () => {
    it('manually records a duration for an operation', () => {
      metrics.record('data_load', 42);
      const snapshot = metrics.getMetrics();
      expect(snapshot.data_load!.count).toBe(1);
      expect(snapshot.data_load!.min).toBe(42);
      expect(snapshot.data_load!.max).toBe(42);
      expect(snapshot.data_load!.avg).toBe(42);
    });

    it('accumulates manually recorded values', () => {
      metrics.record('render', 10);
      metrics.record('render', 30);
      metrics.record('render', 20);

      const snapshot = metrics.getMetrics();
      expect(snapshot.render!.count).toBe(3);
      expect(snapshot.render!.min).toBe(10);
      expect(snapshot.render!.max).toBe(30);
      expect(snapshot.render!.avg).toBe(20);
    });
  });

  describe('getMetrics — stats computation', () => {
    it('returns empty object when no metrics recorded', () => {
      const snapshot = metrics.getMetrics();
      expect(Object.keys(snapshot)).toHaveLength(0);
    });

    it('computes min, max, avg correctly', () => {
      metrics.record('aggregation', 10);
      metrics.record('aggregation', 20);
      metrics.record('aggregation', 30);
      metrics.record('aggregation', 40);
      metrics.record('aggregation', 50);

      const stats = metrics.getMetrics().aggregation!;
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(50);
      expect(stats.avg).toBe(30);
      expect(stats.count).toBe(5);
    });

    it('computes p95 correctly for small dataset', () => {
      // 20 values: 1..20
      for (let i = 1; i <= 20; i++) {
        metrics.record('pivot', i);
      }

      const stats = metrics.getMetrics().pivot!;
      // p95 index = ceil(0.95 * 20) - 1 = ceil(19) - 1 = 18
      // sorted[18] = 19
      expect(stats.p95).toBe(19);
    });

    it('computes p95 correctly for single value', () => {
      metrics.record('filter', 42);
      const stats = metrics.getMetrics().filter!;
      // p95 index = ceil(0.95 * 1) - 1 = 1 - 1 = 0
      expect(stats.p95).toBe(42);
    });

    it('computes p95 for two values', () => {
      metrics.record('filter', 10);
      metrics.record('filter', 100);
      const stats = metrics.getMetrics().filter!;
      // p95 index = ceil(0.95 * 2) - 1 = ceil(1.9) - 1 = 2 - 1 = 1
      // sorted[1] = 100
      expect(stats.p95).toBe(100);
    });
  });

  describe('reset', () => {
    it('clears all recorded metrics', () => {
      metrics.record('aggregation', 10);
      metrics.record('pivot', 20);
      metrics.reset();

      const snapshot = metrics.getMetrics();
      expect(Object.keys(snapshot)).toHaveLength(0);
    });

    it('allows recording after reset', () => {
      metrics.record('aggregation', 10);
      metrics.reset();
      metrics.record('aggregation', 50);

      const stats = metrics.getMetrics().aggregation!;
      expect(stats.count).toBe(1);
      expect(stats.min).toBe(50);
    });
  });

  describe('onSlowOperation', () => {
    it('calls callback when recorded duration exceeds threshold', () => {
      const cb = vi.fn();
      metrics.onSlowOperation(100, cb);
      metrics.record('data_load', 150);

      expect(cb).toHaveBeenCalledOnce();
      expect(cb).toHaveBeenCalledWith('data_load', 150);
    });

    it('does not call callback when duration is below threshold', () => {
      const cb = vi.fn();
      metrics.onSlowOperation(100, cb);
      metrics.record('data_load', 50);

      expect(cb).not.toHaveBeenCalled();
    });

    it('calls callback when timer-based recording exceeds threshold', () => {
      const cb = vi.fn();
      metrics.onSlowOperation(0, cb); // threshold 0ms — any operation triggers

      const handle = metrics.startTimer('aggregation');
      metrics.stopTimer(handle);

      expect(cb).toHaveBeenCalledOnce();
      expect(cb.mock.calls[0][0]).toBe('aggregation');
      expect(cb.mock.calls[0][1]).toBeGreaterThanOrEqual(0);
    });

    it('supports multiple slow-operation listeners', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      metrics.onSlowOperation(10, cb1);
      metrics.onSlowOperation(50, cb2);

      metrics.record('pivot', 30);

      expect(cb1).toHaveBeenCalledOnce(); // 30 > 10
      expect(cb2).not.toHaveBeenCalled(); // 30 < 50
    });

    it('returns unsubscribe function', () => {
      const cb = vi.fn();
      const unsub = metrics.onSlowOperation(0, cb);

      metrics.record('render', 10);
      expect(cb).toHaveBeenCalledOnce();

      unsub();
      metrics.record('render', 20);
      expect(cb).toHaveBeenCalledOnce(); // still 1, not called again
    });
  });

  describe('all operation categories', () => {
    it('accepts all defined operation categories', () => {
      const categories: OperationCategory[] = [
        'aggregation', 'pivot', 'filter', 'expression_eval',
        'expression_compile', 'widget_resolve', 'data_load', 'render',
      ];

      for (const cat of categories) {
        metrics.record(cat, 1);
      }

      const snapshot = metrics.getMetrics();
      for (const cat of categories) {
        expect(snapshot[cat]).toBeDefined();
        expect(snapshot[cat]!.count).toBe(1);
      }
    });
  });
});

describe('BIEngine metrics integration', () => {
  it('BIEngine has enableMetrics in config and engineMetrics getter', async () => {
    const { createBIEngine } = await import('../engine.js');

    // Without metrics — should be undefined/null
    const engineNoMetrics = createBIEngine();
    expect(engineNoMetrics.engineMetrics).toBeUndefined();

    // With metrics enabled
    const engineWithMetrics = createBIEngine({ enableMetrics: true });
    expect(engineWithMetrics.engineMetrics).toBeDefined();
    expect(engineWithMetrics.engineMetrics).toBeInstanceOf(EngineMetrics);
  });

  it('instruments aggregate when metrics enabled', async () => {
    const { createBIEngine } = await import('../engine.js');
    const engine = createBIEngine({ enableMetrics: true });

    engine.aggregate([{ x: 1 }, { x: 2 }], {
      fields: [{ field: 'x', functions: ['sum'] }],
    });

    const snapshot = engine.engineMetrics!.getMetrics();
    expect(snapshot.aggregation).toBeDefined();
    expect(snapshot.aggregation!.count).toBe(1);
  });

  it('instruments pivot when metrics enabled', async () => {
    const { createBIEngine } = await import('../engine.js');
    const engine = createBIEngine({ enableMetrics: true });

    engine.pivot([{ region: 'US', year: '2024', revenue: 100 }], {
      rowFields: ['region'],
      columnFields: ['year'],
      valueFields: [{ field: 'revenue', aggregation: 'sum' }],
    });

    const snapshot = engine.engineMetrics!.getMetrics();
    expect(snapshot.pivot).toBeDefined();
    expect(snapshot.pivot!.count).toBe(1);
  });

  it('zero overhead when metrics disabled — no engineMetrics instance', async () => {
    const { createBIEngine } = await import('../engine.js');
    const engine = createBIEngine({ enableMetrics: false });

    // Should run without error, no metrics tracked
    engine.aggregate([{ x: 1 }], { fields: [{ field: 'x', functions: ['sum'] }] });
    expect(engine.engineMetrics).toBeUndefined();
  });
});
