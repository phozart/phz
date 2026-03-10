import { type RefObject } from 'react';
import type { GridApi, RowId, CellPosition } from '@phozart/phz-core';
export declare function useGridSelection(gridRef: RefObject<GridApi | null>): {
    selectedRows: RowId[];
    selectedCells: CellPosition[];
    select: (rowIds: RowId | RowId[]) => void | undefined;
    deselect: (rowIds: RowId | RowId[]) => void | undefined;
    selectAll: () => void | undefined;
    deselectAll: () => void | undefined;
    selectRange: (start: CellPosition, end: CellPosition) => void | undefined;
};
//# sourceMappingURL=use-grid-selection.d.ts.map