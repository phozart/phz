/**
 * @phozart/grid-admin — Filter Preset Manager
 *
 * Manage filter presets: create, apply, duplicate, delete.
 * Embeddable component.
 */
import { LitElement } from 'lit';
import type { FilterPreset } from '@phozart/core';
export declare class PhzAdminFilters extends LitElement {
    static styles: import("lit").CSSResult[];
    presets: Record<string, FilterPreset>;
    activePreset?: string;
    private handleApply;
    private handleDelete;
    private handleDuplicate;
    private handleAdd;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-admin-filters': PhzAdminFilters;
    }
}
//# sourceMappingURL=phz-admin-filters.d.ts.map