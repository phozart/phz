/**
 * @phozart/phz-engine — Report Configuration
 *
 * Reports define how data is displayed: columns, sorting, filtering,
 * aggregation, grouping, and conditional formatting.
 */

import type {
  SortState,
  FilterState,
  AggregationConfig,
  ConditionalFormattingRule,
  PivotConfig,
} from '@phozart/phz-core';
import type { JoinType } from '@phozart/phz-shared/types';
import type { ReportId, DataProductId, ValidationResult } from './types.js';
import { reportId, dataProductId } from './types.js';
import type { ReportPresentation, GenerateDashboardConfig } from './report-presentation.js';
import type { DrillThroughConfig } from './drill-through.js';
import type { CriteriaConfig } from '@phozart/phz-core';

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
  joinKeys: Array<{ localField: string; remoteField: string }>;
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
    columns: Array<{ field: string; header?: string; width?: number; visible?: boolean }>;
    sort?: SortState;
    filter?: FilterState;
    presentation?: ReportPresentation;
  };
}

export function createReportConfigStore(): ReportConfigStore {
  const reports = new Map<ReportId, ReportConfig>();

  let blankCounter = 0;

  return {
    createBlank(name?: string): ReportConfig {
      blankCounter++;
      const id = reportId(`rpt-${Date.now()}-${blankCounter}`);
      const now = Date.now();
      return {
        id,
        name: name ?? 'Untitled Report',
        dataProductId: dataProductId(''),
        columns: [],
        created: now,
        updated: now,
      };
    },

    save(config: ReportConfig): void {
      reports.set(config.id, { ...config, updated: Date.now() });
    },

    get(id: ReportId): ReportConfig | undefined {
      return reports.get(id);
    },

    list(): ReportConfig[] {
      return Array.from(reports.values());
    },

    delete(id: ReportId): void {
      reports.delete(id);
    },

    validate(config: Partial<ReportConfig>): ValidationResult {
      const errors: { path: string; message: string }[] = [];

      if (!config.id) errors.push({ path: 'id', message: 'ID is required' });
      if (!config.name) errors.push({ path: 'name', message: 'Name is required' });
      if (!config.dataProductId) errors.push({ path: 'dataProductId', message: 'Data product is required' });
      if (!config.columns || config.columns.length === 0) {
        errors.push({ path: 'columns', message: 'At least one column is required' });
      }

      return { valid: errors.length === 0, errors };
    },

    toGridConfig(config: ReportConfig) {
      const result: {
        columns: Array<{ field: string; header?: string; width?: number; visible?: boolean }>;
        sort?: SortState;
        filter?: FilterState;
        presentation?: ReportPresentation;
      } = {
        columns: config.columns.map(c => ({
          field: c.field,
          header: c.header,
          width: c.width,
          visible: c.visible,
        })),
        sort: config.sort,
        filter: config.filter,
      };
      if (config.presentation) {
        result.presentation = config.presentation;
      }
      return result;
    },
  };
}
