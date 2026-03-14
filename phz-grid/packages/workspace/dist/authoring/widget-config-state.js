/**
 * @phozart/workspace — Widget Config Panel State
 *
 * Pure functions for the 3-tab widget configuration panel
 * used in the dashboard editor.
 */
export function createConfigForWidget(widget, _manifest) {
    const aggregations = {};
    for (const m of widget.dataConfig.measures) {
        aggregations[m.field] = m.aggregation;
    }
    return {
        activeTab: 'data',
        widgetId: widget.id,
        widgetType: widget.type,
        dimensions: [...widget.dataConfig.dimensions],
        measures: [...widget.dataConfig.measures],
        aggregations,
        title: widget.config.title ?? '',
        subtitle: widget.config.subtitle,
        colorScheme: widget.config.colorScheme,
        density: widget.config.density ?? 'default',
        padding: widget.config.padding ?? 'default',
        showLegend: widget.config.showLegend,
        showLabels: widget.config.showLabels,
        widgetFilters: [],
    };
}
export function setActiveTab(state, tab) {
    return { ...state, activeTab: tab };
}
export function updateDataConfig(state, updates) {
    const result = { ...state };
    if (updates.dimensions)
        result.dimensions = updates.dimensions;
    if (updates.measures) {
        result.measures = updates.measures;
        // Sync aggregations
        const agg = { ...result.aggregations };
        for (const m of updates.measures) {
            agg[m.field] = m.aggregation;
        }
        result.aggregations = agg;
    }
    return result;
}
export function updateStyleConfig(state, updates) {
    return { ...state, ...updates };
}
export function addWidgetFilter(state, filter) {
    const filters = state.widgetFilters.filter(f => f.filterId !== filter.filterId);
    return { ...state, widgetFilters: [...filters, filter] };
}
export function removeWidgetFilter(state, filterId) {
    return { ...state, widgetFilters: state.widgetFilters.filter(f => f.filterId !== filterId) };
}
export function applyConfigToWidget(config, widget) {
    return {
        ...widget,
        dataConfig: {
            dimensions: config.dimensions,
            measures: config.measures,
            filters: widget.dataConfig.filters, // preserve existing explore filters
        },
        config: {
            ...widget.config,
            title: config.title,
            subtitle: config.subtitle,
            colorScheme: config.colorScheme,
            density: config.density,
            padding: config.padding,
            showLegend: config.showLegend,
            showLabels: config.showLabels,
        },
    };
}
export function getAvailableAggregations(manifest) {
    if (manifest?.supportedAggregations?.length) {
        return manifest.supportedAggregations;
    }
    return ['sum', 'avg', 'min', 'max', 'count', 'count_distinct'];
}
//# sourceMappingURL=widget-config-state.js.map