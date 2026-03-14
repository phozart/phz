/**
 * @phozart/grid — PhzCellRenderer (Abstract Base)
 *
 * All custom cell renderers extend this class.
 */
import { LitElement, type TemplateResult } from 'lit';
import type { RowData, ColumnDefinition } from '@phozart/core';
export declare abstract class PhzCellRenderer extends LitElement {
    value: unknown;
    row: RowData | null;
    column: ColumnDefinition | null;
    abstract renderCell(value: unknown, row: RowData, column: ColumnDefinition): TemplateResult;
    protected render(): TemplateResult;
}
//# sourceMappingURL=base-renderer.d.ts.map