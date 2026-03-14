# ADR-005: Yjs CRDTs for Real-Time Collaboration

## Status
Accepted

## Context

Modern applications increasingly require real-time collaboration features. For data grids, this means multiple users editing the same dataset simultaneously with:
- Live updates (see others' changes within milliseconds)
- Conflict-free merging (no "last-write-wins" data loss)
- Offline support (work offline, sync on reconnect)
- Presence awareness (see who's editing which cell)

### CRDT vs Operational Transform

Two approaches exist for real-time collaboration:

**Operational Transform (OT)** — Used by Google Docs (until 2021)
- Transforms conflicting operations to converge to same state
- Requires central server to sequence operations
- Complex to implement correctly
- Not offline-friendly

**Conflict-Free Replicated Data Types (CRDTs)** — Used by Figma, Notion, Linear
- Mathematically guaranteed convergence without central coordination
- Peer-to-peer friendly
- Offline-first by design
- Easier to implement

### CRDT Libraries Evaluated

| Library | Weekly Downloads | Size | Maturity | Grid Suitability |
|---------|-----------------|------|----------|------------------|
| **Yjs** | 900K+ | ~50 KB | Production (5+ years) | Excellent (Y.Map, Y.Array) |
| Automerge | 50K | ~200 KB | Production (3+ years) | Good |
| ShareDB | 30K | ~80 KB | Production (8+ years) | Fair (OT-based) |
| Gun.js | 20K | ~150 KB | Experimental | Poor (graph database) |
| Replicache | 5K | ~100 KB | Production (2+ years) | Good (React-focused) |

**Yjs Selected** because:
1. Largest ecosystem (900K+ weekly downloads)
2. Battle-tested at massive scale (Proton Docs, JupyterLab, Shopify, Monday.com)
3. Native Y.Map and Y.Array types map perfectly to grid structure
4. Rich provider ecosystem (WebSocket, WebRTC, IndexedDB)
5. Smallest bundle size for feature set
6. TypeScript support

### Grid-Specific Collaboration Challenges

1. **Cell-Level Editing** — Multiple users editing different cells in same row
2. **Structural Changes** — Adding/removing columns must sync without breaking layout
3. **Sorting/Filtering** — User A's sort shouldn't override User B's view
4. **Presence Cursors** — Show which cell each user is editing
5. **Conflict Resolution** — Two users edit same cell simultaneously
6. **Performance at Scale** — 100K rows with 10 concurrent users

## Decision

We will integrate **Yjs** as the collaboration backbone with the following architecture:

### CRDT Document Structure

```typescript
// Yjs document structure
const yDoc = new Y.Doc();

// Root map
const root = yDoc.getMap('grid');

// Rows as Y.Array of Y.Map
const rows = new Y.Array<Y.Map<any>>();
root.set('rows', rows);

// Each row is a Y.Map (enables cell-level CRDT)
const row1 = new Y.Map();
row1.set('id', 'row-1');
row1.set('name', 'Alice');
row1.set('age', 28);
rows.push([row1]);

// Columns (structure)
const columns = new Y.Array();
root.set('columns', columns);

// Sort state (per-user, not shared)
const sortState = new Y.Map();
root.set('sortState', sortState);

// Awareness (ephemeral, not persisted)
const awareness = provider.awareness;
awareness.setLocalState({
  user: { id: 'user-1', name: 'Alice', color: '#3b82f6' },
  cursor: { rowId: 'row-1', columnId: 'name' }
});
```

### Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│  User A Browser                                     │
│  ├─ Grid Component                                  │
│  ├─ Yjs Y.Doc (local state)                        │
│  └─ WebSocket Provider                              │
└─────────────────────────────────────────────────────┘
              ↕ (WebSocket)
┌─────────────────────────────────────────────────────┐
│  Sync Server (y-websocket)                          │
│  ├─ Broadcasts updates to all clients              │
│  ├─ Persists Y.Doc snapshots (optional)            │
│  └─ No application logic (pure relay)              │
└─────────────────────────────────────────────────────┘
              ↕ (WebSocket)
┌─────────────────────────────────────────────────────┐
│  User B Browser                                     │
│  ├─ Grid Component                                  │
│  ├─ Yjs Y.Doc (local state)                        │
│  └─ WebSocket Provider                              │
└─────────────────────────────────────────────────────┘
```

### Implementation

```typescript
// @phozart/collab

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import type { GridApi } from '@phozart/core';

export class CollabGridBinding {
  private yDoc: Y.Doc;
  private yRows: Y.Array<Y.Map<any>>;
  private yColumns: Y.Array<any>;
  private provider: WebsocketProvider;
  private awareness: WebsocketProvider['awareness'];

  constructor(
    private gridApi: GridApi,
    private roomId: string,
    private userId: string,
    private userName: string
  ) {
    this.yDoc = new Y.Doc();
    this.initializeYjsStructure();
    this.bindToGrid();
    this.connectToSyncBackend();
  }

  private initializeYjsStructure() {
    const root = this.yDoc.getMap('grid');

    // Initialize rows
    this.yRows = root.get('rows') ?? new Y.Array();
    if (!root.has('rows')) {
      root.set('rows', this.yRows);

      // Populate from current grid state
      const currentState = this.gridApi.getState();
      for (const row of currentState.data) {
        const yRow = new Y.Map();
        Object.entries(row).forEach(([key, value]) => {
          yRow.set(key, value);
        });
        this.yRows.push([yRow]);
      }
    }

    // Initialize columns
    this.yColumns = root.get('columns') ?? new Y.Array();
    if (!root.has('columns')) {
      root.set('columns', this.yColumns);
      const currentState = this.gridApi.getState();
      this.yColumns.push(currentState.columns);
    }
  }

  private bindToGrid() {
    // Yjs → Grid (remote updates)
    this.yRows.observe((event) => {
      // Handle row additions
      event.changes.added.forEach((item) => {
        const yRow = item.content.type as Y.Map<any>;
        const rowData = this.yMapToObject(yRow);
        this.gridApi.addRow(rowData, { source: 'remote' });
      });

      // Handle row deletions
      event.changes.deleted.forEach((item) => {
        const yRow = item.content.type as Y.Map<any>;
        const rowId = yRow.get('_id');
        this.gridApi.deleteRow(rowId, { source: 'remote' });
      });
    });

    // Observe cell-level changes
    this.yRows.forEach((yRow, index) => {
      yRow.observe((event) => {
        event.changes.keys.forEach((change, key) => {
          if (change.action === 'update' || change.action === 'add') {
            const rowId = yRow.get('_id');
            const newValue = yRow.get(key);
            this.gridApi.updateCell(rowId, key, newValue, { source: 'remote' });
          }
        });
      });
    });

    // Grid → Yjs (local updates)
    this.gridApi.on('cellEditCommit', ({ rowId, columnId, newValue, source }) => {
      if (source === 'remote') return; // Avoid infinite loop

      const rowIndex = this.findRowIndex(rowId);
      const yRow = this.yRows.get(rowIndex);

      // Yjs handles conflict resolution automatically
      yRow.set(columnId, newValue);
    });

    this.gridApi.on('rowAdded', ({ rowData, source }) => {
      if (source === 'remote') return;

      const yRow = new Y.Map();
      Object.entries(rowData).forEach(([key, value]) => {
        yRow.set(key, value);
      });
      this.yRows.push([yRow]);
    });

    this.gridApi.on('rowDeleted', ({ rowId, source }) => {
      if (source === 'remote') return;

      const rowIndex = this.findRowIndex(rowId);
      this.yRows.delete(rowIndex, 1);
    });
  }

  private connectToSyncBackend() {
    // WebSocket provider (can swap for WebRTC, IndexedDB, etc.)
    this.provider = new WebsocketProvider(
      'wss://sync.phozart.io',
      this.roomId,
      this.yDoc,
      { connect: true }
    );

    this.awareness = this.provider.awareness;

    // Set local user state
    this.awareness.setLocalState({
      user: {
        id: this.userId,
        name: this.userName,
        color: this.getUserColor(this.userId)
      },
      cursor: null
    });

    // Listen for presence updates
    this.awareness.on('change', () => {
      this.updatePresenceCursors();
    });
  }

  private updatePresenceCursors() {
    const states = this.awareness.getStates();
    const cursors: PresenceCursor[] = [];

    states.forEach((state, clientId) => {
      if (clientId === this.yDoc.clientID) return; // Skip self

      if (state.cursor) {
        cursors.push({
          userId: state.user.id,
          userName: state.user.name,
          color: state.user.color,
          cellId: state.cursor.cellId
        });
      }
    });

    // Render presence cursors in grid
    this.gridApi.setPresenceCursors(cursors);
  }

  // Announce cursor position to other users
  announceCursorPosition(cellId: CellId) {
    const currentState = this.awareness.getLocalState();
    this.awareness.setLocalState({
      ...currentState,
      cursor: { cellId, timestamp: Date.now() }
    });
  }

  private yMapToObject(yMap: Y.Map<any>): Record<string, any> {
    const obj: Record<string, any> = {};
    yMap.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }

  private findRowIndex(rowId: string): number {
    for (let i = 0; i < this.yRows.length; i++) {
      const yRow = this.yRows.get(i);
      if (yRow.get('_id') === rowId) {
        return i;
      }
    }
    return -1;
  }

  private getUserColor(userId: string): string {
    // Generate consistent color from user ID
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  destroy() {
    this.provider.destroy();
    this.yDoc.destroy();
  }
}
```

### Presence Cursor Rendering

```typescript
// In @phozart/grid component
class PhzGrid extends LitElement {
  @state() private presenceCursors: PresenceCursor[] = [];

  render() {
    return html`
      <div class="grid">
        ${this.renderRows()}

        <!-- Presence cursors -->
        ${this.presenceCursors.map(cursor => html`
          <div
            class="presence-cursor"
            style="
              position: absolute;
              top: ${this.getCellTop(cursor.cellId)}px;
              left: ${this.getCellLeft(cursor.cellId)}px;
              border: 2px solid ${cursor.color};
              pointer-events: none;
            "
          >
            <div class="presence-label" style="background: ${cursor.color}">
              ${cursor.userName}
            </div>
          </div>
        `)}
      </div>
    `;
  }
}
```

### Conflict Resolution

Yjs uses **Last-Write-Wins (LWW)** with Lamport timestamps for conflict resolution.

```typescript
// Scenario: Two users edit same cell simultaneously

// User A (10:00:00.000): Sets cell A1 = "Alice"
yRow.set('name', 'Alice'); // Lamport clock: 1

// User B (10:00:00.050): Sets cell A1 = "Bob"
yRow.set('name', 'Bob'); // Lamport clock: 2

// Yjs resolution:
// - Both operations applied to CRDT
// - Final value: "Bob" (higher Lamport timestamp)
// - Deterministic: All clients converge to "Bob"
// - History preserved: ["Alice" @ ts:1, "Bob" @ ts:2]
```

## Consequences

### Positive

1. **Conflict-Free Merging** — Yjs guarantees convergence, no data loss
2. **Offline-First** — Users can work offline, changes sync on reconnect
3. **Peer-to-Peer** — Can use WebRTC provider (no central server)
4. **Battle-Tested** — Used by Proton Docs (millions of users)
5. **Rich Ecosystem** — Providers for WebSocket, WebRTC, IndexedDB, Dat, IPFS
6. **TypeScript Support** — Full type definitions
7. **Cell-Level Granularity** — CRDT at cell level (not row level)
8. **Presence Awareness** — Built-in Awareness API for cursors

### Negative

1. **Bundle Size** — Yjs is ~50 KB (loaded on demand)
2. **Complexity** — Developers must understand CRDT semantics
3. **Backend Requirement** — Requires sync server (y-websocket, WebRTC signaling, etc.)
4. **Memory Overhead** — Yjs stores operation history (can be GC'd)
5. **Learning Curve** — Different from traditional state management

### Neutral

1. **Sync Server Cost** — WebSocket server needed, but can be simple relay (no app logic)
2. **Conflict Resolution** — LWW may not be ideal for all use cases (but is simplest)

## Sync Provider Options

| Provider | Transport | Use Case | Hosting |
|----------|-----------|----------|---------|
| y-websocket | WebSocket | Most common | Requires server |
| y-webrtc | WebRTC | Peer-to-peer | No server (signaling only) |
| y-indexeddb | IndexedDB | Offline persistence | Local only |
| y-dat | Dat protocol | Distributed | Dat network |
| Custom provider | Any | Custom integration | User provides |

## Alternatives Considered

### Alternative 1: Automerge
**Rejected** because bundle size is 4x larger (~200 KB) and ecosystem is smaller.

### Alternative 2: ShareDB (Operational Transform)
**Rejected** because OT requires central server and is more complex to implement.

### Alternative 3: Replicache
**Rejected** because it's React-focused and doesn't have Y.Map/Y.Array primitives that map well to grids.

### Alternative 4: Custom CRDT
**Rejected** because building a production-ready CRDT is extremely complex. Yjs is battle-tested.

### Alternative 5: Socket.io + Manual Merging
**Rejected** because manual conflict resolution is error-prone and leads to data loss.

## Performance Considerations

| Metric | Target | Mitigation |
|--------|--------|------------|
| Sync latency | <100ms | Use WebSocket, optimize payload size |
| Memory overhead | <100 MB for 100K rows | Enable GC of old operations |
| Initial sync time | <2 sec for 100K rows | Use incremental sync, snapshots |
| Presence update rate | Throttle to 100ms | Debounce cursor updates |

## References

- [Yjs Documentation](https://docs.yjs.dev/)
- [Yjs Performance Benchmarks](https://github.com/dmonad/crdt-benchmarks)
- [CRDT vs OT Comparison](https://www.inkandswitch.com/local-first/)
- [Figma's Multiplayer Technology](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/)
- [Notion's CRDT Implementation](https://www.notion.so/blog/how-we-built-it-real-time-collaboration)

---

**Author**: Solution Architect
**Date**: 2026-02-24
**Stakeholders**: Engineering Leads, Product Manager
**License**: MIT
