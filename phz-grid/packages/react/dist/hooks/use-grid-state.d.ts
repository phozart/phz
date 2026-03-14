import { type RefObject } from 'react';
import type { GridApi, GridState, SerializedGridState } from '@phozart/core';
export declare function useGridState(gridRef: RefObject<GridApi | null>): {
    state: GridState<any> | null;
    setState: (partial: Partial<GridState>) => void;
    exportState: () => SerializedGridState | null;
    importState: (s: SerializedGridState) => void;
};
//# sourceMappingURL=use-grid-state.d.ts.map