/**
 * W.2 — FileUploadManager
 *
 * File format detection, upload options, filename validation,
 * and accept attribute generation for file inputs.
 */
export const SUPPORTED_FORMATS = ['csv', 'excel', 'parquet', 'json'];
const EXTENSION_MAP = {
    '.csv': 'csv',
    '.tsv': 'csv',
    '.xlsx': 'excel',
    '.xls': 'excel',
    '.parquet': 'parquet',
    '.json': 'json',
    '.jsonl': 'json',
    '.ndjson': 'json',
};
// ========================================================================
// Format Detection
// ========================================================================
export function detectFileFormat(filename) {
    const lower = filename.toLowerCase();
    for (const [ext, format] of Object.entries(EXTENSION_MAP)) {
        if (lower.endsWith(ext))
            return format;
    }
    return 'unknown';
}
export function createUploadOptions(format, overrides) {
    const base = { hasHeader: true };
    switch (format) {
        case 'csv':
            return { ...base, delimiter: ',', encoding: 'utf-8', ...overrides };
        case 'excel':
            return { ...base, sheetIndex: 0, ...overrides };
        case 'parquet':
        case 'json':
        default:
            return { ...base, ...overrides };
    }
}
export function validateFileName(filename) {
    if (!filename) {
        return { valid: false, tableName: '', error: 'Filename is required' };
    }
    // Derive table name: remove extension, replace non-alphanumeric with _, lowercase
    const baseName = filename.replace(/\.[^.]+$/, '');
    const tableName = baseName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
    return { valid: true, tableName };
}
// ========================================================================
// Accept Attribute
// ========================================================================
export function getAcceptAttribute() {
    return '.csv,.tsv,.xlsx,.xls,.parquet,.json,.jsonl,.ndjson';
}
//# sourceMappingURL=file-upload-manager.js.map