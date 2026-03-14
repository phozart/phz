/**
 * explorer-wiring — Bridges the Explorer module to DataAdapter execution
 * and artifact persistence.
 *
 * Task 4.1: ExploreQuery → DataQuery → DataAdapter.execute()
 * Task 4.2: Aggregation picker (handled by ExploreValueSlot.aggregation)
 * Task 4.3: Live preview data fetching
 * Task 4.4: Save explorer results as report or dashboard widget
 * Task 4.5: Build drill-through query from widget context
 *
 * Tasks: 4.1-4.5 (WB-018 through WB-020, WB-029, WB-030)
 */
import type { DataAdapter, DataQuery } from '../data-adapter.js';
import type { ExploreQuery, ExploreFilterSlot } from '@phozart/engine';
import { type ReportArtifact, type DashboardWidgetArtifact } from '@phozart/engine';
/**
 * Convert an ExploreQuery (from the visual explorer) into a DataQuery
 * for DataAdapter.execute(). Adds the data source ID and maps operators.
 */
export declare function exploreQueryToDataQuery(explore: ExploreQuery, dataSourceId: string): DataQuery;
export interface ExplorerPreviewResult {
    rows: unknown[][];
    columns: Array<{
        name: string;
        dataType: string;
    }>;
    totalRows: number;
    error?: string;
}
/**
 * Fetch live preview data for the explorer.
 * Converts ExploreQuery → DataQuery → DataAdapter.execute().
 */
export declare function fetchExplorerPreview(adapter: DataAdapter, explore: ExploreQuery, dataSourceId: string): Promise<ExplorerPreviewResult>;
/** Minimal adapter interface for saving reports */
interface ReportSaveAdapter {
    saveReport(report: unknown): Promise<void>;
}
/**
 * Convert explorer query to a report artifact and persist via adapter.
 */
export declare function saveExplorerAsReport(adapter: ReportSaveAdapter, explore: ExploreQuery, dataSource: string, name: string): Promise<ReportArtifact>;
/**
 * Convert explorer query to a dashboard widget artifact.
 * The widget can then be added to a dashboard via the dashboard editor.
 */
export declare function saveExplorerAsDashboardWidget(explore: ExploreQuery, widgetType: string, dashboardId?: string): DashboardWidgetArtifact;
export interface DrillThroughContext {
    sourceWidgetType: string;
    dimension?: string;
    dimensionValue?: unknown;
    measures: string[];
    additionalFilters?: ExploreFilterSlot[];
}
/**
 * Build an ExploreQuery from a dashboard widget context for drill-through.
 * Pre-populates the explorer with the clicked dimension and widget's measures.
 */
export declare function buildDrillThroughQuery(context: DrillThroughContext): ExploreQuery;
export {};
//# sourceMappingURL=explorer-wiring.d.ts.map