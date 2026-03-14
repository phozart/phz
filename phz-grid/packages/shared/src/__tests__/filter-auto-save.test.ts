/**
 * Tests for FilterAutoSave — auto-save configuration, snapshot creation,
 * shouldAutoSave guard, and history pruning.
 *
 * Covers createDefaultAutoSaveConfig, createFilterSnapshot, shouldAutoSave, and pruneHistory.
 */
import {
  createDefaultAutoSaveConfig,
  createFilterSnapshot,
  shouldAutoSave,
  pruneHistory,
} from '@phozart/shared/coordination';
import type {
  FilterAutoSaveConfig,
  FilterStateSnapshot,
} from '@phozart/shared/coordination';

// ========================================================================
// createDefaultAutoSaveConfig
// ========================================================================

describe('createDefaultAutoSaveConfig', () => {
  it('creates config with default values', () => {
    const config = createDefaultAutoSaveConfig();
    expect(config.enabled).toBe(true);
    expect(config.debounceMs).toBe(500);
    expect(config.maxHistoryEntries).toBe(10);
    expect(config.storageKey).toBeUndefined();
  });

  it('applies overrides', () => {
    const config = createDefaultAutoSaveConfig({
      enabled: false,
      debounceMs: 1000,
      storageKey: 'my-filters',
    });
    expect(config.enabled).toBe(false);
    expect(config.debounceMs).toBe(1000);
    expect(config.storageKey).toBe('my-filters');
    // Non-overridden values remain default
    expect(config.maxHistoryEntries).toBe(10);
  });

  it('overrides maxHistoryEntries', () => {
    const config = createDefaultAutoSaveConfig({ maxHistoryEntries: 50 });
    expect(config.maxHistoryEntries).toBe(50);
  });

  it('works with no arguments', () => {
    const config = createDefaultAutoSaveConfig();
    expect(config).toBeDefined();
  });

  it('works with undefined argument', () => {
    const config = createDefaultAutoSaveConfig(undefined);
    expect(config.enabled).toBe(true);
  });
});

// ========================================================================
// createFilterSnapshot
// ========================================================================

describe('createFilterSnapshot', () => {
  it('creates a snapshot with filters and timestamp', () => {
    const before = Date.now();
    const snapshot = createFilterSnapshot({ region: 'US', status: 'active' });
    const after = Date.now();

    expect(snapshot.filters).toEqual({ region: 'US', status: 'active' });
    expect(snapshot.timestamp).toBeGreaterThanOrEqual(before);
    expect(snapshot.timestamp).toBeLessThanOrEqual(after);
    expect(snapshot.artifactId).toBeUndefined();
    expect(snapshot.userId).toBeUndefined();
  });

  it('creates a defensive copy of filters', () => {
    const filters = { x: 1 };
    const snapshot = createFilterSnapshot(filters);
    filters.x = 999;
    expect(snapshot.filters.x).toBe(1);
  });

  it('includes artifactId when provided', () => {
    const snapshot = createFilterSnapshot({ a: 1 }, { artifactId: 'dash-1' });
    expect(snapshot.artifactId).toBe('dash-1');
  });

  it('includes userId when provided', () => {
    const snapshot = createFilterSnapshot({ a: 1 }, { userId: 'user-42' });
    expect(snapshot.userId).toBe('user-42');
  });

  it('includes both artifactId and userId', () => {
    const snapshot = createFilterSnapshot(
      { x: 1 },
      { artifactId: 'report-1', userId: 'admin' },
    );
    expect(snapshot.artifactId).toBe('report-1');
    expect(snapshot.userId).toBe('admin');
  });

  it('handles empty filters', () => {
    const snapshot = createFilterSnapshot({});
    expect(snapshot.filters).toEqual({});
  });

  it('handles complex filter values', () => {
    const snapshot = createFilterSnapshot({
      range: [10, 20],
      tags: ['a', 'b'],
      nested: { deep: true },
    });
    expect(snapshot.filters.range).toEqual([10, 20]);
    expect(snapshot.filters.tags).toEqual(['a', 'b']);
    expect(snapshot.filters.nested).toEqual({ deep: true });
  });

  it('does not include artifactId when not provided in context', () => {
    const snapshot = createFilterSnapshot({ a: 1 }, { userId: 'user-1' });
    expect('artifactId' in snapshot).toBe(false);
  });

  it('does not include userId when not provided in context', () => {
    const snapshot = createFilterSnapshot({ a: 1 }, { artifactId: 'dash-1' });
    expect('userId' in snapshot).toBe(false);
  });

  it('handles undefined context', () => {
    const snapshot = createFilterSnapshot({ a: 1 }, undefined);
    expect(snapshot.artifactId).toBeUndefined();
    expect(snapshot.userId).toBeUndefined();
  });
});

// ========================================================================
// shouldAutoSave
// ========================================================================

describe('shouldAutoSave', () => {
  it('returns true when enabled and debounceMs > 0', () => {
    const config = createDefaultAutoSaveConfig();
    expect(shouldAutoSave(config)).toBe(true);
  });

  it('returns false when disabled', () => {
    const config = createDefaultAutoSaveConfig({ enabled: false });
    expect(shouldAutoSave(config)).toBe(false);
  });

  it('returns false when debounceMs is 0', () => {
    const config = createDefaultAutoSaveConfig({ debounceMs: 0 });
    expect(shouldAutoSave(config)).toBe(false);
  });

  it('returns false when debounceMs is negative', () => {
    const config = createDefaultAutoSaveConfig({ debounceMs: -100 });
    expect(shouldAutoSave(config)).toBe(false);
  });

  it('returns false when both disabled and debounceMs is 0', () => {
    const config = createDefaultAutoSaveConfig({ enabled: false, debounceMs: 0 });
    expect(shouldAutoSave(config)).toBe(false);
  });

  it('returns true with large debounceMs', () => {
    const config = createDefaultAutoSaveConfig({ debounceMs: 60_000 });
    expect(shouldAutoSave(config)).toBe(true);
  });

  it('returns true with debounceMs of 1', () => {
    const config = createDefaultAutoSaveConfig({ debounceMs: 1 });
    expect(shouldAutoSave(config)).toBe(true);
  });
});

// ========================================================================
// pruneHistory
// ========================================================================

describe('pruneHistory', () => {
  function makeSnapshot(ts: number): FilterStateSnapshot {
    return { filters: { ts }, timestamp: ts };
  }

  it('returns all entries when under the limit', () => {
    const config = createDefaultAutoSaveConfig({ maxHistoryEntries: 5 });
    const history = [makeSnapshot(1), makeSnapshot(2), makeSnapshot(3)];
    const pruned = pruneHistory(history, config);
    expect(pruned).toHaveLength(3);
  });

  it('returns all entries when exactly at the limit', () => {
    const config = createDefaultAutoSaveConfig({ maxHistoryEntries: 3 });
    const history = [makeSnapshot(1), makeSnapshot(2), makeSnapshot(3)];
    const pruned = pruneHistory(history, config);
    expect(pruned).toHaveLength(3);
  });

  it('trims oldest entries when over the limit', () => {
    const config = createDefaultAutoSaveConfig({ maxHistoryEntries: 2 });
    const history = [makeSnapshot(1), makeSnapshot(2), makeSnapshot(3), makeSnapshot(4)];
    const pruned = pruneHistory(history, config);
    expect(pruned).toHaveLength(2);
    expect(pruned[0].timestamp).toBe(3);
    expect(pruned[1].timestamp).toBe(4);
  });

  it('keeps only the most recent entries', () => {
    const config = createDefaultAutoSaveConfig({ maxHistoryEntries: 1 });
    const history = [makeSnapshot(10), makeSnapshot(20), makeSnapshot(30)];
    const pruned = pruneHistory(history, config);
    expect(pruned).toHaveLength(1);
    expect(pruned[0].timestamp).toBe(30);
  });

  it('returns empty array for empty history', () => {
    const config = createDefaultAutoSaveConfig({ maxHistoryEntries: 10 });
    const pruned = pruneHistory([], config);
    expect(pruned).toEqual([]);
  });

  it('defaults to 10 when maxHistoryEntries is undefined', () => {
    const config: FilterAutoSaveConfig = {
      enabled: true,
      debounceMs: 500,
      maxHistoryEntries: undefined,
    };
    const history = Array.from({ length: 15 }, (_, i) => makeSnapshot(i));
    const pruned = pruneHistory(history, config);
    expect(pruned).toHaveLength(10);
    expect(pruned[0].timestamp).toBe(5); // oldest 5 pruned
  });

  it('returns a new array (does not mutate original)', () => {
    const config = createDefaultAutoSaveConfig({ maxHistoryEntries: 5 });
    const history = [makeSnapshot(1), makeSnapshot(2)];
    const pruned = pruneHistory(history, config);
    expect(pruned).not.toBe(history);
    expect(pruned).toEqual(history);
  });

  it('handles maxHistoryEntries of 0', () => {
    const config = createDefaultAutoSaveConfig({ maxHistoryEntries: 0 });
    const history = [makeSnapshot(1), makeSnapshot(2)];
    const pruned = pruneHistory(history, config);
    expect(pruned).toHaveLength(0);
  });
});
