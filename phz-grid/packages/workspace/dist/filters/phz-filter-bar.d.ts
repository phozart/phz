/**
 * @phozart/phz-workspace — Filter Bar Utilities (O.5 + O.5a)
 *
 * Auto-select filter UI type from field type/cardinality.
 * Build date filter options from TimeIntelligenceConfig.
 *
 * Lit component rendering is intentionally excluded here
 * (requires browser environment). This module provides the
 * headless logic that a Lit component would consume.
 */
import type { FilterUIType } from '../types.js';
import type { FieldMetadata, TimeIntelligenceConfig } from '../data-adapter.js';
export interface InferOptions {
    hasTimeIntelligence?: boolean;
}
export declare function inferFilterUIType(field: FieldMetadata, options?: InferOptions): FilterUIType;
export interface DateFilterOption {
    id: string;
    label: string;
}
export declare function buildDateFilterOptions(config: TimeIntelligenceConfig): DateFilterOption[];
//# sourceMappingURL=phz-filter-bar.d.ts.map