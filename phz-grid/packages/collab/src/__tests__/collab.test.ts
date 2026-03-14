/**
 * @phozart/collab — Unit Tests
 *
 * Tests for type exports, factory function, session behavior,
 * and sync provider classes.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createCollabSession,
  getYGridDocument,
  WebSocketSyncProvider,
  WebRTCSyncProvider,
} from '../index.js';
import type {
  CollabConfig,
  CollabSession,
  ConflictStrategy,
  SyncProvider,
  ConnectionState,
  UserId,
  UserPresence,
  RemoteChange,
  LocalChange,
  CellChange,
  RowChange,
  ColumnChange,
  StateChange,
  HistoryOptions,
  ChangeEntry,
  SessionInfo,
  UserInfo,
  Conflict,
  ConflictResolution,
  WebSocketSyncConfig,
  WebRTCSyncConfig,
  YDoc,
  YGridDocument,
} from '../index.js';

describe('@phozart/collab', () => {
  describe('type exports', () => {
    it('exports createCollabSession factory', () => {
      expect(createCollabSession).toBeDefined();
      expect(typeof createCollabSession).toBe('function');
    });

    it('exports getYGridDocument function', () => {
      expect(getYGridDocument).toBeDefined();
      expect(typeof getYGridDocument).toBe('function');
    });

    it('exports sync provider classes', () => {
      expect(WebSocketSyncProvider).toBeDefined();
      expect(WebRTCSyncProvider).toBeDefined();
    });

    it('CollabConfig type is usable', () => {
      const config: CollabConfig = {
        sessionId: 'test-session',
        userId: 'user-1',
        userName: 'Alice',
        userColor: '#ff0000',
        conflictResolution: 'last-write-wins',
        enablePresence: true,
        enableHistory: true,
        historyLimit: 500,
      };
      expect(config.conflictResolution).toBe('last-write-wins');
    });

    it('ConflictStrategy covers all options', () => {
      const strategies: ConflictStrategy[] = ['last-write-wins', 'manual', 'custom'];
      expect(strategies).toHaveLength(3);
    });

    it('ConnectionState covers all states', () => {
      const states: ConnectionState[] = ['disconnected', 'connecting', 'connected', 'reconnecting', 'error'];
      expect(states).toHaveLength(5);
    });

    it('UserPresence type is usable', () => {
      const presence: UserPresence = {
        userId: 'user-1',
        userName: 'Alice',
        userColor: '#ff0000',
        cursor: { rowId: 'row-1', field: 'name' },
        selection: [{ rowId: 'row-1', field: 'name' }],
        editing: { rowId: 'row-2', field: 'value' },
        lastActivity: Date.now(),
        online: true,
      };
      expect(presence.online).toBe(true);
    });

    it('RemoteChange type is usable', () => {
      const change: RemoteChange = {
        type: 'cell',
        userId: 'user-2',
        timestamp: Date.now(),
        change: {
          position: { rowId: 'row-1', field: 'name' },
          oldValue: 'Alice',
          newValue: 'Bob',
        },
      };
      expect(change.type).toBe('cell');
    });

    it('Conflict type is usable', () => {
      const conflict: Conflict = {
        id: 'conflict-1',
        type: 'cell',
        position: { rowId: 'row-1', field: 'name' },
        localValue: 'Alice',
        remoteValue: 'Bob',
        localUserId: 'user-1',
        remoteUserId: 'user-2',
        timestamp: Date.now(),
      };
      expect(conflict.type).toBe('cell');
    });

    it('ConflictResolution type is usable', () => {
      const resolutions: ConflictResolution[] = [
        { conflictId: '1', resolution: 'local' },
        { conflictId: '2', resolution: 'remote' },
        { conflictId: '3', resolution: 'merge' },
        { conflictId: '4', resolution: 'custom', customValue: 'merged value' },
      ];
      expect(resolutions).toHaveLength(4);
    });
  });

  describe('createCollabSession', () => {
    const defaultConfig: CollabConfig = {
      userId: 'user-1',
      userName: 'Alice',
      enablePresence: true,
      enableHistory: true,
    };

    it('creates a session instance', () => {
      const session = createCollabSession(defaultConfig);
      expect(session).toBeDefined();
      expect(typeof session.connect).toBe('function');
      expect(typeof session.disconnect).toBe('function');
      expect(typeof session.isConnected).toBe('function');
      expect(typeof session.getConnectionState).toBe('function');
      expect(typeof session.getPresence).toBe('function');
      expect(typeof session.updatePresence).toBe('function');
      expect(typeof session.onPresenceChange).toBe('function');
      expect(typeof session.onRemoteChange).toBe('function');
      expect(typeof session.onLocalChange).toBe('function');
      expect(typeof session.getChangeHistory).toBe('function');
      expect(typeof session.getSessionInfo).toBe('function');
      expect(typeof session.getUserInfo).toBe('function');
      expect(typeof session.onConflict).toBe('function');
      expect(typeof session.resolveConflict).toBe('function');
      expect(typeof session.getYDoc).toBe('function');
      expect(typeof session.attachToGrid).toBe('function');
      expect(typeof session.detachFromGrid).toBe('function');
      expect(typeof session.destroy).toBe('function');
    });

    it('starts disconnected', () => {
      const session = createCollabSession(defaultConfig);
      expect(session.isConnected()).toBe(false);
      expect(session.getConnectionState()).toBe('disconnected');
    });

    it('throws when accessing YDoc before connect', () => {
      const session = createCollabSession(defaultConfig);
      expect(() => session.getYDoc()).toThrow('Not connected');
    });

    it('has own presence on creation', () => {
      const session = createCollabSession(defaultConfig);
      const presence = session.getPresence();
      expect(presence.size).toBe(1);
      expect(presence.get('user-1')?.userName).toBe('Alice');
      expect(presence.get('user-1')?.online).toBe(true);
    });

    it('returns user info', () => {
      const session = createCollabSession(defaultConfig);
      const info = session.getUserInfo('user-1');
      expect(info).toBeDefined();
      expect(info?.userName).toBe('Alice');
      expect(info?.changeCount).toBe(0);
    });

    it('returns undefined for unknown user', () => {
      const session = createCollabSession(defaultConfig);
      expect(session.getUserInfo('unknown')).toBeUndefined();
    });

    it('returns session info', () => {
      const session = createCollabSession(defaultConfig);
      const info = session.getSessionInfo();
      expect(info.connectedUsers).toBe(1);
      expect(info.totalChanges).toBe(0);
    });

    it('onPresenceChange returns unsubscribe', () => {
      const session = createCollabSession(defaultConfig);
      const handler = vi.fn();
      const unsub = session.onPresenceChange(handler);
      expect(typeof unsub).toBe('function');
      unsub();
    });

    it('onRemoteChange returns unsubscribe', () => {
      const session = createCollabSession(defaultConfig);
      const handler = vi.fn();
      const unsub = session.onRemoteChange(handler);
      expect(typeof unsub).toBe('function');
      unsub();
    });

    it('onLocalChange returns unsubscribe', () => {
      const session = createCollabSession(defaultConfig);
      const handler = vi.fn();
      const unsub = session.onLocalChange(handler);
      expect(typeof unsub).toBe('function');
      unsub();
    });

    it('onConflict returns unsubscribe', () => {
      const session = createCollabSession(defaultConfig);
      const handler = vi.fn().mockReturnValue({ conflictId: '', resolution: 'local' as const });
      const unsub = session.onConflict(handler);
      expect(typeof unsub).toBe('function');
      unsub();
    });

    it('getChangeHistory returns empty initially', () => {
      const session = createCollabSession(defaultConfig);
      expect(session.getChangeHistory()).toEqual([]);
    });

    it('getChangeHistory respects options', () => {
      const session = createCollabSession(defaultConfig);
      const history = session.getChangeHistory({ limit: 10, type: 'cell' });
      expect(history).toEqual([]);
    });

    it('generates deterministic color from userId', () => {
      const session1 = createCollabSession({ userId: 'user-1', userName: 'Alice' });
      const session2 = createCollabSession({ userId: 'user-1', userName: 'Bob' });
      const color1 = session1.getPresence().get('user-1')?.userColor;
      const color2 = session2.getPresence().get('user-1')?.userColor;
      expect(color1).toBe(color2);
      expect(color1).toMatch(/^hsl\(\d+, 70%, 50%\)$/);
    });

    it('uses provided userColor over generated', () => {
      const session = createCollabSession({
        userId: 'user-1',
        userName: 'Alice',
        userColor: '#custom',
      });
      expect(session.getPresence().get('user-1')?.userColor).toBe('#custom');
    });

    it('destroy cleans up', () => {
      const session = createCollabSession(defaultConfig);
      session.destroy();
      expect(session.isConnected()).toBe(false);
      expect(session.getConnectionState()).toBe('disconnected');
    });
  });

  describe('WebSocketSyncProvider', () => {
    it('has correct name', () => {
      const provider = new WebSocketSyncProvider({ url: 'ws://localhost:1234' });
      expect(provider.name).toBe('websocket');
    });

    it('starts disconnected', () => {
      const provider = new WebSocketSyncProvider({ url: 'ws://localhost:1234' });
      expect(provider.isConnected()).toBe(false);
    });

    it('onConnectionStateChange returns unsubscribe', () => {
      const provider = new WebSocketSyncProvider({ url: 'ws://localhost:1234' });
      const handler = vi.fn();
      const unsub = provider.onConnectionStateChange(handler);
      expect(typeof unsub).toBe('function');
      unsub();
    });
  });

  describe('WebRTCSyncProvider', () => {
    it('has correct name', () => {
      const provider = new WebRTCSyncProvider({ signalingServer: 'ws://localhost:5678' });
      expect(provider.name).toBe('webrtc');
    });

    it('starts disconnected', () => {
      const provider = new WebRTCSyncProvider({ signalingServer: 'ws://localhost:5678' });
      expect(provider.isConnected()).toBe(false);
    });

    it('onConnectionStateChange returns unsubscribe', () => {
      const provider = new WebRTCSyncProvider({ signalingServer: 'ws://localhost:5678' });
      const handler = vi.fn();
      const unsub = provider.onConnectionStateChange(handler);
      expect(typeof unsub).toBe('function');
      unsub();
    });
  });

  describe('does not re-export core (tree-shaking fix)', () => {
    it('core symbols are not re-exported', async () => {
      const mod = await import('../index.js');
      expect((mod as any).createGrid).toBeUndefined();
      expect((mod as any).EventEmitter).toBeUndefined();
    });
  });
});
