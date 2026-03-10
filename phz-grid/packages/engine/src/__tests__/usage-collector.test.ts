/**
 * Tests for Usage Analytics Collector (C-2.08)
 */
import { describe, it, expect } from 'vitest';
import {
  createUsageCollector,
  trackEvent,
  shouldFlush,
  flush,
  setCollecting,
  getBufferedCount,
} from '../analytics/usage-collector.js';

describe('createUsageCollector', () => {
  it('creates default state', () => {
    const state = createUsageCollector();
    expect(state.buffer).toEqual([]);
    expect(state.bufferSize).toBe(50);
    expect(state.flushIntervalMs).toBe(30_000);
    expect(state.collecting).toBe(true);
  });

  it('accepts custom config', () => {
    const state = createUsageCollector({ bufferSize: 10, flushIntervalMs: 5000 });
    expect(state.bufferSize).toBe(10);
    expect(state.flushIntervalMs).toBe(5000);
  });
});

describe('trackEvent', () => {
  it('adds an event to the buffer', () => {
    let state = createUsageCollector();
    state = trackEvent(state, 'page-view', { page: '/dashboard' });
    expect(state.buffer).toHaveLength(1);
    expect(state.buffer[0].type).toBe('page-view');
    expect(state.buffer[0].data).toEqual({ page: '/dashboard' });
    expect(state.buffer[0].timestamp).toBeGreaterThan(0);
  });

  it('defaults data to empty object', () => {
    let state = createUsageCollector();
    state = trackEvent(state, 'session-start');
    expect(state.buffer[0].data).toEqual({});
  });

  it('drops events when collecting is disabled', () => {
    let state = createUsageCollector();
    state = setCollecting(state, false);
    state = trackEvent(state, 'page-view');
    expect(state.buffer).toHaveLength(0);
  });

  it('accumulates multiple events', () => {
    let state = createUsageCollector();
    state = trackEvent(state, 'event-1');
    state = trackEvent(state, 'event-2');
    state = trackEvent(state, 'event-3');
    expect(state.buffer).toHaveLength(3);
  });
});

describe('shouldFlush', () => {
  it('returns false when buffer is below capacity', () => {
    const state = createUsageCollector({ bufferSize: 5 });
    expect(shouldFlush(state)).toBe(false);
  });

  it('returns true when buffer reaches capacity', () => {
    let state = createUsageCollector({ bufferSize: 3 });
    state = trackEvent(state, 'e1');
    state = trackEvent(state, 'e2');
    state = trackEvent(state, 'e3');
    expect(shouldFlush(state)).toBe(true);
  });

  it('returns true when buffer exceeds capacity', () => {
    let state = createUsageCollector({ bufferSize: 2 });
    state = trackEvent(state, 'e1');
    state = trackEvent(state, 'e2');
    state = trackEvent(state, 'e3');
    expect(shouldFlush(state)).toBe(true);
  });
});

describe('flush', () => {
  it('returns empty buffer and flushed events', () => {
    let state = createUsageCollector();
    state = trackEvent(state, 'e1');
    state = trackEvent(state, 'e2');

    const { flushed, events } = flush(state);
    expect(flushed.buffer).toEqual([]);
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe('e1');
    expect(events[1].type).toBe('e2');
  });

  it('handles empty buffer', () => {
    const state = createUsageCollector();
    const { flushed, events } = flush(state);
    expect(flushed.buffer).toEqual([]);
    expect(events).toEqual([]);
  });

  it('preserves other state properties', () => {
    let state = createUsageCollector({ bufferSize: 10, flushIntervalMs: 5000 });
    state = trackEvent(state, 'e1');
    const { flushed } = flush(state);
    expect(flushed.bufferSize).toBe(10);
    expect(flushed.flushIntervalMs).toBe(5000);
    expect(flushed.collecting).toBe(true);
  });
});

describe('setCollecting', () => {
  it('enables collecting', () => {
    let state = createUsageCollector();
    state = setCollecting(state, false);
    state = setCollecting(state, true);
    expect(state.collecting).toBe(true);
  });

  it('disables collecting', () => {
    let state = createUsageCollector();
    state = setCollecting(state, false);
    expect(state.collecting).toBe(false);
  });
});

describe('getBufferedCount', () => {
  it('returns 0 for empty buffer', () => {
    const state = createUsageCollector();
    expect(getBufferedCount(state)).toBe(0);
  });

  it('returns the number of buffered events', () => {
    let state = createUsageCollector();
    state = trackEvent(state, 'e1');
    state = trackEvent(state, 'e2');
    expect(getBufferedCount(state)).toBe(2);
  });
});
