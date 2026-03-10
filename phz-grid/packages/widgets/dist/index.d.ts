/**
 * @phozart/phz-widgets — Lit Web Component Widgets
 *
 * KPI cards, scorecards, charts, dashboards, and more.
 * All components are framework-agnostic Web Components.
 */
export { widgetBaseStyles } from './shared-styles.js';
export { formatTooltipContent, computeTooltipPosition } from './tooltip.js';
export type { TooltipData, TooltipPosition, TooltipPositionOptions } from './tooltip.js';
export { resolveWidgetState } from './widget-states.js';
export type { WidgetStateConfig, WidgetStateResult } from './widget-states.js';
export { PhzKPICard } from './components/phz-kpi-card.js';
export { PhzKPIScorecard } from './components/phz-kpi-scorecard.js';
export { PhzBarChart, computeStackedSegments, computeGroupedBars, computeStackedTotal, generateLegendItems } from './components/phz-bar-chart.js';
export type { MultiSeriesDataPoint, StackedSegment, GroupedBar, LegendItem } from './components/phz-bar-chart.js';
export { PhzTrendLine } from './components/phz-trend-line.js';
export { PhzBottomN } from './components/phz-bottom-n.js';
export { PhzStatusTable } from './components/phz-status-table.js';
export { PhzDrillLink } from './components/phz-drill-link.js';
export { PhzDashboard } from './components/phz-dashboard.js';
export { PhzViewManager } from './components/phz-view-manager.js';
export { PhzSelectionBar } from './components/phz-selection-bar.js';
export { PhzWidget } from './components/phz-widget.js';
export { PhzPieChart } from './components/phz-pie-chart.js';
export type { PieChartDatum } from './components/phz-pie-chart.js';
export { PhzLineChart } from './components/phz-line-chart.js';
export type { LineChartPoint, LineChartSeries } from './components/phz-line-chart.js';
export { PhzAreaChart, scalePoints, buildLinePath, buildAreaPath, computeStackedData, computeYBounds } from './components/phz-area-chart.js';
export type { AreaDataPoint, AreaSeries, ScaledPoint, AreaChartPadding } from './components/phz-area-chart.js';
export { PhzGauge, valueToAngle, detectThresholdZone, describeArc, needleEndpoint } from './components/phz-gauge.js';
export type { GaugeThreshold } from './components/phz-gauge.js';
export { PhzScatterChart, computeNiceScale as scatterNiceScale, scalePoint, computeBubbleRadius, buildAccessibleDescription as buildScatterAccessibleDescription } from './components/phz-scatter-chart.js';
export type { ScatterDataPoint } from './components/phz-scatter-chart.js';
export { PhzHeatmap, hexToRGB, interpolateColor, computeHeatmapCells, buildHeatmapAccessibleDescription } from './components/phz-heatmap.js';
export type { HeatmapDatum, HeatmapCell } from './components/phz-heatmap.js';
export { PhzWaterfallChart, computeWaterfallBars, computeWaterfallBounds, buildWaterfallAccessibleDescription, WATERFALL_COLORS } from './components/phz-waterfall-chart.js';
export type { WaterfallDatum, WaterfallBar } from './components/phz-waterfall-chart.js';
export { PhzFunnelChart, computeFunnelStages, computeOverallConversion, buildFunnelAccessibleDescription, FUNNEL_PALETTE } from './components/phz-funnel-chart.js';
export type { FunnelDatum, FunnelStage } from './components/phz-funnel-chart.js';
export { resolveBreakpoint, computeResponsiveColumns, clampColSpan, computeResponsiveLayout, generateContainerQueryCSS } from './responsive-layout.js';
export { createCrossFilterEvent, applyCrossFilter, clearCrossFilter, isCrossFilterSource } from './cross-filter.js';
export { exportToCSV, escapeCSVField, formatClipboardData, exportToClipboard, exportToImage } from './widget-export.js';
export type { ExportColumn } from './widget-export.js';
export { PhzExportMenu, EXPORT_MENU_ITEMS } from './components/phz-export-menu.js';
export type { ExportMenuItem, WidgetExportEvent } from './components/phz-export-menu.js';
export { lightTheme, darkTheme, highContrastTheme, applyTheme, detectSystemTheme, resolveTheme, PhzThemeSwitcher } from './themes.js';
export type { DashboardTheme, ThemeTokens } from './themes.js';
export { PhzAlertPanel, PhzAlertBadge, createAlertStore, filterAlerts, computeBadgeCount, severityRank, alertTypeIcon } from './components/phz-alert-panel.js';
export type { AlertNotification, AlertFilter, AlertStore } from './components/phz-alert-panel.js';
export { createAnnotationManager, renderAnnotationMarker, PhzAnnotationLayer } from './annotations.js';
export type { Annotation, MarkerStyle, AnnotationManager } from './annotations.js';
export { PhzQueryBuilder, getOperatorsForType, validateFilter, buildQuerySummary, applyQueryToData } from './components/phz-query-builder.js';
export type { QueryField, QueryFilter, QueryAggregation, QuerySort, QueryConfig } from './components/phz-query-builder.js';
export { createDecisionTreeState, toggleNode, evaluateAllNodes, getVisibleNodes, findNodePath, getNodeDepth, getEffectiveStatus } from './decision-tree-state.js';
export type { DecisionTreeState } from './decision-tree-state.js';
export { PhzDecisionTree } from './components/phz-decision-tree.js';
export { createContainerBoxState, createDefaultContainerBoxState, toggleContainerCollapse, addChildWidget, removeChildWidget, reorderChildWidget, updateContainerConfig } from './container-box-state.js';
export type { ContainerBoxState } from './container-box-state.js';
export { PhzContainerBox } from './components/phz-container-box.js';
export { createExpandableWidgetState, createDefaultExpandableWidgetState, toggleExpand, setExpanded, finishAnimation, shouldShowToggle, getCollapsedMaxHeight } from './expandable-widget-state.js';
export type { ExpandableWidgetState } from './expandable-widget-state.js';
export { createViewGroupState, switchGroup, switchView, getActiveView, getActiveGroup, getAllViewIds, findGroupForView } from './view-group-state.js';
export type { ViewGroupState } from './view-group-state.js';
export { createRichTextState, shouldTruncate, updateContent, setMaxHeight, getLineCount, getPreview } from './rich-text-state.js';
export type { RichTextState, RichTextFormat } from './rich-text-state.js';
export { PhzRichText } from './components/phz-rich-text.js';
export { getMorphGroupForType, getTypesInMorphGroup, morphGroupToViewGroup, allMorphGroupsToViewGroups, formatWidgetTypeLabel, canMorphBetween } from './morph-view-group-mapper.js';
export type { MorphGroup } from './morph-view-group-mapper.js';
export { initialAttentionWidgetState, computePrioritySummary, getTopItems, getTotalCount, getContainerVariant } from './attention-widget-state.js';
export type { AttentionWidgetState, PrioritySummary, AttentionContainerVariant } from './attention-widget-state.js';
export { createValueOnlyRenderer, createSparklineRenderer, createDeltaRenderer, createGaugeArcRenderer, registerAllMicroWidgetRenderers } from './micro-widget-renderers.js';
export { initialImpactChainState, computeChainLayout, getChainContainerVariant, toggleNodeExpand, setContainerWidth, getHypothesisColor, getHypothesisLabel, getNodeRoleColor, computeChainSummary, resolveConclusion } from './impact-chain-state.js';
export type { ImpactChainState, NodePosition, ChainEdge, ComputedChainLayout, ChainContainerVariant, ChainSummary } from './impact-chain-state.js';
export { DECISION_TREE_VARIANTS } from './decision-tree-variants.js';
export type { DecisionTreeVariantEntry } from './decision-tree-variants.js';
//# sourceMappingURL=index.d.ts.map