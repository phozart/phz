/**
 * @phozart/phz-engine — Drill-Through Resolution
 *
 * Two-table pattern: aggregate → detail with selection context passthrough.
 */
import type { FilterState, SelectionContext } from '@phozart/phz-core';
import type { ReportId, KPIId } from './types.js';
import type { ReportConfigStore } from './report.js';
export interface DrillThroughAction {
    targetReportId: ReportId;
    filters: Record<string, string>;
    selectionOverrides?: SelectionContext;
    openIn: 'panel' | 'modal' | 'page';
}
export interface PivotDrillSource {
    type: 'pivot';
    rowValues: Record<string, string>;
    columnValues: Record<string, string>;
}
export interface ChartDrillSource {
    type: 'chart';
    xValue: string;
    seriesField?: string;
}
export interface KPIDrillSource {
    type: 'kpi';
    kpiId: KPIId;
    breakdownId?: string;
}
export interface ScorecardDrillSource {
    type: 'scorecard';
    kpiId: KPIId;
    breakdownId?: string;
    entityId?: string;
}
export interface GridRowDrillSource {
    type: 'grid-row';
    rowData: Record<string, unknown>;
    field?: string;
    value?: unknown;
    isSummaryRow?: boolean;
}
export interface DrillThroughConfig {
    targetReportId: ReportId;
    trigger: 'click' | 'dblclick';
    openIn: 'panel' | 'modal' | 'page';
    mode: 'filtered' | 'full';
    fieldMappings?: Array<{
        sourceField: string;
        targetField: string;
    }>;
    filterFields?: string[];
}
export type DrillSource = PivotDrillSource | ChartDrillSource | KPIDrillSource | ScorecardDrillSource | GridRowDrillSource;
export interface DrillContext {
    source: DrillSource;
    selectionContext?: SelectionContext;
    targetReportId?: ReportId;
    openIn?: 'panel' | 'modal' | 'page';
    filterFields?: string[];
}
/**
 * Resolve drill source into filter state.
 * Creates 'equals' filters from the drill context values.
 */
export declare function resolveDrillFilter(context: DrillContext): FilterState;
/**
 * Resolve a drill context into a full drill-through action.
 */
export declare function resolveDrillAction(context: DrillContext, reportStore?: ReportConfigStore): DrillThroughAction;
//# sourceMappingURL=drill-through.d.ts.map