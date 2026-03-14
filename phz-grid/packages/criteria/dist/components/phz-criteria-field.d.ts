/**
 * @phozart/criteria — Criteria Field
 *
 * Individual criterion renderer. Switch-renders based on fieldDef.type.
 */
import { LitElement, nothing } from 'lit';
import type { SelectionFieldDef, SelectionFieldOption } from '@phozart/core';
import './fields/phz-date-range-picker.js';
import './fields/phz-numeric-range-input.js';
import './fields/phz-tree-select.js';
import './fields/phz-searchable-dropdown.js';
import './fields/phz-field-presence-filter.js';
export declare class PhzCriteriaField extends LitElement {
    static styles: import("lit").CSSResult[];
    fieldDef: SelectionFieldDef;
    value: string | string[] | null;
    filteredOptions: SelectionFieldOption[];
    locked: boolean;
    private _fire;
    private _onSelectChange;
    private _onMultiSelectToggle;
    private _onChipToggle;
    private _onTextInput;
    private _onDateRangeChange;
    private _onNumericRangeChange;
    private _onTreeChange;
    private _onSearchSelect;
    private _onPresenceChange;
    private _renderField;
    render(): import("lit-html").TemplateResult<1> | typeof nothing;
}
//# sourceMappingURL=phz-criteria-field.d.ts.map