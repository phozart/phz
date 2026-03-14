/**
 * @phozart/engine — Drill-Through Resolution
 *
 * Two-table pattern: aggregate → detail with selection context passthrough.
 */

import type { FilterState, SelectionContext } from '@phozart/core';
import type { ReportId, KPIId } from './types.js';
import type { ReportConfigStore } from './report.js';

// --- Drill Actions ---

export interface DrillThroughAction {
  targetReportId: ReportId;
  filters: Record<string, string>;
  selectionOverrides?: SelectionContext;
  openIn: 'panel' | 'modal' | 'page';
}

// --- Drill Sources ---

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
  fieldMappings?: Array<{ sourceField: string; targetField: string }>;
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
export function resolveDrillFilter(context: DrillContext): FilterState {
  const filters: Array<{ field: string; operator: 'equals'; value: unknown }> = [];

  switch (context.source.type) {
    case 'pivot':
      for (const [field, value] of Object.entries(context.source.rowValues)) {
        filters.push({ field, operator: 'equals', value });
      }
      for (const [field, value] of Object.entries(context.source.columnValues)) {
        filters.push({ field, operator: 'equals', value });
      }
      break;

    case 'chart':
      if (context.source.seriesField) {
        filters.push({ field: context.source.seriesField, operator: 'equals', value: context.source.xValue });
      }
      break;

    case 'kpi':
      filters.push({ field: 'kpiId', operator: 'equals', value: context.source.kpiId });
      if (context.source.breakdownId) {
        filters.push({ field: 'breakdownId', operator: 'equals', value: context.source.breakdownId });
      }
      break;

    case 'scorecard':
      filters.push({ field: 'kpiId', operator: 'equals', value: context.source.kpiId });
      if (context.source.breakdownId) {
        filters.push({ field: 'breakdownId', operator: 'equals', value: context.source.breakdownId });
      }
      if (context.source.entityId) {
        filters.push({ field: 'entityId', operator: 'equals', value: context.source.entityId });
      }
      break;

    case 'grid-row': {
      // Summary row drill: skip row-level filters (drill to ALL rows)
      if (context.source.isSummaryRow) break;

      const fields = context.filterFields ?? Object.keys(context.source.rowData);
      for (const field of fields) {
        if (field === '__id') continue;
        const value = context.source.rowData[field];
        if (value !== null && value !== undefined && typeof value !== 'object') {
          filters.push({ field, operator: 'equals', value });
        }
      }
      break;
    }
  }

  // Merge selection context as additional filters
  if (context.selectionContext) {
    for (const [field, value] of Object.entries(context.selectionContext)) {
      if (value !== null && !Array.isArray(value)) {
        filters.push({ field, operator: 'equals', value });
      }
    }
  }

  return { filters, presets: {} };
}

/**
 * Resolve a drill context into a full drill-through action.
 */
export function resolveDrillAction(context: DrillContext, reportStore?: ReportConfigStore): DrillThroughAction {
  const filterState = resolveDrillFilter(context);

  const filterMap: Record<string, string> = {};
  for (const f of filterState.filters) {
    filterMap[f.field] = String(f.value);
  }

  return {
    targetReportId: context.targetReportId ?? ('' as ReportId),
    filters: filterMap,
    selectionOverrides: context.selectionContext,
    openIn: context.openIn ?? 'panel',
  };
}
