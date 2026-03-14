/**
 * @phozart/criteria — Preset Sidebar
 *
 * Vertical list of saved presets grouped by scope (Shared, Personal).
 * Used inside the expanded modal sidebar.
 */
import { LitElement } from 'lit';
import type { SelectionPreset } from '@phozart/core';
export declare class PhzPresetSidebar extends LitElement {
    static styles: import("lit").CSSResult[];
    presets: SelectionPreset[];
    activePresetId: string | null;
    private _select;
    render(): import("lit-html").TemplateResult<1>;
}
//# sourceMappingURL=phz-preset-sidebar.d.ts.map