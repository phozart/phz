/**
 * @phozart/core — Typed Event Emitter
 *
 * High-performance event system with typed event maps, once support,
 * and proper cleanup via Unsubscribe functions.
 */

import type { GridEventMap, GridEventHandler } from './types/events.js';
import type { Unsubscribe } from './types/common.js';

type HandlerSet<K extends keyof GridEventMap> = Set<GridEventHandler<K>>;

export class EventEmitter {
  private handlers = new Map<string, Set<GridEventHandler<any>>>();
  private onceHandlers = new WeakSet<GridEventHandler<any>>();

  on<K extends keyof GridEventMap>(event: K, handler: GridEventHandler<K>): Unsubscribe {
    let set = this.handlers.get(event as string) as HandlerSet<K> | undefined;
    if (!set) {
      set = new Set();
      this.handlers.set(event as string, set as Set<GridEventHandler<any>>);
    }
    set.add(handler);

    return () => {
      set!.delete(handler);
      if (set!.size === 0) {
        this.handlers.delete(event as string);
      }
    };
  }

  once<K extends keyof GridEventMap>(event: K, handler: GridEventHandler<K>): Unsubscribe {
    this.onceHandlers.add(handler as GridEventHandler<any>);
    return this.on(event, handler);
  }

  off<K extends keyof GridEventMap>(event: K, handler: GridEventHandler<K>): void {
    const set = this.handlers.get(event as string);
    if (set) {
      set.delete(handler as GridEventHandler<any>);
      if (set.size === 0) {
        this.handlers.delete(event as string);
      }
    }
  }

  emit<K extends keyof GridEventMap>(event: K, payload: GridEventMap[K]): void {
    const set = this.handlers.get(event as string);
    if (!set) return;

    for (const handler of set) {
      handler(payload);

      if (this.onceHandlers.has(handler)) {
        this.onceHandlers.delete(handler);
        set.delete(handler);
      }
    }

    if (set.size === 0) {
      this.handlers.delete(event as string);
    }
  }

  removeAllListeners(): void {
    this.handlers.clear();
  }
}
