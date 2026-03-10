/**
 * @phozart/phz-collab — Real-time Collaboration
 *
 * Yjs CRDT-based collaboration for phz-grid.
 * Provides presence awareness, change tracking, conflict resolution,
 * and multiple sync providers (WebSocket, WebRTC).
 */

// Types
export type {
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
  YArray,
  YMap,
  YGridDocument,
} from './types.js';

// Factory
export { createCollabSession, getYGridDocument } from './collab-session.js';

// Sync Providers
export { WebSocketSyncProvider, WebRTCSyncProvider } from './sync-providers.js';
