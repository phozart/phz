/**
 * @phozart/workspace — Shadow Picker Micro-Component
 *
 * 4-option visual selector (none/sm/md/lg) showing card previews.
 * Fires 'shadow-changed' event with { detail: { shadow: string } }.
 */
import { LitElement } from 'lit';
export type ShadowLevel = 'none' | 'sm' | 'md' | 'lg';
export declare const SHADOW_VALUES: Record<ShadowLevel, string>;
export declare class PhzShadowPicker extends LitElement {
    value: ShadowLevel;
    label: string;
    static styles: import("lit").CSSResult;
    private _select;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-shadow-picker': PhzShadowPicker;
    }
}
//# sourceMappingURL=phz-shadow-picker.d.ts.map