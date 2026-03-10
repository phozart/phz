/**
 * W.7 — Cross-Tier Session Compatibility
 *
 * Shared format for session export/import between browser (OPFS)
 * and phz-local server. ZIP round-trip support.
 */
// ========================================================================
// Version
// ========================================================================
export const SESSION_FORMAT_VERSION = 1;
export function createExportBundle(input) {
    return {
        version: SESSION_FORMAT_VERSION,
        sessionName: input.sessionName,
        tables: [...input.tables],
        exportedAt: Date.now(),
        source: input.source,
    };
}
export function validateExportBundle(data) {
    if (data == null || typeof data !== 'object') {
        return { valid: false, errors: ['Invalid bundle data'] };
    }
    const obj = data;
    const errors = [];
    if (typeof obj.version !== 'number') {
        errors.push('Missing or invalid version');
    }
    else if (obj.version > SESSION_FORMAT_VERSION) {
        errors.push(`Unsupported version: ${obj.version}. Max supported: ${SESSION_FORMAT_VERSION}`);
    }
    if (typeof obj.sessionName !== 'string') {
        errors.push('Missing sessionName');
    }
    return errors.length === 0
        ? { valid: true, errors: [] }
        : { valid: false, errors };
}
// ========================================================================
// Source Detection
// ========================================================================
export function isLocalServerBundle(data) {
    if (data == null || typeof data !== 'object')
        return false;
    return data.source === 'phz-local';
}
export function convertBundleForImport(bundle) {
    return {
        version: bundle.version,
        sessionName: bundle.sessionName,
        tables: [...bundle.tables],
        exportedAt: bundle.exportedAt,
    };
}
//# sourceMappingURL=session-compat.js.map