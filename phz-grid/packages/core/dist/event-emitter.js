/**
 * @phozart/phz-core — Typed Event Emitter
 *
 * High-performance event system with typed event maps, once support,
 * and proper cleanup via Unsubscribe functions.
 */
export class EventEmitter {
    handlers = new Map();
    onceHandlers = new WeakSet();
    on(event, handler) {
        let set = this.handlers.get(event);
        if (!set) {
            set = new Set();
            this.handlers.set(event, set);
        }
        set.add(handler);
        return () => {
            set.delete(handler);
            if (set.size === 0) {
                this.handlers.delete(event);
            }
        };
    }
    once(event, handler) {
        this.onceHandlers.add(handler);
        return this.on(event, handler);
    }
    off(event, handler) {
        const set = this.handlers.get(event);
        if (set) {
            set.delete(handler);
            if (set.size === 0) {
                this.handlers.delete(event);
            }
        }
    }
    emit(event, payload) {
        const set = this.handlers.get(event);
        if (!set)
            return;
        for (const handler of set) {
            handler(payload);
            if (this.onceHandlers.has(handler)) {
                this.onceHandlers.delete(handler);
                set.delete(handler);
            }
        }
        if (set.size === 0) {
            this.handlers.delete(event);
        }
    }
    removeAllListeners() {
        this.handlers.clear();
    }
}
//# sourceMappingURL=event-emitter.js.map