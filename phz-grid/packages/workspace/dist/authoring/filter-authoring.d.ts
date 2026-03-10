/**
 * @phozart/phz-workspace — Filter Authoring
 *
 * Multi-entry-point filter creation. All entry points produce
 * the same FilterValue output regardless of how the user triggered it.
 */
import type { FilterValue, FilterOperator, FilterUIType, DashboardFilterDef } from '../types.js';
export type FilterEntryPoint = 'drag-field-to-filter-bar' | 'context-menu-filter-by-value' | 'context-menu-add-filter' | 'config-panel-filters-tab' | 'filter-bar-add-button';
export interface FilterCreationState {
    entryPoint: FilterEntryPoint;
    field: string;
    dataType: string;
    prefilledValue?: unknown;
    suggestedOperator: FilterOperator;
    suggestedUIType: FilterUIType;
}
export declare function inferFilterDefaults(dataType: string, cardinality?: 'low' | 'medium' | 'high'): {
    operator: FilterOperator;
    uiType: FilterUIType;
};
export declare function createFilterFromEntry(entryPoint: FilterEntryPoint, field: string, dataType: string, value?: unknown, cardinality?: 'low' | 'medium' | 'high'): FilterCreationState;
export declare function finalizeFilter(creation: FilterCreationState, userChoices?: {
    operator?: FilterOperator;
    value?: unknown;
}): FilterValue;
export declare function createDashboardFilterDef(field: string, dataSourceId: string, options?: {
    label?: string;
    filterType?: FilterUIType;
    required?: boolean;
    appliesTo?: string[];
}): DashboardFilterDef;
export declare function _resetFilterIdCounter(): void;
//# sourceMappingURL=filter-authoring.d.ts.map