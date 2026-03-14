/**
 * @phozart/engine/explorer — Visual Query Explorer
 *
 * Headless explorer module for self-service analytics:
 * field palette, drop zones, pivot preview, chart suggest,
 * artifact conversion, and dashboard integration.
 *
 * Moved from @phozart/workspace/explore in v15 (A-2.01).
 */

// Explore types & conversion
export {
  exploreToDataQuery,
  type ExploreFieldSlot,
  type ExploreValueSlot,
  type ExploreFilterSlot,
  type ExploreQuery,
  type ExploreDataQuery,
  type ExploreDataQueryAggregation,
  type ExploreDataQueryFilter,
} from './explore-types.js';

// Aggregation validation
export {
  validateAggregation,
  type AggregationWarning,
} from './aggregation-validation.js';

// Field palette
export {
  createFieldPalette,
  groupFieldsByType,
  searchFields,
  autoPlaceField,
  type PaletteField,
  type FieldPalette,
  type DropZoneType,
} from './phz-field-palette.js';

// Drop zones
export {
  createDropZoneState,
  addFieldToZone,
  removeFieldFromZone,
  moveFieldBetweenZones,
  getDefaultAggregation,
  getCardinalityWarning,
  validateDropZoneAggregation,
  type DropZoneState,
  type ZoneName,
  type DimensionEntry,
  type ValueEntry,
  type FilterEntry,
} from './phz-drop-zones.js';

// Pivot preview
export {
  createPreviewController,
  toExploreQuery,
  type PreviewMode,
  type PreviewController,
  type QueryOptions,
} from './phz-pivot-preview.js';

// Chart suggest
export {
  suggestChartType,
  type ChartSuggestOptions,
} from './chart-suggest.js';

// Explore to artifact
export {
  exploreToReport,
  exploreToDashboardWidget,
  type ReportArtifact,
  type DashboardWidgetArtifact,
} from './explore-to-artifact.js';

// Data explorer
export {
  createDataExplorer,
  type DataExplorer,
  type DataExplorerState,
} from './phz-data-explorer.js';

// Explorer <-> Dashboard integration
export {
  promoteFilterToDashboard,
  buildDrillThroughPrePopulation,
} from './explorer-dashboard-integration.js';

// Widget suggestion for dashboard field drops
export {
  suggestWidgetForFieldDrop,
  type ExistingWidgetInfo,
  type ChartEncoding,
  type WidgetSuggestion,
} from './widget-suggestion.js';

// Explore → Pivot converter
export { exploreQueryToPivot } from './explore-pivot.js';
