import { type RefObject } from 'react';
import type { GridApi, FilterState, FilterOperator } from '@phozart/phz-core';
export declare function useGridFilter(gridRef: RefObject<GridApi | null>): {
    filterState: FilterState | null;
    addFilter: (field: string, operator: FilterOperator, value: unknown) => void | undefined;
    removeFilter: (field: string) => void | undefined;
    clearFilters: () => void | undefined;
    savePreset: (name: string) => void | undefined;
    loadPreset: (name: string) => void | undefined;
};
//# sourceMappingURL=use-grid-filter.d.ts.map