/**
 * @phozart/shared — Filter State Auto-Save (A-2.10)
 *
 * Configuration and snapshot utilities for automatically persisting
 * filter state. Supports debounced saves with configurable history depth.
 *
 * Pure types and functions only — no side effects.
 */
// ========================================================================
// createDefaultAutoSaveConfig
// ========================================================================
/**
 * Creates a default auto-save configuration with auto-save enabled,
 * a 500ms debounce, and a maximum of 10 history entries.
 */
export function createDefaultAutoSaveConfig(overrides) {
    return {
        enabled: true,
        debounceMs: 500,
        maxHistoryEntries: 10,
        ...overrides,
    };
}
// ========================================================================
// createFilterSnapshot
// ========================================================================
/**
 * Creates an immutable filter state snapshot with the current timestamp.
 *
 * @param filters - The current filter values keyed by filter definition ID.
 * @param context - Optional artifact and user context for the snapshot.
 */
export function createFilterSnapshot(filters, context) {
    return {
        filters: { ...filters },
        timestamp: Date.now(),
        ...(context?.artifactId !== undefined ? { artifactId: context.artifactId } : {}),
        ...(context?.userId !== undefined ? { userId: context.userId } : {}),
    };
}
// ========================================================================
// shouldAutoSave
// ========================================================================
/**
 * Returns `true` when auto-save is enabled and the debounce interval is
 * a positive number.
 */
export function shouldAutoSave(config) {
    return config.enabled && config.debounceMs > 0;
}
// ========================================================================
// pruneHistory
// ========================================================================
/**
 * Prunes a history array to the maximum number of entries allowed by the
 * config, keeping the most recent snapshots.
 *
 * @param history - Snapshots sorted by timestamp ascending (oldest first).
 * @param config - Auto-save config with `maxHistoryEntries`.
 * @returns A new array trimmed to the maximum allowed entries.
 */
export function pruneHistory(history, config) {
    const max = config.maxHistoryEntries ?? 10;
    if (history.length <= max)
        return [...history];
    return history.slice(history.length - max);
}
//# sourceMappingURL=filter-auto-save.js.map