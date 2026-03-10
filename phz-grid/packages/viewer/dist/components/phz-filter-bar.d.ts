/**
 * @phozart/phz-viewer — <phz-filter-bar> Custom Element
 *
 * Filter bar for dashboards and reports. Shows active filters,
 * preset selection, and filter value editing.
 */
import { LitElement, type TemplateResult } from 'lit';
import type { FilterPresetValue } from '@phozart/phz-shared/types';
import type { DashboardFilterDef, FilterValue } from '@phozart/phz-shared/coordination';
import { type FilterBarState } from '../screens/filter-bar-state.js';
export declare class PhzFilterBar extends LitElement {
    static styles: import("lit").CSSResult;
    filters: DashboardFilterDef[];
    presets: FilterPresetValue[];
    collapsed: boolean;
    private _filterBarState;
    willUpdate(changed: Map<string, unknown>): void;
    getFilterBarState(): FilterBarState;
    setFilterVal(filterValue: FilterValue): void;
    clearFilter(filterId: string): void;
    clearAll(): void;
    render(): TemplateResult;
    private _handleChipClick;
    private _handleClearAll;
    private _handleToggleCollapse;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-filter-bar': PhzFilterBar;
    }
}
//# sourceMappingURL=phz-filter-bar.d.ts.map