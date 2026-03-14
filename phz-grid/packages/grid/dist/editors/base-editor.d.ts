/**
 * @phozart/grid — PhzCellEditor (Abstract Base)
 *
 * All custom cell editors extend this class.
 */
import { LitElement, type TemplateResult } from 'lit';
import type { RowData, ColumnDefinition } from '@phozart/core';
export declare abstract class PhzCellEditor extends LitElement {
    value: unknown;
    row: RowData | null;
    column: ColumnDefinition | null;
    abstract renderEditor(value: unknown, row: RowData, column: ColumnDefinition): TemplateResult;
    abstract getValue(): unknown;
    abstract focusEditor(): void;
    protected render(): TemplateResult;
    connectedCallback(): void;
}
//# sourceMappingURL=base-editor.d.ts.map