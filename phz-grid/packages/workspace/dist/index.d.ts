/**
 * @phozart/workspace — Unified Workspace for Admin & Authoring
 *
 * UI sub-modules (grid-admin, engine-admin, grid-creator, criteria-admin,
 * definition-ui) register custom elements as side effects and must be
 * imported via sub-path exports:
 *   import '@phozart/workspace/grid-admin';
 *   import '@phozart/workspace/engine-admin';
 *   import '@phozart/workspace/grid-creator';
 *   import '@phozart/workspace/criteria-admin';
 *   import '@phozart/workspace/definition-ui';
 */
export * from './types.js';
export * from './placement.js';
export * from './workspace-adapter.js';
export * from './data-adapter.js';
export * from './format/format-value.js';
export * from './interaction-bus.js';
export * from './explore-types.js';
export * from './adapters/index.js';
export * from './catalog/index.js';
export * from './placements/index.js';
export * from './registry/index.js';
export * from './schema/index.js';
export * from './client/index.js';
export * from './shell/index.js';
export * from './layout/index.js';
export * from './coordination/index.js';
export * from './i18n/i18n-provider.js';
export * from './filters/index.js';
export * from './alerts/index.js';
export * from './templates/index.js';
export * from './explore/index.js';
export * from './navigation/index.js';
export * from './styles/index.js';
export * from './local/index.js';
export * from './data-source/index.js';
export * from './govern/index.js';
export { createWorkbenchState, setWorkbenchSources, setWorkbenchSourcesLoading, setWorkbenchSchema, setWorkbenchSchemaLoading, setWorkbenchFieldSearch, getFilteredFields, getFilteredFieldsByCategory, addFieldToWorkbench, removeFieldFromWorkbench, autoPlaceWorkbenchField, cycleAggregation, setPreviewMode as setWorkbenchPreviewMode, setPreviewLoading as setWorkbenchPreviewLoading, setPreviewResult as setWorkbenchPreviewResult, setPreviewError as setWorkbenchPreviewError, workbenchToExploreQuery, hasWorkbenchQuery, pushWorkbenchSnapshot, undoWorkbench, redoWorkbench, canUndoWorkbench, canRedoWorkbench, setWorkbenchError, clearWorkbenchError, type WorkbenchState, type PreviewResult as WorkbenchPreviewResult, type PreviewColumn as WorkbenchPreviewColumn, } from './authoring/data-workbench-orchestrator.js';
//# sourceMappingURL=index.d.ts.map