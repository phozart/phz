/**
 * @phozart/phz-workspace — Format Value Utility
 *
 * Formats numeric values according to UnitSpec using Intl.NumberFormat.
 * Also validates aggregation compatibility with field data types.
 */
import type { UnitSpec, FieldMetadata } from '../data-adapter.js';
export interface AggregationWarning {
    severity: 'warning' | 'error';
    message: string;
    field: string;
    aggregation: string;
}
export declare function formatValue(value: number | null, unit: UnitSpec | undefined, locale: string, options?: {
    compact?: boolean;
}): string;
export declare function validateAggregation(field: FieldMetadata, aggregation: string): AggregationWarning | null;
//# sourceMappingURL=format-value.d.ts.map