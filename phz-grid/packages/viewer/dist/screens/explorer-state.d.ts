/**
 * @phozart/phz-viewer — Explorer Screen State
 *
 * Thin wrapper around @phozart/phz-engine/explorer DataExplorer.
 * Adds viewer-specific concerns: data source selection, preview
 * rendering mode, and chart type tracking.
 */
import type { DataExplorer, DataExplorerState } from '@phozart/phz-engine/explorer';
import type { DataSourceMeta, FieldMetadata } from '@phozart/phz-shared/adapters';
export type ExplorerPreviewMode = 'table' | 'chart' | 'pivot';
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
export declare function createExplorerScreenState(overrides?: Partial<ExplorerScreenState>): ExplorerScreenState;
/**
 * Set the available data sources.
 */
export declare function setDataSources(state: ExplorerScreenState, dataSources: DataSourceMeta[]): ExplorerScreenState;
/**
 * Select a data source and clear any prior field state.
 */
export declare function selectDataSource(state: ExplorerScreenState, sourceId: string): ExplorerScreenState;
/**
 * Set fields after loading schema for the selected source.
 * Also initialises the data explorer with the new fields.
 */
export declare function setFields(state: ExplorerScreenState, fields: FieldMetadata[]): ExplorerScreenState;
/**
 * Set the DataExplorer reference.
 */
export declare function setExplorer(state: ExplorerScreenState, explorer: DataExplorer): ExplorerScreenState;
/**
 * Set the preview rendering mode.
 */
export declare function setPreviewMode(state: ExplorerScreenState, previewMode: ExplorerPreviewMode): ExplorerScreenState;
/**
 * Update the suggested chart type from the engine.
 */
export declare function setSuggestedChartType(state: ExplorerScreenState, suggestedChartType: string | null): ExplorerScreenState;
/**
 * Set the field search query for the palette filter.
 */
export declare function setFieldSearch(state: ExplorerScreenState, fieldSearchQuery: string): ExplorerScreenState;
/**
 * Get the current explorer state snapshot (from the engine).
 */
export declare function getExplorerSnapshot(state: ExplorerScreenState): DataExplorerState | null;
/**
 * Filter fields by the current search query.
 */
export declare function getFilteredFields(state: ExplorerScreenState): FieldMetadata[];
//# sourceMappingURL=explorer-state.d.ts.map