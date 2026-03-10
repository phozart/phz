/**
 * @phozart/phz-engine/explorer — Visual Query Explorer
 *
 * Headless explorer module for self-service analytics:
 * field palette, drop zones, pivot preview, chart suggest,
 * artifact conversion, and dashboard integration.
 *
 * Moved from @phozart/phz-workspace/explore in v15 (A-2.01).
 */
export { exploreToDataQuery, type ExploreFieldSlot, type ExploreValueSlot, type ExploreFilterSlot, type ExploreQuery, type ExploreDataQuery, type ExploreDataQueryAggregation, type ExploreDataQueryFilter, } from './explore-types.js';
export { validateAggregation, type AggregationWarning, } from './aggregation-validation.js';
export { createFieldPalette, groupFieldsByType, searchFields, autoPlaceField, type PaletteField, type FieldPalette, type DropZoneType, } from './phz-field-palette.js';
export { createDropZoneState, addFieldToZone, removeFieldFromZone, moveFieldBetweenZones, getDefaultAggregation, getCardinalityWarning, validateDropZoneAggregation, type DropZoneState, type ZoneName, type DimensionEntry, type ValueEntry, type FilterEntry, } from './phz-drop-zones.js';
export { createPreviewController, toExploreQuery, type PreviewMode, type PreviewController, type QueryOptions, } from './phz-pivot-preview.js';
export { suggestChartType, type ChartSuggestOptions, } from './chart-suggest.js';
export { exploreToReport, exploreToDashboardWidget, type ReportArtifact, type DashboardWidgetArtifact, } from './explore-to-artifact.js';
export { createDataExplorer, type DataExplorer, type DataExplorerState, } from './phz-data-explorer.js';
export { promoteFilterToDashboard, buildDrillThroughPrePopulation, } from './explorer-dashboard-integration.js';
export { suggestWidgetForFieldDrop, type ExistingWidgetInfo, type ChartEncoding, type WidgetSuggestion, } from './widget-suggestion.js';
//# sourceMappingURL=index.d.ts.map