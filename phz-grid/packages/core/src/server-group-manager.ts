/**
 * @phozart/core — ServerGroupManager
 *
 * Manages server-side grouping state: expand/collapse tracking,
 * group row caching, and request building for lazy-expand grouping.
 */

import type {
  ServerGroupRequest,
  ServerGroupField,
  ServerGroupRow,
} from './types/server.js';

export interface ServerGroupManagerConfig {
  groupBy: ServerGroupField[];
}

export class ServerGroupManager {
  private groupBy: ServerGroupField[];
  private expandedGroups = new Map<string, unknown[]>();
  private groupRowCache = new Map<string, ServerGroupRow[]>();

  constructor(config: ServerGroupManagerConfig) {
    this.groupBy = config.groupBy;
  }

  buildGroupRequest(): ServerGroupRequest {
    const expandedGroupKeys = Array.from(this.expandedGroups.values());
    return {
      groupBy: this.groupBy,
      expandedGroupKeys,
    };
  }

  expandGroup(groupKey: unknown[]): void {
    this.expandedGroups.set(this.keyToString(groupKey), groupKey);
  }

  collapseGroup(groupKey: unknown[]): void {
    const keyStr = this.keyToString(groupKey);
    this.expandedGroups.delete(keyStr);

    // Also collapse all children — child keys start with parent elements
    for (const [key, value] of this.expandedGroups) {
      if ((value as unknown[]).length > groupKey.length) {
        const isChild = groupKey.every((k, i) => JSON.stringify(k) === JSON.stringify((value as unknown[])[i]));
        if (isChild) {
          this.expandedGroups.delete(key);
        }
      }
    }
  }

  toggleGroup(groupKey: unknown[]): void {
    if (this.isGroupExpanded(groupKey)) {
      this.collapseGroup(groupKey);
    } else {
      this.expandGroup(groupKey);
    }
  }

  isGroupExpanded(groupKey: unknown[]): boolean {
    return this.expandedGroups.has(this.keyToString(groupKey));
  }

  collapseAll(): void {
    this.expandedGroups.clear();
  }

  setGroupRows(parentKey: unknown[], rows: ServerGroupRow[]): void {
    this.groupRowCache.set(this.keyToString(parentKey), rows);
  }

  getGroupRows(parentKey: unknown[]): ServerGroupRow[] | undefined {
    return this.groupRowCache.get(this.keyToString(parentKey));
  }

  private keyToString(groupKey: unknown[]): string {
    return JSON.stringify(groupKey);
  }
}
