import { type RefObject } from 'react';
import type { GridApi, EditState, CellPosition, RowId } from '@phozart/core';
export declare function useGridEdit(gridRef: RefObject<GridApi | null>): {
    editState: EditState | null;
    startEdit: (position: CellPosition) => void | undefined;
    commitEdit: (position: CellPosition, value: unknown) => Promise<boolean>;
    cancelEdit: (position: CellPosition) => void | undefined;
    isDirty: boolean;
    dirtyRows: RowId[];
};
//# sourceMappingURL=use-grid-edit.d.ts.map