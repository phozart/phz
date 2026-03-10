/**
 * @phozart/phz-shared — Filter State Auto-Save (A-2.10)
 *
 * Configuration and snapshot utilities for automatically persisting
 * filter state. Supports debounced saves with configurable history depth.
 *
 * Pure types and functions only — no side effects.
 */
/**
 * Configuration for automatic filter state persistence.
 */
export interface FilterAutoSaveConfig {
    /** Whether auto-save is enabled. */
    enabled: boolean;
    /** Debounce interval in milliseconds before saving after the last change. */
    debounceMs: number;
    /**
     * Storage key prefix used when persisting filter state. When undefined,
     * a key is derived from the artifact ID.
     */
    storageKey?: string;
    /**
     * Maximum number of historical snapshots to retain.
     * Oldest snapshots are evicted when the limit is exceeded.
     * Defaults to 10.
     */
    maxHistoryEntries?: number;
}
/**
 * An immutable snapshot of filter state at a point in time.
 */
export interface FilterStateSnapshot {
    /** The filter values keyed by filter definition ID. */
    filters: Record<string, unknown>;
    /** Unix timestamp (ms) when the snapshot was captured. */
    timestamp: number;
    /** The artifact (dashboard/report) this snapshot belongs to. */
    artifactId?: string;
    /** The user who created this snapshot. */
    userId?: string;
}
/**
 * Creates a default auto-save configuration with auto-save enabled,
 * a 500ms debounce, and a maximum of 10 history entries.
 */
export declare function createDefaultAutoSaveConfig(overrides?: Partial<FilterAutoSaveConfig>): FilterAutoSaveConfig;
/**
 * Creates an immutable filter state snapshot with the current timestamp.
 *
 * @param filters - The current filter values keyed by filter definition ID.
 * @param context - Optional artifact and user context for the snapshot.
 */
export declare function createFilterSnapshot(filters: Record<string, unknown>, context?: {
    artifactId?: string;
    userId?: string;
}): FilterStateSnapshot;
/**
 * Returns `true` when auto-save is enabled and the debounce interval is
 * a positive number.
 */
export declare function shouldAutoSave(config: FilterAutoSaveConfig): boolean;
/**
 * Prunes a history array to the maximum number of entries allowed by the
 * config, keeping the most recent snapshots.
 *
 * @param history - Snapshots sorted by timestamp ascending (oldest first).
 * @param config - Auto-save config with `maxHistoryEntries`.
 * @returns A new array trimmed to the maximum allowed entries.
 */
export declare function pruneHistory(history: readonly FilterStateSnapshot[], config: FilterAutoSaveConfig): FilterStateSnapshot[];
//# sourceMappingURL=filter-auto-save.d.ts.map