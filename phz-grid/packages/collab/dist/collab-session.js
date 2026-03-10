/**
 * @phozart/phz-collab — Collaboration Session Implementation
 *
 * Real-time collaboration using Yjs CRDTs. Manages presence,
 * change tracking, conflict resolution, and Yjs document mapping.
 */
const VALID_SESSION_ID = /^[a-zA-Z0-9_-]{1,128}$/;
let changeIdCounter = 0;
class CollabSessionImpl {
    config;
    doc = null;
    provider = null;
    connectionState = 'disconnected';
    grid = null;
    presenceMap = new Map();
    presenceHandlers = new Set();
    remoteChangeHandlers = new Set();
    localChangeHandlers = new Set();
    conflictHandlers = new Set();
    history = [];
    userInfoMap = new Map();
    createdAt;
    gridUnsub = null;
    constructor(config) {
        if (config.sessionId !== undefined && !VALID_SESSION_ID.test(config.sessionId)) {
            throw new Error('@phozart/phz-collab: Invalid session ID format. Only alphanumeric, hyphen, and underscore allowed (max 128 chars).');
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
    async connect(provider) {
        this.provider = provider;
        this.connectionState = 'connecting';
        // Create Yjs document
        const yjs = await import('yjs');
        this.doc = new yjs.Doc();
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
    async disconnect() {
        this.updatePresence({ online: false });
        if (this.provider) {
            await this.provider.disconnect();
            this.provider = null;
        }
        this.connectionState = 'disconnected';
    }
    isConnected() {
        return this.connectionState === 'connected';
    }
    getConnectionState() {
        return this.connectionState;
    }
    getPresence() {
        return this.presenceMap;
    }
    updatePresence(data) {
        const current = this.presenceMap.get(this.config.userId);
        if (!current)
            return;
        const updated = { ...current, ...data, lastActivity: Date.now() };
        this.presenceMap.set(this.config.userId, updated);
        // Sync to Yjs presence map
        if (this.doc) {
            const ygrid = this.getYGridDocument();
            ygrid.presence.set(this.config.userId, updated);
        }
        this.notifyPresenceChange();
    }
    onPresenceChange(handler) {
        this.presenceHandlers.add(handler);
        return () => { this.presenceHandlers.delete(handler); };
    }
    onRemoteChange(handler) {
        this.remoteChangeHandlers.add(handler);
        return () => { this.remoteChangeHandlers.delete(handler); };
    }
    onLocalChange(handler) {
        this.localChangeHandlers.add(handler);
        return () => { this.localChangeHandlers.delete(handler); };
    }
    getChangeHistory(options) {
        let entries = [...this.history];
        if (options?.since) {
            entries = entries.filter((e) => e.timestamp >= options.since);
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
    getSessionInfo() {
        const onlineUsers = Array.from(this.presenceMap.values()).filter((u) => u.online).length;
        return {
            sessionId: this.config.sessionId ?? 'local',
            createdAt: this.createdAt,
            connectedUsers: onlineUsers,
            totalChanges: this.history.length,
        };
    }
    getUserInfo(userId) {
        return this.userInfoMap.get(userId);
    }
    onConflict(handler) {
        this.conflictHandlers.add(handler);
        return () => { this.conflictHandlers.delete(handler); };
    }
    resolveConflict(conflictId, resolution) {
        if (resolution.resolution === 'local') {
            // Keep local value — no action needed, Yjs already has it
        }
        else if (resolution.resolution === 'remote') {
            // Accept remote value — would need to revert local change
            // This is handled by the Yjs CRDT merge
        }
        else if (resolution.resolution === 'custom' && resolution.customValue !== undefined) {
            // Apply custom value to the grid
            if (this.grid) {
                // The custom value would be applied based on conflict type
            }
        }
    }
    getYDoc() {
        if (!this.doc)
            throw new Error('@phozart/phz-collab: Not connected');
        return this.doc;
    }
    attachToGrid(grid) {
        this.grid = grid;
        let previousState = grid.getState();
        // Listen for grid state changes and broadcast as local changes
        this.gridUnsub = grid.subscribe((state) => {
            const changedFields = [];
            if (JSON.stringify(state.sort) !== JSON.stringify(previousState.sort)) {
                changedFields.push({
                    field: 'sort',
                    oldValue: previousState.sort,
                    newValue: state.sort,
                });
            }
            if (JSON.stringify(state.filter) !== JSON.stringify(previousState.filter)) {
                changedFields.push({
                    field: 'filter',
                    oldValue: previousState.filter,
                    newValue: state.filter,
                });
            }
            if (JSON.stringify(state.columns) !== JSON.stringify(previousState.columns)) {
                changedFields.push({
                    field: 'columns',
                    oldValue: previousState.columns,
                    newValue: state.columns,
                });
            }
            if (JSON.stringify(state.grouping) !==
                JSON.stringify(previousState.grouping)) {
                changedFields.push({
                    field: 'grouping',
                    oldValue: previousState.grouping,
                    newValue: state.grouping,
                });
            }
            previousState = state;
            for (const changed of changedFields) {
                const localChange = {
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
    detachFromGrid() {
        if (this.gridUnsub) {
            this.gridUnsub();
            this.gridUnsub = null;
        }
        this.grid = null;
    }
    destroy() {
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
    getYGridDocument() {
        if (!this.doc)
            throw new Error('@phozart/phz-collab: No Yjs document');
        return {
            rows: this.doc.getArray('rows'),
            columns: this.doc.getArray('columns'),
            state: this.doc.getMap('state'),
            presence: this.doc.getMap('presence'),
        };
    }
    setupYjsObservers() {
        if (!this.doc)
            return;
        const ygrid = this.getYGridDocument();
        // Observe presence changes
        ygrid.presence.observe(() => {
            ygrid.presence.forEach((value, key) => {
                if (key !== this.config.userId) {
                    this.presenceMap.set(key, value);
                    if (!this.userInfoMap.has(key)) {
                        const p = value;
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
                const txn = event.transaction;
                if (txn?.local)
                    return;
            }
            const remoteChange = {
                type: 'row',
                userId: 'remote',
                timestamp: Date.now(),
                change: { action: 'update', rowId: '' },
            };
            this.notifyRemoteChange(remoteChange);
        });
    }
    syncGridToYjs() {
        if (!this.grid || !this.doc)
            return;
        const ygrid = this.getYGridDocument();
        const data = this.grid.getData();
        const restricted = this.grid.getRestrictedFields?.() ?? new Set();
        const maskFieldSet = new Set(this.config.maskFields ?? []);
        this.doc.transact(() => {
            // Sync rows
            for (const row of data) {
                const yRow = this.doc.getMap(`row-${row['__id']}`);
                for (const [key, value] of Object.entries(row)) {
                    if (restricted.has(key))
                        continue;
                    if (maskFieldSet.has(key)) {
                        yRow.set(key, '****');
                    }
                    else {
                        yRow.set(key, value);
                    }
                }
            }
            // Sync column state
            const colState = this.grid.getColumnState();
            ygrid.state.set('columns', colState);
        });
    }
    notifyPresenceChange() {
        for (const handler of this.presenceHandlers) {
            handler(new Map(this.presenceMap));
        }
    }
    notifyRemoteChange(change) {
        for (const handler of this.remoteChangeHandlers) {
            handler(change);
        }
    }
    notifyLocalChange(change) {
        for (const handler of this.localChangeHandlers) {
            handler(change);
        }
    }
    recordChange(userId, change) {
        if (!this.config.enableHistory)
            return;
        const entry = {
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
    generateColor(userId) {
        // Deterministic color from userId
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
        }
        const h = Math.abs(hash) % 360;
        return `hsl(${h}, 70%, 50%)`;
    }
}
export function createCollabSession(config) {
    return new CollabSessionImpl(config);
}
export function getYGridDocument(doc) {
    return {
        rows: doc.getArray('rows'),
        columns: doc.getArray('columns'),
        state: doc.getMap('state'),
        presence: doc.getMap('presence'),
    };
}
//# sourceMappingURL=collab-session.js.map