/**
 * @phozart/phz-workspace — Slider Input Micro-Component
 *
 * Range input with numeric readout and label.
 * Fires 'value-changed' event with { detail: { value: number } }.
 */
import { LitElement } from 'lit';
export declare class PhzSliderInput extends LitElement {
    value: number;
    min: number;
    max: number;
    step: number;
    label: string;
    suffix: string;
    static styles: import("lit").CSSResult;
    private _onChange;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-slider-input': PhzSliderInput;
    }
}
//# sourceMappingURL=phz-slider-input.d.ts.map