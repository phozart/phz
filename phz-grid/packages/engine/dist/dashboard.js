/**
 * @phozart/phz-engine — Dashboard Configuration & Layout
 *
 * Dashboards are collections of widgets arranged in a responsive grid layout.
 */
import { DEFAULT_DASHBOARD_THEME } from './dashboard-enhanced.js';
export function createDashboardConfigStore() {
    const dashboards = new Map();
    return {
        save(config) {
            dashboards.set(config.id, { ...config, updated: Date.now() });
        },
        get(id) {
            return dashboards.get(id);
        },
        list() {
            return Array.from(dashboards.values());
        },
        delete(id) {
            dashboards.delete(id);
        },
        validate(config) {
            const errors = [];
            if (!config.id)
                errors.push({ path: 'id', message: 'ID is required' });
            if (!config.name)
                errors.push({ path: 'name', message: 'Name is required' });
            if (!config.layout) {
                errors.push({ path: 'layout', message: 'Layout is required' });
            }
            else {
                if (!config.layout.columns || config.layout.columns < 1) {
                    errors.push({ path: 'layout.columns', message: 'Columns must be at least 1' });
                }
                if (!config.layout.rowHeight || config.layout.rowHeight < 1) {
                    errors.push({ path: 'layout.rowHeight', message: 'Row height must be positive' });
                }
            }
            return { valid: errors.length === 0, errors };
        },
        addWidget(dashboardId, widget) {
            const dashboard = dashboards.get(dashboardId);
            if (!dashboard)
                return;
            dashboard.widgets.push(widget);
            dashboard.updated = Date.now();
        },
        removeWidget(dashboardId, widgetId) {
            const dashboard = dashboards.get(dashboardId);
            if (!dashboard)
                return;
            dashboard.widgets = dashboard.widgets.filter(w => w.id !== widgetId);
            dashboard.updated = Date.now();
        },
        updateWidget(dashboardId, widgetId, updates) {
            const dashboard = dashboards.get(dashboardId);
            if (!dashboard)
                return;
            const idx = dashboard.widgets.findIndex(w => w.id === widgetId);
            if (idx === -1)
                return;
            dashboard.widgets[idx] = { ...dashboard.widgets[idx], ...updates };
            dashboard.updated = Date.now();
        },
        resolveLayout(config, containerWidth) {
            const { columns, rowHeight, gap } = config.layout;
            const totalGap = gap * (columns - 1);
            const columnWidth = (containerWidth - totalGap) / columns;
            const positions = config.widgets.map(widget => ({
                widgetId: widget.id,
                x: widget.position.col * (columnWidth + gap),
                y: widget.position.row * (rowHeight + gap),
                width: widget.position.colSpan * columnWidth + (widget.position.colSpan - 1) * gap,
                height: widget.position.rowSpan * rowHeight + (widget.position.rowSpan - 1) * gap,
            }));
            return { containerWidth, columnWidth, positions };
        },
    };
}
/**
 * Converts a legacy `DashboardConfig` (v1) to `EnhancedDashboardConfig` (v2).
 *
 * Mapping:
 * - `layout.columns` and `layout.gap` carry over directly
 * - Each `WidgetPlacement` becomes a `DashboardWidgetPlacement` with column/order derived from position
 * - `widgets` array is populated with minimal `EnhancedWidgetConfig` entries
 * - `created`/`updated` timestamps carry over into `metadata`
 * - `autoRefreshInterval` carries over
 * - `crossFilter` is dropped (no v2 equivalent — use globalFilters instead)
 */
export function upgradeDashboardConfig(legacy) {
    const placements = legacy.widgets.map((w, i) => ({
        widgetId: w.id,
        column: w.position.col,
        order: i,
        colSpan: w.position.colSpan,
        heightOverride: w.position.rowSpan > 1
            ? w.position.rowSpan * legacy.layout.rowHeight + (w.position.rowSpan - 1) * legacy.layout.gap
            : undefined,
    }));
    const widgets = legacy.widgets.map(w => ({
        id: w.id,
        type: w.widgetType,
        name: w.config?.title ?? w.widgetType,
        data: {},
        appearance: {},
        behaviour: {},
    }));
    return {
        version: 2,
        id: legacy.id,
        name: legacy.name,
        description: legacy.description,
        layout: {
            columns: legacy.layout.columns,
            gap: legacy.layout.gap,
        },
        widgets,
        placements,
        globalFilters: [],
        theme: { ...DEFAULT_DASHBOARD_THEME },
        metadata: {
            created: legacy.created,
            updated: legacy.updated,
            createdBy: legacy.createdBy,
        },
        autoRefreshInterval: legacy.autoRefreshInterval,
    };
}
//# sourceMappingURL=dashboard.js.map