/**
 * @phozart/phz-collab — Real-time Collaboration
 *
 * Yjs CRDT-based collaboration for phz-grid.
 * Provides presence awareness, change tracking, conflict resolution,
 * and multiple sync providers (WebSocket, WebRTC).
 */
// Factory
export { createCollabSession, getYGridDocument } from './collab-session.js';
// Sync Providers
export { WebSocketSyncProvider, WebRTCSyncProvider } from './sync-providers.js';
//# sourceMappingURL=index.js.map