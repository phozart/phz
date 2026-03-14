/**
 * @phozart/grid — Built-in Cell Editors
 */
import { type TemplateResult } from 'lit';
import type { RowData, ColumnDefinition } from '@phozart/core';
import { PhzCellEditor } from './base-editor.js';
export declare class TextCellEditor extends PhzCellEditor {
    static styles: import("lit").CSSResult;
    private inputEl;
    renderEditor(value: unknown): TemplateResult;
    getValue(): unknown;
    focusEditor(): void;
    private handleKeyDown;
}
export declare class NumberCellEditor extends PhzCellEditor {
    static styles: import("lit").CSSResult;
    private inputEl;
    renderEditor(value: unknown): TemplateResult;
    getValue(): unknown;
    focusEditor(): void;
    private handleKeyDown;
}
export declare class SelectCellEditor extends PhzCellEditor {
    static styles: import("lit").CSSResult;
    private selectEl;
    renderEditor(value: unknown, _row: RowData, column: ColumnDefinition): TemplateResult;
    getValue(): unknown;
    focusEditor(): void;
    private handleChange;
    private handleKeyDown;
}
export declare class DateCellEditor extends PhzCellEditor {
    static styles: import("lit").CSSResult;
    private inputEl;
    renderEditor(value: unknown): TemplateResult;
    getValue(): unknown;
    focusEditor(): void;
    private handleKeyDown;
}
export declare class CheckboxCellEditor extends PhzCellEditor {
    static styles: import("lit").CSSResult;
    private inputEl;
    renderEditor(value: unknown): TemplateResult;
    getValue(): unknown;
    focusEditor(): void;
    private handleChange;
    private handleKeyDown;
}
//# sourceMappingURL=built-in.d.ts.map