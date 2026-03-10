/**
 * @phozart/phz-engine — Dirty Tracker
 *
 * Tracks which widgets need re-resolution after data, filter, or config changes.
 * Integration points:
 *   - Filter change → markDirty('all')
 *   - Data change → markDirty('all')
 *   - Widget config change → markDirty(widgetId)
 */

export class DirtyTracker {
  private allDirty = false;
  private dirtySet = new Set<string>();
  private cleanSet = new Set<string>();

  isDirty(widgetId: string): boolean {
    if (this.cleanSet.has(widgetId)) return false;
    if (this.allDirty) return true;
    return this.dirtySet.has(widgetId);
  }

  markDirty(widgetId: string | 'all'): void {
    if (widgetId === 'all') {
      this.allDirty = true;
      this.dirtySet.clear();
      this.cleanSet.clear();
    } else {
      this.dirtySet.add(widgetId);
      this.cleanSet.delete(widgetId);
    }
  }

  markClean(widgetId: string | 'all'): void {
    if (widgetId === 'all') {
      this.allDirty = false;
      this.dirtySet.clear();
      this.cleanSet.clear();
    } else {
      this.dirtySet.delete(widgetId);
      if (this.allDirty) {
        this.cleanSet.add(widgetId);
      }
    }
  }

  getDirtyWidgets(): string[] {
    if (this.allDirty) return ['all'];
    return Array.from(this.dirtySet);
  }

  reset(): void {
    this.allDirty = false;
    this.dirtySet.clear();
    this.cleanSet.clear();
  }
}
