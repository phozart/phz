/**
 * @phozart/phz-core — Configuration Types
 */
import type { ColumnDefinition } from './column.js';
import type { GridState } from './state.js';
import type { Plugin } from './plugin.js';
import type { UserRole } from './common.js';
import type { QueryBackend } from './query-backend.js';
import type { ProgressiveLoadConfig } from '../progressive-load.js';
/**
 * Grid configuration provided to createGrid().
 */
export interface GridConfig<TData = any> {
    data: unknown[];
    columns?: ColumnDefinition<TData>[];
    autoColumns?: boolean;
    rowIdField?: string;
    initialState?: Partial<GridState<TData>>;
    plugins?: Plugin[];
    enableVirtualization?: boolean;
    enableSelection?: boolean;
    enableEditing?: boolean;
    enableSorting?: boolean;
    enableFiltering?: boolean;
    features?: FeatureFlags;
    accessibility?: AccessibilityConfig;
    performance?: PerformanceConfig;
    queryBackend?: QueryBackend;
    progressiveLoad?: ProgressiveLoadConfig;
    userRole?: UserRole;
}
export interface FeatureFlags {
    virtualization?: boolean;
    selection?: boolean;
    editing?: boolean;
    sorting?: boolean;
    filtering?: boolean;
    grouping?: boolean;
    columnResize?: boolean;
    columnReorder?: boolean;
    columnFreeze?: boolean;
    responsive?: boolean;
}
export interface AccessibilityConfig {
    enabled?: boolean;
    announceChanges?: boolean;
    ariaLabels?: AriaLabels;
    keyboardNavigation?: boolean;
    focusMode?: 'cell' | 'row' | 'none';
}
export interface AriaLabels {
    grid?: string;
    rowGroup?: string;
    columnHeader?: string;
    cell?: string;
    sortAscending?: string;
    sortDescending?: string;
    filterActive?: string;
    selectedRow?: string;
    expandedGroup?: string;
    collapsedGroup?: string;
}
export interface PerformanceConfig {
    virtualScrollOverscan?: number;
    batchSize?: number;
    debounceMs?: number;
    enableWorkers?: boolean;
}
//# sourceMappingURL=config.d.ts.map