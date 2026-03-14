/**
 * @phozart/widgets — Lit Web Component Widgets
 *
 * KPI cards, scorecards, charts, dashboards, and more.
 * All components are framework-agnostic Web Components.
 */
// Shared styles
export { widgetBaseStyles } from './shared-styles.js';
// Tooltip utilities
export { formatTooltipContent, computeTooltipPosition } from './tooltip.js';
// Widget state utilities
export { resolveWidgetState } from './widget-states.js';
// Components
export { PhzKPICard } from './components/phz-kpi-card.js';
export { PhzKPIScorecard } from './components/phz-kpi-scorecard.js';
export { PhzBarChart, computeStackedSegments, computeGroupedBars, computeStackedTotal, generateLegendItems } from './components/phz-bar-chart.js';
export { PhzTrendLine } from './components/phz-trend-line.js';
export { PhzBottomN } from './components/phz-bottom-n.js';
export { PhzStatusTable } from './components/phz-status-table.js';
export { PhzDrillLink } from './components/phz-drill-link.js';
export { PhzDashboard } from './components/phz-dashboard.js';
export { PhzViewManager } from './components/phz-view-manager.js';
export { PhzSelectionBar } from './components/phz-selection-bar.js';
export { PhzWidget } from './components/phz-widget.js';
export { PhzPieChart } from './components/phz-pie-chart.js';
export { PhzLineChart } from './components/phz-line-chart.js';
export { PhzAreaChart, scalePoints, buildLinePath, buildAreaPath, computeStackedData, computeYBounds } from './components/phz-area-chart.js';
export { PhzGauge, valueToAngle, detectThresholdZone, describeArc, needleEndpoint } from './components/phz-gauge.js';
export { PhzScatterChart, computeNiceScale as scatterNiceScale, scalePoint, computeBubbleRadius, buildAccessibleDescription as buildScatterAccessibleDescription } from './components/phz-scatter-chart.js';
export { PhzHeatmap, hexToRGB, interpolateColor, computeHeatmapCells, buildHeatmapAccessibleDescription } from './components/phz-heatmap.js';
export { PhzWaterfallChart, computeWaterfallBars, computeWaterfallBounds, buildWaterfallAccessibleDescription, WATERFALL_COLORS } from './components/phz-waterfall-chart.js';
export { PhzFunnelChart, computeFunnelStages, computeOverallConversion, buildFunnelAccessibleDescription, FUNNEL_PALETTE } from './components/phz-funnel-chart.js';
export { PhzSlicer, filterItems, toggleMultiValue, selectAll, selectNone, clampRange, buildRangeValues } from './components/phz-slicer.js';
// Responsive layout
export { resolveBreakpoint, computeResponsiveColumns, clampColSpan, computeResponsiveLayout, generateContainerQueryCSS } from './responsive-layout.js';
// Cross-filtering
export { createCrossFilterEvent, applyCrossFilter, clearCrossFilter, isCrossFilterSource } from './cross-filter.js';
// Widget export
export { exportToCSV, escapeCSVField, formatClipboardData, exportToClipboard, exportToImage } from './widget-export.js';
export { PhzExportMenu, EXPORT_MENU_ITEMS } from './components/phz-export-menu.js';
// Themes
export { lightTheme, darkTheme, highContrastTheme, applyTheme, detectSystemTheme, resolveTheme, PhzThemeSwitcher } from './themes.js';
// KPI Alert Notifications
export { PhzAlertPanel, PhzAlertBadge, createAlertStore, filterAlerts, computeBadgeCount, severityRank, alertTypeIcon } from './components/phz-alert-panel.js';
// Annotations
export { createAnnotationManager, renderAnnotationMarker, PhzAnnotationLayer } from './annotations.js';
// Query Builder
export { PhzQueryBuilder, getOperatorsForType, validateFilter, buildQuerySummary, applyQueryToData } from './components/phz-query-builder.js';
// Decision Tree (C-1.01)
export { createDecisionTreeState, toggleNode, evaluateAllNodes, getVisibleNodes, findNodePath, getNodeDepth, getEffectiveStatus } from './decision-tree-state.js';
export { PhzDecisionTree } from './components/phz-decision-tree.js';
// Container Box (C-1.03)
export { createContainerBoxState, createDefaultContainerBoxState, toggleContainerCollapse, addChildWidget, removeChildWidget, reorderChildWidget, updateContainerConfig } from './container-box-state.js';
export { PhzContainerBox } from './components/phz-container-box.js';
// Expandable Widget (C-1.04)
export { createExpandableWidgetState, createDefaultExpandableWidgetState, toggleExpand, setExpanded, finishAnimation, shouldShowToggle, getCollapsedMaxHeight } from './expandable-widget-state.js';
// View Groups (C-1.05)
export { createViewGroupState, switchGroup, switchView, getActiveView, getActiveGroup, getAllViewIds, findGroupForView } from './view-group-state.js';
// Rich Text (C-1.06)
export { createRichTextState, shouldTruncate, updateContent, setMaxHeight, getLineCount, getPreview } from './rich-text-state.js';
export { PhzRichText } from './components/phz-rich-text.js';
// Morph / View Group Mapper (C-1.07)
export { getMorphGroupForType, getTypesInMorphGroup, morphGroupToViewGroup, allMorphGroupsToViewGroups, formatWidgetTypeLabel, canMorphBetween } from './morph-view-group-mapper.js';
// Attention Widget (7A-D)
export { initialAttentionWidgetState, computePrioritySummary, getTopItems, getTotalCount, getContainerVariant } from './attention-widget-state.js';
// Micro-Widget Cell Renderers (7A-B)
export { createValueOnlyRenderer, createSparklineRenderer, createDeltaRenderer, createGaugeArcRenderer, registerAllMicroWidgetRenderers } from './micro-widget-renderers.js';
// Impact Chain State (7A-C)
export { initialImpactChainState, computeChainLayout, getChainContainerVariant, toggleNodeExpand, setContainerWidth, getHypothesisColor, getHypothesisLabel, getNodeRoleColor, computeChainSummary, resolveConclusion } from './impact-chain-state.js';
// Decision Tree Variants (7A-C)
export { DECISION_TREE_VARIANTS } from './decision-tree-variants.js';
// Unified Chart Component
export { PhzChart } from './components/phz-chart.js';
// Chart subsystem
export * from './chart/index.js';
//# sourceMappingURL=index.js.map