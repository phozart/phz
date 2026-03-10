/**
 * @phozart/phz-engine/explorer — Aggregation Validation
 *
 * Validates aggregation compatibility with field data types.
 * Extracted from workspace format-value.ts in v15 (A-2.01).
 */
import type { FieldMetadata } from '@phozart/phz-shared/adapters';
export interface AggregationWarning {
    severity: 'warning' | 'error';
    message: string;
    field: string;
    aggregation: string;
}
export declare function validateAggregation(field: FieldMetadata, aggregation: string): AggregationWarning | null;
//# sourceMappingURL=aggregation-validation.d.ts.map