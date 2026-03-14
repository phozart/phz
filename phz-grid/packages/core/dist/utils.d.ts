/**
 * @phozart/core — Immutable Utility Functions
 */
import type { TreeNode, TreeLevelConfig } from './types/selection-context.js';
export declare function immutableUpdate<T extends object>(obj: T, updates: Partial<T>): T;
export declare function immutableArrayUpdate<T>(arr: ReadonlyArray<T>, index: number, update: Partial<T>): ReadonlyArray<T>;
export declare function immutableArrayInsert<T>(arr: ReadonlyArray<T>, index: number, item: T): ReadonlyArray<T>;
export declare function immutableArrayRemove<T>(arr: ReadonlyArray<T>, index: number): ReadonlyArray<T>;
export declare function immutableMapUpdate<K, V>(map: ReadonlyMap<K, V>, key: K, value: V): ReadonlyMap<K, V>;
export declare function immutableMapDelete<K, V>(map: ReadonlyMap<K, V>, key: K): ReadonlyMap<K, V>;
export declare function immutableSetAdd<T>(set: ReadonlySet<T>, item: T): ReadonlySet<T>;
export declare function immutableSetDelete<T>(set: ReadonlySet<T>, item: T): ReadonlySet<T>;
export declare function generateRowId(): string;
export declare function serializeCellPosition(pos: {
    rowId: string | number;
    field: string;
}): string;
export declare function deserializeCellPosition(key: string): {
    rowId: string;
    field: string;
};
export declare function resolveLabelTemplate(template: string, row: Record<string, unknown>): string;
export declare function buildTreeFromSource(rows: Record<string, unknown>[], levels: TreeLevelConfig[]): TreeNode[];
//# sourceMappingURL=utils.d.ts.map