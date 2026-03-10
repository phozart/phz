/**
 * @phozart/phz-workspace — Explore to Artifact Conversion (P.4)
 *
 * Pure functions to convert ExploreQuery into report or dashboard widget
 * artifact configs. These are workspace-local types, not engine types —
 * a bridge layer maps them to the engine's ReportConfig/WidgetPlacement.
 */
import type { ExploreQuery } from '../explore-types.js';
export interface ReportArtifact {
    id: string;
    type: 'report';
    name: string;
    dataSource: string;
    columns: string[];
    groupBy: string[];
    aggregations: Array<{
        field: string;
        function: string;
        alias?: string;
    }>;
    filters: Array<{
        field: string;
        operator: string;
        value: unknown;
    }>;
    sort?: Array<{
        field: string;
        direction: 'asc' | 'desc';
    }>;
    limit?: number;
    createdAt: number;
}
export interface DashboardWidgetArtifact {
    id: string;
    widgetType: string;
    dashboardId?: string;
    dataConfig: {
        dimensions: string[];
        measures: Array<{
            field: string;
            aggregation: string;
            alias?: string;
        }>;
        filters: Array<{
            field: string;
            operator: string;
            value: unknown;
        }>;
    };
    position: {
        row: number;
        col: number;
        rowSpan: number;
        colSpan: number;
    };
}
export declare function exploreToReport(explore: ExploreQuery, name: string, dataSource: string): ReportArtifact;
export declare function exploreToDashboardWidget(explore: ExploreQuery, widgetType: string, dashboardId?: string): DashboardWidgetArtifact;
//# sourceMappingURL=explore-to-artifact.d.ts.map