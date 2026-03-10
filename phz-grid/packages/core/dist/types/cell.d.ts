/**
 * @phozart/phz-core — Cell Types
 */
import type { RowId } from './row.js';
export interface CellPosition {
    rowId: RowId;
    field: string;
}
export interface CellRange {
    start: CellPosition;
    end: CellPosition;
}
export type CellValue = string | number | boolean | Date | null | undefined;
//# sourceMappingURL=cell.d.ts.map