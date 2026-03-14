/**
 * @phozart/core — ServerGroupManager
 *
 * Manages server-side grouping state: expand/collapse tracking,
 * group row caching, and request building for lazy-expand grouping.
 */
export class ServerGroupManager {
    groupBy;
    expandedGroups = new Map();
    groupRowCache = new Map();
    constructor(config) {
        this.groupBy = config.groupBy;
    }
    buildGroupRequest() {
        const expandedGroupKeys = Array.from(this.expandedGroups.values());
        return {
            groupBy: this.groupBy,
            expandedGroupKeys,
        };
    }
    expandGroup(groupKey) {
        this.expandedGroups.set(this.keyToString(groupKey), groupKey);
    }
    collapseGroup(groupKey) {
        const keyStr = this.keyToString(groupKey);
        this.expandedGroups.delete(keyStr);
        // Also collapse all children — child keys start with parent elements
        for (const [key, value] of this.expandedGroups) {
            if (value.length > groupKey.length) {
                const isChild = groupKey.every((k, i) => JSON.stringify(k) === JSON.stringify(value[i]));
                if (isChild) {
                    this.expandedGroups.delete(key);
                }
            }
        }
    }
    toggleGroup(groupKey) {
        if (this.isGroupExpanded(groupKey)) {
            this.collapseGroup(groupKey);
        }
        else {
            this.expandGroup(groupKey);
        }
    }
    isGroupExpanded(groupKey) {
        return this.expandedGroups.has(this.keyToString(groupKey));
    }
    collapseAll() {
        this.expandedGroups.clear();
    }
    setGroupRows(parentKey, rows) {
        this.groupRowCache.set(this.keyToString(parentKey), rows);
    }
    getGroupRows(parentKey) {
        return this.groupRowCache.get(this.keyToString(parentKey));
    }
    keyToString(groupKey) {
        return JSON.stringify(groupKey);
    }
}
//# sourceMappingURL=server-group-manager.js.map