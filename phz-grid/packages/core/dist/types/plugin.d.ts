/**
 * @phozart/phz-core — Plugin Types
 */
import type { RowId, RowData } from './row.js';
import type { CellPosition } from './cell.js';
import type { SortState, FilterState } from './state.js';
import type { GridApi } from './api.js';
export interface Plugin {
    id: string;
    name: string;
    version: string;
    hooks?: PluginHooks;
    initialize?(grid: GridApi): void;
    destroy?(): void;
}
export interface PluginHooks {
    beforeDataChange?(data: unknown[]): unknown[] | false;
    afterDataChange?(data: RowData[]): void;
    beforeSort?(state: SortState): SortState | false;
    afterSort?(state: SortState): void;
    beforeFilter?(state: FilterState): FilterState | false;
    afterFilter?(state: FilterState): void;
    beforeEdit?(position: CellPosition, value: unknown): unknown | false;
    afterEdit?(position: CellPosition, value: unknown): void;
    beforeSelect?(rowIds: RowId[]): RowId[] | false;
    afterSelect?(rowIds: RowId[]): void;
    beforeRender?(model: RowModelRef): RowModelRef | void;
    afterRender?(model: RowModelRef): void;
}
export interface RowModelRef {
    rows: RowData[];
    rowsById: Map<RowId, RowData>;
    flatRows: RowData[];
    rowCount: number;
}
//# sourceMappingURL=plugin.d.ts.map