/**
 * @phozart/workspace — Data Config Panel State (B-3.05)
 *
 * Pure functions for managing multi-source data configuration UI.
 * Supports source mapping (field aliases), refresh interval configuration,
 * and loading strategy selection (preload vs full-load).
 */
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
export interface RefreshPreset {
    label: string;
    ms: number;
}
export declare const REFRESH_PRESETS: RefreshPreset[];
export declare function initialDataConfigPanelState(): DataConfigPanelState;
export declare function addDataSource(state: DataConfigPanelState, dataSourceId: string, name: string, maxDataSources?: number): DataConfigPanelState;
export declare function removeDataSource(state: DataConfigPanelState, id: string): DataConfigPanelState;
export declare function selectConfigDataSource(state: DataConfigPanelState, id: string): DataConfigPanelState;
export declare function toggleDataSourceEnabled(state: DataConfigPanelState, id: string): DataConfigPanelState;
export declare function addFieldAlias(state: DataConfigPanelState, sourceId: string, sourceField: string, alias: string): DataConfigPanelState;
export declare function removeFieldAlias(state: DataConfigPanelState, sourceId: string, sourceField: string): DataConfigPanelState;
export declare function setRefreshInterval(state: DataConfigPanelState, sourceId: string, ms: number): DataConfigPanelState;
export declare function setLoadingStrategy(state: DataConfigPanelState, sourceId: string, strategy: LoadingStrategy): DataConfigPanelState;
export declare function setMaxRows(state: DataConfigPanelState, sourceId: string, maxRows: number | undefined): DataConfigPanelState;
export declare function getSelectedSource(state: DataConfigPanelState): DataSourceConfig | undefined;
export declare function getEnabledSources(state: DataConfigPanelState): DataSourceConfig[];
export declare function resolveFieldName(source: DataSourceConfig, sourceField: string): string;
export interface DataConfigValidation {
    valid: boolean;
    errors: string[];
}
export declare function validateDataConfig(state: DataConfigPanelState): DataConfigValidation;
/**
 * Reset the source counter. Exposed only for testing determinism.
 * @internal
 */
export declare function _resetSourceCounter(): void;
//# sourceMappingURL=data-config-panel-state.d.ts.map