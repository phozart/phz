/**
 * @phozart/phz-engine — Widget Data Resolver
 *
 * Pure functions that map WidgetPlacement + BIEngine + raw data → resolved widget props.
 * No DOM dependencies — suitable for server-side pre-rendering or headless tests.
 */
import { computeAggregation } from './aggregation.js';
import { createDashboardDataModelStore } from './dashboard-data-model.js';
// --- Resolution per type ---
function resolveKPICard(config, ctx) {
    const kpiDef = ctx.engine.kpis.get(config.kpiId);
    if (!kpiDef)
        return { widgetType: 'kpi-card' };
    const provider = ctx.scoreProvider;
    if (!provider)
        return { widgetType: 'kpi-card', kpiDefinition: kpiDef, cardStyle: config.cardStyle ?? kpiDef.defaultCardStyle ?? 'compact' };
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
function resolveScorecard(config, ctx) {
    const kpiDefs = [];
    const scores = [];
    for (const kpiId of config.kpis) {
        const kpiDef = ctx.engine.kpis.get(kpiId);
        if (!kpiDef)
            continue;
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
function resolveBarChart(config, ctx) {
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
    const groups = new Map();
    for (const row of ctx.data) {
        const key = String(row[config.dimension] ?? '');
        if (!groups.has(key))
            groups.set(key, []);
        groups.get(key).push(row);
    }
    const points = Array.from(groups.entries()).map(([key, rows]) => ({
        x: key,
        y: computeAggregation(rows, config.metricField, 'avg') ?? 0,
        label: key,
    }));
    // Sort by rankOrder
    if (config.rankOrder === 'asc') {
        points.sort((a, b) => a.y - b.y);
    }
    else {
        points.sort((a, b) => b.y - a.y);
    }
    const chartData = {
        field: config.metricField,
        label: `${config.metricField} by ${config.dimension}`,
        data: points,
    };
    return { widgetType: 'bar-chart', chartData, rankOrder: config.rankOrder ?? 'desc', maxBars: 10 };
}
function resolveTrendLine(config, ctx) {
    // Look up associated KPI for target line
    const kpiDef = findKPIByMetricField(ctx, config.metricField);
    const provider = ctx.scoreProvider;
    let trendPoints;
    if (provider && kpiDef) {
        const score = provider(kpiDef.id, ctx.data, kpiDef);
        trendPoints = score.trendData;
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = {
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
function resolveBottomN(config, ctx) {
    // Schema validation warnings
    if (ctx.schema) {
        const metricCol = ctx.schema.find(c => c.field === config.metricField);
        if (metricCol && metricCol.type !== 'number') {
            console.warn(`[phozart] bottom-n: metricField "${config.metricField}" is type "${metricCol.type}", expected "number"`);
        }
    }
    // Group by dimension, avg metric per group, sort, take N
    const groups = new Map();
    for (const row of ctx.data) {
        const key = String(row[config.dimension] ?? '');
        if (!groups.has(key))
            groups.set(key, []);
        groups.get(key).push(row);
    }
    let entries = Array.from(groups.entries()).map(([key, rows]) => ({
        [config.dimension]: key,
        [config.metricField]: computeAggregation(rows, config.metricField, 'avg') ?? 0,
    }));
    const dir = config.direction ?? 'bottom';
    entries.sort((a, b) => {
        const av = a[config.metricField];
        const bv = b[config.metricField];
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
function resolveStatusTable(config, ctx) {
    const kpiDefs = [];
    for (const kpiId of config.kpis) {
        const kpiDef = ctx.engine.kpis.get(kpiId);
        if (kpiDef)
            kpiDefs.push(kpiDef);
    }
    return {
        widgetType: 'status-table',
        data: ctx.data,
        entityField: config.entityDimension,
        kpiDefinitions: kpiDefs,
    };
}
function resolveDrillLink(config) {
    return {
        widgetType: 'drill-link',
        label: config.label,
        targetReportId: config.targetReportId,
        filters: config.filters,
    };
}
// --- Helpers ---
function findKPIByMetricField(ctx, metricField) {
    // Try matching KPI id (stripped of brand) to metricField
    for (const kpi of ctx.engine.kpis.list()) {
        if (kpi.id === metricField)
            return kpi;
    }
    return undefined;
}
// --- Public API ---
/**
 * Resolve a single widget's display props from its config + data context.
 */
export function resolveWidgetProps(widget, ctx) {
    switch (widget.widgetType) {
        case 'kpi-card':
            return resolveKPICard(widget.config, ctx);
        case 'kpi-scorecard':
            return resolveScorecard(widget.config, ctx);
        case 'bar-chart':
            return resolveBarChart(widget.config, ctx);
        case 'trend-line':
            return resolveTrendLine(widget.config, ctx);
        case 'bottom-n':
            return resolveBottomN(widget.config, ctx);
        case 'status-table':
            return resolveStatusTable(widget.config, ctx);
        case 'drill-link':
            return resolveDrillLink(widget.config);
        default:
            return { widgetType: widget.widgetType };
    }
}
/**
 * When a dataModel is present in the context, augment data with calculated fields
 * and compute metrics through the expression pipeline.
 */
function applyDataModelPipeline(ctx) {
    if (!ctx.dataModel)
        return ctx;
    const store = createDashboardDataModelStore(ctx.dataModel.fields);
    store.load(ctx.dataModel);
    store.rebuildGraph(ctx.engine.metrics.list());
    const paramValues = ctx.paramValues ?? {};
    const augmentedData = store.computeCalculatedFields(ctx.data, paramValues);
    const metricValues = store.computeMetrics(augmentedData, paramValues, ctx.engine.metrics);
    // Enhance score provider to use computed metric values
    const baseProvider = ctx.scoreProvider;
    const enhancedProvider = (kpiId, data, kpiDef) => {
        // If the KPI has a metricId and we have a computed value, use it
        if (kpiDef.metricId && metricValues[kpiDef.metricId] !== undefined) {
            const value = metricValues[kpiDef.metricId];
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
export function resolveDashboardWidgets(dashboard, ctx) {
    // Apply data model pipeline if present
    const resolvedCtx = applyDataModelPipeline(ctx);
    const result = new Map();
    for (const widget of dashboard.widgets) {
        result.set(widget.id, resolveWidgetProps(widget, resolvedCtx));
    }
    return result;
}
//# sourceMappingURL=widget-resolver.js.map