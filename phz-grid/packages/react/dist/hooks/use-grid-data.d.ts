import { type RefObject } from 'react';
import type { GridApi, RowData, RowId } from '@phozart/phz-core';
export declare function useGridData(gridRef: RefObject<GridApi | null>): {
    data: RowData<any>[];
    setData: (newData: unknown[]) => void | undefined;
    addRow: (rowData: Record<string, unknown>, position?: number) => RowId;
    updateRow: (id: RowId, rowData: Partial<Record<string, unknown>>) => void | undefined;
    deleteRow: (id: RowId) => void | undefined;
};
//# sourceMappingURL=use-grid-data.d.ts.map