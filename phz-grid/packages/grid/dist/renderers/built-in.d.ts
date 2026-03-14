/**
 * @phozart/grid — Built-in Cell Renderers
 */
import { type TemplateResult } from 'lit';
import type { RowData, ColumnDefinition } from '@phozart/core';
import { PhzCellRenderer } from './base-renderer.js';
export declare class TextCellRenderer extends PhzCellRenderer {
    renderCell(value: unknown): TemplateResult;
}
export declare class NumberCellRenderer extends PhzCellRenderer {
    static styles: import("lit").CSSResult;
    renderCell(value: unknown): TemplateResult;
}
export declare class DateCellRenderer extends PhzCellRenderer {
    renderCell(value: unknown): TemplateResult;
}
export declare class BooleanCellRenderer extends PhzCellRenderer {
    static styles: import("lit").CSSResult;
    renderCell(value: unknown): TemplateResult;
}
export declare class LinkCellRenderer extends PhzCellRenderer {
    renderCell(value: unknown, row: RowData, column: ColumnDefinition): TemplateResult;
}
export declare class ImageCellRenderer extends PhzCellRenderer {
    static styles: import("lit").CSSResult;
    renderCell(value: unknown): TemplateResult;
}
export declare class ProgressCellRenderer extends PhzCellRenderer {
    static styles: import("lit").CSSResult;
    renderCell(value: unknown): TemplateResult;
}
//# sourceMappingURL=built-in.d.ts.map