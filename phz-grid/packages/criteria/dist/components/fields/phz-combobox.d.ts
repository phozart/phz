/**
 * @phozart/phz-criteria — Combobox
 *
 * General-purpose autocomplete combobox. Drop-in replacement for native
 * <select> elements with type-to-filter capability.
 *
 * WAI-ARIA combobox pattern: role="combobox", aria-expanded,
 * aria-activedescendant, role="listbox", role="option", aria-selected.
 *
 * CSS prefix: phz-cb- (self-contained Shadow DOM, no shared-styles dependency).
 */
import { LitElement } from 'lit';
export interface ComboboxOption {
    value: string;
    label: string;
}
/** Filter options by case-insensitive substring match on label or value. */
export declare function filterComboboxOptions(options: ComboboxOption[], query: string, allowEmpty: boolean, emptyLabel: string): ComboboxOption[];
/** Resolve display label for a given value. */
export declare function resolveComboboxLabel(options: ComboboxOption[], value: string, emptyLabel: string, placeholder: string): string;
export declare class PhzCombobox extends LitElement {
    static styles: import("lit").CSSResult;
    options: ComboboxOption[];
    value: string;
    placeholder: string;
    disabled: boolean;
    allowEmpty: boolean;
    emptyLabel: string;
    private _open;
    private _query;
    private _highlightIndex;
    private get _filteredOptions();
    private get _displayLabel();
    private _open_dropdown;
    private _close;
    private _selectOption;
    private _onTriggerClick;
    private _onTriggerKeydown;
    private _onSearchInput;
    private _onSearchKeydown;
    private _scrollHighlightIntoView;
    private _onClickOutside;
    connectedCallback(): void;
    disconnectedCallback(): void;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-combobox': PhzCombobox;
    }
}
//# sourceMappingURL=phz-combobox.d.ts.map