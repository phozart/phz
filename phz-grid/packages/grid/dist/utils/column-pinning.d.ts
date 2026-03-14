import type { ColumnDefinition } from '@phozart/core';
export interface PinnedColumnGroup {
    left: ColumnDefinition[];
    scrollable: ColumnDefinition[];
    right: ColumnDefinition[];
    hasPinned: boolean;
}
export declare function splitPinnedColumns(columns: ColumnDefinition[], pinOverrides?: Record<string, 'left' | 'right' | null>): PinnedColumnGroup;
export declare function computePinnedOffsets(columns: ColumnDefinition[], side: 'left' | 'right'): number[];
export declare function getPinnedStyle(col: ColumnDefinition, offset: number, side: 'left' | 'right'): string;
//# sourceMappingURL=column-pinning.d.ts.map