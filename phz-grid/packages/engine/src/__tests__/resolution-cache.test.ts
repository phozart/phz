import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ResolutionCache } from '../resolution-cache.js';
import { DirtyTracker } from '../dirty-tracker.js';

describe('ResolutionCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates with default options', () => {
    const cache = new ResolutionCache();
    expect(cache.size).toBe(0);
  });

  it('stores and retrieves cached results', () => {
    const cache = new ResolutionCache();
    const result = { widgetType: 'kpi-card' as const, value: 42 };

    cache.set('w1', 'data-hash-1', 'filter-hash-1', result);
    const cached = cache.get('w1', 'data-hash-1', 'filter-hash-1');

    expect(cached).toEqual(result);
  });

  it('returns null for cache miss (different data hash)', () => {
    const cache = new ResolutionCache();
    const result = { widgetType: 'kpi-card' as const, value: 42 };

    cache.set('w1', 'data-hash-1', 'filter-hash-1', result);
    const cached = cache.get('w1', 'data-hash-2', 'filter-hash-1');

    expect(cached).toBeNull();
  });

  it('returns null for cache miss (different filter hash)', () => {
    const cache = new ResolutionCache();
    const result = { widgetType: 'kpi-card' as const, value: 42 };

    cache.set('w1', 'data-hash-1', 'filter-hash-1', result);
    const cached = cache.get('w1', 'data-hash-1', 'filter-hash-2');

    expect(cached).toBeNull();
  });

  it('returns null for cache miss (unknown widget)', () => {
    const cache = new ResolutionCache();
    expect(cache.get('unknown', 'dh', 'fh')).toBeNull();
  });

  it('invalidates a specific widget', () => {
    const cache = new ResolutionCache();
    cache.set('w1', 'dh', 'fh', { widgetType: 'kpi-card' as const });
    cache.set('w2', 'dh', 'fh', { widgetType: 'bar-chart' as const });

    cache.invalidate('w1');

    expect(cache.get('w1', 'dh', 'fh')).toBeNull();
    expect(cache.get('w2', 'dh', 'fh')).not.toBeNull();
    expect(cache.size).toBe(1);
  });

  it('invalidates all widgets', () => {
    const cache = new ResolutionCache();
    cache.set('w1', 'dh', 'fh', { widgetType: 'kpi-card' as const });
    cache.set('w2', 'dh', 'fh', { widgetType: 'bar-chart' as const });

    cache.invalidate();

    expect(cache.size).toBe(0);
  });

  it('invalidates by filter hash', () => {
    const cache = new ResolutionCache();
    cache.set('w1', 'dh', 'filter-A', { widgetType: 'kpi-card' as const });
    cache.set('w2', 'dh', 'filter-A', { widgetType: 'bar-chart' as const });
    cache.set('w3', 'dh', 'filter-B', { widgetType: 'trend-line' as const });

    cache.invalidateByFilter('filter-A');

    expect(cache.get('w1', 'dh', 'filter-A')).toBeNull();
    expect(cache.get('w2', 'dh', 'filter-A')).toBeNull();
    expect(cache.get('w3', 'dh', 'filter-B')).not.toBeNull();
    expect(cache.size).toBe(1);
  });

  it('expires entries after TTL', () => {
    const cache = new ResolutionCache({ ttlMs: 5000 });
    cache.set('w1', 'dh', 'fh', { widgetType: 'kpi-card' as const });

    // Before TTL
    expect(cache.get('w1', 'dh', 'fh')).not.toBeNull();

    // After TTL
    vi.advanceTimersByTime(5001);
    expect(cache.get('w1', 'dh', 'fh')).toBeNull();
  });

  it('evicts oldest when max entries exceeded', () => {
    const cache = new ResolutionCache({ maxEntries: 2 });

    cache.set('w1', 'dh', 'fh', { widgetType: 'kpi-card' as const });
    cache.set('w2', 'dh', 'fh', { widgetType: 'bar-chart' as const });
    cache.set('w3', 'dh', 'fh', { widgetType: 'trend-line' as const });

    expect(cache.size).toBe(2);
    expect(cache.get('w1', 'dh', 'fh')).toBeNull(); // evicted
    expect(cache.get('w2', 'dh', 'fh')).not.toBeNull();
    expect(cache.get('w3', 'dh', 'fh')).not.toBeNull();
  });

  it('reports stats', () => {
    const cache = new ResolutionCache();
    cache.set('w1', 'dh', 'fh', { widgetType: 'kpi-card' as const });
    cache.get('w1', 'dh', 'fh'); // hit
    cache.get('w1', 'dh', 'fh2'); // miss

    const stats = cache.stats();
    expect(stats.size).toBe(1);
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
  });
});

describe('ResolutionCache.computeDataHash', () => {
  it('returns same hash for same data', () => {
    const data = [{ a: 1, b: 2 }, { a: 3, b: 4 }];
    const h1 = ResolutionCache.computeDataHash(data);
    const h2 = ResolutionCache.computeDataHash(data);
    expect(h1).toBe(h2);
  });

  it('returns different hash for different length', () => {
    const d1 = [{ a: 1 }];
    const d2 = [{ a: 1 }, { a: 2 }];
    expect(ResolutionCache.computeDataHash(d1)).not.toBe(ResolutionCache.computeDataHash(d2));
  });

  it('returns different hash for different sample values', () => {
    const d1 = [{ a: 1 }, { a: 2 }];
    const d2 = [{ a: 1 }, { a: 999 }];
    expect(ResolutionCache.computeDataHash(d1)).not.toBe(ResolutionCache.computeDataHash(d2));
  });

  it('handles empty data', () => {
    const h = ResolutionCache.computeDataHash([]);
    expect(typeof h).toBe('string');
    expect(h.length).toBeGreaterThan(0);
  });
});

describe('ResolutionCache.computeFilterHash', () => {
  it('returns same hash for same filters', () => {
    const f = { region: 'North', year: 2025 };
    const h1 = ResolutionCache.computeFilterHash(f);
    const h2 = ResolutionCache.computeFilterHash(f);
    expect(h1).toBe(h2);
  });

  it('returns different hash for different filters', () => {
    const f1 = { region: 'North' };
    const f2 = { region: 'South' };
    expect(ResolutionCache.computeFilterHash(f1)).not.toBe(ResolutionCache.computeFilterHash(f2));
  });

  it('handles empty filters', () => {
    const h = ResolutionCache.computeFilterHash({});
    expect(typeof h).toBe('string');
  });
});

describe('DirtyTracker', () => {
  it('creates with no dirty widgets', () => {
    const tracker = new DirtyTracker();
    expect(tracker.isDirty('w1')).toBe(false);
  });

  it('marks specific widget dirty', () => {
    const tracker = new DirtyTracker();
    tracker.markDirty('w1');

    expect(tracker.isDirty('w1')).toBe(true);
    expect(tracker.isDirty('w2')).toBe(false);
  });

  it('marks all widgets dirty', () => {
    const tracker = new DirtyTracker();
    tracker.markDirty('all');

    expect(tracker.isDirty('w1')).toBe(true);
    expect(tracker.isDirty('anything')).toBe(true);
  });

  it('marks widget clean', () => {
    const tracker = new DirtyTracker();
    tracker.markDirty('w1');
    tracker.markClean('w1');

    expect(tracker.isDirty('w1')).toBe(false);
  });

  it('markClean on specific does not clear allDirty', () => {
    const tracker = new DirtyTracker();
    tracker.markDirty('all');
    tracker.markClean('w1');

    // w1 was explicitly cleaned
    expect(tracker.isDirty('w1')).toBe(false);
    // w2 is still dirty (all flag)
    expect(tracker.isDirty('w2')).toBe(true);
  });

  it('markClean all clears everything', () => {
    const tracker = new DirtyTracker();
    tracker.markDirty('all');
    tracker.markClean('all');

    expect(tracker.isDirty('w1')).toBe(false);
    expect(tracker.isDirty('w2')).toBe(false);
  });

  it('getDirtyWidgets returns dirty set', () => {
    const tracker = new DirtyTracker();
    tracker.markDirty('w1');
    tracker.markDirty('w2');

    const dirty = tracker.getDirtyWidgets();
    expect(dirty).toContain('w1');
    expect(dirty).toContain('w2');
    expect(dirty).toHaveLength(2);
  });

  it('getDirtyWidgets returns "all" when allDirty', () => {
    const tracker = new DirtyTracker();
    tracker.markDirty('all');

    const dirty = tracker.getDirtyWidgets();
    expect(dirty).toEqual(['all']);
  });

  it('reset clears all state', () => {
    const tracker = new DirtyTracker();
    tracker.markDirty('w1');
    tracker.markDirty('all');
    tracker.reset();

    expect(tracker.isDirty('w1')).toBe(false);
    expect(tracker.getDirtyWidgets()).toEqual([]);
  });
});
