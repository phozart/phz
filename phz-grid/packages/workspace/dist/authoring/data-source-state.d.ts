/**
 * data-source-state — Headless state machine for data source browsing
 *
 * Manages the lifecycle of browsing data sources, loading schemas,
 * classifying fields into dimensions/measures/time/identifiers, and
 * selecting fields for report composition. Driven by the DataAdapter SPI.
 *
 * All functions are pure — no side effects, no async, no DOM.
 * The Lit component (or any UI) calls DataAdapter methods and feeds
 * results into these state transitions.
 */
import type { DataSourceMeta, FieldMetadata, FieldStatsResult } from '@phozart/phz-shared';
export type { DataSourceMeta, FieldMetadata };
export interface DataSourceSchema {
    id: string;
    name: string;
    fields: FieldMetadata[];
}
export interface DataSourceState {
    /** Available data sources from the adapter. */
    sources: DataSourceMeta[];
    sourcesLoading: boolean;
    /** Currently selected data source ID. */
    selectedSourceId: string | null;
    /** Schema for the selected data source. */
    schema: DataSourceSchema | null;
    schemaLoading: boolean;
    /** Classified field lists (derived from schema). */
    dimensions: FieldMetadata[];
    measures: FieldMetadata[];
    timeFields: FieldMetadata[];
    identifiers: FieldMetadata[];
    /** Fields selected for the current report/visualization. */
    selectedFields: string[];
    /** Field search query for filtering the sidebar. */
    fieldSearch: string;
    /** Cached field statistics (loaded on demand). */
    fieldStats: Record<string, FieldStatsResult>;
    /** Error message, if any. */
    error: string | null;
}
export declare function createDataSourceState(): DataSourceState;
export declare function setSources(state: DataSourceState, sources: DataSourceMeta[]): DataSourceState;
export declare function selectSource(state: DataSourceState, sourceId: string): DataSourceState;
export declare function setSchema(state: DataSourceState, schema: DataSourceSchema): DataSourceState;
export declare function setSchemaLoading(state: DataSourceState, loading: boolean): DataSourceState;
export declare function setFieldSearch(state: DataSourceState, query: string): DataSourceState;
export declare function addField(state: DataSourceState, fieldName: string): DataSourceState;
export declare function removeField(state: DataSourceState, fieldName: string): DataSourceState;
export declare function reorderFields(state: DataSourceState, fromIndex: number, toIndex: number): DataSourceState;
export declare function setFieldStats(state: DataSourceState, fieldName: string, stats: FieldStatsResult): DataSourceState;
export declare function setError(state: DataSourceState, message: string): DataSourceState;
export declare function clearError(state: DataSourceState): DataSourceState;
export declare function filteredDimensions(state: DataSourceState): FieldMetadata[];
export declare function filteredMeasures(state: DataSourceState): FieldMetadata[];
export declare function filteredTimeFields(state: DataSourceState): FieldMetadata[];
export declare function filteredIdentifiers(state: DataSourceState): FieldMetadata[];
/**
 * All filtered fields in presentation order: time → dimensions → measures → identifiers.
 * This order matches BI tool conventions (date context first, then slice, then measure, then ID).
 */
export declare function allFilteredFields(state: DataSourceState): FieldMetadata[];
//# sourceMappingURL=data-source-state.d.ts.map