/**
 * TDD RED — Tiered Attention for State Changes (Item 6.8)
 *
 * Tests for priority-based state change scheduling:
 * - Immediate: synchronous or RAF (scroll)
 * - Deferred: queueMicrotask (filter/sort) — current default
 * - Background: requestIdleCallback (theme/responsive)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StateManager, createInitialState } from '../state.js';

const columns = [{ field: 'name', header: 'Name' }, { field: 'age', header: 'Age' }];

describe('Tiered Attention — StatePriority', () => {
  let sm: StateManager;

  beforeEach(() => {
    sm = new StateManager(createInitialState(columns));
  });

  afterEach(() => {
    sm.destroy();
  });

  it('setState accepts optional priority parameter', () => {
    // Should not throw — priority is optional
    sm.setState({ sort: { columns: [{ field: 'name', direction: 'asc' }] } }, { priority: 'deferred' });
    expect(sm.getState().sort.columns).toHaveLength(1);
  });

  it('immediate priority fires synchronously (no microtask deferral)', async () => {
    const calls: string[] = [];
    sm.subscribe(() => calls.push('notified'));

    sm.setState(
      { scroll: { scrollTop: 100, scrollLeft: 0, direction: 'down' } },
      { priority: 'immediate' },
    );

    // Immediate should fire synchronously — no await needed
    expect(calls).toContain('notified');
  });

  it('deferred priority fires via microtask (default behavior)', async () => {
    const calls: string[] = [];
    sm.subscribe(() => calls.push('notified'));

    sm.setState(
      { sort: { columns: [{ field: 'name', direction: 'asc' }] } },
      { priority: 'deferred' },
    );

    // Not yet notified synchronously
    expect(calls).toHaveLength(0);

    // After microtask
    await Promise.resolve();
    expect(calls).toContain('notified');
  });

  it('default priority (no option) behaves as deferred', async () => {
    const calls: string[] = [];
    sm.subscribe(() => calls.push('notified'));

    sm.setState({ sort: { columns: [{ field: 'name', direction: 'asc' }] } });

    expect(calls).toHaveLength(0);
    await Promise.resolve();
    expect(calls).toContain('notified');
  });

  it('background priority fires after deferred', async () => {
    const order: string[] = [];

    sm.subscribe((state) => {
      if (state.theme.name !== 'default') {
        order.push('background');
      }
      if (state.sort.columns.length > 0) {
        order.push('deferred');
      }
    });

    // Set background first, then deferred
    sm.setState(
      { theme: { ...sm.getState().theme, name: 'dark' } },
      { priority: 'background' },
    );
    sm.setState(
      { sort: { columns: [{ field: 'name', direction: 'asc' }] } },
      { priority: 'deferred' },
    );

    // Deferred fires first (microtask), background fires later
    await Promise.resolve();
    // After microtask, deferred should have fired
    expect(order).toContain('deferred');

    // Background fires eventually (we simulate requestIdleCallback)
    await new Promise(r => setTimeout(r, 50));
    expect(order).toContain('background');
  });

  it('selector subscriptions respect priority', async () => {
    const calls: string[] = [];

    sm.subscribeSelector(
      (s) => s.sort.columns.length,
      (next) => calls.push(`sort:${next}`),
    );

    sm.setState(
      { sort: { columns: [{ field: 'name', direction: 'asc' }] } },
      { priority: 'deferred' },
    );

    expect(calls).toHaveLength(0);
    await Promise.resolve();
    expect(calls).toEqual(['sort:1']);
  });

  it('immediate priority still deduplicates within same tick', () => {
    let count = 0;
    sm.subscribe(() => count++);

    sm.setState(
      { scroll: { scrollTop: 100, scrollLeft: 0, direction: 'down' } },
      { priority: 'immediate' },
    );
    sm.setState(
      { scroll: { scrollTop: 200, scrollLeft: 0, direction: 'down' } },
      { priority: 'immediate' },
    );

    // Two immediate calls should both notify (they're synchronous)
    expect(count).toBe(2);
  });

  it('batch still works with priorities', async () => {
    let count = 0;
    sm.subscribe(() => count++);

    sm.batch(() => {
      sm.setState({ sort: { columns: [{ field: 'name', direction: 'asc' }] } });
      sm.setState({ sort: { columns: [{ field: 'age', direction: 'desc' }] } });
    });

    await Promise.resolve();
    expect(count).toBe(1); // Only one notification for batch
  });

  it('getPendingPriorities returns currently scheduled tiers', async () => {
    sm.setState(
      { sort: { columns: [{ field: 'name', direction: 'asc' }] } },
      { priority: 'deferred' },
    );

    // Before microtask fires, there should be a pending deferred
    const pending = sm.getPendingPriorities();
    expect(pending).toContain('deferred');

    await Promise.resolve();
    const afterPending = sm.getPendingPriorities();
    expect(afterPending).not.toContain('deferred');
  });
});
