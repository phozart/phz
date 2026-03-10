import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from '../event-emitter.js';
import type { SortChangeEvent, FilterChangeEvent } from '../types/events.js';

describe('EventEmitter', () => {
  it('calls handler on emit', () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();
    emitter.on('sort:change', handler);
    emitter.emit('sort:change', {
      type: 'sort:change',
      timestamp: Date.now(),
      sort: { columns: [{ field: 'name', direction: 'asc' }] },
    } satisfies SortChangeEvent);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'sort:change' }),
    );
  });

  it('supports multiple handlers for the same event', () => {
    const emitter = new EventEmitter();
    const h1 = vi.fn();
    const h2 = vi.fn();
    emitter.on('sort:change', h1);
    emitter.on('sort:change', h2);
    emitter.emit('sort:change', {
      type: 'sort:change',
      timestamp: Date.now(),
      sort: { columns: [{ field: 'age', direction: 'desc' }] },
    } satisfies SortChangeEvent);
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes via returned function', () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();
    const unsub = emitter.on('sort:change', handler);
    unsub();
    emitter.emit('sort:change', {
      type: 'sort:change',
      timestamp: Date.now(),
      sort: { columns: [{ field: 'name', direction: 'asc' }] },
    } satisfies SortChangeEvent);
    expect(handler).not.toHaveBeenCalled();
  });

  it('off() removes a specific handler', () => {
    const emitter = new EventEmitter();
    const h1 = vi.fn();
    const h2 = vi.fn();
    emitter.on('sort:change', h1);
    emitter.on('sort:change', h2);
    emitter.off('sort:change', h1);
    emitter.emit('sort:change', {
      type: 'sort:change',
      timestamp: Date.now(),
      sort: { columns: [{ field: 'name', direction: 'asc' }] },
    } satisfies SortChangeEvent);
    expect(h1).not.toHaveBeenCalled();
    expect(h2).toHaveBeenCalledTimes(1);
  });

  it('off() is a no-op for unknown handler', () => {
    const emitter = new EventEmitter();
    emitter.off('sort:change', vi.fn());
  });

  it('once() fires handler only once', () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();
    emitter.once('sort:change', handler);
    const payload: SortChangeEvent = {
      type: 'sort:change',
      timestamp: Date.now(),
      sort: { columns: [{ field: 'name', direction: 'asc' }] },
    };
    emitter.emit('sort:change', payload);
    emitter.emit('sort:change', payload);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('once() can be unsubscribed before firing', () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();
    const unsub = emitter.once('sort:change', handler);
    unsub();
    emitter.emit('sort:change', {
      type: 'sort:change',
      timestamp: Date.now(),
      sort: { columns: [{ field: 'name', direction: 'asc' }] },
    } satisfies SortChangeEvent);
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not throw when emitting with no listeners', () => {
    const emitter = new EventEmitter();
    expect(() => {
      emitter.emit('sort:change', {
        type: 'sort:change',
        timestamp: Date.now(),
        sort: { columns: [{ field: 'name', direction: 'asc' }] },
      } satisfies SortChangeEvent);
    }).not.toThrow();
  });

  it('removeAllListeners clears all handlers', () => {
    const emitter = new EventEmitter();
    const h1 = vi.fn();
    const h2 = vi.fn();
    emitter.on('sort:change', h1);
    emitter.on('filter:change', h2);
    emitter.removeAllListeners();
    emitter.emit('sort:change', {
      type: 'sort:change',
      timestamp: Date.now(),
      sort: { columns: [{ field: 'name', direction: 'asc' }] },
    } satisfies SortChangeEvent);
    emitter.emit('filter:change', {
      type: 'filter:change',
      timestamp: Date.now(),
      filter: { filters: [], presets: {} },
    } satisfies FilterChangeEvent);
    expect(h1).not.toHaveBeenCalled();
    expect(h2).not.toHaveBeenCalled();
  });

  it('cleans up handler map when last handler is removed', () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();
    const unsub = emitter.on('sort:change', handler);
    unsub();
    expect((emitter as any).handlers.has('sort:change')).toBe(false);
  });

  it('cleans up handler map after once fires', () => {
    const emitter = new EventEmitter();
    emitter.once('sort:change', vi.fn());
    emitter.emit('sort:change', {
      type: 'sort:change',
      timestamp: Date.now(),
      sort: { columns: [{ field: 'name', direction: 'asc' }] },
    } satisfies SortChangeEvent);
    expect((emitter as any).handlers.has('sort:change')).toBe(false);
  });
});
