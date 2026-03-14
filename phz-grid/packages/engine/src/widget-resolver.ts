/**
 * @phozart/engine — Widget Data Resolver
 *
 * Pure functions that map WidgetPlacement + BIEngine + raw data → resolved widget props.
 * No DOM dependencies — suitable for server-side pre-rendering or headless tests.
 */

import type { SelectionContext, DataSetColumn } from '@phozart/core';
import type { BIEngine } from './engine.js';
import type { KPIDefinition, KPIScoreResponse, KPIBreakdownScore } from './kpi.js';
import type { ChartDataSeries } from './chart-projection.js';
import type {
  WidgetType, WidgetPlacement, KPICardWidgetConfig, ScorecardWidgetConfig,
  BarChartWidgetConfig, TrendLineWidgetConfig, BottomNWidgetConfig,
  StatusTableWidgetConfig, DrillLinkWidgetConfig,
} from './widget.js';
import type { DashboardConfig } from './dashboard.js';
import type { KPIId } from './types.js';
import type { DashboardDataModel } from './expression-types.js';
import { computeAggregation } from './aggregation.js';
import { createDashboardDataModelStore } from './dashboard-data-model.js';

// --- Public types ---

export interface ResolvedWidgetProps {
  widgetType: WidgetType;
  // KPI Card
  kpiDefinition?: KPIDefinition;
  value?: number;
  previousValue?: number;
  trendData?: number[];
  cardStyle?: 'compact' | 'expanded' | 'minimal';
  // Bar Chart
  chartData?: ChartDataSeries;
  rankOrder?: 'asc' | 'desc';
  maxBars?: number;
  // Trend Line
  target?: number;
  periods?: number;
  // Bottom N
  data?: Record<string, unknown>[];
  metricField?: string;
  dimensionField?: string;
  n?: number;
  direction?: 'bottom' | 'top';
  // Scorecard
  kpiDefinitions?: KPIDefinition[];
  scores?: KPIScoreResponse[];
  // Status Table
  entityField?: string;
  // Drill Link
  label?: string;
  targetReportId?: string;
  filters?: Record<string, string>;
}

export type KPIScoreProvider = (
  kpiId: KPIId,
  data: Record<string, unknown>[],
  kpiDef: KPIDefinition,
) => { value: number; previousValue?: number; trendData?: number[]; breakdowns?: KPIBreakdownScore[]; estimated?: boolean };

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

// --- Resolution per type ---

function resolveKPICard(config: KPICardWidgetConfig, ctx: WidgetResolverContext): ResolvedWidgetProps {
  const kpiDef = ctx.engine.kpis.get(config.kpiId);
  if (!kpiDef) return { widgetType: 'kpi-card' };

  const provider = ctx.scoreProvider;
  if (!provider) return { widgetType: 'kpi-card', kpiDefinition: kpiDef, cardStyle: config.cardStyle ?? kpiDef.defaultCardStyle ?? 'compact' };

  const score = provider(config.kpiId, ctx.data, kpiDef);
  return {
    widgetType: 'kpi-card',
    kpiDefinition: kpiDef,
    value: score.value,
    previousValue: score.previousValue,
    trendData: score.trendData,
    cardStyle: config.cardStyle ?? kpiDef.defaultCardStyle ?? 'compact',
  };
}

function resolveScorecard(config: ScorecardWidgetConfig, ctx: WidgetResolverContext): ResolvedWidgetProps {
  const kpiDefs: KPIDefinition[] = [];
  const scores: KPIScoreResponse[] = [];

  for (const kpiId of config.kpis) {
    const kpiDef = ctx.engine.kpis.get(kpiId);
    if (!kpiDef) continue;
    kpiDefs.push(kpiDef);

    if (ctx.scoreProvider) {
      const s = ctx.scoreProvider(kpiId, ctx.data, kpiDef);
      scores.push({
        kpiId,
        value: s.value,
        previousValue: s.previousValue,
        trend: s.trendData,
        breakdowns: s.breakdowns,
      });
    }
  }

  return { widgetType: 'kpi-scorecard', kpiDefinitions: kpiDefs, scores };
}

function resolveBarChart(config: BarChartWidgetConfig, ctx: WidgetResolverContext): ResolvedWidgetProps {
  // Schema validation warnings
  if (ctx.schema) {
    if (!ctx.schema.find(c => c.field === config.dimension)) {
      console.warn(`[phozart] bar-chart: dimension field "${config.dimension}" not found in schema`);
    }
    const metricCol = ctx.schema.find(c => c.field === config.metricField);
    if (metricCol && metricCol.type !== 'number') {
      console.warn(`[phozart] bar-chart: metricField "${config.metricField}" is type "${metricCol.type}", expected "number"`);
    }
  }
  // Group data by dimension, avg metricField per group
  const groups = new Map<string, Record<string, unknown>[]>();
  for (const row of ctx.data) {
    const key = String(row[config.dimension] ?? '');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const points = Array.from(groups.entries()).map(([key, rows]) => ({
    x: key,
    y: (computeAggregation(rows, config.metricField, 'avg') as number) ?? 0,
    label: key,
  }));

  // Sort by rankOrder
  if (config.rankOrder === 'asc') {
    points.sort((a, b) => a.y - b.y);
  } else {
    points.sort((a, b) => b.y - a.y);
  }

  const chartData: ChartDataSeries = {
    field: config.metricField,
    label: `${config.metricField} by ${config.dimension}`,
    data: points,
  };

  return { widgetType: 'bar-chart', chartData, rankOrder: config.rankOrder ?? 'desc', maxBars: 10 };
}

function resolveTrendLine(config: TrendLineWidgetConfig, ctx: WidgetResolverContext): ResolvedWidgetProps {
  // Look up associated KPI for target line
  const kpiDef = findKPIByMetricField(ctx, config.metricField);
  const provider = ctx.scoreProvider;

  let trendPoints: number[] | undefined;
  if (provider && kpiDef) {
    const score = provider(kpiDef.id, ctx.data, kpiDef);
    trendPoints = score.trendData;
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const chartData: ChartDataSeries = {
    field: config.metricField,
    label: config.title ?? config.metricField,
    data: (trendPoints ?? []).map((v, i) => ({
      x: months[i % 12],
      y: v,
      label: months[i % 12],
    })),
  };

  return {
    widgetType: 'trend-line',
    chartData,
    target: kpiDef?.target,
    periods: config.periods,
    kpiDefinition: kpiDef,
  };
}

function resolveBottomN(config: BottomNWidgetConfig, ctx: WidgetResolverContext): ResolvedWidgetProps {
  // Schema validation warnings
  if (ctx.schema) {
    const metricCol = ctx.schema.find(c => c.field === config.metricField);
    if (metricCol && metricCol.type !== 'number') {
      console.warn(`[phozart] bottom-n: metricField "${config.metricField}" is type "${metricCol.type}", expected "number"`);
    }
  }
  // Group by dimension, avg metric per group, sort, take N
  const groups = new Map<string, Record<string, unknown>[]>();
  for (const row of ctx.data) {
    const key = String(row[config.dimension] ?? '');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  let entries = Array.from(groups.entries()).map(([key, rows]) => ({
    [config.dimension]: key,
    [config.metricField]: (computeAggregation(rows, config.metricField, 'avg') as number) ?? 0,
  }));

  const dir = config.direction ?? 'bottom';
  entries.sort((a, b) => {
    const av = a[config.metricField] as number;
    const bv = b[config.metricField] as number;
    return dir === 'bottom' ? av - bv : bv - av;
  });
  entries = entries.slice(0, config.n);

  const kpiDef = findKPIByMetricField(ctx, config.metricField);

  return {
    widgetType: 'bottom-n',
    data: entries,
    metricField: config.metricField,
    dimensionField: config.dimension,
    n: config.n,
    direction: dir,
    kpiDefinition: kpiDef,
  };
}

function resolveStatusTable(config: StatusTableWidgetConfig, ctx: WidgetResolverContext): ResolvedWidgetProps {
  const kpiDefs: KPIDefinition[] = [];
  for (const kpiId of config.kpis) {
    const kpiDef = ctx.engine.kpis.get(kpiId);
    if (kpiDef) kpiDefs.push(kpiDef);
  }

  return {
    widgetType: 'status-table',
    data: ctx.data,
    entityField: config.entityDimension,
    kpiDefinitions: kpiDefs,
  };
}

function resolveDrillLink(config: DrillLinkWidgetConfig): ResolvedWidgetProps {
  return {
    widgetType: 'drill-link',
    label: config.label,
    targetReportId: config.targetReportId as string,
    filters: config.filters,
  };
}

// --- Helpers ---

function findKPIByMetricField(ctx: WidgetResolverContext, metricField: string): KPIDefinition | undefined {
  // Try matching KPI id (stripped of brand) to metricField
  for (const kpi of ctx.engine.kpis.list()) {
    if ((kpi.id as string) === metricField) return kpi;
  }
  return undefined;
}

// --- Public API ---

/**
 * Resolve a single widget's display props from its config + data context.
 */
export function resolveWidgetProps(widget: WidgetPlacement, ctx: WidgetResolverContext): ResolvedWidgetProps {
  switch (widget.widgetType) {
    case 'kpi-card':
      return resolveKPICard(widget.config as KPICardWidgetConfig, ctx);
    case 'kpi-scorecard':
      return resolveScorecard(widget.config as ScorecardWidgetConfig, ctx);
    case 'bar-chart':
      return resolveBarChart(widget.config as BarChartWidgetConfig, ctx);
    case 'trend-line':
      return resolveTrendLine(widget.config as TrendLineWidgetConfig, ctx);
    case 'bottom-n':
      return resolveBottomN(widget.config as BottomNWidgetConfig, ctx);
    case 'status-table':
      return resolveStatusTable(widget.config as StatusTableWidgetConfig, ctx);
    case 'drill-link':
      return resolveDrillLink(widget.config as DrillLinkWidgetConfig);
    default:
      return { widgetType: widget.widgetType };
  }
}

/**
 * When a dataModel is present in the context, augment data with calculated fields
 * and compute metrics through the expression pipeline.
 */
function applyDataModelPipeline(ctx: WidgetResolverContext): WidgetResolverContext {
  if (!ctx.dataModel) return ctx;

  const store = createDashboardDataModelStore(ctx.dataModel.fields);
  store.load(ctx.dataModel);
  store.rebuildGraph(ctx.engine.metrics.list());

  const paramValues = ctx.paramValues ?? {};
  const augmentedData = store.computeCalculatedFields(ctx.data, paramValues);
  const metricValues = store.computeMetrics(augmentedData, paramValues, ctx.engine.metrics);

  // Enhance score provider to use computed metric values
  const baseProvider = ctx.scoreProvider;
  const enhancedProvider: KPIScoreProvider = (kpiId, data, kpiDef) => {
    // If the KPI has a metricId and we have a computed value, use it
    if (kpiDef.metricId && metricValues[kpiDef.metricId as string] !== undefined) {
      const value = metricValues[kpiDef.metricId as string] as number;
      const base = baseProvider ? baseProvider(kpiId, data, kpiDef) : { value };
      return { ...base, value };
    }
    return baseProvider
      ? baseProvider(kpiId, data, kpiDef)
      : { value: 0 };
  };

  return { ...ctx, data: augmentedData, scoreProvider: enhancedProvider };
}

/**
 * Resolve all widgets in a dashboard config, returning a Map keyed by widget ID.
 */
export function resolveDashboardWidgets(
  dashboard: DashboardConfig,
  ctx: WidgetResolverContext,
): Map<string, ResolvedWidgetProps> {
  // Apply data model pipeline if present
  const resolvedCtx = applyDataModelPipeline(ctx);

  const result = new Map<string, ResolvedWidgetProps>();
  for (const widget of dashboard.widgets) {
    result.set(widget.id as string, resolveWidgetProps(widget, resolvedCtx));
  }
  return result;
}
