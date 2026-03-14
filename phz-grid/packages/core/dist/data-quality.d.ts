/**
 * @phozart/core — Data Quality Metrics (DIFF-9)
 *
 * Computes aggregate data quality metrics: completeness score,
 * missing value counts, duplicate detection, and health grade.
 */
export type HealthGrade = 'A' | 'B' | 'C' | 'D' | 'F';
export interface DataQualityMetrics {
    totalRows: number;
    totalFields: number;
    completeness: number;
    missingByField: Record<string, number>;
    duplicateRows: number;
    healthGrade: HealthGrade;
}
/**
 * Compute data quality metrics for a dataset.
 */
export declare function computeDataQualityMetrics(data: Record<string, unknown>[], fields: string[]): DataQualityMetrics;
//# sourceMappingURL=data-quality.d.ts.map