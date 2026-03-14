/**
 * @phozart/engine — Headless BI Engine
 *
 * Pure computation: KPIs, metrics, dashboards, reports, aggregation, pivot, drill-through.
 * No DOM dependencies.
 */

// Base types
export * from './types.js';

// Data Product Registry
export { createDataProductRegistry } from './data-product.js';
export type { DataProductDef, DataProductField, DataProductSchema, DataProductRegistry } from './data-product.js';

// KPI Definitions & Registry
export { createKPIRegistry } from './kpi.js';
export type {
  KPIDefinition, KPIBreakdown, KPIDataSource, KPIAlertConfig,
  KPIScoreResponse, KPIBreakdownScore, KPIRegistry,
  KPIUnit, KPIDirection, KPIDeltaComparison, KPICardStyle, KPIColorScheme, KPIThresholds,
} from './kpi.js';

// Status Engine
export { computeStatus, computeDelta, classifyKPIScore, STATUS_COLORS, STATUS_ICONS } from './status.js';
export type { StatusResult, Delta, ClassifiedScore, ClassifiedBreakdown } from './status.js';

// Metric Catalog
export { createMetricCatalog } from './metric.js';
export type {
  MetricDef, MetricFormula, SimpleMetricFormula, ConditionalMetricFormula, CompositeMetricFormula,
  MetricFormat, MetricCatalog,
} from './metric.js';

// Aggregation Engine
export { computeAggregation, computeAggregations, computeGroupAggregations } from './aggregation.js';
export type { AggregationResult } from './aggregation.js';

// Incremental Aggregation
export { createIncrementalAggregator } from './incremental-aggregation.js';
export type { IncrementalAggregator } from './incremental-aggregation.js';

// Re-export commonly used core types for convenience
export type { AggregationFunction, AggregationConfig, FilterOperator, PivotConfig, PivotValueField, ShowValuesAs } from '@phozart/core';

// Report Configuration
export { createReportConfigStore } from './report.js';
export type { ReportConfig, ReportColumnConfig, ReportConfigStore, ReportAdditionalSource } from './report.js';

// Report Presentation
export type {
  ReportPresentation, TableSettings, ColumnFormatting, ColumnColorThreshold,
  NumberFormat, ExportSettings as ReportExportSettings, GenerateDashboardConfig,
} from './report-presentation.js';
export { DEFAULT_TABLE_SETTINGS, DEFAULT_REPORT_PRESENTATION } from './report-presentation.js';

// Widget Configuration
export { validateWidget } from './widget.js';
export type {
  WidgetType, WidgetPosition, WidgetSize, BaseWidgetConfig, WidgetConfig, WidgetPlacement,
  KPICardWidgetConfig, ScorecardWidgetConfig, BarChartWidgetConfig, TrendLineWidgetConfig,
  BottomNWidgetConfig, PivotTableWidgetConfig, DataTableWidgetConfig, StatusTableWidgetConfig,
  DrillLinkWidgetConfig, SlicerWidgetConfig, CustomWidgetConfig,
  VisibilityOperator, VisibilityExpression, WidgetVisibilityCondition,
} from './widget.js';

// Chart Tooltip Configuration
export { resolveAutoTooltip, evaluateTooltipCondition, computeTooltipDelta } from './chart-tooltip.js';
export type {
  ChartTooltipConfig, AutoTooltipConfig, TooltipField, TooltipCondition,
  TooltipDeltaResult, ChartEncodingInput,
} from './chart-tooltip.js';

// Dashboard Configuration
export { createDashboardConfigStore, upgradeDashboardConfig } from './dashboard.js';
export type {
  DashboardConfig, DashboardLayout, DashboardCrossFilterConfig, ResolvedLayout, DashboardConfigStore,
} from './dashboard.js';

// Config Merge / Layering
export { deepMerge, mergeReportConfigs, mergeDashboardConfigs, createConfigLayerManager } from './config-merge.js';
export type { UserViewConfig, ConfigLayerDef, ConfigLayerManager } from './config-merge.js';

// Pivot Engine
export { computePivot, pivotResultToFlatRows, applyShowValuesAs } from './pivot.js';
export type { PivotResult, PivotSubtotal } from './pivot.js';

// Date Grouping
export { groupDate, addDateBuckets, dateGroupingSQL } from './date-grouping.js';
export type { DateGranularity } from './date-grouping.js';

// Chart Data Projection
export { projectChartData, projectAggregatedChartData, projectPieData } from './chart-projection.js';
export type { ChartDataSeries, ChartDataPoint, PieSlice } from './chart-projection.js';

// Grid Visualization Bridge
export { suggestChartFromData, gridDataToChart, pivotToChart, createQuickDashboard } from './grid-visualization.js';
export type { SuggestedVisualization, GridVisualizationConfig, ChartVisualizationResult, QuickDashboardField, QuickDashboardOptions } from './grid-visualization.js';

// Drill-Through Resolution
export { resolveDrillFilter, resolveDrillAction } from './drill-through.js';
export type {
  DrillThroughAction, DrillThroughConfig, DrillContext, DrillSource,
  PivotDrillSource, ChartDrillSource, KPIDrillSource, ScorecardDrillSource, GridRowDrillSource,
} from './drill-through.js';

// Hierarchy Definitions (within-visualization drill-down)
export { generateDateHierarchy, createCustomHierarchy, validateHierarchy } from './hierarchy.js';
export type { HierarchyDefinition, HierarchyLevel } from './hierarchy.js';

// Drill-Down State (hierarchy navigation)
export { createInitialDrillDownState, drillDown, drillUp, drillToLevel, getDrillQuery, canDrillDown, canDrillUp } from './drill-down-state.js';
export type { DrillDownState, DrillBreadcrumbEntry } from './drill-down-state.js';

// Widget Data Resolver
export { resolveWidgetProps, resolveDashboardWidgets } from './widget-resolver.js';
export type { ResolvedWidgetProps, KPIScoreProvider, WidgetResolverContext } from './widget-resolver.js';

// Default Score Provider
export { createDefaultScoreProvider } from './score-provider.js';
export type { ScoreProviderConfig } from './score-provider.js';

// Enhanced Widget Configuration
export { SMART_DEFAULTS } from './widget-config-enhanced.js';
export type {
  EnhancedWidgetConfig, WidgetDataConfig, WidgetAppearanceConfig, WidgetBehaviourConfig,
  DataBinding, ChartBinding, KpiBinding, ScorecardBinding, StatusTableBinding, DataTableBinding, DrillLinkBinding, SlicerBinding,
  FieldRef, MeasureRef, FieldFormat, WidgetFilterRule, Threshold,
  ContainerAppearance, TitleBarAppearance, ChartAppearance, KpiAppearance, ScorecardAppearance, BottomNAppearance,
  ClickAction,
  FilterOperator as EnhancedFilterOperator,
} from './widget-config-enhanced.js';

// Enhanced Dashboard Configuration
export { createEnhancedDashboardConfig, serializeDashboard, isEnhancedDashboard, DEFAULT_DASHBOARD_THEME } from './dashboard-enhanced.js';
export type {
  EnhancedDashboardConfig, DashboardWidgetPlacement, GlobalFilter, GlobalFilterType,
  DashboardTheme, DashboardSerializationFormat,
} from './dashboard-enhanced.js';

// Widget Data Processor
export { processWidgetData } from './widget-data-processor.js';
export type { ProcessedWidgetData, ProcessedRow } from './widget-data-processor.js';

// Color Palettes
export { getPaletteColors, PALETTE_PRESETS } from './color-palettes.js';
export type { PalettePreset } from './color-palettes.js';

// Selection Criteria
export {
  resolveDynamicDefaults,
  resolveDynamicPreset,
  resolveDependencies,
  filterTreeByParent,
  buildExportMetadata,
  formatCriteriaValue,
  validateCriteria,
  serializeCriteria,
  deserializeCriteria,
  resolveBuiltinPreset,
  resolveComparisonPeriod,
  getAvailablePresets,
  formatDateRangeDisplay,
  getFiscalQuarter,
  getFiscalQuarterBounds,
  getWeekStart,
  getWeekEnd,
  getISOWeekNumber,
  getSequentialWeekNumber,
  getMonthBounds,
  getCalendarQuarterBounds,
  inferCriteriaType,
  deriveOptionsFromData,
  resolveOptionsSource,
  resolveFieldOptions,
  applyCriteriaToData,
  applyPresenceFilter,
  BUILTIN_DATE_PRESETS,
  DATE_PRESET_GROUP_LABELS,
} from './selection-criteria.js';

// Format Registry
export { FormatRegistry } from './format-registry.js';
export type { FormatFunction } from './format-registry.js';

// Filter Definition Registry
export { createFilterRegistry, detectDependencyCycles, topologicalSortFilters } from './criteria/filter-registry.js';
export type { FilterRegistry } from './criteria/filter-registry.js';

// Filter Bindings
export { createFilterBindingStore, resolveArtefactFields, migrateCriteriaConfig } from './criteria/filter-bindings.js';
export type { FilterBindingStore } from './criteria/filter-bindings.js';

// Filter State Management
export { createFilterStateManager, resolveFilterValue, createMemoryStorageAdapter, reconcilePersistedState } from './criteria/filter-state.js';
export type { FilterStateManager, ResolvedFilterValue } from './criteria/filter-state.js';

// Filter Rules Engine
export { createFilterRuleEngine, evaluateRule, previewRule } from './criteria/filter-rules.js';
export type { FilterRuleEngine, CustomRuleEvaluator } from './criteria/filter-rules.js';

// Criteria Output
export { createCriteriaOutputManager, inferOperator, filterTreeOutput, splitSearchTokens } from './criteria/criteria-output.js';
export type { CriteriaOutputManager, CriteriaSubscriber } from './criteria/criteria-output.js';

// Filter Admin Service
export { createFilterAdminService, FULL_ADMIN_PERMISSIONS, READONLY_PERMISSIONS } from './criteria/filter-admin.js';
export type { FilterAdminService } from './criteria/filter-admin.js';

// Criteria Engine (unified facade)
export { createCriteriaEngine, migrateFromCriteriaConfig } from './criteria/criteria-engine.js';
export type { CriteriaEngine, CriteriaEngineConfig } from './criteria/criteria-engine.js';

// Criteria Resolution (auto-hydration & divergence detection)
export { resolveReportCriteria, resolveDashboardCriteria, hydrateCriteriaConfig } from './criteria/resolve-criteria.js';
export type { CriteriaResolutionResult, DivergenceInfo, DivergenceCallback } from './criteria/resolve-criteria.js';

// Report & Dashboard Services (runtime orchestrators)
export { createReportService, createDashboardService } from './report-service.js';
export type { ReportService, DashboardService, GridFilterParams, FilterChangeListener } from './report-service.js';

// Expression Types & AST
export { parameterId, calculatedFieldId } from './expression-types.js';
export type {
  ParameterId, CalculatedFieldId,
  SourcePosition, BinaryOperator, UnaryOperator, BuiltinFunction,
  ExpressionNode, FieldRefNode, ParamRefNode, MetricRefNode, CalcRefNode,
  LiteralNode, UnaryOpNode, BinaryOpNode, ConditionalNode, FunctionCallNode, NullCheckNode,
  ExpressionMetricFormula,
  ParameterType, ParameterDef,
  CalculatedFieldOutputType, CalculatedFieldDef,
  ThresholdSource, ThresholdBand,
  DataModelField, DashboardDataModel,
} from './expression-types.js';

// Dependency Graph
export { createDependencyGraph, extractDependencies } from './dependency-graph.js';
export type {
  DependencyNodeType, DependencyRef, DependencyNode, CanDeleteResult, DependencyGraph,
} from './dependency-graph.js';

// Expression Evaluator
export { evaluateRowExpression, evaluateMetricExpression } from './expression-evaluator.js';
export type { RowExpressionContext, MetricExpressionContext } from './expression-evaluator.js';

// Expression Compiler
export { compileRowExpression, compileMetricExpression } from './expression-compiler.js';
export type { CompiledRowExpression, CompiledMetricExpression } from './expression-compiler.js';

// Expression Cache
export { ExpressionCache } from './expression-cache.js';
export type { ExpressionCacheOptions } from './expression-cache.js';

// Expression Validator
export { validateExpression } from './expression-validator.js';
export type { ExpressionError, ExpressionValidationContext } from './expression-validator.js';

// Formula Parser
export { parseFormula, formatFormula } from './formula-parser.js';
export type { ParseResult } from './formula-parser.js';

// Expression SQL Transpiler
export { expressionToSQL, FUNCTION_SQL_MAP } from './expression-sql-transpiler.js';

// Error Classes
export { PhzConfigError, PhzExpressionError } from './errors.js';

// Dashboard Data Model Store
export { createDashboardDataModelStore } from './dashboard-data-model.js';
export type { DashboardDataModelStore } from './dashboard-data-model.js';

// Status (add new exports)
export { resolveThresholdValue, computeStatusFromBands } from './status.js';

// Storage Adapters
export { MemoryStorageAdapter, LocalStorageAdapter } from './storage-adapter.js';
export type { EngineStorageAdapter } from './storage-adapter.js';

// Filter Adapter (bridges CriteriaEngine to widget data filtering)
export { createFilterAdapter, applyArtefactCriteria, globalFiltersToCriteriaBindings } from './filter-adapter.js';
export type { FilterAdapter } from './filter-adapter.js';

// Compute Backend Strategy
export { createJSComputeBackend, JSComputeBackend } from './compute-backend.js';
export type { ComputeBackend, CalculatedFieldInput, ComputeFilterInput } from './compute-backend.js';

// Web Worker Compute
export { WorkerComputeBackend } from './workers/worker-compute-backend.js';
export type { WorkerRequest, WorkerResponse } from './workers/compute-worker-protocol.js';

// Engine Metrics (Performance Monitor)
export { EngineMetrics } from './engine-metrics.js';
export type { OperationCategory, OperationStats, MetricsSnapshot, TimerHandle } from './engine-metrics.js';

// Metrics Controller (Lit reactive controller for admin UI)
export { MetricsController } from './metrics-controller.js';
export type { MetricsControllerConfig } from './metrics-controller.js';

// Anomaly Detection
export { detectAnomalies, detectTrendChange } from './anomaly-detector.js';
export type {
  AnomalyConfig, AnomalyResult, AnomalyMethod, AnomalySeverity,
  TrendChangeResult, TrendChange, TrendDirection,
} from './anomaly-detector.js';

// KPI Alerting
export { createKPIAlertEngine } from './kpi-alerting.js';
export type {
  KPIAlertEngine, AlertRule, Alert, AlertRuleType, AlertSeverity,
  ThresholdBreachConfig, AnomalyAlertConfig, ConsecutiveDeclineConfig,
} from './kpi-alerting.js';

// Window Functions
export {
  runningSum, runningAvg, movingAverage, movingSum,
  rank, percentRank, lag, lead, rowNumber,
} from './window-functions.js';

// Resolution Cache
export { ResolutionCache } from './resolution-cache.js';
export type { ResolutionCacheOptions } from './resolution-cache.js';

// Dirty Tracker
export { DirtyTracker } from './dirty-tracker.js';

// Embed Manager
export { EmbedManager } from './embed-manager.js';
export type { EmbedOptions } from './embed-manager.js';

// Engine Facade
export { createBIEngine } from './engine.js';
export type { BIEngine, BIEngineConfig } from './engine.js';

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
export {
  computeLinearRegression,
  computeMovingAverage,
  computeExponentialRegression,
  resolveTargetForCategory,
  alertRuleToThresholdBands,
} from './chart-overlays.js';
export type {
  ChartOverlayType, DashStyle, ChartOverlay, ReferenceLine, TrendLine,
  ChartThresholdBand, AverageLine, TargetLine,
  LinearRegressionResult, ExponentialRegressionResult,
} from './chart-overlays.js';

// Attention System (C-2.12)
export * from './attention/index.js';

// Unified Chart Specification
export { applyChartDefaults, validateChartSpec, CHART_SPEC_DEFAULTS } from './chart-spec.js';
export type {
  ChartSpec, ChartDataSpec, ChartSeriesSpec, SeriesType,
  EncodingChannel, FieldDataType, EncodingAggregate, TimeUnit, ScaleOverride,
  BarMarkConfig, BarOrientation, LineMarkConfig, CurveType, PointMarkConfig, AreaMarkConfig,
  DataTransform, FilterTransform, SortTransform, AggregateTransform, StackTransform,
  BinTransform, TimeUnitTransform, NormalizeTransform, CalculateTransform,
  ChartAxisSpec, ChartAnnotationSpec, ReferenceLineAnnotation, ThresholdBandAnnotation,
  TargetLineAnnotation, TextAnnotation, AnnotationType,
  ChartLegendSpec, ChartTooltipSpec, TooltipMode, ChartInteractionSpec, BrushDirection,
  ChartAppearanceSpec, ChartRenderer as ChartRendererType,
} from './chart-spec.js';

// Chart Data Transform Pipeline
export { applyTransforms } from './chart-transforms.js';
export {
  applyFilter, applySort, applyAggregate, applyStack,
  applyTimeUnit, applyBin, applyNormalize, applyCalculate,
} from './chart-transforms.js';

// AI Chart Recommendation
export { recommendChartSpec } from './chart-recommend.js';
export type { RecommendOptions } from './chart-recommend.js';
