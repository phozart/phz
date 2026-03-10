/**
 * @phozart/phz-workspace — Explore to Artifact Conversion (P.4)
 *
 * Pure functions to convert ExploreQuery into report or dashboard widget
 * artifact configs. These are workspace-local types, not engine types —
 * a bridge layer maps them to the engine's ReportConfig/WidgetPlacement.
 */

import type { ExploreQuery } from '../explore-types.js';

// ========================================================================
// Report Artifact (workspace-local)
// ========================================================================

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
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  limit?: number;
  createdAt: number;
}

// ========================================================================
// Dashboard Widget Artifact (workspace-local)
// ========================================================================

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
  position: { row: number; col: number; rowSpan: number; colSpan: number };
}

// ========================================================================
// ID generation
// ========================================================================

let counter = 0;
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${++counter}`;
}

// ========================================================================
// exploreToReport
// ========================================================================

export function exploreToReport(
  explore: ExploreQuery,
  name: string,
  dataSource: string,
): ReportArtifact {
  const dimFields = explore.dimensions.map(d => d.field);
  const measureFields = explore.measures.map(m => m.field);

  return {
    id: generateId('report'),
    type: 'report',
    name,
    dataSource,
    columns: [...dimFields, ...measureFields],
    groupBy: dimFields,
    aggregations: explore.measures.map(m => ({
      field: m.field,
      function: m.aggregation,
      alias: m.alias,
    })),
    filters: explore.filters.map(f => ({
      field: f.field,
      operator: f.operator,
      value: f.value,
    })),
    sort: explore.sort,
    limit: explore.limit,
    createdAt: Date.now(),
  };
}

// ========================================================================
// exploreToDashboardWidget
// ========================================================================

export function exploreToDashboardWidget(
  explore: ExploreQuery,
  widgetType: string,
  dashboardId?: string,
): DashboardWidgetArtifact {
  return {
    id: generateId('widget'),
    widgetType,
    dashboardId,
    dataConfig: {
      dimensions: explore.dimensions.map(d => d.field),
      measures: explore.measures.map(m => ({
        field: m.field,
        aggregation: m.aggregation,
        alias: m.alias,
      })),
      filters: explore.filters.map(f => ({
        field: f.field,
        operator: f.operator,
        value: f.value,
      })),
    },
    position: { row: 0, col: 0, rowSpan: 2, colSpan: 3 },
  };
}
