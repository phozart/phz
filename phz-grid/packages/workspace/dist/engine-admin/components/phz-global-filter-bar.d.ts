/**
 * @phozart/phz-engine-admin — Global Filter Bar
 *
 * Horizontal bar with per-filter dropdowns, multi-selects, date ranges, and text searches.
 * Auto-populates filter options from unique data values.
 */
import { LitElement } from 'lit';
import type { GlobalFilter } from '@phozart/phz-engine';
interface FieldInfo {
    name: string;
    type: string;
}
export declare class PhzGlobalFilterBar extends LitElement {
    static styles: import("lit").CSSResult[];
    filters: GlobalFilter[];
    data: Record<string, unknown>[];
    fields: FieldInfo[];
    private activeValues;
    private showAddPicker;
    private expandedMultiSelect?;
    private getUniqueValues;
    private detectFilterType;
    private handleFilterChange;
    private handleMultiSelectChange;
    private addFilter;
    private removeFilter;
    private clearAll;
    private emitChange;
    private renderFilterControl;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-global-filter-bar': PhzGlobalFilterBar;
    }
}
export {};
//# sourceMappingURL=phz-global-filter-bar.d.ts.map