/**
 * @phozart/grid — Anomaly Detector
 *
 * Statistical anomaly detection for grid columns. Supports Z-score and IQR
 * methods. Zero external dependencies. Returns anomalies with scores and
 * reasons that can be fed into conditional formatting.
 */
import type { RowData, ColumnDefinition } from '@phozart/core';
export interface AnomalyResult {
    rowId: string | number;
    field: string;
    value: unknown;
    score: number;
    type: 'outlier' | 'missing' | 'inconsistent' | 'duplicate' | 'format';
    reason: string;
}
export interface AnomalyDetectionOptions {
    method?: 'zscore' | 'iqr' | 'auto';
    threshold?: number;
    includeNulls?: boolean;
    includeDuplicates?: boolean;
}
export declare function detectAnomalies(rows: RowData[], field: string, options?: AnomalyDetectionOptions): AnomalyResult[];
export declare function detectAllAnomalies(rows: RowData[], columns: ColumnDefinition[], options?: AnomalyDetectionOptions): Map<string, AnomalyResult[]>;
/**
 * Builds a lookup Map from anomaly results for O(1) access by field+rowId.
 * Key format: "field:rowId"
 */
export declare function buildAnomalyLookup(anomalyMap: Map<string, AnomalyResult[]>): Map<string, AnomalyResult>;
//# sourceMappingURL=anomaly-detector.d.ts.map