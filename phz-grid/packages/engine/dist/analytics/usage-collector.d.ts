/**
 * @phozart/phz-engine — Usage Analytics Collector (C-2.08)
 *
 * Buffers usage events and flushes them when the buffer is full or
 * on a timed interval. Consumes UsageAnalyticsAdapter from shared.
 *
 * Pure functions only — no side effects, no DOM, no timers.
 */
export interface BufferedEvent {
    type: string;
    timestamp: number;
    data: Record<string, unknown>;
}
export interface UsageCollectorState {
    buffer: BufferedEvent[];
    bufferSize: number;
    flushIntervalMs: number;
    collecting: boolean;
}
export interface UsageCollectorConfig {
    bufferSize?: number;
    flushIntervalMs?: number;
}
/**
 * Create a fresh UsageCollectorState with configurable buffer and interval.
 *
 * @param config - Optional configuration overrides.
 */
export declare function createUsageCollector(config?: UsageCollectorConfig): UsageCollectorState;
/**
 * Track a usage event. Adds it to the buffer with a timestamp.
 * If collecting is disabled, the event is dropped.
 */
export declare function trackEvent(state: UsageCollectorState, type: string, data?: Record<string, unknown>): UsageCollectorState;
/**
 * Determine whether the buffer should be flushed (reached capacity).
 */
export declare function shouldFlush(state: UsageCollectorState): boolean;
/**
 * Flush the buffer, returning the flushed events and a clean state.
 * If the buffer is empty, returns the state unchanged with an empty events array.
 */
export declare function flush(state: UsageCollectorState): {
    flushed: UsageCollectorState;
    events: BufferedEvent[];
};
/**
 * Enable or disable event collection.
 */
export declare function setCollecting(state: UsageCollectorState, collecting: boolean): UsageCollectorState;
/**
 * Get the number of buffered events.
 */
export declare function getBufferedCount(state: UsageCollectorState): number;
//# sourceMappingURL=usage-collector.d.ts.map