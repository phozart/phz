/**
 * @phozart/engine — Dirty Tracker
 *
 * Tracks which widgets need re-resolution after data, filter, or config changes.
 * Integration points:
 *   - Filter change → markDirty('all')
 *   - Data change → markDirty('all')
 *   - Widget config change → markDirty(widgetId)
 */
export declare class DirtyTracker {
    private allDirty;
    private dirtySet;
    private cleanSet;
    isDirty(widgetId: string): boolean;
    markDirty(widgetId: string | 'all'): void;
    markClean(widgetId: string | 'all'): void;
    getDirtyWidgets(): string[];
    reset(): void;
}
//# sourceMappingURL=dirty-tracker.d.ts.map