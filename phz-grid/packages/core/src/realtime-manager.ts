/**
 * @phozart/core — RealtimeManager
 *
 * Manages real-time push updates from a generic RealtimeProvider.
 * Applies delta updates (insert/update/delete/refresh), detects
 * sequence gaps, and handles reconnection with full refresh.
 */

import type {
  RealtimeProvider,
  DataUpdate,
  RealtimeConnectionState,
} from './types/server.js';

export interface RealtimeManagerCallbacks<T = unknown> {
  onInsert?: (rowId: string, data: T) => void;
  onUpdate?: (rowId: string, delta: Partial<T>) => void;
  onDelete?: (rowId: string) => void;
  onRefresh?: () => void;
  onConnectionChange?: (state: RealtimeConnectionState) => void;
}

export class RealtimeManager<T = unknown> {
  private provider: RealtimeProvider<T>;
  private callbacks: RealtimeManagerCallbacks<T>;
  private unsubscribeData: (() => void) | null = null;
  private unsubscribeConnection: (() => void) | null = null;
  private lastSequence = 0;
  private connectionState: RealtimeConnectionState = 'disconnected';
  private wasDisconnected = false;

  constructor(
    provider: RealtimeProvider<T>,
    callbacks: RealtimeManagerCallbacks<T> = {},
  ) {
    this.provider = provider;
    this.callbacks = callbacks;
  }

  start(): void {
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

  stop(): void {
    this.unsubscribeData?.();
    this.unsubscribeData = null;
    this.unsubscribeConnection?.();
    this.unsubscribeConnection = null;
    this.lastSequence = 0;
  }

  getConnectionState(): RealtimeConnectionState {
    return this.connectionState;
  }

  private handleUpdate(update: DataUpdate<T>): void {
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

  private handleConnectionChange(state: RealtimeConnectionState): void {
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
