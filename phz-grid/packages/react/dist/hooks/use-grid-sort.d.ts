import { type RefObject } from 'react';
import type { GridApi, SortState } from '@phozart/core';
export declare function useGridSort(gridRef: RefObject<GridApi | null>): {
    sortState: SortState | null;
    sort: (field: string, direction: "asc" | "desc" | null) => void | undefined;
    multiSort: (sorts: Array<{
        field: string;
        direction: "asc" | "desc";
    }>) => void | undefined;
    clearSort: () => void | undefined;
};
//# sourceMappingURL=use-grid-sort.d.ts.map