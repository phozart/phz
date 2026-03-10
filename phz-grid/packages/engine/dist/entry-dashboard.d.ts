/**
 * @phozart/phz-engine/dashboard — Dashboard-focused entry point
 *
 * Dashboard configuration, widget resolution, data processing, and chart projection.
 */
export { createDashboardConfigStore, upgradeDashboardConfig } from './dashboard.js';
export type { DashboardConfig, DashboardLayout, DashboardCrossFilterConfig, ResolvedLayout, DashboardConfigStore, } from './dashboard.js';
export { createEnhancedDashboardConfig, serializeDashboard, isEnhancedDashboard, DEFAULT_DASHBOARD_THEME } from './dashboard-enhanced.js';
export type { EnhancedDashboardConfig, DashboardWidgetPlacement, GlobalFilter, GlobalFilterType, DashboardTheme, DashboardSerializationFormat, } from './dashboard-enhanced.js';
export { validateWidget } from './widget.js';
export type { WidgetType, WidgetPosition, WidgetSize, BaseWidgetConfig, WidgetConfig, WidgetPlacement, KPICardWidgetConfig, ScorecardWidgetConfig, BarChartWidgetConfig, TrendLineWidgetConfig, BottomNWidgetConfig, PivotTableWidgetConfig, DataTableWidgetConfig, StatusTableWidgetConfig, DrillLinkWidgetConfig, CustomWidgetConfig, } from './widget.js';
export { SMART_DEFAULTS } from './widget-config-enhanced.js';
export type { EnhancedWidgetConfig, WidgetDataConfig, WidgetAppearanceConfig, WidgetBehaviourConfig, DataBinding, ChartBinding, KpiBinding, ScorecardBinding, StatusTableBinding, DataTableBinding, DrillLinkBinding, FieldRef, MeasureRef, FieldFormat, WidgetFilterRule, Threshold, ContainerAppearance, TitleBarAppearance, ChartAppearance, KpiAppearance, ScorecardAppearance, BottomNAppearance, ClickAction, FilterOperator as EnhancedFilterOperator, } from './widget-config-enhanced.js';
export { resolveWidgetProps, resolveDashboardWidgets } from './widget-resolver.js';
export type { ResolvedWidgetProps, WidgetResolverContext } from './widget-resolver.js';
export { processWidgetData } from './widget-data-processor.js';
export type { ProcessedWidgetData, ProcessedRow } from './widget-data-processor.js';
export { projectChartData, projectAggregatedChartData, projectPieData } from './chart-projection.js';
export type { ChartDataSeries, ChartDataPoint, PieSlice } from './chart-projection.js';
export { getPaletteColors, PALETTE_PRESETS } from './color-palettes.js';
export type { PalettePreset } from './color-palettes.js';
export { createDashboardDataModelStore } from './dashboard-data-model.js';
export type { DashboardDataModelStore } from './dashboard-data-model.js';
export { deepMerge, mergeReportConfigs, mergeDashboardConfigs, createConfigLayerManager } from './config-merge.js';
export type { UserViewConfig, ConfigLayerDef, ConfigLayerManager } from './config-merge.js';
//# sourceMappingURL=entry-dashboard.d.ts.map