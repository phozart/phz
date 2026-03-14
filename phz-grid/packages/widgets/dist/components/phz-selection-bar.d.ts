/**
 * @phozart/widgets — Selection Bar
 *
 * Global filter bar that scopes all widgets. Renders selection fields as dropdowns, chips, etc.
 */
import { LitElement, nothing } from 'lit';
import type { SelectionContext, SelectionFieldDef } from '@phozart/core';
export declare class PhzSelectionBar extends LitElement {
    static styles: import("lit").CSSResult[];
    fields: SelectionFieldDef[];
    selectionContext: SelectionContext;
    persistTo: 'url' | 'storage' | 'none';
    private emitChange;
    private handleSingleSelect;
    private handleMultiSelect;
    private handleChipToggle;
    private handleTextInput;
    private renderField;
    render(): typeof nothing | import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-selection-bar': PhzSelectionBar;
    }
}
//# sourceMappingURL=phz-selection-bar.d.ts.map