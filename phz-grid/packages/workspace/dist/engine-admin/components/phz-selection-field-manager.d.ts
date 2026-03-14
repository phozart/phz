/**
 * @phozart/engine-admin — Selection Field Manager
 *
 * CRUD for selection field definitions. Embeddable component.
 */
import { LitElement } from 'lit';
import type { SelectionFieldDef } from '@phozart/core';
export declare class PhzSelectionFieldManager extends LitElement {
    static styles: import("lit").CSSResult[];
    fields: SelectionFieldDef[];
    private editingId?;
    private handleAdd;
    private handleRemove;
    private handleEdit;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-selection-field-manager': PhzSelectionFieldManager;
    }
}
//# sourceMappingURL=phz-selection-field-manager.d.ts.map