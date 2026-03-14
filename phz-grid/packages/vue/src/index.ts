/**
 * @phozart/vue — Vue 3 Wrapper for phz-grid
 *
 * Provides a Vue component and composables that wrap the <phz-grid>
 * Web Component with idiomatic Vue APIs. This package uses Vue's
 * defineCustomElement interop.
 *
 * NOTE: Requires Vue 3.x as a peer dependency.
 */

// Component and composable types (framework-agnostic type definitions)
export type {
  PhzGridProps,
  PhzGridEmits,
  UseGridReturn,
  UseGridSelectionReturn,
  UseGridSortReturn,
  UseGridFilterReturn,
  UseGridEditReturn,
} from './types.js';

// The actual Vue component and composables are provided as factory functions
// that accept the Vue runtime to avoid hard dependency on Vue
export {
  createPhzGridComponent,
  createUseGrid,
  createUseGridSelection,
  createUseGridSort,
  createUseGridFilter,
  createUseGridEdit,
} from './factories.js';
