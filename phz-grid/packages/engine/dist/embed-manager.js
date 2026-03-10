/**
 * @phozart/phz-engine — Embed Manager
 *
 * Generates embed code and shareable config for dashboards.
 * Supports width/height, theme, hideControls, and filterDefaults options.
 */
export class EmbedManager {
    dashboards = new Map();
    registerDashboard(config) {
        this.dashboards.set(config.id, config);
    }
    unregisterDashboard(id) {
        this.dashboards.delete(id);
    }
    generateEmbedCode(dashboardId, options) {
        const config = this.dashboards.get(dashboardId);
        if (!config)
            throw new Error('Dashboard not found: ' + dashboardId);
        const attrs = [];
        const styles = [];
        // Config as base64-encoded JSON attribute
        const configJson = this.generateShareableConfig(dashboardId);
        const configEncoded = btoa(unescape(encodeURIComponent(configJson)));
        attrs.push(`config="${configEncoded}"`);
        if (options?.theme) {
            attrs.push(`theme="${escapeAttr(options.theme)}"`);
        }
        if (options?.hideControls) {
            attrs.push('hide-controls');
        }
        if (options?.filterDefaults) {
            const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(options.filterDefaults))));
            attrs.push(`filter-defaults="${encoded}"`);
        }
        if (options?.width)
            styles.push(`width: ${options.width}`);
        if (options?.height)
            styles.push(`height: ${options.height}`);
        const styleAttr = styles.length > 0 ? ` style="${styles.join('; ')}"` : '';
        const attrStr = attrs.join(' ');
        return `<phz-dashboard ${attrStr}${styleAttr}></phz-dashboard>`;
    }
    generateShareableConfig(dashboardId) {
        const config = this.dashboards.get(dashboardId);
        if (!config)
            throw new Error('Dashboard not found: ' + dashboardId);
        const shareable = {
            version: 2,
            id: config.id,
            name: config.name,
            description: config.description,
            layout: { ...config.layout },
            widgets: config.widgets.map(w => ({ ...w })),
            placements: config.placements.map(p => ({ ...p })),
            globalFilters: config.globalFilters.map(f => ({ ...f })),
            theme: { ...config.theme },
            metadata: { ...config.metadata },
            autoRefreshInterval: config.autoRefreshInterval,
        };
        return JSON.stringify(shareable, null, 2);
    }
    loadFromShareableConfig(json) {
        let parsed;
        try {
            parsed = JSON.parse(json);
        }
        catch {
            throw new Error('Invalid JSON: ' + json.slice(0, 50));
        }
        if (parsed.version !== 2) {
            throw new Error('Invalid config: expected version 2, got ' + parsed.version);
        }
        return {
            version: 2,
            id: parsed.id,
            name: parsed.name,
            description: parsed.description,
            layout: parsed.layout,
            widgets: parsed.widgets,
            placements: parsed.placements,
            globalFilters: parsed.globalFilters,
            theme: parsed.theme,
            metadata: parsed.metadata,
            autoRefreshInterval: parsed.autoRefreshInterval,
        };
    }
}
function escapeAttr(value) {
    return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
//# sourceMappingURL=embed-manager.js.map