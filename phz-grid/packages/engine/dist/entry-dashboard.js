/**
 * @phozart/phz-engine/dashboard — Dashboard-focused entry point
 *
 * Dashboard configuration, widget resolution, data processing, and chart projection.
 */
// Dashboard Configuration
export { createDashboardConfigStore, upgradeDashboardConfig } from './dashboard.js';
// Enhanced Dashboard Configuration
export { createEnhancedDashboardConfig, serializeDashboard, isEnhancedDashboard, DEFAULT_DASHBOARD_THEME } from './dashboard-enhanced.js';
// Widget Configuration
export { validateWidget } from './widget.js';
// Enhanced Widget Configuration
export { SMART_DEFAULTS } from './widget-config-enhanced.js';
// Widget Data Resolver
export { resolveWidgetProps, resolveDashboardWidgets } from './widget-resolver.js';
// Widget Data Processor
export { processWidgetData } from './widget-data-processor.js';
// Chart Data Projection
export { projectChartData, projectAggregatedChartData, projectPieData } from './chart-projection.js';
// Color Palettes
export { getPaletteColors, PALETTE_PRESETS } from './color-palettes.js';
// Dashboard Data Model Store
export { createDashboardDataModelStore } from './dashboard-data-model.js';
// Config Merge / Layering
export { deepMerge, mergeReportConfigs, mergeDashboardConfigs, createConfigLayerManager } from './config-merge.js';
//# sourceMappingURL=entry-dashboard.js.map