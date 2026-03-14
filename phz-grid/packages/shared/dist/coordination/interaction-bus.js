/**
 * @phozart/shared — InteractionBus (A-1.05)
 *
 * Pub/sub event bus for cross-widget interactions.
 * Widgets emit events (drill-through, cross-filter, etc.) and other
 * widgets or the shell can subscribe to react.
 *
 * Extracted from workspace/interaction-bus.ts.
 */
// ========================================================================
// createInteractionBus factory
// ========================================================================
export function createInteractionBus() {
    const handlers = new Map();
    return {
        emit(event) {
            const set = handlers.get(event.type);
            if (set)
                set.forEach(h => h(event));
        },
        on(type, handler) {
            if (!handlers.has(type))
                handlers.set(type, new Set());
            handlers.get(type).add(handler);
            return () => handlers.get(type)?.delete(handler);
        },
        off(type, handler) {
            handlers.get(type)?.delete(handler);
        },
    };
}
//# sourceMappingURL=interaction-bus.js.map