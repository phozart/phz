/**
 * @phozart/workspace — Report Editor State
 *
 * Pure functions for configuring a report (a configured <phz-grid>).
 * Manages columns, filters, sorting, grouping, conditional formatting, and density.
 */
import type { FilterValue } from '../types.js';
import type { ReportChartState } from './report-chart-state.js';
import type { JoinType } from '@phozart/shared/types';
export interface ReportColumnConfig {
    field: string;
    label: string;
    width?: number;
    visible: boolean;
    pinned?: 'left' | 'right';
    format?: string;
    aggregation?: string;
}
export interface ConditionalFormatRule {
    id: string;
    field: string;
    operator: 'greaterThan' | 'lessThan' | 'equals' | 'between';
    value: unknown;
    style: Record<string, string>;
}
export interface ReportAdditionalSourceConfig {
    slotId: string;
    dataSourceId: string;
    alias: string;
    joinKeys: Array<{
        localField: string;
        remoteField: string;
    }>;
    joinType: JoinType;
}
export interface ReportEditorState {
    name: string;
    dataSourceId: string;
    columns: ReportColumnConfig[];
    filters: FilterValue[];
    sorting: Array<{
        field: string;
        direction: 'asc' | 'desc';
    }>;
    grouping: string[];
    formatting: ConditionalFormatRule[];
    density: 'compact' | 'dense' | 'comfortable';
    configPanelTab: 'columns' | 'filters' | 'style' | 'formatting' | 'drill' | 'chart';
    selectedColumnField?: string;
    additionalSources: ReportAdditionalSourceConfig[];
    chartConfig?: ReportChartState;
}
export declare function initialReportEditorState(name: string, dataSourceId: string): ReportEditorState;
export declare function addColumn(state: ReportEditorState, field: string, label?: string): ReportEditorState;
export declare function removeColumn(state: ReportEditorState, field: string): ReportEditorState;
export declare function reorderColumns(state: ReportEditorState, fromIndex: number, toIndex: number): ReportEditorState;
export declare function updateColumn(state: ReportEditorState, field: string, updates: Partial<ReportColumnConfig>): ReportEditorState;
export declare function toggleColumnVisibility(state: ReportEditorState, field: string): ReportEditorState;
export declare function pinColumn(state: ReportEditorState, field: string, side?: 'left' | 'right'): ReportEditorState;
export declare function addFilter(state: ReportEditorState, filter: FilterValue): ReportEditorState;
export declare function removeFilter(state: ReportEditorState, filterId: string): ReportEditorState;
export declare function setSorting(state: ReportEditorState, sorting: Array<{
    field: string;
    direction: 'asc' | 'desc';
}>): ReportEditorState;
export declare function setGrouping(state: ReportEditorState, fields: string[]): ReportEditorState;
export declare function addConditionalFormat(state: ReportEditorState, rule: ConditionalFormatRule): ReportEditorState;
export declare function removeConditionalFormat(state: ReportEditorState, ruleId: string): ReportEditorState;
export declare function setDensity(state: ReportEditorState, density: ReportEditorState['density']): ReportEditorState;
export declare function setConfigPanelTab(state: ReportEditorState, tab: ReportEditorState['configPanelTab']): ReportEditorState;
export declare function selectColumn(state: ReportEditorState, field?: string): ReportEditorState;
export interface GridConfig {
    columns: Array<{
        field: string;
        headerName: string;
        width?: number;
        hide?: boolean;
        pinned?: string;
    }>;
    filters: FilterValue[];
    sorting: Array<{
        field: string;
        direction: 'asc' | 'desc';
    }>;
    grouping: string[];
    density: string;
}
export declare function toGridConfig(state: ReportEditorState): GridConfig;
export declare function addReportSource(state: ReportEditorState, dataSourceId: string, alias: string, joinKeys: Array<{
    localField: string;
    remoteField: string;
}>, joinType?: JoinType): ReportEditorState;
export declare function removeReportSource(state: ReportEditorState, slotId: string): ReportEditorState;
export declare function updateReportSource(state: ReportEditorState, slotId: string, updates: Partial<Omit<ReportAdditionalSourceConfig, 'slotId'>>): ReportEditorState;
/**
 * Reset the report source counter. Exposed only for testing determinism.
 * @internal
 */
export declare function _resetReportSourceCounter(): void;
//# sourceMappingURL=report-editor-state.d.ts.map