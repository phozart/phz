# @phozart/collab

Real-time collaboration for phz-grid. Built on Yjs CRDTs, provides presence awareness, change tracking, conflict resolution, and multiple sync providers (WebSocket, WebRTC).

## Installation

```bash
npm install @phozart/collab @phozart/core
```

**Peer dependency:** `yjs ^13.0.0`

## Quick Start

```ts
import { createCollabSession, WebSocketSyncProvider } from '@phozart/collab';
import { createGrid } from '@phozart/core';

const grid = createGrid({ columns, data });

// Create a collaboration session
const session = createCollabSession({
  gridApi: grid,
  documentId: 'my-spreadsheet',
  userId: 'user-123',
  userName: 'Alice',
  syncProvider: new WebSocketSyncProvider({
    url: 'wss://collab.example.com',
    room: 'my-spreadsheet',
  }),
});

// Connect
await session.connect();

// Listen for presence changes
session.on('presence:change', (users) => {
  console.log('Active users:', users);
});

// Listen for remote changes
session.on('remote:change', (change) => {
  console.log('Remote change:', change);
});

// Disconnect when done
session.disconnect();
```

## Sync Providers

### WebSocket

```ts
import { WebSocketSyncProvider } from '@phozart/collab';

const provider = new WebSocketSyncProvider({
  url: 'wss://collab.example.com',
  room: 'document-id',
  // Optional
  params: { token: 'auth-token' },
});
```

### WebRTC

```ts
import { WebRTCSyncProvider } from '@phozart/collab';

const provider = new WebRTCSyncProvider({
  room: 'document-id',
  signaling: ['wss://signaling.example.com'],
  // Optional
  password: 'room-password',
  maxPeers: 10,
});
```

## API

### `createCollabSession(config): CollabSession`

Creates a collaboration session that syncs grid state between users.

```ts
interface CollabSession {
  connect(): Promise<void>;
  disconnect(): void;
  getPresence(): UserPresence[];
  getHistory(options?: HistoryOptions): ChangeEntry[];
  getSessionInfo(): SessionInfo;
  on(event: string, handler: Function): void;
  off(event: string, handler: Function): void;
}
```

### `getYGridDocument(doc): YGridDocument`

Access the underlying Yjs document structure for advanced use cases.

## Conflict Resolution

Configure how concurrent edits are handled:

```ts
const session = createCollabSession({
  // ...
  conflictStrategy: 'last-write-wins', // default
  // or: 'first-write-wins', 'manual'
  onConflict: (conflict) => {
    // For 'manual' strategy
    return conflict.remote; // or conflict.local
  },
});
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `presence:change` | `UserPresence[]` | User joined/left/moved |
| `remote:change` | `RemoteChange` | Data changed by another user |
| `local:change` | `LocalChange` | Local change synced |
| `connection:change` | `ConnectionState` | Connection status changed |
| `conflict` | `Conflict` | Edit conflict detected |

## Types

```ts
import type {
  CollabConfig,
  CollabSession,
  ConflictStrategy,
  SyncProvider,
  ConnectionState,
  UserPresence,
  RemoteChange,
  LocalChange,
  ChangeEntry,
  SessionInfo,
  Conflict,
} from '@phozart/collab';
```

## Re-exports

This package re-exports all types from `@phozart/core` for convenience.

## License

MIT
