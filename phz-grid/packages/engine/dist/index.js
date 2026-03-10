/**
 * @phozart/phz-engine — Headless BI Engine
 *
 * Pure computation: KPIs, metrics, dashboards, reports, aggregation, pivot, drill-through.
 * No DOM dependencies.
 */
// Base types
export * from './types.js';
// Data Product Registry
export { createDataProductRegistry } from './data-product.js';
// KPI Definitions & Registry
export { createKPIRegistry } from './kpi.js';
// Status Engine
export { computeStatus, computeDelta, classifyKPIScore, STATUS_COLORS, STATUS_ICONS } from './status.js';
// Metric Catalog
export { createMetricCatalog } from './metric.js';
// Aggregation Engine
export { computeAggregation, computeAggregations, computeGroupAggregations } from './aggregation.js';
// Report Configuration
export { createReportConfigStore } from './report.js';
export { DEFAULT_TABLE_SETTINGS, DEFAULT_REPORT_PRESENTATION } from './report-presentation.js';
// Widget Configuration
export { validateWidget } from './widget.js';
// Chart Tooltip Configuration
export { resolveAutoTooltip, evaluateTooltipCondition, computeTooltipDelta } from './chart-tooltip.js';
// Dashboard Configuration
export { createDashboardConfigStore, upgradeDashboardConfig } from './dashboard.js';
// Config Merge / Layering
export { deepMerge, mergeReportConfigs, mergeDashboardConfigs, createConfigLayerManager } from './config-merge.js';
// Pivot Engine
export { computePivot, pivotResultToFlatRows } from './pivot.js';
// Chart Data Projection
export { projectChartData, projectAggregatedChartData, projectPieData } from './chart-projection.js';
// Drill-Through Resolution
export { resolveDrillFilter, resolveDrillAction } from './drill-through.js';
// Hierarchy Definitions (within-visualization drill-down)
export { generateDateHierarchy, createCustomHierarchy, validateHierarchy } from './hierarchy.js';
// Drill-Down State (hierarchy navigation)
export { createInitialDrillDownState, drillDown, drillUp, drillToLevel, getDrillQuery, canDrillDown, canDrillUp } from './drill-down-state.js';
// Widget Data Resolver
export { resolveWidgetProps, resolveDashboardWidgets } from './widget-resolver.js';
// Default Score Provider
export { createDefaultScoreProvider } from './score-provider.js';
// Enhanced Widget Configuration
export { SMART_DEFAULTS } from './widget-config-enhanced.js';
// Enhanced Dashboard Configuration
export { createEnhancedDashboardConfig, serializeDashboard, isEnhancedDashboard, DEFAULT_DASHBOARD_THEME } from './dashboard-enhanced.js';
// Widget Data Processor
export { processWidgetData } from './widget-data-processor.js';
// Color Palettes
export { getPaletteColors, PALETTE_PRESETS } from './color-palettes.js';
// Selection Criteria
export { resolveDynamicDefaults, resolveDynamicPreset, resolveDependencies, filterTreeByParent, buildExportMetadata, formatCriteriaValue, validateCriteria, serializeCriteria, deserializeCriteria, resolveBuiltinPreset, resolveComparisonPeriod, getAvailablePresets, formatDateRangeDisplay, getFiscalQuarter, getFiscalQuarterBounds, getWeekStart, getWeekEnd, getISOWeekNumber, getSequentialWeekNumber, getMonthBounds, getCalendarQuarterBounds, inferCriteriaType, deriveOptionsFromData, resolveOptionsSource, resolveFieldOptions, applyCriteriaToData, applyPresenceFilter, BUILTIN_DATE_PRESETS, DATE_PRESET_GROUP_LABELS, } from './selection-criteria.js';
// Format Registry
export { FormatRegistry } from './format-registry.js';
// Filter Definition Registry
export { createFilterRegistry, detectDependencyCycles, topologicalSortFilters } from './criteria/filter-registry.js';
// Filter Bindings
export { createFilterBindingStore, resolveArtefactFields, migrateCriteriaConfig } from './criteria/filter-bindings.js';
// Filter State Management
export { createFilterStateManager, resolveFilterValue, createMemoryStorageAdapter, reconcilePersistedState } from './criteria/filter-state.js';
// Filter Rules Engine
export { createFilterRuleEngine, evaluateRule, previewRule } from './criteria/filter-rules.js';
// Criteria Output
export { createCriteriaOutputManager, inferOperator, filterTreeOutput, splitSearchTokens } from './criteria/criteria-output.js';
// Filter Admin Service
export { createFilterAdminService, FULL_ADMIN_PERMISSIONS, READONLY_PERMISSIONS } from './criteria/filter-admin.js';
// Criteria Engine (unified facade)
export { createCriteriaEngine, migrateFromCriteriaConfig } from './criteria/criteria-engine.js';
// Criteria Resolution (auto-hydration & divergence detection)
export { resolveReportCriteria, resolveDashboardCriteria, hydrateCriteriaConfig } from './criteria/resolve-criteria.js';
// Report & Dashboard Services (runtime orchestrators)
export { createReportService, createDashboardService } from './report-service.js';
// Expression Types & AST
export { parameterId, calculatedFieldId } from './expression-types.js';
// Dependency Graph
export { createDependencyGraph, extractDependencies } from './dependency-graph.js';
// Expression Evaluator
export { evaluateRowExpression, evaluateMetricExpression } from './expression-evaluator.js';
// Expression Compiler
export { compileRowExpression, compileMetricExpression } from './expression-compiler.js';
// Expression Cache
export { ExpressionCache } from './expression-cache.js';
// Expression Validator
export { validateExpression } from './expression-validator.js';
// Formula Parser
export { parseFormula, formatFormula } from './formula-parser.js';
// Dashboard Data Model Store
export { createDashboardDataModelStore } from './dashboard-data-model.js';
// Status (add new exports)
export { resolveThresholdValue, computeStatusFromBands } from './status.js';
// Storage Adapters
export { MemoryStorageAdapter, LocalStorageAdapter } from './storage-adapter.js';
// Filter Adapter (bridges CriteriaEngine to widget data filtering)
export { createFilterAdapter, applyArtefactCriteria, globalFiltersToCriteriaBindings } from './filter-adapter.js';
// Compute Backend Strategy
export { createJSComputeBackend, JSComputeBackend } from './compute-backend.js';
// Engine Metrics (Performance Monitor)
export { EngineMetrics } from './engine-metrics.js';
// Metrics Controller (Lit reactive controller for admin UI)
export { MetricsController } from './metrics-controller.js';
// Anomaly Detection
export { detectAnomalies, detectTrendChange } from './anomaly-detector.js';
// KPI Alerting
export { createKPIAlertEngine } from './kpi-alerting.js';
// Window Functions
export { runningSum, runningAvg, movingAverage, movingSum, rank, percentRank, lag, lead, rowNumber, } from './window-functions.js';
// Resolution Cache
export { ResolutionCache } from './resolution-cache.js';
// Dirty Tracker
export { DirtyTracker } from './dirty-tracker.js';
// Embed Manager
export { EmbedManager } from './embed-manager.js';
// Engine Facade
export { createBIEngine } from './engine.js';
// Explorer (visual query builder — moved from workspace in v15)
export * from './explorer/index.js';
// Personal Alert Engine (C-2.03, C-2.04)
export * from './alerts/index.js';
// Subscription Engine (C-2.05)
export * from './subscriptions/index.js';
// Usage Analytics Collector (C-2.08)
export * from './analytics/index.js';
// OpenAPI Spec Generator (C-2.09)
export * from './api/index.js';
// Chart Analytics Overlays
export { computeLinearRegression, computeMovingAverage, computeExponentialRegression, resolveTargetForCategory, alertRuleToThresholdBands, } from './chart-overlays.js';
// Attention System (C-2.12)
export * from './attention/index.js';
//# sourceMappingURL=index.js.map