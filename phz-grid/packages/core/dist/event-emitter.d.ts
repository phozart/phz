/**
 * @phozart/phz-core — Typed Event Emitter
 *
 * High-performance event system with typed event maps, once support,
 * and proper cleanup via Unsubscribe functions.
 */
import type { GridEventMap, GridEventHandler } from './types/events.js';
import type { Unsubscribe } from './types/common.js';
export declare class EventEmitter {
    private handlers;
    private onceHandlers;
    on<K extends keyof GridEventMap>(event: K, handler: GridEventHandler<K>): Unsubscribe;
    once<K extends keyof GridEventMap>(event: K, handler: GridEventHandler<K>): Unsubscribe;
    off<K extends keyof GridEventMap>(event: K, handler: GridEventHandler<K>): void;
    emit<K extends keyof GridEventMap>(event: K, payload: GridEventMap[K]): void;
    removeAllListeners(): void;
}
//# sourceMappingURL=event-emitter.d.ts.map