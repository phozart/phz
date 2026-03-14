/**
 * @phozart/engine — Config Merge / Layering
 *
 * 3-layer merge: Admin (L0) → Super User (L1) → Personal User View (L2).
 */
// --- Deep Merge ---
export function deepMerge(base, override) {
    const result = { ...base };
    for (const key of Object.keys(override)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype')
            continue;
        const overrideVal = override[key];
        const baseVal = result[key];
        if (overrideVal === undefined)
            continue;
        if (overrideVal !== null &&
            typeof overrideVal === 'object' &&
            !Array.isArray(overrideVal) &&
            baseVal !== null &&
            typeof baseVal === 'object' &&
            !Array.isArray(baseVal)) {
            result[key] = deepMerge(baseVal, overrideVal);
        }
        else {
            result[key] = overrideVal;
        }
    }
    return result;
}
// --- Report Config Merge ---
export function mergeReportConfigs(layers) {
    // Sort by layer priority: system first, then admin, then user
    const priority = { system: 0, admin: 1, user: 2 };
    const sorted = [...layers].sort((a, b) => priority[a.layer] - priority[b.layer]);
    let result = sorted[0]?.config;
    for (let i = 1; i < sorted.length; i++) {
        result = deepMerge(result, sorted[i].config);
    }
    return result;
}
// --- Dashboard Config Merge ---
export function mergeDashboardConfigs(layers) {
    const priority = { system: 0, admin: 1, user: 2 };
    const sorted = [...layers].sort((a, b) => priority[a.layer] - priority[b.layer]);
    let result = sorted[0]?.config;
    for (let i = 1; i < sorted.length; i++) {
        result = deepMerge(result, sorted[i].config);
    }
    return result;
}
export function createConfigLayerManager() {
    const layers = new Map();
    return {
        setLayer(layer, config) {
            layers.set(layer, config);
        },
        getLayer(layer) {
            return layers.get(layer);
        },
        removeLayer(layer) {
            layers.delete(layer);
        },
        getMerged() {
            const priority = { system: 0, admin: 1, user: 2 };
            const sorted = Array.from(layers.entries())
                .sort(([a], [b]) => priority[a] - priority[b]);
            if (sorted.length === 0)
                return {};
            let result = sorted[0][1];
            for (let i = 1; i < sorted.length; i++) {
                result = deepMerge(result, sorted[i][1]);
            }
            return result;
        },
        getLayers() {
            return Array.from(layers.entries()).map(([layer, config]) => ({ layer, config }));
        },
    };
}
//# sourceMappingURL=config-merge.js.map