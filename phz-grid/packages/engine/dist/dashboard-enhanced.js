/**
 * @phozart/phz-engine — Enhanced Dashboard Configuration Types
 *
 * Extends existing DashboardConfig with global filters, themes,
 * and full serialization format.
 */
export const DEFAULT_DASHBOARD_THEME = {
    mode: 'light',
    background: '#F5F5F4',
    cardBackground: '#FFFFFF',
    textColor: '#1C1917',
    mutedColor: '#78716C',
    borderColor: '#E7E5E4',
    accentColor: '#3B82F6',
};
// --- Factory ---
export function createEnhancedDashboardConfig(id, name) {
    return {
        version: 2,
        id,
        name,
        layout: { columns: 3, gap: 16 },
        widgets: [],
        placements: [],
        globalFilters: [],
        theme: { ...DEFAULT_DASHBOARD_THEME },
        metadata: { created: Date.now(), updated: Date.now() },
    };
}
// --- Serialization helpers ---
export function serializeDashboard(config, kpis, metrics, datasetSchema) {
    return {
        version: 2,
        dashboard: {
            id: config.id,
            name: config.name,
            description: config.description,
            layout: config.layout,
            theme: config.theme,
            autoRefreshInterval: config.autoRefreshInterval,
        },
        widgets: config.widgets,
        placements: config.placements,
        globalFilters: config.globalFilters,
        kpis,
        metrics,
        datasetSchema,
    };
}
/**
 * Detect whether a config object is an enhanced (v2) dashboard.
 */
export function isEnhancedDashboard(config) {
    return typeof config === 'object' && config !== null && config.version === 2;
}
//# sourceMappingURL=dashboard-enhanced.js.map