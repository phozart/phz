/**
 * @phozart/grid — <phz-view-switcher>
 *
 * Dropdown UI for switching between saved grid views.
 * Renders in the toolbar area. Shows active view name, dirty indicator,
 * and a dropdown list of available views.
 */
import { LitElement } from 'lit';
import type { ViewsSummary } from '@phozart/core';
export declare class PhzViewSwitcher extends LitElement {
    static styles: import("lit").CSSResult[];
    views: ViewsSummary[];
    isDirty: boolean;
    activeViewName: string;
    private _open;
    render(): import("lit-html").TemplateResult<1>;
    private _renderDropdown;
    private _toggle;
    private _selectView;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-view-switcher': PhzViewSwitcher;
    }
}
//# sourceMappingURL=phz-view-switcher.d.ts.map