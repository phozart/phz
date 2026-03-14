/**
 * @phozart/core — Configuration Types
 */

import type { ColumnDefinition } from './column.js';
import type { GridState } from './state.js';
import type { Plugin } from './plugin.js';
import type { UserRole } from './common.js';
import type { QueryBackend } from './query-backend.js';
import type { ProgressiveLoadConfig } from '../progressive-load.js';

/**
 * Configuration object passed to {@link createGrid} to initialize a headless
 * grid instance. At minimum, supply a `data` array; columns can be inferred
 * automatically from the first row when `autoColumns` is not `false`.
 *
 * @example
 * ```ts
 * const config: GridConfig = {
 *   data: rows,
 *   columns: [{ field: 'name', header: 'Name', type: 'string' }],
 *   enableSorting: true,
 *   enableFiltering: true,
 *   rowIdField: 'id',
 * };
 * ```
 */
export interface GridConfig<TData = any> {
  /** Row data array. Each element is an object whose keys map to column fields. */
  data: unknown[];
  /** Column definitions. Omit to auto-infer from the first data row. */
  columns?: ColumnDefinition<TData>[];
  /** When `true` (default), columns are inferred from data if `columns` is omitted. */
  autoColumns?: boolean;
  /** Property name used as the unique row identifier. Defaults to auto-generated IDs. */
  rowIdField?: string;
  /** Partial state to merge into the default initial grid state. */
  initialState?: Partial<GridState<TData>>;
  /** Plugins to register on the grid at creation time. */
  plugins?: Plugin[];
  /** Enable row virtualization for large datasets. */
  enableVirtualization?: boolean;
  /** Enable row/cell selection. */
  enableSelection?: boolean;
  /** Enable inline cell editing. */
  enableEditing?: boolean;
  /** Enable column sorting. */
  enableSorting?: boolean;
  /** Enable column filtering. */
  enableFiltering?: boolean;
  /** Fine-grained feature flags (overrides individual `enable*` flags). */
  features?: FeatureFlags;
  /** Accessibility configuration (keyboard nav, ARIA labels, focus mode). */
  accessibility?: AccessibilityConfig;
  /** Performance tuning (overscan, batch size, debounce, workers). */
  performance?: PerformanceConfig;
  /** Async query backend for server-side sort/filter/pagination. */
  queryBackend?: QueryBackend;
  /** Progressive (chunked) loading configuration. */
  progressiveLoad?: ProgressiveLoadConfig;
  /** Current user's role — used for column-level access control and masking. */
  userRole?: UserRole;
}

export interface FeatureFlags {
  virtualization?: boolean;
  selection?: boolean;
  editing?: boolean;
  sorting?: boolean;
  filtering?: boolean;
  grouping?: boolean;
  columnResize?: boolean;
  columnReorder?: boolean;
  columnFreeze?: boolean;
  responsive?: boolean;
}

export interface AccessibilityConfig {
  enabled?: boolean;
  announceChanges?: boolean;
  ariaLabels?: AriaLabels;
  keyboardNavigation?: boolean;
  focusMode?: 'cell' | 'row' | 'none';
}

export interface AriaLabels {
  grid?: string;
  rowGroup?: string;
  columnHeader?: string;
  cell?: string;
  sortAscending?: string;
  sortDescending?: string;
  filterActive?: string;
  selectedRow?: string;
  expandedGroup?: string;
  collapsedGroup?: string;
}

export interface PerformanceConfig {
  virtualScrollOverscan?: number;
  batchSize?: number;
  debounceMs?: number;
  enableWorkers?: boolean;
}
