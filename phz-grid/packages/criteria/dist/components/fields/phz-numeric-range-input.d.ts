/**
 * @phozart/criteria — Numeric Range Input
 *
 * Min/Max inputs with optional dual-thumb slider and unit label.
 */
import { LitElement } from 'lit';
import type { NumericRangeFieldConfig, NumericRangeValue } from '@phozart/core';
export declare class PhzNumericRangeInput extends LitElement {
    static styles: import("lit").CSSResult[];
    config: NumericRangeFieldConfig;
    value: NumericRangeValue | null;
    disabled: boolean;
    private _fireChange;
    private _onMinInput;
    private _onMaxInput;
    private _onMinSlider;
    private _onMaxSlider;
    render(): import("lit-html").TemplateResult<1>;
}
//# sourceMappingURL=phz-numeric-range-input.d.ts.map