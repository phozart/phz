/**
 * @phozart/workspace — Filter Bar Config Builder (L.9)
 *
 * Builds a DashboardFilterBarConfig from FieldMetadata[] using heuristics
 * to auto-select appropriate filter UI types.
 */
import type { FieldMetadata } from '../data-adapter.js';
import type { DashboardFilterBarConfig } from '../types.js';
export interface FilterBarConfigOptions {
    position?: 'top' | 'left';
    collapsible?: boolean;
    defaultCollapsed?: boolean;
    showActiveFilterCount?: boolean;
    showPresetPicker?: boolean;
}
export declare function buildFilterBarConfig(fields: FieldMetadata[], options?: FilterBarConfigOptions): DashboardFilterBarConfig;
//# sourceMappingURL=filter-bar-config-builder.d.ts.map