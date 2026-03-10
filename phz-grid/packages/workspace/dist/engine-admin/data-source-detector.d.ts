/**
 * @phozart/phz-engine-admin — Data Source Detector
 *
 * Pure utility functions for schema detection, delimiter detection,
 * CSV parsing, and source config validation.
 */
export interface DetectedField {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date';
    nullable: boolean;
}
export interface CSVParseOptions {
    delimiter: string;
    hasHeader: boolean;
    maxRows: number;
}
export interface CSVParseResult {
    headers: string[];
    rows: Record<string, string>[];
}
export interface ValidationResult {
    valid: boolean;
    error?: string;
}
export type SourceType = 'json' | 'csv' | 'rest' | 'duckdb';
export declare function detectSchema(data: Record<string, unknown>[]): DetectedField[];
export declare function detectDelimiter(text: string): string;
export declare function parseCSVPreview(text: string, options: CSVParseOptions): CSVParseResult;
export declare function validateSourceConfig(sourceType: SourceType, config: Record<string, unknown>): ValidationResult;
//# sourceMappingURL=data-source-detector.d.ts.map