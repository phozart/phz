/**
 * @phozart/phz-editor — Explorer State (B-2.10)
 *
 * State machine for the editor explorer screen. Extends the engine
 * explorer with save-to-artifact capability, allowing users to
 * promote ad-hoc queries into saved reports or dashboard widgets.
 */

import type {
  ExploreQuery,
  ExploreFieldSlot,
  ExploreValueSlot,
  ExploreFilterSlot,
} from '@phozart/phz-engine/explorer';

// ========================================================================
// SaveTarget — where to save an explorer query
// ========================================================================

export type SaveTargetType = 'report' | 'dashboard-widget' | 'new-dashboard';

export interface SaveTarget {
  type: SaveTargetType;
  /** Existing artifact ID (for dashboard-widget, the dashboard to add to). */
  artifactId?: string;
  /** Name for the new artifact or widget. */
  name: string;
}

// ========================================================================
// ExplorerState
// ========================================================================

export interface ExplorerState {
  /** The current explore query being built. */
  query: ExploreQuery;
  /** The data source ID being explored. */
  dataSourceId: string;
  /** Available field names (from the schema). */
  availableFields: string[];
  /** Suggested chart type based on the current query shape. */
  suggestedChartType: string | null;
  /** Preview data from the most recent query execution. */
  previewData: unknown[][] | null;
  /** Number of result rows. */
  resultRowCount: number;
  /** Whether a query is currently executing. */
  executing: boolean;
  /** Whether the save dialog is open. */
  saveDialogOpen: boolean;
  /** The save target configuration. */
  saveTarget: SaveTarget | null;
  /** Loading state. */
  loading: boolean;
  /** Error state. */
  error: unknown;
}

// ========================================================================
// Factory
// ========================================================================

export function createExplorerState(
  dataSourceId?: string,
  overrides?: Partial<ExplorerState>,
): ExplorerState {
  return {
    query: { dimensions: [], measures: [], filters: [] },
    dataSourceId: dataSourceId ?? '',
    availableFields: [],
    suggestedChartType: null,
    previewData: null,
    resultRowCount: 0,
    executing: false,
    saveDialogOpen: false,
    saveTarget: null,
    loading: false,
    error: null,
    ...overrides,
  };
}

// ========================================================================
// Query building operations
// ========================================================================

/**
 * Add a dimension to the explore query.
 */
export function addDimension(
  state: ExplorerState,
  field: ExploreFieldSlot,
): ExplorerState {
  return {
    ...state,
    query: {
      ...state.query,
      dimensions: [...state.query.dimensions, field],
    },
    previewData: null, // Invalidate preview on query change
  };
}

/**
 * Remove a dimension from the explore query.
 */
export function removeDimension(
  state: ExplorerState,
  field: string,
): ExplorerState {
  return {
    ...state,
    query: {
      ...state.query,
      dimensions: state.query.dimensions.filter(d => d.field !== field),
    },
    previewData: null,
  };
}

/**
 * Add a measure to the explore query.
 */
export function addMeasure(
  state: ExplorerState,
  measure: ExploreValueSlot,
): ExplorerState {
  return {
    ...state,
    query: {
      ...state.query,
      measures: [...state.query.measures, measure],
    },
    previewData: null,
  };
}

/**
 * Remove a measure from the explore query.
 */
export function removeMeasure(
  state: ExplorerState,
  field: string,
): ExplorerState {
  return {
    ...state,
    query: {
      ...state.query,
      measures: state.query.measures.filter(m => m.field !== field),
    },
    previewData: null,
  };
}

/**
 * Add a filter to the explore query.
 */
export function addExplorerFilter(
  state: ExplorerState,
  filter: ExploreFilterSlot,
): ExplorerState {
  return {
    ...state,
    query: {
      ...state.query,
      filters: [...state.query.filters, filter],
    },
    previewData: null,
  };
}

/**
 * Remove a filter from the explore query by index.
 */
export function removeExplorerFilter(
  state: ExplorerState,
  index: number,
): ExplorerState {
  const filters = [...state.query.filters];
  filters.splice(index, 1);
  return {
    ...state,
    query: { ...state.query, filters },
    previewData: null,
  };
}

/**
 * Set the sort on the explore query.
 */
export function setExplorerSort(
  state: ExplorerState,
  sort: Array<{ field: string; direction: 'asc' | 'desc' }>,
): ExplorerState {
  return {
    ...state,
    query: { ...state.query, sort },
    previewData: null,
  };
}

/**
 * Set the row limit on the explore query.
 */
export function setExplorerLimit(
  state: ExplorerState,
  limit: number | undefined,
): ExplorerState {
  return {
    ...state,
    query: { ...state.query, limit },
    previewData: null,
  };
}

// ========================================================================
// Query execution
// ========================================================================

/**
 * Mark the explorer as executing a query.
 */
export function setExplorerExecuting(
  state: ExplorerState,
  executing: boolean,
): ExplorerState {
  return { ...state, executing };
}

/**
 * Set the preview results from a query execution.
 */
export function setExplorerResults(
  state: ExplorerState,
  data: unknown[][],
  rowCount: number,
): ExplorerState {
  return {
    ...state,
    previewData: data,
    resultRowCount: rowCount,
    executing: false,
    error: null,
  };
}

/**
 * Set a suggested chart type.
 */
export function setSuggestedChartType(
  state: ExplorerState,
  chartType: string | null,
): ExplorerState {
  return { ...state, suggestedChartType: chartType };
}

// ========================================================================
// Save-to-artifact flow
// ========================================================================

/**
 * Open the save dialog with a target type.
 */
export function openSaveDialog(
  state: ExplorerState,
  targetType: SaveTargetType,
  name?: string,
  artifactId?: string,
): ExplorerState {
  return {
    ...state,
    saveDialogOpen: true,
    saveTarget: {
      type: targetType,
      name: name ?? '',
      artifactId,
    },
  };
}

/**
 * Update the save target.
 */
export function updateSaveTarget(
  state: ExplorerState,
  updates: Partial<SaveTarget>,
): ExplorerState {
  if (!state.saveTarget) return state;
  return {
    ...state,
    saveTarget: { ...state.saveTarget, ...updates },
  };
}

/**
 * Close the save dialog.
 */
export function closeSaveDialog(state: ExplorerState): ExplorerState {
  return { ...state, saveDialogOpen: false, saveTarget: null };
}

// ========================================================================
// Data source
// ========================================================================

/**
 * Set the data source ID and available fields.
 */
export function setExplorerDataSource(
  state: ExplorerState,
  dataSourceId: string,
  fields: string[],
): ExplorerState {
  return {
    ...state,
    dataSourceId,
    availableFields: fields,
    // Reset query when switching data sources
    query: { dimensions: [], measures: [], filters: [] },
    previewData: null,
    resultRowCount: 0,
    suggestedChartType: null,
  };
}

/**
 * Set explorer error state.
 */
export function setExplorerError(state: ExplorerState, error: unknown): ExplorerState {
  return { ...state, error, executing: false, loading: false };
}
