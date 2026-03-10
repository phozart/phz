/**
 * W.2 — FileUploadManager
 *
 * File format detection, upload options, filename validation,
 * and accept attribute generation for file inputs.
 */
export type FileFormat = 'csv' | 'excel' | 'parquet' | 'json' | 'unknown';
export declare const SUPPORTED_FORMATS: FileFormat[];
export declare function detectFileFormat(filename: string): FileFormat;
export interface UploadOptions {
    hasHeader: boolean;
    delimiter?: string;
    encoding?: string;
    sheetIndex?: number;
}
export declare function createUploadOptions(format: FileFormat, overrides?: Partial<UploadOptions>): UploadOptions;
export interface FileNameValidation {
    valid: boolean;
    tableName: string;
    error?: string;
}
export declare function validateFileName(filename: string): FileNameValidation;
export declare function getAcceptAttribute(): string;
//# sourceMappingURL=file-upload-manager.d.ts.map