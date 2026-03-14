/**
 * @phozart/workspace — Variant Picker
 *
 * Lit component for displaying widget variant cards.
 * Emits 'variant-select' when a variant is chosen.
 */
import { LitElement } from 'lit';
import type { WidgetVariant } from '../types.js';
export declare function filterVariants(variants: WidgetVariant[], query: string): WidgetVariant[];
export declare function sortVariantsByName(variants: WidgetVariant[]): WidgetVariant[];
export declare class PhzVariantPicker extends LitElement {
    static styles: import("lit").CSSResult;
    variants: WidgetVariant[];
    selectedId?: string;
    private _searchQuery;
    render(): import("lit-html").TemplateResult<1>;
    private _select;
}
//# sourceMappingURL=phz-variant-picker.d.ts.map