/**
 * @phozart/criteria — Chip Select
 *
 * Multi-select pill-based selector. Each option renders as a toggleable chip.
 */
import { LitElement } from 'lit';
import type { SelectionFieldOption, CriteriaSelectionMode } from '@phozart/core';
export declare class PhzChipSelect extends LitElement {
    static styles: import("lit").CSSResult[];
    options: SelectionFieldOption[];
    value: string[];
    disabled: boolean;
    selectionMode: CriteriaSelectionMode | undefined;
    private get _effectiveDisabled();
    private _toggle;
    render(): import("lit-html").TemplateResult<1>;
}
//# sourceMappingURL=phz-chip-select.d.ts.map