import { describe, it, expect, vi } from 'vitest';
import { createWidgetRegistry } from '../registry/widget-registry.js';

describe('WidgetRegistry', () => {
  it('registers and retrieves a sync renderer', () => {
    const registry = createWidgetRegistry();
    const renderer = { type: 'bar-chart', render: vi.fn() };
    registry.register('bar-chart', renderer);
    expect(registry.has('bar-chart')).toBe(true);
    expect(registry.get('bar-chart')).toBe(renderer);
  });

  it('registers a lazy renderer via factory', async () => {
    const registry = createWidgetRegistry();
    const renderer = { type: 'custom', render: vi.fn() };
    registry.register('custom', () => Promise.resolve(renderer));
    expect(registry.has('custom')).toBe(true);
    const resolved = await registry.resolve('custom');
    expect(resolved).toBe(renderer);
  });

  it('returns undefined for unknown types', () => {
    const registry = createWidgetRegistry();
    expect(registry.get('nonexistent')).toBeUndefined();
    expect(registry.has('nonexistent')).toBe(false);
  });

  it('lists all registered types', () => {
    const registry = createWidgetRegistry();
    registry.register('a', { type: 'a', render: vi.fn() });
    registry.register('b', { type: 'b', render: vi.fn() });
    expect(registry.list()).toEqual(['a', 'b']);
  });

  it('allows overriding a registered renderer', () => {
    const registry = createWidgetRegistry();
    const r1 = { type: 'bar-chart', render: vi.fn() };
    const r2 = { type: 'bar-chart', render: vi.fn() };
    registry.register('bar-chart', r1);
    registry.register('bar-chart', r2);
    expect(registry.get('bar-chart')).toBe(r2);
  });

  it('resolve() returns undefined for unknown lazy type', async () => {
    const registry = createWidgetRegistry();
    const result = await registry.resolve('missing');
    expect(result).toBeUndefined();
  });

  it('resolve() caches lazy-loaded renderers', async () => {
    const registry = createWidgetRegistry();
    const renderer = { type: 'lazy', render: vi.fn() };
    const factory = vi.fn(() => Promise.resolve(renderer));
    registry.register('lazy', factory);

    await registry.resolve('lazy');
    await registry.resolve('lazy');
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('resolve() works for sync renderers', async () => {
    const registry = createWidgetRegistry();
    const renderer = { type: 'sync', render: vi.fn() };
    registry.register('sync', renderer);
    const resolved = await registry.resolve('sync');
    expect(resolved).toBe(renderer);
  });

  it('get() returns undefined for lazy renderer not yet resolved', () => {
    const registry = createWidgetRegistry();
    const renderer = { type: 'lazy', render: vi.fn() };
    registry.register('lazy', () => Promise.resolve(renderer));
    expect(registry.get('lazy')).toBeUndefined();
  });
});
