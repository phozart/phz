/**
 * @phozart/engine — Dirty Tracker
 *
 * Tracks which widgets need re-resolution after data, filter, or config changes.
 * Integration points:
 *   - Filter change → markDirty('all')
 *   - Data change → markDirty('all')
 *   - Widget config change → markDirty(widgetId)
 */
export class DirtyTracker {
    allDirty = false;
    dirtySet = new Set();
    cleanSet = new Set();
    isDirty(widgetId) {
        if (this.cleanSet.has(widgetId))
            return false;
        if (this.allDirty)
            return true;
        return this.dirtySet.has(widgetId);
    }
    markDirty(widgetId) {
        if (widgetId === 'all') {
            this.allDirty = true;
            this.dirtySet.clear();
            this.cleanSet.clear();
        }
        else {
            this.dirtySet.add(widgetId);
            this.cleanSet.delete(widgetId);
        }
    }
    markClean(widgetId) {
        if (widgetId === 'all') {
            this.allDirty = false;
            this.dirtySet.clear();
            this.cleanSet.clear();
        }
        else {
            this.dirtySet.delete(widgetId);
            if (this.allDirty) {
                this.cleanSet.add(widgetId);
            }
        }
    }
    getDirtyWidgets() {
        if (this.allDirty)
            return ['all'];
        return Array.from(this.dirtySet);
    }
    reset() {
        this.allDirty = false;
        this.dirtySet.clear();
        this.cleanSet.clear();
    }
}
//# sourceMappingURL=dirty-tracker.js.map