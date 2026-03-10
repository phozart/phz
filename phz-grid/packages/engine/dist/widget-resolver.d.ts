/**
 * @phozart/phz-engine — Widget Data Resolver
 *
 * Pure functions that map WidgetPlacement + BIEngine + raw data → resolved widget props.
 * No DOM dependencies — suitable for server-side pre-rendering or headless tests.
 */
import type { SelectionContext, DataSetColumn } from '@phozart/phz-core';
import type { BIEngine } from './engine.js';
import type { KPIDefinition, KPIScoreResponse, KPIBreakdownScore } from './kpi.js';
import type { ChartDataSeries } from './chart-projection.js';
import type { WidgetType, WidgetPlacement } from './widget.js';
import type { DashboardConfig } from './dashboard.js';
import type { KPIId } from './types.js';
import type { DashboardDataModel } from './expression-types.js';
export interface ResolvedWidgetProps {
    widgetType: WidgetType;
    kpiDefinition?: KPIDefinition;
    value?: number;
    previousValue?: number;
    trendData?: number[];
    cardStyle?: 'compact' | 'expanded' | 'minimal';
    chartData?: ChartDataSeries;
    rankOrder?: 'asc' | 'desc';
    maxBars?: number;
    target?: number;
    periods?: number;
    data?: Record<string, unknown>[];
    metricField?: string;
    dimensionField?: string;
    n?: number;
    direction?: 'bottom' | 'top';
    kpiDefinitions?: KPIDefinition[];
    scores?: KPIScoreResponse[];
    entityField?: string;
    label?: string;
    targetReportId?: string;
    filters?: Record<string, string>;
}
export type KPIScoreProvider = (kpiId: KPIId, data: Record<string, unknown>[], kpiDef: KPIDefinition) => {
    value: number;
    previousValue?: number;
    trendData?: number[];
    breakdowns?: KPIBreakdownScore[];
    estimated?: boolean;
};
export interface WidgetResolverContext {
    engine: BIEngine;
    data: Record<string, unknown>[];
    selectionContext?: SelectionContext;
    scoreProvider?: KPIScoreProvider;
    /** Optional DataSet schema for field validation warnings. */
    schema?: DataSetColumn[];
    /** Optional data model for expression-based computed fields/metrics. */
    dataModel?: DashboardDataModel;
    /** Parameter values for expression evaluation. */
    paramValues?: Record<string, unknown>;
}
/**
 * Resolve a single widget's display props from its config + data context.
 */
export declare function resolveWidgetProps(widget: WidgetPlacement, ctx: WidgetResolverContext): ResolvedWidgetProps;
/**
 * Resolve all widgets in a dashboard config, returning a Map keyed by widget ID.
 */
export declare function resolveDashboardWidgets(dashboard: DashboardConfig, ctx: WidgetResolverContext): Map<string, ResolvedWidgetProps>;
//# sourceMappingURL=widget-resolver.d.ts.map