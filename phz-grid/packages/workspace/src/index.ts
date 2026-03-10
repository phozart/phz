/**
 * @phozart/phz-workspace — Unified Workspace for Admin & Authoring
 *
 * UI sub-modules (grid-admin, engine-admin, grid-creator, criteria-admin,
 * definition-ui) register custom elements as side effects and must be
 * imported via sub-path exports:
 *   import '@phozart/phz-workspace/grid-admin';
 *   import '@phozart/phz-workspace/engine-admin';
 *   import '@phozart/phz-workspace/grid-creator';
 *   import '@phozart/phz-workspace/criteria-admin';
 *   import '@phozart/phz-workspace/definition-ui';
 */

// Types & placement
export * from './types.js';
export * from './placement.js';
export * from './workspace-adapter.js';
export * from './data-adapter.js';
export * from './format/format-value.js';

// Interaction bus
export * from './interaction-bus.js';

// Explore types
export * from './explore-types.js';

// Adapters
export * from './adapters/index.js';

// Catalog
export * from './catalog/index.js';

// Placements
export * from './placements/index.js';

// Registry
export * from './registry/index.js';

// Schema & config
export * from './schema/index.js';

// Client
export * from './client/index.js';

// Shell
export * from './shell/index.js';

// Layout engine
export * from './layout/index.js';

// Coordination
export * from './coordination/index.js';

// I18n
export * from './i18n/i18n-provider.js';

// Filters
export * from './filters/index.js';

// Alerts
export * from './alerts/index.js';

// Templates
export * from './templates/index.js';

// Explore
export * from './explore/index.js';

// Navigation
export * from './navigation/index.js';

// Styles (design system)
export * from './styles/index.js';

// Local (browser-side persistence)
export * from './local/index.js';

// Data Source
export * from './data-source/index.js';

// Govern
export * from './govern/index.js';

// Data Workbench orchestrator (headless)
// Named exports to avoid collisions with data-adapter (DataSourceSchema),
// explore (PreviewMode), and filters (setPreviewError/setPreviewLoading).
export {
  createWorkbenchState,
  setWorkbenchSources,
  setWorkbenchSourcesLoading,
  setWorkbenchSchema,
  setWorkbenchSchemaLoading,
  setWorkbenchFieldSearch,
  getFilteredFields,
  getFilteredFieldsByCategory,
  addFieldToWorkbench,
  removeFieldFromWorkbench,
  autoPlaceWorkbenchField,
  cycleAggregation,
  setPreviewMode as setWorkbenchPreviewMode,
  setPreviewLoading as setWorkbenchPreviewLoading,
  setPreviewResult as setWorkbenchPreviewResult,
  setPreviewError as setWorkbenchPreviewError,
  workbenchToExploreQuery,
  hasWorkbenchQuery,
  pushWorkbenchSnapshot,
  undoWorkbench,
  redoWorkbench,
  canUndoWorkbench,
  canRedoWorkbench,
  setWorkbenchError,
  clearWorkbenchError,
  type WorkbenchState,
  type PreviewResult as WorkbenchPreviewResult,
  type PreviewColumn as WorkbenchPreviewColumn,
} from './authoring/data-workbench-orchestrator.js';
