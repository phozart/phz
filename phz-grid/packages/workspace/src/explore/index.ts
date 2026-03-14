/**
 * @phozart/workspace — Explore Module (P.7)
 *
 * @deprecated Import from '@phozart/engine/explorer' instead.
 * These re-exports will be removed in v16.
 */

// Field palette (P.1)
export {
  createFieldPalette,
  groupFieldsByType,
  searchFields,
  autoPlaceField,
  type PaletteField,
  type FieldPalette,
  type DropZoneType,
} from './phz-field-palette.js';

// Drop zones (P.2 + P.2a)
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

// Pivot preview (P.3)
export {
  createPreviewController,
  toExploreQuery,
  type PreviewMode,
  type PreviewController,
  type QueryOptions,
} from './phz-pivot-preview.js';

// Chart suggest (P.3)
export {
  suggestChartType,
  type ChartSuggestOptions,
} from './chart-suggest.js';

// Explore to artifact (P.4)
export {
  exploreToReport,
  exploreToDashboardWidget,
  type ReportArtifact,
  type DashboardWidgetArtifact,
} from './explore-to-artifact.js';

// Data explorer (P.5)
export {
  createDataExplorer,
  type DataExplorer,
  type DataExplorerState,
} from './phz-data-explorer.js';

// Explorer <-> Dashboard integration (P.6)
export {
  promoteFilterToDashboard,
  buildDrillThroughPrePopulation,
} from './explorer-dashboard-integration.js';

// Explore → Pivot converter
export { exploreQueryToPivot } from './explore-pivot.js';
