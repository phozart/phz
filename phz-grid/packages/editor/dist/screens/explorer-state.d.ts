/**
 * @phozart/editor — Explorer State (B-2.10)
 *
 * State machine for the editor explorer screen. Extends the engine
 * explorer with save-to-artifact capability, allowing users to
 * promote ad-hoc queries into saved reports or dashboard widgets.
 */
import type { ExploreQuery, ExploreFieldSlot, ExploreValueSlot, ExploreFilterSlot } from '@phozart/engine/explorer';
export type SaveTargetType = 'report' | 'dashboard-widget' | 'new-dashboard';
export interface SaveTarget {
    type: SaveTargetType;
    /** Existing artifact ID (for dashboard-widget, the dashboard to add to). */
    artifactId?: string;
    /** Name for the new artifact or widget. */
    name: string;
}
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
export declare function createExplorerState(dataSourceId?: string, overrides?: Partial<ExplorerState>): ExplorerState;
/**
 * Add a dimension to the explore query.
 */
export declare function addDimension(state: ExplorerState, field: ExploreFieldSlot): ExplorerState;
/**
 * Remove a dimension from the explore query.
 */
export declare function removeDimension(state: ExplorerState, field: string): ExplorerState;
/**
 * Add a measure to the explore query.
 */
export declare function addMeasure(state: ExplorerState, measure: ExploreValueSlot): ExplorerState;
/**
 * Remove a measure from the explore query.
 */
export declare function removeMeasure(state: ExplorerState, field: string): ExplorerState;
/**
 * Add a filter to the explore query.
 */
export declare function addExplorerFilter(state: ExplorerState, filter: ExploreFilterSlot): ExplorerState;
/**
 * Remove a filter from the explore query by index.
 */
export declare function removeExplorerFilter(state: ExplorerState, index: number): ExplorerState;
/**
 * Set the sort on the explore query.
 */
export declare function setExplorerSort(state: ExplorerState, sort: Array<{
    field: string;
    direction: 'asc' | 'desc';
}>): ExplorerState;
/**
 * Set the row limit on the explore query.
 */
export declare function setExplorerLimit(state: ExplorerState, limit: number | undefined): ExplorerState;
/**
 * Mark the explorer as executing a query.
 */
export declare function setExplorerExecuting(state: ExplorerState, executing: boolean): ExplorerState;
/**
 * Set the preview results from a query execution.
 */
export declare function setExplorerResults(state: ExplorerState, data: unknown[][], rowCount: number): ExplorerState;
/**
 * Set a suggested chart type.
 */
export declare function setSuggestedChartType(state: ExplorerState, chartType: string | null): ExplorerState;
/**
 * Open the save dialog with a target type.
 */
export declare function openSaveDialog(state: ExplorerState, targetType: SaveTargetType, name?: string, artifactId?: string): ExplorerState;
/**
 * Update the save target.
 */
export declare function updateSaveTarget(state: ExplorerState, updates: Partial<SaveTarget>): ExplorerState;
/**
 * Close the save dialog.
 */
export declare function closeSaveDialog(state: ExplorerState): ExplorerState;
/**
 * Set the data source ID and available fields.
 */
export declare function setExplorerDataSource(state: ExplorerState, dataSourceId: string, fields: string[]): ExplorerState;
/**
 * Set explorer error state.
 */
export declare function setExplorerError(state: ExplorerState, error: unknown): ExplorerState;
//# sourceMappingURL=explorer-state.d.ts.map