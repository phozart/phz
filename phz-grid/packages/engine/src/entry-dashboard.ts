/**
 * @phozart/engine/dashboard — Dashboard-focused entry point
 *
 * Dashboard configuration, widget resolution, data processing, and chart projection.
 */

// Dashboard Configuration
export { createDashboardConfigStore, upgradeDashboardConfig } from './dashboard.js';
export type {
  DashboardConfig, DashboardLayout, DashboardCrossFilterConfig, ResolvedLayout, DashboardConfigStore,
} from './dashboard.js';

// Enhanced Dashboard Configuration
export { createEnhancedDashboardConfig, serializeDashboard, isEnhancedDashboard, DEFAULT_DASHBOARD_THEME } from './dashboard-enhanced.js';
export type {
  EnhancedDashboardConfig, DashboardWidgetPlacement, GlobalFilter, GlobalFilterType,
  DashboardTheme, DashboardSerializationFormat,
} from './dashboard-enhanced.js';

// Widget Configuration
export { validateWidget } from './widget.js';
export type {
  WidgetType, WidgetPosition, WidgetSize, BaseWidgetConfig, WidgetConfig, WidgetPlacement,
  KPICardWidgetConfig, ScorecardWidgetConfig, BarChartWidgetConfig, TrendLineWidgetConfig,
  BottomNWidgetConfig, PivotTableWidgetConfig, DataTableWidgetConfig, StatusTableWidgetConfig,
  DrillLinkWidgetConfig, CustomWidgetConfig,
} from './widget.js';

// Enhanced Widget Configuration
export { SMART_DEFAULTS } from './widget-config-enhanced.js';
export type {
  EnhancedWidgetConfig, WidgetDataConfig, WidgetAppearanceConfig, WidgetBehaviourConfig,
  DataBinding, ChartBinding, KpiBinding, ScorecardBinding, StatusTableBinding, DataTableBinding, DrillLinkBinding,
  FieldRef, MeasureRef, FieldFormat, WidgetFilterRule, Threshold,
  ContainerAppearance, TitleBarAppearance, ChartAppearance, KpiAppearance, ScorecardAppearance, BottomNAppearance,
  ClickAction,
  FilterOperator as EnhancedFilterOperator,
} from './widget-config-enhanced.js';

// Widget Data Resolver
export { resolveWidgetProps, resolveDashboardWidgets } from './widget-resolver.js';
export type { ResolvedWidgetProps, WidgetResolverContext } from './widget-resolver.js';

// Widget Data Processor
export { processWidgetData } from './widget-data-processor.js';
export type { ProcessedWidgetData, ProcessedRow } from './widget-data-processor.js';

// Chart Data Projection
export { projectChartData, projectAggregatedChartData, projectPieData } from './chart-projection.js';
export type { ChartDataSeries, ChartDataPoint, PieSlice } from './chart-projection.js';

// Color Palettes
export { getPaletteColors, PALETTE_PRESETS } from './color-palettes.js';
export type { PalettePreset } from './color-palettes.js';

// Dashboard Data Model Store
export { createDashboardDataModelStore } from './dashboard-data-model.js';
export type { DashboardDataModelStore } from './dashboard-data-model.js';

// Config Merge / Layering
export { deepMerge, mergeReportConfigs, mergeDashboardConfigs, createConfigLayerManager } from './config-merge.js';
export type { UserViewConfig, ConfigLayerDef, ConfigLayerManager } from './config-merge.js';
