/**
 * @phozart/core — Column Auto-Inference
 *
 * Infers ColumnDefinition[] from raw data shape.
 * Runs once at createGrid() time, not per-render.
 */
import type { ColumnDefinition, ColumnType } from './types/column.js';
export interface InferColumnsOptions {
    sampleSize?: number;
}
/**
 * Convert a field key to a human-readable header.
 * camelCase → "Camel Case", snake_case → "Snake Case"
 */
export declare function formatFieldAsHeader(field: string): string;
/**
 * Detect the column type from sampled values.
 * Priority: boolean > number > date > string. Mixed → string.
 */
export declare function detectColumnType(values: unknown[]): ColumnType;
/**
 * Infer column definitions from data shape.
 * Returns [] if data is empty or first row is not a plain object.
 */
export declare function inferColumns(data: unknown[], options?: InferColumnsOptions): ColumnDefinition[];
//# sourceMappingURL=infer-columns.d.ts.map