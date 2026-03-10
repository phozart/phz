/**
 * data-workbench-orchestrator — Headless state machine for the interactive
 * data workbench (Tableau-like visual query builder).
 *
 * Combines:
 * - Data source browsing & field classification
 * - 4 drop zones (rows, columns, values, filters)
 * - Preview state management
 * - Chart suggestion
 * - Aggregation cycling
 * - Undo/redo via snapshot stack
 *
 * All functions are PURE — no side effects, no async, no DOM.
 * The Lit component handles async DataAdapter calls and feeds
 * results into these state transitions.
 */
import type { FieldMetadata, DataSourceMeta } from '@phozart/phz-shared';
import type { DropZoneState, ZoneName } from '@phozart/phz-engine';
import type { ExploreQuery } from '@phozart/phz-engine';
export interface DataSourceSchema {
    id: string;
    name: string;
    fields: FieldMetadata[];
}
export type PreviewMode = 'table' | 'chart' | 'sql';
/** Column descriptor for preview results. */
export interface PreviewColumn {
    name: string;
    dataType: string;
}
/** Preview data result from DataAdapter. */
export interface PreviewResult {
    columns: PreviewColumn[];
    rows: unknown[][];
    metadata: {
        totalRows: number;
        truncated: boolean;
        queryTimeMs: number;
    };
}
export interface WorkbenchState {
    sources: DataSourceMeta[];
    sourcesLoading: boolean;
    selectedSourceId: string | null;
    schema: DataSourceSchema | null;
    schemaLoading: boolean;
    dimensions: FieldMetadata[];
    measures: FieldMetadata[];
    timeFields: FieldMetadata[];
    identifiers: FieldMetadata[];
    fieldSearch: string;
    dropZones: DropZoneState;
    previewMode: PreviewMode;
    previewLoading: boolean;
    previewResult?: PreviewResult;
    previewError?: string;
    suggestedChart: string;
    undoStack: DropZoneState[];
    redoStack: DropZoneState[];
    error?: string;
}
export declare function createWorkbenchState(): WorkbenchState;
export declare function setWorkbenchSources(state: WorkbenchState, sources: DataSourceMeta[]): WorkbenchState;
export declare function setWorkbenchSourcesLoading(state: WorkbenchState): WorkbenchState;
export declare function setWorkbenchSchema(state: WorkbenchState, schema: DataSourceSchema): WorkbenchState;
export declare function setWorkbenchSchemaLoading(state: WorkbenchState): WorkbenchState;
export declare function setWorkbenchFieldSearch(state: WorkbenchState, query: string): WorkbenchState;
/** All classified fields filtered by search, in BI convention order: time → dims → measures → identifiers */
export declare function getFilteredFields(state: WorkbenchState): FieldMetadata[];
/** Get filtered fields grouped by category. */
export declare function getFilteredFieldsByCategory(state: WorkbenchState): {
    timeFields: FieldMetadata[];
    dimensions: FieldMetadata[];
    measures: FieldMetadata[];
    identifiers: FieldMetadata[];
};
export declare function addFieldToWorkbench(state: WorkbenchState, zone: ZoneName, field: FieldMetadata): WorkbenchState;
export declare function removeFieldFromWorkbench(state: WorkbenchState, zone: ZoneName, fieldName: string): WorkbenchState;
/** Auto-place field based on dataType: number→values, date→columns, bool→filters, string→rows */
export declare function autoPlaceWorkbenchField(state: WorkbenchState, field: FieldMetadata): WorkbenchState;
/** Cycle the aggregation function on a value field: sum → avg → count → min → max → count_distinct → sum */
export declare function cycleAggregation(state: WorkbenchState, fieldName: string): WorkbenchState;
export declare function setPreviewMode(state: WorkbenchState, mode: PreviewMode): WorkbenchState;
export declare function setPreviewLoading(state: WorkbenchState, loading: boolean): WorkbenchState;
export declare function setPreviewResult(state: WorkbenchState, result: PreviewResult): WorkbenchState;
export declare function setPreviewError(state: WorkbenchState, error: string): WorkbenchState;
/** Convert current drop zone state to an ExploreQuery for DataAdapter execution. */
export declare function workbenchToExploreQuery(state: WorkbenchState): ExploreQuery;
/** Check whether the workbench has any fields placed (i.e., a query can be executed). */
export declare function hasWorkbenchQuery(state: WorkbenchState): boolean;
/** Push the current drop zone state onto the undo stack. Call BEFORE making changes. */
export declare function pushWorkbenchSnapshot(state: WorkbenchState): WorkbenchState;
export declare function undoWorkbench(state: WorkbenchState): WorkbenchState;
export declare function redoWorkbench(state: WorkbenchState): WorkbenchState;
export declare function canUndoWorkbench(state: WorkbenchState): boolean;
export declare function canRedoWorkbench(state: WorkbenchState): boolean;
export declare function setWorkbenchError(state: WorkbenchState, error: string): WorkbenchState;
export declare function clearWorkbenchError(state: WorkbenchState): WorkbenchState;
//# sourceMappingURL=data-workbench-orchestrator.d.ts.map