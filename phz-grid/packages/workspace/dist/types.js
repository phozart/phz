/**
 * @phozart/workspace — Core Types
 */
export { kpiId, metricId, reportId, dashboardId, widgetId, dataProductId, } from '@phozart/engine';
export function placementId(id) { return id; }
export function isWidgetManifest(obj) {
    if (obj == null || typeof obj !== 'object')
        return false;
    const o = obj;
    return (typeof o.type === 'string' &&
        typeof o.category === 'string' &&
        typeof o.name === 'string' &&
        typeof o.description === 'string' &&
        Array.isArray(o.requiredFields) &&
        Array.isArray(o.supportedAggregations) &&
        o.minSize != null && typeof o.minSize === 'object' &&
        o.preferredSize != null && typeof o.preferredSize === 'object' &&
        o.maxSize != null && typeof o.maxSize === 'object' &&
        Array.isArray(o.supportedInteractions) &&
        Array.isArray(o.variants));
}
export function validateWidgetSizeBounds(min, preferred, max) {
    return (min.cols <= preferred.cols &&
        min.rows <= preferred.rows &&
        preferred.cols <= max.cols &&
        preferred.rows <= max.rows);
}
export function validateWidgetVariants(variants) {
    const ids = new Set();
    for (const v of variants) {
        if (ids.has(v.id))
            return false;
        ids.add(v.id);
    }
    return true;
}
export function defaultWidgetCommonConfig(overrides) {
    return {
        title: '',
        padding: 'default',
        loadingBehavior: 'skeleton',
        clickAction: 'none',
        highContrastMode: 'auto',
        ...overrides,
    };
}
export function isWidgetCommonConfig(obj) {
    if (obj == null || typeof obj !== 'object')
        return false;
    const o = obj;
    return (typeof o.title === 'string' &&
        typeof o.padding === 'string' &&
        typeof o.loadingBehavior === 'string' &&
        typeof o.clickAction === 'string' &&
        typeof o.highContrastMode === 'string');
}
/**
 * @deprecated Import FieldMapping from '@phozart/shared/coordination' instead.
 * This re-export will be removed in v16.
 */
export { resolveFieldForSource } from '@phozart/shared/coordination';
export function autoSuggestMappings(schemas) {
    if (schemas.length < 2)
        return [];
    // Group fields by name+dataType across sources
    const fieldMap = new Map();
    for (const schema of schemas) {
        for (const field of schema.fields) {
            const key = `${field.name}:${field.dataType}`;
            let entries = fieldMap.get(key);
            if (!entries) {
                entries = [];
                fieldMap.set(key, entries);
            }
            entries.push({ dataSourceId: schema.dataSourceId, field: field.name });
        }
    }
    const result = [];
    for (const [key, sources] of fieldMap) {
        if (sources.length >= 2) {
            const canonicalField = key.split(':')[0];
            result.push({ canonicalField, sources });
        }
    }
    return result;
}
export function alertRuleId(id) { return id; }
export function breachId(id) { return id; }
export function templateId(id) { return id; }
export function isDashboardDataConfig(obj) {
    if (obj == null || typeof obj !== 'object')
        return false;
    const o = obj;
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
const VALID_TRANSITIONS = new Set(['seamless', 'fade', 'replace']);
export function validateDashboardDataConfig(config) {
    if (!isDashboardDataConfig(config))
        return false;
    if (config.transition !== undefined && !VALID_TRANSITIONS.has(config.transition))
        return false;
    if (config.fullLoad.maxRows !== undefined && config.fullLoad.maxRows < 0)
        return false;
    if (config.detailSources) {
        for (const ds of config.detailSources) {
            if (!isDetailSourceConfig(ds))
                return false;
        }
    }
    return true;
}
//# sourceMappingURL=types.js.map