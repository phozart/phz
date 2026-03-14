/**
 * @phozart/shared — Dashboard Data Pipeline types (A-1.05)
 *
 * Preload/full-load parallel data architecture types.
 * Pure types only — no DataAdapter dependency.
 *
 * Extracted from workspace/coordination/dashboard-data-pipeline.ts.
 */
// ========================================================================
// migrateLegacyDataConfig — converts legacy format to multi-source format
// ========================================================================
/**
 * Wraps a legacy `{preload, fullLoad}` config into the multi-source
 * `{sources: [...]}` format. If the config already has `sources`, it is
 * returned as-is (no double-migration).
 *
 * The top-level `preload` and `fullLoad` fields are preserved for backward
 * compatibility so that consumers reading the old fields still work.
 */
export function migrateLegacyDataConfig(config) {
    // Already migrated — nothing to do
    if (config.sources && config.sources.length > 0) {
        return config;
    }
    // No preload or fullLoad at all — return with empty sources
    if (!config.preload && !config.fullLoad) {
        return { ...config, sources: [] };
    }
    const defaultSource = {
        sourceId: 'default',
        ...(config.preload ? { preload: config.preload } : {}),
        ...(config.fullLoad ? { fullLoad: config.fullLoad } : {}),
    };
    return {
        ...config,
        sources: [defaultSource],
    };
}
// ========================================================================
// Type guards
// ========================================================================
/**
 * Type guard for `DashboardDataConfig`. Accepts both legacy format
 * (top-level `preload`/`fullLoad`) and multi-source format (`sources` array).
 */
export function isDashboardDataConfig(obj) {
    if (obj == null || typeof obj !== 'object')
        return false;
    const o = obj;
    // Multi-source format: sources array present and non-empty
    if (Array.isArray(o.sources) && o.sources.length > 0) {
        return o.sources.every((s) => s != null &&
            typeof s === 'object' &&
            typeof s.sourceId === 'string');
    }
    // Legacy format: top-level preload and fullLoad
    if (o.preload == null || typeof o.preload !== 'object')
        return false;
    if (o.fullLoad == null || typeof o.fullLoad !== 'object')
        return false;
    const preload = o.preload;
    if (preload.query == null || typeof preload.query !== 'object')
        return false;
    const fullLoad = o.fullLoad;
    if (fullLoad.query == null || typeof fullLoad.query !== 'object')
        return false;
    return true;
}
export function isDetailSourceConfig(obj) {
    if (obj == null || typeof obj !== 'object')
        return false;
    const o = obj;
    return (typeof o.id === 'string' &&
        typeof o.name === 'string' &&
        typeof o.dataSourceId === 'string' &&
        Array.isArray(o.filterMapping) &&
        o.baseQuery != null && typeof o.baseQuery === 'object' &&
        o.trigger !== undefined);
}
//# sourceMappingURL=dashboard-data-pipeline.js.map