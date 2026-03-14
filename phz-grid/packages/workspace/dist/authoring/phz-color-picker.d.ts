/**
 * @phozart/workspace — Color Picker Micro-Component
 *
 * 19-color swatch grid from design tokens + custom hex input.
 * Fires 'color-changed' event with { detail: { color: string } }.
 */
import { LitElement } from 'lit';
export declare const SWATCH_COLORS: string[];
export declare class PhzColorPicker extends LitElement {
    value: string;
    label: string;
    static styles: import("lit").CSSResult;
    private _selectColor;
    private _onHexInput;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-color-picker': PhzColorPicker;
    }
}
//# sourceMappingURL=phz-color-picker.d.ts.map