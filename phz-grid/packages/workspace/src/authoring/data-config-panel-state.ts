/**
 * @phozart/workspace — Data Config Panel State (B-3.05)
 *
 * Pure functions for managing multi-source data configuration UI.
 * Supports source mapping (field aliases), refresh interval configuration,
 * and loading strategy selection (preload vs full-load).
 */

// ========================================================================
// Types
// ========================================================================

export type LoadingStrategy = 'preload' | 'full-load' | 'lazy';

export interface FieldAlias {
  sourceField: string;
  alias: string;
}

export interface DataSourceConfig {
  id: string;
  name: string;
  dataSourceId: string;
  fieldAliases: FieldAlias[];
  refreshIntervalMs: number;
  loadingStrategy: LoadingStrategy;
  maxRows?: number;
  enabled: boolean;
}

export interface DataConfigPanelState {
  sources: DataSourceConfig[];
  selectedSourceId?: string;
  defaultLoadingStrategy: LoadingStrategy;
  defaultRefreshIntervalMs: number;
}

// ========================================================================
// Refresh interval presets
// ========================================================================

export interface RefreshPreset {
  label: string;
  ms: number;
}

export const REFRESH_PRESETS: RefreshPreset[] = [
  { label: 'Manual', ms: 0 },
  { label: '30 seconds', ms: 30_000 },
  { label: '1 minute', ms: 60_000 },
  { label: '5 minutes', ms: 300_000 },
  { label: '15 minutes', ms: 900_000 },
  { label: '1 hour', ms: 3_600_000 },
];

// ========================================================================
// Factory
// ========================================================================

export function initialDataConfigPanelState(): DataConfigPanelState {
  return {
    sources: [],
    defaultLoadingStrategy: 'preload',
    defaultRefreshIntervalMs: 300_000,
  };
}

// ========================================================================
// Source management
// ========================================================================

let sourceCounter = 0;

export function addDataSource(
  state: DataConfigPanelState,
  dataSourceId: string,
  name: string,
  maxDataSources?: number,
): DataConfigPanelState {
  // Capability gate: check max sources limit
  if (maxDataSources !== undefined && state.sources.length >= maxDataSources) {
    return state;
  }
  sourceCounter++;
  const id = `ds_${Date.now()}_${sourceCounter}`;
  const source: DataSourceConfig = {
    id,
    name,
    dataSourceId,
    fieldAliases: [],
    refreshIntervalMs: state.defaultRefreshIntervalMs,
    loadingStrategy: state.defaultLoadingStrategy,
    enabled: true,
  };
  return {
    ...state,
    sources: [...state.sources, source],
    selectedSourceId: id,
  };
}

export function removeDataSource(
  state: DataConfigPanelState,
  id: string,
): DataConfigPanelState {
  return {
    ...state,
    sources: state.sources.filter(s => s.id !== id),
    selectedSourceId: state.selectedSourceId === id ? undefined : state.selectedSourceId,
  };
}

export function selectConfigDataSource(
  state: DataConfigPanelState,
  id: string,
): DataConfigPanelState {
  if (!state.sources.some(s => s.id === id)) return state;
  return { ...state, selectedSourceId: id };
}

export function toggleDataSourceEnabled(
  state: DataConfigPanelState,
  id: string,
): DataConfigPanelState {
  return {
    ...state,
    sources: state.sources.map(s =>
      s.id === id ? { ...s, enabled: !s.enabled } : s,
    ),
  };
}

// ========================================================================
// Field aliases
// ========================================================================

export function addFieldAlias(
  state: DataConfigPanelState,
  sourceId: string,
  sourceField: string,
  alias: string,
): DataConfigPanelState {
  return {
    ...state,
    sources: state.sources.map(s => {
      if (s.id !== sourceId) return s;
      // Replace existing alias for same field, or add new
      const aliases = s.fieldAliases.filter(a => a.sourceField !== sourceField);
      return { ...s, fieldAliases: [...aliases, { sourceField, alias }] };
    }),
  };
}

export function removeFieldAlias(
  state: DataConfigPanelState,
  sourceId: string,
  sourceField: string,
): DataConfigPanelState {
  return {
    ...state,
    sources: state.sources.map(s => {
      if (s.id !== sourceId) return s;
      return {
        ...s,
        fieldAliases: s.fieldAliases.filter(a => a.sourceField !== sourceField),
      };
    }),
  };
}

// ========================================================================
// Refresh interval
// ========================================================================

export function setRefreshInterval(
  state: DataConfigPanelState,
  sourceId: string,
  ms: number,
): DataConfigPanelState {
  if (ms < 0) return state;
  return {
    ...state,
    sources: state.sources.map(s =>
      s.id === sourceId ? { ...s, refreshIntervalMs: ms } : s,
    ),
  };
}

// ========================================================================
// Loading strategy
// ========================================================================

export function setLoadingStrategy(
  state: DataConfigPanelState,
  sourceId: string,
  strategy: LoadingStrategy,
): DataConfigPanelState {
  return {
    ...state,
    sources: state.sources.map(s =>
      s.id === sourceId ? { ...s, loadingStrategy: strategy } : s,
    ),
  };
}

// ========================================================================
// Max rows
// ========================================================================

export function setMaxRows(
  state: DataConfigPanelState,
  sourceId: string,
  maxRows: number | undefined,
): DataConfigPanelState {
  if (maxRows !== undefined && maxRows < 0) return state;
  return {
    ...state,
    sources: state.sources.map(s =>
      s.id === sourceId ? { ...s, maxRows } : s,
    ),
  };
}

// ========================================================================
// Getters
// ========================================================================

export function getSelectedSource(
  state: DataConfigPanelState,
): DataSourceConfig | undefined {
  return state.sources.find(s => s.id === state.selectedSourceId);
}

export function getEnabledSources(
  state: DataConfigPanelState,
): DataSourceConfig[] {
  return state.sources.filter(s => s.enabled);
}

export function resolveFieldName(
  source: DataSourceConfig,
  sourceField: string,
): string {
  const alias = source.fieldAliases.find(a => a.sourceField === sourceField);
  return alias?.alias ?? sourceField;
}

// ========================================================================
// Validation
// ========================================================================

export interface DataConfigValidation {
  valid: boolean;
  errors: string[];
}

export function validateDataConfig(
  state: DataConfigPanelState,
): DataConfigValidation {
  const errors: string[] = [];

  if (state.sources.length === 0) {
    errors.push('At least one data source is required');
  }

  const enabledSources = getEnabledSources(state);
  if (state.sources.length > 0 && enabledSources.length === 0) {
    errors.push('At least one data source must be enabled');
  }

  for (const s of state.sources) {
    if (!s.name.trim()) {
      errors.push(`Data source "${s.id}" has no name`);
    }
    if (!s.dataSourceId.trim()) {
      errors.push(`Data source "${s.name || s.id}" has no data source ID`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Reset the source counter. Exposed only for testing determinism.
 * @internal
 */
export function _resetSourceCounter(): void {
  sourceCounter = 0;
}
