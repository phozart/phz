/**
 * @phozart/workspace — Filter Value Handling Admin State (B-3.07)
 *
 * Pure functions for configuring FilterValueSource (data-source, lookup-table, static),
 * transform configuration, default value setup, and display options
 * (multi-select, free text, count display).
 */
import type { FilterValueSource, FilterValueTransform, FilterDefault } from '../types.js';
export interface FilterDisplayOptions {
    showCount: boolean;
    allowFreeText: boolean;
    multiSelect: boolean;
    searchable: boolean;
    maxVisibleItems: number;
    placeholder?: string;
    emptyStateText?: string;
}
export interface LookupEntry {
    value: string;
    label: string;
    order?: number;
}
export interface FilterValueAdminState {
    filterDefinitionId: string;
    valueSource: FilterValueSource;
    transform?: FilterValueTransform;
    defaultValue?: FilterDefault;
    displayOptions: FilterDisplayOptions;
    previewValues: unknown[];
    previewLoading: boolean;
    previewError?: string;
}
export declare function initialFilterValueAdminState(filterDefinitionId: string, valueSource?: FilterValueSource): FilterValueAdminState;
export declare function setValueSourceType(state: FilterValueAdminState, type: 'data-source' | 'lookup-table' | 'static'): FilterValueAdminState;
export declare function updateDataSourceConfig(state: FilterValueAdminState, dataSourceId: string, field: string): FilterValueAdminState;
export declare function setStaticValues(state: FilterValueAdminState, values: string[]): FilterValueAdminState;
export declare function addLookupEntry(state: FilterValueAdminState, entry: LookupEntry): FilterValueAdminState;
export declare function removeLookupEntry(state: FilterValueAdminState, value: string): FilterValueAdminState;
export declare function reorderLookupEntries(state: FilterValueAdminState, fromIndex: number, toIndex: number): FilterValueAdminState;
export declare function setTransform(state: FilterValueAdminState, transform: FilterValueTransform | undefined): FilterValueAdminState;
export declare function setDefaultValue(state: FilterValueAdminState, defaultValue: FilterDefault | undefined): FilterValueAdminState;
export declare function setStaticDefault(state: FilterValueAdminState, value: unknown): FilterValueAdminState;
export declare function setViewerAttributeDefault(state: FilterValueAdminState, attribute: string): FilterValueAdminState;
export declare function setRelativeDateDefault(state: FilterValueAdminState, offset: number, unit: 'days' | 'weeks' | 'months' | 'years'): FilterValueAdminState;
export declare function updateDisplayOptions(state: FilterValueAdminState, updates: Partial<FilterDisplayOptions>): FilterValueAdminState;
export declare function toggleMultiSelect(state: FilterValueAdminState): FilterValueAdminState;
export declare function toggleShowCount(state: FilterValueAdminState): FilterValueAdminState;
export declare function toggleFreeText(state: FilterValueAdminState): FilterValueAdminState;
export declare function setPreviewLoading(state: FilterValueAdminState, loading: boolean): FilterValueAdminState;
export declare function setPreviewValues(state: FilterValueAdminState, values: unknown[]): FilterValueAdminState;
export declare function setPreviewError(state: FilterValueAdminState, error: string): FilterValueAdminState;
export interface FilterValueValidation {
    valid: boolean;
    errors: string[];
}
export declare function validateFilterValueConfig(state: FilterValueAdminState): FilterValueValidation;
//# sourceMappingURL=filter-value-admin-state.d.ts.map