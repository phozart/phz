/**
 * @phozart/viewer — Explorer Screen State
 *
 * Thin wrapper around @phozart/engine/explorer DataExplorer.
 * Adds viewer-specific concerns: data source selection, preview
 * rendering mode, and chart type tracking.
 */

import type { DataExplorer, DataExplorerState } from '@phozart/engine/explorer';
import type { DataSourceMeta, FieldMetadata } from '@phozart/shared/adapters';

// ========================================================================
// Preview mode (how the explorer renders results)
// ========================================================================

export type ExplorerPreviewMode = 'table' | 'chart' | 'pivot';

// ========================================================================
// ExplorerScreenState
// ========================================================================

export interface ExplorerScreenState {
  /** Available data sources for the explorer. */
  dataSources: DataSourceMeta[];
  /** Currently selected data source ID. */
  selectedSourceId: string | null;
  /** Fields for the selected data source. */
  fields: FieldMetadata[];
  /** Reference to the engine's DataExplorer instance. */
  explorer: DataExplorer | null;
  /** Current preview rendering mode. */
  previewMode: ExplorerPreviewMode;
  /** Suggested chart type from the engine. */
  suggestedChartType: string | null;
  /** Whether data sources are loading. */
  loadingDataSources: boolean;
  /** Whether fields are loading for the selected source. */
  loadingFields: boolean;
  /** Whether the preview is loading. */
  loadingPreview: boolean;
  /** Search query for filtering the field palette. */
  fieldSearchQuery: string;
}

// ========================================================================
// Factory
// ========================================================================

export function createExplorerScreenState(
  overrides?: Partial<ExplorerScreenState>,
): ExplorerScreenState {
  return {
    dataSources: overrides?.dataSources ?? [],
    selectedSourceId: overrides?.selectedSourceId ?? null,
    fields: overrides?.fields ?? [],
    explorer: overrides?.explorer ?? null,
    previewMode: overrides?.previewMode ?? 'table',
    suggestedChartType: overrides?.suggestedChartType ?? null,
    loadingDataSources: overrides?.loadingDataSources ?? false,
    loadingFields: overrides?.loadingFields ?? false,
    loadingPreview: overrides?.loadingPreview ?? false,
    fieldSearchQuery: overrides?.fieldSearchQuery ?? '',
  };
}

// ========================================================================
// State transitions
// ========================================================================

/**
 * Set the available data sources.
 */
export function setDataSources(
  state: ExplorerScreenState,
  dataSources: DataSourceMeta[],
): ExplorerScreenState {
  return { ...state, dataSources, loadingDataSources: false };
}

/**
 * Select a data source and clear any prior field state.
 */
export function selectDataSource(
  state: ExplorerScreenState,
  sourceId: string,
): ExplorerScreenState {
  return {
    ...state,
    selectedSourceId: sourceId,
    fields: [],
    loadingFields: true,
    suggestedChartType: null,
    fieldSearchQuery: '',
  };
}

/**
 * Set fields after loading schema for the selected source.
 * Also initialises the data explorer with the new fields.
 */
export function setFields(
  state: ExplorerScreenState,
  fields: FieldMetadata[],
): ExplorerScreenState {
  // If we have a DataExplorer reference, set its data source
  if (state.explorer && state.selectedSourceId) {
    state.explorer.setDataSource(state.selectedSourceId, fields);
  }

  return {
    ...state,
    fields,
    loadingFields: false,
  };
}

/**
 * Set the DataExplorer reference.
 */
export function setExplorer(
  state: ExplorerScreenState,
  explorer: DataExplorer,
): ExplorerScreenState {
  return { ...state, explorer };
}

/**
 * Set the preview rendering mode.
 */
export function setPreviewMode(
  state: ExplorerScreenState,
  previewMode: ExplorerPreviewMode,
): ExplorerScreenState {
  return { ...state, previewMode };
}

/**
 * Update the suggested chart type from the engine.
 */
export function setSuggestedChartType(
  state: ExplorerScreenState,
  suggestedChartType: string | null,
): ExplorerScreenState {
  return { ...state, suggestedChartType };
}

/**
 * Set the field search query for the palette filter.
 */
export function setFieldSearch(
  state: ExplorerScreenState,
  fieldSearchQuery: string,
): ExplorerScreenState {
  return { ...state, fieldSearchQuery };
}

/**
 * Get the current explorer state snapshot (from the engine).
 */
export function getExplorerSnapshot(
  state: ExplorerScreenState,
): DataExplorerState | null {
  return state.explorer?.getState() ?? null;
}

/**
 * Filter fields by the current search query.
 */
export function getFilteredFields(state: ExplorerScreenState): FieldMetadata[] {
  if (!state.fieldSearchQuery.trim()) {
    return state.fields;
  }
  const q = state.fieldSearchQuery.toLowerCase().trim();
  return state.fields.filter(f => f.name.toLowerCase().includes(q));
}
