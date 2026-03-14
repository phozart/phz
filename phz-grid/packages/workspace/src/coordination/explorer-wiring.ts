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

import type { DataAdapter, DataQuery, DataResult } from '../data-adapter.js';
import type {
  ExploreQuery,
  ExploreFilterSlot,
} from '@phozart/engine';
import {
  exploreToReport,
  exploreToDashboardWidget,
  type ReportArtifact,
  type DashboardWidgetArtifact,
} from '@phozart/engine';

// ========================================================================
// Task 4.1: ExploreQuery → DataQuery
// ========================================================================

/** Map explorer filter operators to DataQueryFilter operators */
function mapExploreOperator(op: ExploreFilterSlot['operator']): string {
  switch (op) {
    case 'eq': return 'equals';
    case 'neq': return 'notEquals';
    case 'gt': return 'greaterThan';
    case 'gte': return 'greaterThanOrEqual';
    case 'lt': return 'lessThan';
    case 'lte': return 'lessThanOrEqual';
    case 'in': return 'in';
    case 'not_in': return 'notIn';
    case 'contains': return 'contains';
    case 'between': return 'between';
    default: return 'equals';
  }
}

/**
 * Convert an ExploreQuery (from the visual explorer) into a DataQuery
 * for DataAdapter.execute(). Adds the data source ID and maps operators.
 */
export function exploreQueryToDataQuery(
  explore: ExploreQuery,
  dataSourceId: string,
): DataQuery {
  const dimensionFields = explore.dimensions.map(d => d.field);
  const measureFields = explore.measures.map(m => m.field);

  const query: DataQuery = {
    source: dataSourceId,
    fields: [...dimensionFields, ...measureFields],
  };

  if (dimensionFields.length > 0) {
    query.groupBy = dimensionFields;
  }

  if (explore.measures.length > 0) {
    query.aggregations = explore.measures.map(m => ({
      field: m.field,
      function: m.aggregation as any,
    }));
  }

  if (explore.filters.length > 0) {
    query.filters = explore.filters.map(f => ({
      field: f.field,
      operator: mapExploreOperator(f.operator) as any,
      value: f.value,
    }));
  }

  if (explore.sort) {
    query.sort = explore.sort;
  }

  if (explore.limit !== undefined) {
    query.limit = explore.limit;
  }

  return query;
}

// ========================================================================
// Task 4.3: Fetch explorer preview with live data
// ========================================================================

export interface ExplorerPreviewResult {
  rows: unknown[][];
  columns: Array<{ name: string; dataType: string }>;
  totalRows: number;
  error?: string;
}

/**
 * Fetch live preview data for the explorer.
 * Converts ExploreQuery → DataQuery → DataAdapter.execute().
 */
export async function fetchExplorerPreview(
  adapter: DataAdapter,
  explore: ExploreQuery,
  dataSourceId: string,
): Promise<ExplorerPreviewResult> {
  try {
    const query = exploreQueryToDataQuery(explore, dataSourceId);
    const result = await adapter.execute(query);
    return {
      rows: result.rows,
      columns: result.columns,
      totalRows: result.metadata.totalRows,
    };
  } catch (err) {
    return {
      rows: [],
      columns: [],
      totalRows: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ========================================================================
// Task 4.4: Save as Report / Add to Dashboard
// ========================================================================

/** Minimal adapter interface for saving reports */
interface ReportSaveAdapter {
  saveReport(report: unknown): Promise<void>;
}

/**
 * Convert explorer query to a report artifact and persist via adapter.
 */
export async function saveExplorerAsReport(
  adapter: ReportSaveAdapter,
  explore: ExploreQuery,
  dataSource: string,
  name: string,
): Promise<ReportArtifact> {
  const report = exploreToReport(explore, name, dataSource);
  await adapter.saveReport(report);
  return report;
}

/**
 * Convert explorer query to a dashboard widget artifact.
 * The widget can then be added to a dashboard via the dashboard editor.
 */
export function saveExplorerAsDashboardWidget(
  explore: ExploreQuery,
  widgetType: string,
  dashboardId?: string,
): DashboardWidgetArtifact {
  return exploreToDashboardWidget(explore, widgetType, dashboardId);
}

// ========================================================================
// Task 4.5: Drill-through from widget → explorer
// ========================================================================

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
export function buildDrillThroughQuery(context: DrillThroughContext): ExploreQuery {
  const dimensions = context.dimension
    ? [{ field: context.dimension }]
    : [];

  const filters: ExploreFilterSlot[] = [];

  if (context.dimension && context.dimensionValue !== undefined) {
    filters.push({
      field: context.dimension,
      operator: 'eq',
      value: context.dimensionValue,
    });
  }

  if (context.additionalFilters) {
    filters.push(...context.additionalFilters);
  }

  return {
    dimensions,
    measures: context.measures.map(field => ({
      field,
      aggregation: 'sum',
    })),
    filters,
  };
}
