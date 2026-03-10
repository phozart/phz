/**
 * @phozart/phz-core — RealtimeManager
 *
 * Manages real-time push updates from a generic RealtimeProvider.
 * Applies delta updates (insert/update/delete/refresh), detects
 * sequence gaps, and handles reconnection with full refresh.
 */
export class RealtimeManager {
    provider;
    callbacks;
    unsubscribeData = null;
    unsubscribeConnection = null;
    lastSequence = 0;
    connectionState = 'disconnected';
    wasDisconnected = false;
    constructor(provider, callbacks = {}) {
        this.provider = provider;
        this.callbacks = callbacks;
    }
    start() {
        this.connectionState = this.provider.getConnectionState();
        this.lastSequence = 0;
        this.wasDisconnected = false;
        this.unsubscribeData = this.provider.subscribe((update) => {
            this.handleUpdate(update);
        });
        this.unsubscribeConnection = this.provider.onConnectionStateChange((state) => {
            this.handleConnectionChange(state);
        });
    }
    stop() {
        this.unsubscribeData?.();
        this.unsubscribeData = null;
        this.unsubscribeConnection?.();
        this.unsubscribeConnection = null;
        this.lastSequence = 0;
    }
    getConnectionState() {
        return this.connectionState;
    }
    handleUpdate(update) {
        // Check for sequence gap
        if (this.lastSequence > 0 && update.sequence > this.lastSequence + 1) {
            this.callbacks.onRefresh?.();
            this.lastSequence = update.sequence;
            return;
        }
        this.lastSequence = update.sequence;
        switch (update.type) {
            case 'insert':
                if (update.rowId && update.data) {
                    this.callbacks.onInsert?.(update.rowId, update.data);
                }
                break;
            case 'update':
                if (update.rowId && update.delta) {
                    this.callbacks.onUpdate?.(update.rowId, update.delta);
                }
                break;
            case 'delete':
                if (update.rowId) {
                    this.callbacks.onDelete?.(update.rowId);
                }
                break;
            case 'refresh':
                this.callbacks.onRefresh?.();
                break;
        }
    }
    handleConnectionChange(state) {
        const prevState = this.connectionState;
        this.connectionState = state;
        this.callbacks.onConnectionChange?.(state);
        // Track disconnection
        if (state === 'disconnected' || state === 'error') {
            this.wasDisconnected = true;
        }
        // Trigger refresh on reconnect
        if (state === 'connected' && this.wasDisconnected) {
            this.wasDisconnected = false;
            this.lastSequence = 0;
            this.callbacks.onRefresh?.();
        }
    }
}
//# sourceMappingURL=realtime-manager.js.map