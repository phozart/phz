/**
 * @phozart/phz-engine — Usage Analytics Collector (C-2.08)
 *
 * Buffers usage events and flushes them when the buffer is full or
 * on a timed interval. Consumes UsageAnalyticsAdapter from shared.
 *
 * Pure functions only — no side effects, no DOM, no timers.
 */
// ========================================================================
// Factory
// ========================================================================
/**
 * Create a fresh UsageCollectorState with configurable buffer and interval.
 *
 * @param config - Optional configuration overrides.
 */
export function createUsageCollector(config) {
    return {
        buffer: [],
        bufferSize: config?.bufferSize ?? 50,
        flushIntervalMs: config?.flushIntervalMs ?? 30_000,
        collecting: true,
    };
}
// ========================================================================
// State transitions
// ========================================================================
/**
 * Track a usage event. Adds it to the buffer with a timestamp.
 * If collecting is disabled, the event is dropped.
 */
export function trackEvent(state, type, data) {
    if (!state.collecting)
        return state;
    const event = {
        type,
        timestamp: Date.now(),
        data: data ?? {},
    };
    return {
        ...state,
        buffer: [...state.buffer, event],
    };
}
/**
 * Determine whether the buffer should be flushed (reached capacity).
 */
export function shouldFlush(state) {
    return state.buffer.length >= state.bufferSize;
}
/**
 * Flush the buffer, returning the flushed events and a clean state.
 * If the buffer is empty, returns the state unchanged with an empty events array.
 */
export function flush(state) {
    return {
        flushed: { ...state, buffer: [] },
        events: [...state.buffer],
    };
}
/**
 * Enable or disable event collection.
 */
export function setCollecting(state, collecting) {
    return { ...state, collecting };
}
/**
 * Get the number of buffered events.
 */
export function getBufferedCount(state) {
    return state.buffer.length;
}
//# sourceMappingURL=usage-collector.js.map