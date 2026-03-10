import { describe, it, expect, vi } from 'vitest';
import { RealtimeManager } from '../realtime-manager.js';
import type {
  RealtimeProvider,
  DataUpdate,
  DataUpdateHandler,
  RealtimeConnectionState,
} from '../types/server.js';

type TestRow = { id: string; name: string; age: number };

function createMockProvider(): RealtimeProvider<TestRow> & {
  emit: (update: DataUpdate<TestRow>) => void;
  setConnectionState: (state: RealtimeConnectionState) => void;
} {
  let handler: DataUpdateHandler<TestRow> | null = null;
  let stateHandler: ((state: RealtimeConnectionState) => void) | null = null;
  let connectionState: RealtimeConnectionState = 'connected';

  return {
    subscribe(h: DataUpdateHandler<TestRow>) {
      handler = h;
      return () => {
        handler = null;
      };
    },
    getConnectionState: () => connectionState,
    onConnectionStateChange(h: (state: RealtimeConnectionState) => void) {
      stateHandler = h;
      return () => {
        stateHandler = null;
      };
    },
    emit(update: DataUpdate<TestRow>) {
      handler?.(update);
    },
    setConnectionState(state: RealtimeConnectionState) {
      connectionState = state;
      stateHandler?.(state);
    },
  };
}

describe('WI 22: RealtimeManager — delta application (insert)', () => {
  it('applies insert update to data', () => {
    const provider = createMockProvider();
    const onInsert = vi.fn();
    const manager = new RealtimeManager(provider, { onInsert });

    manager.start();

    provider.emit({
      type: 'insert',
      rowId: 'row-1',
      data: { id: 'row-1', name: 'Alice', age: 30 },
      timestamp: Date.now(),
      sequence: 1,
    });

    expect(onInsert).toHaveBeenCalledWith(
      'row-1',
      expect.objectContaining({ name: 'Alice' }),
    );
  });
});

describe('WI 22: RealtimeManager — delta application (update)', () => {
  it('applies update delta', () => {
    const provider = createMockProvider();
    const onUpdate = vi.fn();
    const manager = new RealtimeManager(provider, { onUpdate });

    manager.start();

    provider.emit({
      type: 'update',
      rowId: 'row-1',
      delta: { name: 'Bob' },
      timestamp: Date.now(),
      sequence: 1,
    });

    expect(onUpdate).toHaveBeenCalledWith('row-1', { name: 'Bob' });
  });
});

describe('WI 22: RealtimeManager — delta application (delete)', () => {
  it('applies delete', () => {
    const provider = createMockProvider();
    const onDelete = vi.fn();
    const manager = new RealtimeManager(provider, { onDelete });

    manager.start();

    provider.emit({
      type: 'delete',
      rowId: 'row-1',
      timestamp: Date.now(),
      sequence: 1,
    });

    expect(onDelete).toHaveBeenCalledWith('row-1');
  });
});

describe('WI 22: RealtimeManager — delta application (refresh)', () => {
  it('triggers full refresh', () => {
    const provider = createMockProvider();
    const onRefresh = vi.fn();
    const manager = new RealtimeManager(provider, { onRefresh });

    manager.start();

    provider.emit({
      type: 'refresh',
      timestamp: Date.now(),
      sequence: 1,
    });

    expect(onRefresh).toHaveBeenCalled();
  });
});

describe('WI 22: RealtimeManager — sequence gap detection', () => {
  it('detects sequence gaps and triggers refresh', () => {
    const provider = createMockProvider();
    const onRefresh = vi.fn();
    const onUpdate = vi.fn();
    const manager = new RealtimeManager(provider, { onUpdate, onRefresh });

    manager.start();

    // Sequence 1
    provider.emit({
      type: 'update',
      rowId: 'row-1',
      delta: { name: 'A' },
      timestamp: Date.now(),
      sequence: 1,
    });

    // Skip sequence 2, jump to 3 — gap detected
    provider.emit({
      type: 'update',
      rowId: 'row-2',
      delta: { name: 'B' },
      timestamp: Date.now(),
      sequence: 3,
    });

    expect(onRefresh).toHaveBeenCalled();
  });

  it('does not trigger refresh for consecutive sequences', () => {
    const provider = createMockProvider();
    const onRefresh = vi.fn();
    const onUpdate = vi.fn();
    const manager = new RealtimeManager(provider, { onUpdate, onRefresh });

    manager.start();

    provider.emit({
      type: 'update',
      rowId: 'row-1',
      delta: { name: 'A' },
      timestamp: Date.now(),
      sequence: 1,
    });

    provider.emit({
      type: 'update',
      rowId: 'row-2',
      delta: { name: 'B' },
      timestamp: Date.now(),
      sequence: 2,
    });

    expect(onRefresh).not.toHaveBeenCalled();
    expect(onUpdate).toHaveBeenCalledTimes(2);
  });
});

describe('WI 22: RealtimeManager — connection state', () => {
  it('tracks connection state transitions', () => {
    const provider = createMockProvider();
    const onConnectionChange = vi.fn();
    const manager = new RealtimeManager(provider, { onConnectionChange });

    manager.start();

    expect(manager.getConnectionState()).toBe('connected');

    provider.setConnectionState('disconnected');
    expect(onConnectionChange).toHaveBeenCalledWith('disconnected');
    expect(manager.getConnectionState()).toBe('disconnected');

    provider.setConnectionState('connecting');
    expect(onConnectionChange).toHaveBeenCalledWith('connecting');
  });

  it('triggers refresh on reconnect', () => {
    const provider = createMockProvider();
    const onRefresh = vi.fn();
    const manager = new RealtimeManager(provider, { onRefresh });

    manager.start();

    provider.setConnectionState('disconnected');
    provider.setConnectionState('connecting');
    provider.setConnectionState('connected');

    // Reconnection should trigger a full refresh
    expect(onRefresh).toHaveBeenCalled();
  });
});

describe('WI 22: RealtimeManager — lifecycle', () => {
  it('stop() unsubscribes from provider', () => {
    const provider = createMockProvider();
    const onUpdate = vi.fn();
    const manager = new RealtimeManager(provider, { onUpdate });

    manager.start();
    manager.stop();

    // Events after stop should be ignored
    provider.emit({
      type: 'update',
      rowId: 'row-1',
      delta: { name: 'X' },
      timestamp: Date.now(),
      sequence: 1,
    });

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('can restart after stop', () => {
    const provider = createMockProvider();
    const onUpdate = vi.fn();
    const manager = new RealtimeManager(provider, { onUpdate });

    manager.start();
    manager.stop();
    manager.start();

    provider.emit({
      type: 'update',
      rowId: 'row-1',
      delta: { name: 'X' },
      timestamp: Date.now(),
      sequence: 1,
    });

    expect(onUpdate).toHaveBeenCalledTimes(1);
  });
});
