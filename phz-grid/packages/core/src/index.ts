/**
 * @phozart/phz-core — Headless grid engine
 *
 * Zero DOM dependencies. Foundation for all rendering layers.
 */

// Types
export * from './types/index.js';

// Factory
export { createGrid } from './create-grid.js';

// Event Emitter (internal, but exported for grid package)
export { EventEmitter } from './event-emitter.js';

// State Management
export { StateManager, createInitialState } from './state.js';

// Row Model Pipeline
export {
  parseData,
  buildCoreRowModel,
  buildRowMap,
  filterRows,
  sortRows,
  groupRows,
  flattenRows,
  virtualizeRows,
} from './row-model.js';

// Type Guards
export {
  isEditStateIdle,
  isEditStateEditing,
  isEditStateValidating,
  isEditStateCommitting,
  isEditStateError,
  isLocalDataSource,
  isAsyncDataSource,
  isDuckDBDataSource,
} from './type-guards.js';

// Utilities
export {
  immutableUpdate,
  immutableArrayUpdate,
  immutableArrayInsert,
  immutableArrayRemove,
  immutableMapUpdate,
  immutableMapDelete,
  immutableSetAdd,
  immutableSetDelete,
  serializeCellPosition,
  deserializeCellPosition,
  resolveLabelTemplate,
  buildTreeFromSource,
} from './utils.js';

// Selection Context
export {
  serializeSelection,
  deserializeSelection,
  mergeSelection,
  validateSelection,
} from './selection.js';

// DataSet
export { toColumnDefinitions, createDataSet, inferDataSetColumns } from './dataset.js';

// QueryBackend
export { createJSArrayQueryBackend } from './js-query-backend.js';

// Progressive Loading
export {
  createInitialProgressiveState,
  startProgressiveLoad,
  onChunkReceived,
  onAllChunksComplete,
  startRefresh,
  shouldShowOverlay,
  shouldShowFooterIndicator,
  getProgressMessage,
  getNextOffset,
} from './progressive-load.js';
export type {
  ProgressiveLoadConfig,
  ProgressivePhase,
  ProgressiveLoadState,
} from './progressive-load.js';
