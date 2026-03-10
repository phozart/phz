/**
 * @phozart/phz-engine/explorer — Visual Query Explorer
 *
 * Headless explorer module for self-service analytics:
 * field palette, drop zones, pivot preview, chart suggest,
 * artifact conversion, and dashboard integration.
 *
 * Moved from @phozart/phz-workspace/explore in v15 (A-2.01).
 */
// Explore types & conversion
export { exploreToDataQuery, } from './explore-types.js';
// Aggregation validation
export { validateAggregation, } from './aggregation-validation.js';
// Field palette
export { createFieldPalette, groupFieldsByType, searchFields, autoPlaceField, } from './phz-field-palette.js';
// Drop zones
export { createDropZoneState, addFieldToZone, removeFieldFromZone, moveFieldBetweenZones, getDefaultAggregation, getCardinalityWarning, validateDropZoneAggregation, } from './phz-drop-zones.js';
// Pivot preview
export { createPreviewController, toExploreQuery, } from './phz-pivot-preview.js';
// Chart suggest
export { suggestChartType, } from './chart-suggest.js';
// Explore to artifact
export { exploreToReport, exploreToDashboardWidget, } from './explore-to-artifact.js';
// Data explorer
export { createDataExplorer, } from './phz-data-explorer.js';
// Explorer <-> Dashboard integration
export { promoteFilterToDashboard, buildDrillThroughPrePopulation, } from './explorer-dashboard-integration.js';
// Widget suggestion for dashboard field drops
export { suggestWidgetForFieldDrop, } from './widget-suggestion.js';
//# sourceMappingURL=index.js.map