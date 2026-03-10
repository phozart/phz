/**
 * @phozart/phz-core — ServerGroupManager
 *
 * Manages server-side grouping state: expand/collapse tracking,
 * group row caching, and request building for lazy-expand grouping.
 */
import type { ServerGroupRequest, ServerGroupField, ServerGroupRow } from './types/server.js';
export interface ServerGroupManagerConfig {
    groupBy: ServerGroupField[];
}
export declare class ServerGroupManager {
    private groupBy;
    private expandedGroups;
    private groupRowCache;
    constructor(config: ServerGroupManagerConfig);
    buildGroupRequest(): ServerGroupRequest;
    expandGroup(groupKey: unknown[]): void;
    collapseGroup(groupKey: unknown[]): void;
    toggleGroup(groupKey: unknown[]): void;
    isGroupExpanded(groupKey: unknown[]): boolean;
    collapseAll(): void;
    setGroupRows(parentKey: unknown[], rows: ServerGroupRow[]): void;
    getGroupRows(parentKey: unknown[]): ServerGroupRow[] | undefined;
    private keyToString;
}
//# sourceMappingURL=server-group-manager.d.ts.map