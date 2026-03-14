/**
 * @phozart/engine — Report Configuration
 *
 * Reports define how data is displayed: columns, sorting, filtering,
 * aggregation, grouping, and conditional formatting.
 */
import type { SortState, FilterState, AggregationConfig, ConditionalFormattingRule, PivotConfig } from '@phozart/core';
import type { JoinType } from '@phozart/shared/types';
import type { ReportId, DataProductId, ValidationResult } from './types.js';
import type { ReportPresentation, GenerateDashboardConfig } from './report-presentation.js';
import type { DrillThroughConfig } from './drill-through.js';
import type { CriteriaConfig } from '@phozart/core';
export interface ReportColumnConfig {
    field: string;
    header?: string;
    width?: number;
    visible?: boolean;
    frozen?: boolean;
}
export interface ReportAdditionalSource {
    slotId: string;
    dataProductId: DataProductId;
    joinKeys: Array<{
        localField: string;
        remoteField: string;
    }>;
    joinType: JoinType;
}
export interface ReportConfig {
    id: ReportId;
    name: string;
    description?: string;
    dataProductId: DataProductId;
    additionalSources?: ReportAdditionalSource[];
    columns: ReportColumnConfig[];
    sort?: SortState;
    filter?: FilterState;
    aggregation?: AggregationConfig;
    grouping?: string[];
    conditionalFormatting?: ConditionalFormattingRule[];
    pivot?: PivotConfig;
    pageSize?: number;
    selectionFields?: string[];
    aggregateTable?: string;
    detailTable?: string;
    joinKey?: string;
    created: number;
    updated: number;
    createdBy?: string;
    permissions?: string[];
    presentation?: ReportPresentation;
    drillThrough?: DrillThroughConfig;
    generateDashboard?: GenerateDashboardConfig;
    criteriaConfig?: CriteriaConfig;
    chartConfig?: {
        enabled: boolean;
        chartType: string;
        encoding: {
            category?: string;
            value: string[];
            color?: string;
            size?: string;
            detail?: string;
            tooltip: string[];
        };
        style?: Record<string, unknown>;
    };
}
export interface ReportConfigStore {
    /** Creates a blank ReportConfig shell with a generated ID. */
    createBlank(name?: string): ReportConfig;
    save(config: ReportConfig): void;
    get(id: ReportId): ReportConfig | undefined;
    list(): ReportConfig[];
    delete(id: ReportId): void;
    validate(config: Partial<ReportConfig>): ValidationResult;
    toGridConfig(config: ReportConfig): {
        columns: Array<{
            field: string;
            header?: string;
            width?: number;
            visible?: boolean;
        }>;
        sort?: SortState;
        filter?: FilterState;
        presentation?: ReportPresentation;
    };
}
export declare function createReportConfigStore(): ReportConfigStore;
//# sourceMappingURL=report.d.ts.map