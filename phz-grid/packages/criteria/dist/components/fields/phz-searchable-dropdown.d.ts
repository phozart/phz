/**
 * @phozart/criteria — Searchable Dropdown
 *
 * Text input + dropdown with type-ahead, debounced filtering.
 * WAI-ARIA combobox pattern.
 */
import { LitElement } from 'lit';
import type { SelectionFieldOption, SearchFieldConfig } from '@phozart/core';
/** Filter search options respecting matchMode and multiValue config. */
export declare function filterSearchOptions(options: SelectionFieldOption[], query: string, config: SearchFieldConfig): SelectionFieldOption[];
export declare class PhzSearchableDropdown extends LitElement {
    static styles: import("lit").CSSResult[];
    options: SelectionFieldOption[];
    config: SearchFieldConfig;
    value: string;
    disabled: boolean;
    private _query;
    private _open;
    private _highlightIndex;
    private _debounceTimer;
    private get _filteredOptions();
    private _onInput;
    private _onKeydown;
    private _selectOption;
    private _onFocus;
    private _onBlur;
    /** Emit the raw query text as the value (for multiValue free-text mode). */
    private _emitRawQuery;
    render(): import("lit-html").TemplateResult<1>;
}
//# sourceMappingURL=phz-searchable-dropdown.d.ts.map