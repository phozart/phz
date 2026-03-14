/**
 * @phozart/workspace — Explore Module (P.7)
 *
 * @deprecated Import from '@phozart/engine/explorer' instead.
 * These re-exports will be removed in v16.
 */
// Field palette (P.1)
export { createFieldPalette, groupFieldsByType, searchFields, autoPlaceField, } from './phz-field-palette.js';
// Drop zones (P.2 + P.2a)
export { createDropZoneState, addFieldToZone, removeFieldFromZone, moveFieldBetweenZones, getDefaultAggregation, getCardinalityWarning, validateDropZoneAggregation, } from './phz-drop-zones.js';
// Pivot preview (P.3)
export { createPreviewController, toExploreQuery, } from './phz-pivot-preview.js';
// Chart suggest (P.3)
export { suggestChartType, } from './chart-suggest.js';
// Explore to artifact (P.4)
export { exploreToReport, exploreToDashboardWidget, } from './explore-to-artifact.js';
// Data explorer (P.5)
export { createDataExplorer, } from './phz-data-explorer.js';
// Explorer <-> Dashboard integration (P.6)
export { promoteFilterToDashboard, buildDrillThroughPrePopulation, } from './explorer-dashboard-integration.js';
// Explore → Pivot converter
export { exploreQueryToPivot } from './explore-pivot.js';
//# sourceMappingURL=index.js.map