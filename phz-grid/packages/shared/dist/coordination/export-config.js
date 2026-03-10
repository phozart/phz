/**
 * @phozart/phz-shared — Grid Export Config (A-2.08)
 *
 * Configuration for grid data export. Defines which formats are available,
 * row limits, and when to use async export for large datasets.
 *
 * Pure types and functions only — no side effects.
 */
// ========================================================================
// createDefaultExportConfig
// ========================================================================
/**
 * Creates a default export configuration with CSV and XLSX enabled,
 * headers included, and group summaries included.
 */
export function createDefaultExportConfig(overrides) {
    return {
        enabledFormats: ['csv', 'xlsx'],
        includeHeaders: true,
        includeGroupSummary: true,
        asyncThreshold: 10_000,
        ...overrides,
    };
}
// ========================================================================
// shouldUseAsyncExport
// ========================================================================
/**
 * Determines whether an export operation should use the async path.
 *
 * Returns `true` when:
 * - `asyncThreshold` is defined, AND
 * - `rowCount` exceeds the threshold
 */
export function shouldUseAsyncExport(config, rowCount) {
    if (config.asyncThreshold === undefined)
        return false;
    return rowCount > config.asyncThreshold;
}
// ========================================================================
// isFormatEnabled
// ========================================================================
/**
 * Checks whether a specific export format is enabled in the config.
 */
export function isFormatEnabled(config, format) {
    return config.enabledFormats.includes(format);
}
//# sourceMappingURL=export-config.js.map