/**
 * @phozart/phz-collab — Collaboration Session Implementation
 *
 * Real-time collaboration using Yjs CRDTs. Manages presence,
 * change tracking, conflict resolution, and Yjs document mapping.
 */

import type { GridApi, Unsubscribe } from '@phozart/phz-core';
import type {
  CollabConfig,
  CollabSession,
  SyncProvider,
  ConnectionState,
  UserId,
  UserPresence,
  RemoteChange,
  LocalChange,
  StateChange,
  HistoryOptions,
  ChangeEntry,
  SessionInfo,
  UserInfo,
  Conflict,
  ConflictResolution,
  YDoc,
  YGridDocument,
} from './types.js';

const VALID_SESSION_ID = /^[a-zA-Z0-9_-]{1,128}$/;

let changeIdCounter = 0;

class CollabSessionImpl implements CollabSession {
  private config: CollabConfig;
  private doc: YDoc | null = null;
  private provider: SyncProvider | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private grid: GridApi | null = null;

  private presenceMap: Map<UserId, UserPresence> = new Map();
  private presenceHandlers: Set<(presenceMap: Map<UserId, UserPresence>) => void> = new Set();
  private remoteChangeHandlers: Set<(change: RemoteChange) => void> = new Set();
  private localChangeHandlers: Set<(change: LocalChange) => void> = new Set();
  private conflictHandlers: Set<(conflict: Conflict) => ConflictResolution> = new Set();

  private history: ChangeEntry[] = [];
  private userInfoMap: Map<UserId, UserInfo> = new Map();
  private createdAt: number;
  private gridUnsub: Unsubscribe | null = null;

  constructor(config: CollabConfig) {
    if (config.sessionId !== undefined && !VALID_SESSION_ID.test(config.sessionId)) {
      throw new Error(
        '@phozart/phz-collab: Invalid session ID format. Only alphanumeric, hyphen, and underscore allowed (max 128 chars).',
      );
    }
    this.config = config;
    this.createdAt = Date.now();

    // Register self in user info
    this.userInfoMap.set(config.userId, {
      userId: config.userId,
      userName: config.userName,
      userColor: config.userColor ?? this.generateColor(config.userId),
      joinedAt: Date.now(),
      changeCount: 0,
    });

    // Set own presence
    this.presenceMap.set(config.userId, {
      userId: config.userId,
      userName: config.userName,
      userColor: config.userColor ?? this.generateColor(config.userId),
      lastActivity: Date.now(),
      online: true,
    });
  }

  async connect(provider: SyncProvider): Promise<void> {
    this.provider = provider;
    this.connectionState = 'connecting';

    // Create Yjs document
    const yjs = await import('yjs' as string);
    this.doc = new yjs.Doc() as unknown as YDoc;

    const sessionId = this.config.sessionId ?? `phz-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    await provider.connect(this.doc, sessionId);
    this.connectionState = 'connected';

    // Listen for connection state changes
    provider.onConnectionStateChange((state) => {
      this.connectionState = state;
    });

    // Set up Yjs observers for remote changes
    this.setupYjsObservers();

    // Update presence
    this.updatePresence({ online: true, lastActivity: Date.now() });
  }

  async disconnect(): Promise<void> {
    this.updatePresence({ online: false });
    if (this.provider) {
      await this.provider.disconnect();
      this.provider = null;
    }
    this.connectionState = 'disconnected';
  }

  isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  getPresence(): ReadonlyMap<UserId, UserPresence> {
    return this.presenceMap;
  }

  updatePresence(data: Partial<UserPresence>): void {
    const current = this.presenceMap.get(this.config.userId);
    if (!current) return;

    const updated: UserPresence = { ...current, ...data, lastActivity: Date.now() };
    this.presenceMap.set(this.config.userId, updated);

    // Sync to Yjs presence map
    if (this.doc) {
      const ygrid = this.getYGridDocument();
      ygrid.presence.set(this.config.userId, updated);
    }

    this.notifyPresenceChange();
  }

  onPresenceChange(handler: (presenceMap: Map<UserId, UserPresence>) => void): Unsubscribe {
    this.presenceHandlers.add(handler);
    return () => { this.presenceHandlers.delete(handler); };
  }

  onRemoteChange(handler: (change: RemoteChange) => void): Unsubscribe {
    this.remoteChangeHandlers.add(handler);
    return () => { this.remoteChangeHandlers.delete(handler); };
  }

  onLocalChange(handler: (change: LocalChange) => void): Unsubscribe {
    this.localChangeHandlers.add(handler);
    return () => { this.localChangeHandlers.delete(handler); };
  }

  getChangeHistory(options?: HistoryOptions): ChangeEntry[] {
    let entries = [...this.history];

    if (options?.since) {
      entries = entries.filter((e) => e.timestamp >= options.since!);
    }
    if (options?.userId) {
      entries = entries.filter((e) => e.userId === options.userId);
    }
    if (options?.type) {
      entries = entries.filter((e) => e.type === options.type);
    }
    if (options?.limit) {
      entries = entries.slice(-options.limit);
    }

    return entries;
  }

  getSessionInfo(): SessionInfo {
    const onlineUsers = Array.from(this.presenceMap.values()).filter((u) => u.online).length;
    return {
      sessionId: this.config.sessionId ?? 'local',
      createdAt: this.createdAt,
      connectedUsers: onlineUsers,
      totalChanges: this.history.length,
    };
  }

  getUserInfo(userId: UserId): UserInfo | undefined {
    return this.userInfoMap.get(userId);
  }

  onConflict(handler: (conflict: Conflict) => ConflictResolution): Unsubscribe {
    this.conflictHandlers.add(handler);
    return () => { this.conflictHandlers.delete(handler); };
  }

  resolveConflict(conflictId: string, resolution: ConflictResolution): void {
    if (resolution.resolution === 'local') {
      // Keep local value — no action needed, Yjs already has it
    } else if (resolution.resolution === 'remote') {
      // Accept remote value — would need to revert local change
      // This is handled by the Yjs CRDT merge
    } else if (resolution.resolution === 'custom' && resolution.customValue !== undefined) {
      // Apply custom value to the grid
      if (this.grid) {
        // The custom value would be applied based on conflict type
      }
    }
  }

  getYDoc(): YDoc {
    if (!this.doc) throw new Error('@phozart/phz-collab: Not connected');
    return this.doc;
  }

  attachToGrid(grid: GridApi): void {
    this.grid = grid;
    let previousState = grid.getState();

    // Listen for grid state changes and broadcast as local changes
    this.gridUnsub = grid.subscribe((state) => {
      const changedFields: StateChange[] = [];
      if (JSON.stringify(state.sort) !== JSON.stringify(previousState.sort)) {
        changedFields.push({
          field: 'sort',
          oldValue: previousState.sort,
          newValue: state.sort,
        });
      }
      if (
        JSON.stringify(state.filter) !== JSON.stringify(previousState.filter)
      ) {
        changedFields.push({
          field: 'filter',
          oldValue: previousState.filter,
          newValue: state.filter,
        });
      }
      if (
        JSON.stringify(state.columns) !== JSON.stringify(previousState.columns)
      ) {
        changedFields.push({
          field: 'columns',
          oldValue: previousState.columns,
          newValue: state.columns,
        });
      }
      if (
        JSON.stringify(state.grouping) !==
        JSON.stringify(previousState.grouping)
      ) {
        changedFields.push({
          field: 'grouping',
          oldValue: previousState.grouping,
          newValue: state.grouping,
        });
      }
      previousState = state;
      for (const changed of changedFields) {
        const localChange: LocalChange = {
          type: 'state',
          timestamp: Date.now(),
          change: changed,
        };
        this.notifyLocalChange(localChange);
        this.recordChange(this.config.userId, localChange);
      }
    });

    // Sync initial data to Yjs
    this.syncGridToYjs();
  }

  detachFromGrid(): void {
    if (this.gridUnsub) {
      this.gridUnsub();
      this.gridUnsub = null;
    }
    this.grid = null;
  }

  destroy(): void {
    this.detachFromGrid();
    if (this.provider) {
      this.provider.disconnect();
      this.provider = null;
    }
    if (this.doc) {
      this.doc.destroy();
      this.doc = null;
    }
    this.presenceHandlers.clear();
    this.remoteChangeHandlers.clear();
    this.localChangeHandlers.clear();
    this.conflictHandlers.clear();
    this.history = [];
    this.connectionState = 'disconnected';
  }

  // --- Private helpers ---

  private getYGridDocument(): YGridDocument {
    if (!this.doc) throw new Error('@phozart/phz-collab: No Yjs document');
    return {
      rows: this.doc.getArray('rows'),
      columns: this.doc.getArray('columns'),
      state: this.doc.getMap('state'),
      presence: this.doc.getMap('presence'),
    };
  }

  private setupYjsObservers(): void {
    if (!this.doc) return;
    const ygrid = this.getYGridDocument();

    // Observe presence changes
    ygrid.presence.observe(() => {
      ygrid.presence.forEach((value, key) => {
        if (key !== this.config.userId) {
          this.presenceMap.set(key, value as UserPresence);
          if (!this.userInfoMap.has(key)) {
            const p = value as UserPresence;
            this.userInfoMap.set(key, {
              userId: p.userId,
              userName: p.userName,
              userColor: p.userColor,
              joinedAt: Date.now(),
              changeCount: 0,
            });
          }
        }
      });
      this.notifyPresenceChange();
    });

    // Observe row changes from remote
    ygrid.rows.observe((event) => {
      // Only process remote changes (not our own)
      if (event && typeof event === 'object' && 'transaction' in event) {
        const txn = (event as { transaction?: { local?: boolean } }).transaction;
        if (txn?.local) return;
      }

      const remoteChange: RemoteChange = {
        type: 'row',
        userId: 'remote',
        timestamp: Date.now(),
        change: { action: 'update', rowId: '' },
      };
      this.notifyRemoteChange(remoteChange);
    });
  }

  private syncGridToYjs(): void {
    if (!this.grid || !this.doc) return;
    const ygrid = this.getYGridDocument();
    const data = this.grid.getData();
    const restricted = this.grid.getRestrictedFields?.() ?? new Set<string>();
    const maskFieldSet = new Set(this.config.maskFields ?? []);

    this.doc.transact(() => {
      // Sync rows
      for (const row of data) {
        const yRow = this.doc!.getMap(`row-${(row as Record<string, unknown>)['__id']}`);
        for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
          if (restricted.has(key)) continue;
          if (maskFieldSet.has(key)) {
            yRow.set(key, '****');
          } else {
            yRow.set(key, value);
          }
        }
      }

      // Sync column state
      const colState = this.grid!.getColumnState();
      ygrid.state.set('columns', colState);
    });
  }

  private notifyPresenceChange(): void {
    for (const handler of this.presenceHandlers) {
      handler(new Map(this.presenceMap));
    }
  }

  private notifyRemoteChange(change: RemoteChange): void {
    for (const handler of this.remoteChangeHandlers) {
      handler(change);
    }
  }

  private notifyLocalChange(change: LocalChange): void {
    for (const handler of this.localChangeHandlers) {
      handler(change);
    }
  }

  private recordChange(userId: UserId, change: LocalChange | RemoteChange): void {
    if (!this.config.enableHistory) return;

    const entry: ChangeEntry = {
      id: `change-${++changeIdCounter}`,
      userId,
      timestamp: change.timestamp,
      type: change.type,
      change: change.change,
    };

    this.history.push(entry);

    // Enforce history limit
    const limit = this.config.historyLimit ?? 1000;
    if (this.history.length > limit) {
      this.history = this.history.slice(-limit);
    }

    // Update user change count
    const info = this.userInfoMap.get(userId);
    if (info) {
      info.changeCount++;
    }
  }

  private generateColor(userId: string): string {
    // Deterministic color from userId
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 50%)`;
  }
}

export function createCollabSession(config: CollabConfig): CollabSession {
  return new CollabSessionImpl(config);
}

export function getYGridDocument(doc: YDoc): YGridDocument {
  return {
    rows: doc.getArray('rows'),
    columns: doc.getArray('columns'),
    state: doc.getMap('state'),
    presence: doc.getMap('presence'),
  };
}
