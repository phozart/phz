/**
 * @phozart/core — Headless grid engine
 *
 * Zero DOM dependencies. Foundation for all rendering layers.
 */
export * from './types/index.js';
export { createGrid } from './create-grid.js';
export { EventEmitter } from './event-emitter.js';
export { StateManager, createInitialState, pinColumn, unpinColumn, getEffectivePinState, } from './state.js';
export { parseData, buildCoreRowModel, buildRowMap, filterRows, sortRows, groupRows, flattenRows, virtualizeRows, } from './row-model.js';
export { isEditStateIdle, isEditStateEditing, isEditStateValidating, isEditStateCommitting, isEditStateError, isLocalDataSource, isAsyncDataSource, isDuckDBDataSource, } from './type-guards.js';
export { immutableUpdate, immutableArrayUpdate, immutableArrayInsert, immutableArrayRemove, immutableMapUpdate, immutableMapDelete, immutableSetAdd, immutableSetDelete, serializeCellPosition, deserializeCellPosition, resolveLabelTemplate, buildTreeFromSource, } from './utils.js';
export { serializeSelection, deserializeSelection, mergeSelection, validateSelection, } from './selection.js';
export { toColumnDefinitions, createDataSet, inferDataSetColumns } from './dataset.js';
export { createJSArrayQueryBackend } from './js-query-backend.js';
export { QueryPlanner, PlanOptimizer } from './query-planner.js';
export type { ExecutionEngine, QueryPlanStage, QueryPlan, PipelineCapabilities, QueryPlannerConfig, OptimizedQueryPlan, QueryHint, PlanContext, } from './query-planner.js';
export { createInitialProgressiveState, startProgressiveLoad, onChunkReceived, onAllChunksComplete, startRefresh, shouldShowOverlay, shouldShowFooterIndicator, getProgressMessage, getNextOffset, } from './progressive-load.js';
export type { ProgressiveLoadConfig, ProgressivePhase, ProgressiveLoadState, } from './progressive-load.js';
//# sourceMappingURL=index.d.ts.map