/**
 * @phozart/grid — <phz-column> Custom Element
 *
 * Declarative column definition element. Used as a child of <phz-grid>
 * to define columns via HTML attributes instead of JavaScript config.
 */
import { LitElement } from 'lit';
import type { ColumnDefinition, ColumnType } from '@phozart/core';
export declare class PhzColumn extends LitElement {
    field: string;
    header: string;
    colWidth: number;
    minWidth: number;
    maxWidth: number;
    sortable: boolean;
    filterable: boolean;
    editable: boolean;
    resizable: boolean;
    type: ColumnType;
    priority: 1 | 2 | 3;
    frozen: 'left' | 'right' | null;
    static readonly slots: {
        readonly header: "Custom column header";
        readonly cell: "Custom cell template";
        readonly editor: "Custom cell editor";
        readonly filter: "Custom filter UI";
    };
    static styles: import("lit").CSSResult;
    toColumnDefinition(): ColumnDefinition;
    protected render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-column': PhzColumn;
    }
}
//# sourceMappingURL=phz-column.d.ts.map