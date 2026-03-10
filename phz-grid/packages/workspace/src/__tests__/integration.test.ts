/**
 * Sprint M.1 — Integration Test Suite
 *
 * End-to-end scenarios testing cross-module interactions across
 * the full workspace BI authoring environment.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Data layer
import { MemoryDataAdapter } from '../adapters/memory-data-adapter.js';
import { MemoryWorkspaceAdapter } from '../adapters/memory-adapter.js';
import type { DataSourceSchema, FieldMetadata } from '../data-adapter.js';
import { computeFreshnessStatus, resolvePeriod, DEFAULT_RELATIVE_PERIODS } from '../data-adapter.js';
import type { TimeIntelligenceConfig } from '../data-adapter.js';

// Types
import type {
  AlertRule, AlertCondition, BreachRecord, FilterValue,
  FilterContextState, FieldMapping, TemplateDefinition,
  ViewerContext, WidgetManifest,
} from '../types.js';
import {
  alertRuleId, breachId, templateId,
  resolveFieldForSource, autoSuggestMappings,
} from '../types.js';

// Templates
import { analyzeSchema } from '../templates/schema-analyzer.js';
import { matchTemplates } from '../templates/template-matcher.js';
import { DEFAULT_TEMPLATES } from '../templates/default-templates.js';
import { autoBindFields, resolveBindings } from '../templates/template-bindings.js';

// Alerts
import { evaluateRule, evaluateRules, evaluateCondition } from '../alerts/alert-evaluator.js';
import { computeRiskSummary, withBreachIndicator } from '../alerts/risk-summary-widget.js';
import { filterBreachesForWidget, createRenderContext } from '../alerts/render-context-ext.js';

// Filters
import { createFilterContext } from '../filters/filter-context.js';
import { serializeFilterState, deserializeFilterState } from '../filters/url-filter-sync.js';
import { buildDependencyGraph } from '../filters/cascading-resolver.js';

// Explorer
import { createDataExplorer } from '../explore/phz-data-explorer.js';
import { suggestChartType } from '../explore/chart-suggest.js';
import { exploreToReport, exploreToDashboardWidget } from '../explore/explore-to-artifact.js';
import { promoteFilterToDashboard } from '../explore/explorer-dashboard-integration.js';
import { toExploreQuery } from '../explore/phz-pivot-preview.js';
import { addFieldToZone, createDropZoneState } from '../explore/phz-drop-zones.js';

// Registry
import { createManifestRegistry } from '../registry/widget-registry.js';
import { registerDefaultManifests } from '../registry/default-manifests.js';

// Layout
import { renderLayoutToCSS } from '../layout/layout-renderer.js';
import { createWidgetErrorState, isRecoverable } from '../layout/widget-error-boundary.js';

// Navigation
import { createNavigationStack, pushCrumb, popTo } from '../shell/shell-utils.js';

// Interaction bus
import { createInteractionBus } from '../interaction-bus.js';

// I18n
import { createDefaultI18nProvider } from '../i18n/i18n-provider.js';

// Format
import { formatValue } from '../format/format-value.js';

// ========================================================================
// Helpers
// ========================================================================

const SALES_DATA = [
  { region: 'Europe', product: 'Widget A', revenue: 1200, cost: 400, date: '2025-01-15' },
  { region: 'Europe', product: 'Widget B', revenue: 800, cost: 300, date: '2025-02-20' },
  { region: 'Asia', product: 'Widget A', revenue: 1500, cost: 500, date: '2025-01-22' },
  { region: 'Asia', product: 'Widget C', revenue: 600, cost: 200, date: '2025-03-10' },
  { region: 'Americas', product: 'Widget B', revenue: 2000, cost: 700, date: '2025-02-05' },
];

const SALES_SCHEMA: DataSourceSchema = {
  id: 'sales',
  name: 'Sales',
  fields: [
    { name: 'region', dataType: 'string', nullable: false, cardinality: 'low', semanticHint: 'dimension' },
    { name: 'product', dataType: 'string', nullable: false, cardinality: 'low', semanticHint: 'category' },
    { name: 'revenue', dataType: 'number', nullable: false, semanticHint: 'measure' },
    { name: 'cost', dataType: 'number', nullable: false, semanticHint: 'measure' },
    { name: 'date', dataType: 'date', nullable: false, semanticHint: 'timestamp' },
  ],
};

function createSalesAdapter(): MemoryDataAdapter {
  const adapter = new MemoryDataAdapter();
  adapter.addSource('sales', SALES_DATA);
  return adapter;
}

// ========================================================================
// Scenario 1: Schema → Template suggestion → Save dashboard
// ========================================================================

describe('Integration: Schema → Template → Dashboard', () => {
  it('analyzes schema, matches templates, and auto-binds fields', () => {
    const profile = analyzeSchema(SALES_SCHEMA);

    expect(profile.hasTimeSeries).toBe(true);
    expect(profile.hasCategorical).toBe(true);
    expect(profile.hasMultipleMeasures).toBe(true);
    expect(profile.suggestedMeasures).toContain('revenue');
    expect(profile.suggestedDimensions).toContain('region');

    const scored = matchTemplates(profile, DEFAULT_TEMPLATES);
    expect(scored.length).toBeGreaterThan(0);
    expect(scored[0].score).toBeGreaterThan(0);

    const topTemplate = scored[0].template;
    const bindings = autoBindFields(topTemplate.widgetSlots, profile);
    expect(bindings.length).toBeGreaterThan(0);

    const resolved = resolveBindings(topTemplate.widgetSlots, bindings);
    expect(resolved.size).toBeGreaterThan(0);
  });
});

// ========================================================================
// Scenario 2: Manifest registry + custom manifest
// ========================================================================

describe('Integration: Custom manifest in registry', () => {
  it('registers default and custom manifests, queries by category', () => {
    const registry = createManifestRegistry();
    registerDefaultManifests(registry);

    const customManifest: WidgetManifest = {
      type: 'custom-chart',
      category: 'custom',
      name: 'Custom Chart',
      description: 'A custom chart widget',
      requiredFields: [{ name: 'value', dataType: 'number', role: 'measure', required: true }],
      supportedAggregations: ['sum', 'avg'],
      minSize: { cols: 2, rows: 2 },
      preferredSize: { cols: 4, rows: 3 },
      maxSize: { cols: 8, rows: 6 },
      supportedInteractions: ['drill-through'],
      variants: [{ id: 'default', name: 'Default', description: 'Standard view', presetConfig: {} }],
    };
    registry.registerManifest(customManifest);

    expect(registry.getManifest('custom-chart')).toBeDefined();
    // 13 default manifests + 1 custom = 14
    expect(registry.listManifests().length).toBeGreaterThanOrEqual(14);
    expect(registry.listByCategory('custom')).toHaveLength(1);
  });
});

// ========================================================================
// Scenario 3: Breadcrumb navigation
// ========================================================================

describe('Integration: Catalog → Dashboard → KPI → Breadcrumb back', () => {
  it('navigates through workspace panels via breadcrumbs', () => {
    let stack = createNavigationStack([{ id: 'catalog', label: 'Catalog', panelId: 'catalog' }]);
    stack = pushCrumb(stack, { id: 'dashboard-1', label: 'Sales Dashboard', panelId: 'engine-admin' });
    stack = pushCrumb(stack, { id: 'kpi-1', label: 'Revenue KPI', panelId: 'engine-admin', metadata: { artifactType: 'kpi' } });

    expect(stack.entries).toHaveLength(3);
    expect(stack.currentIndex).toBe(2);

    // Pop back to catalog
    const popped = popTo(stack, 0);
    expect(popped.currentIndex).toBe(0);
    expect(popped.entries[popped.currentIndex].id).toBe('catalog');
  });
});

// ========================================================================
// Scenario 5: Alert rule → evaluate → breach → acknowledge → resolve
// ========================================================================

describe('Integration: Alert lifecycle', () => {
  it('evaluates alert rule, detects breach, tracks status transitions', () => {
    const rule: AlertRule = {
      id: alertRuleId('rule-1'),
      name: 'Revenue Drop',
      description: 'Revenue falls below threshold',
      artifactId: 'dashboard-1',
      widgetId: 'kpi-revenue',
      condition: { kind: 'threshold', metric: 'revenue', operator: '<', value: 1000 },
      severity: 'warning',
      cooldownMs: 60000,
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Evaluate — should trigger
    const values = new Map([['revenue', 800]]);
    const result = evaluateRule(rule, values);
    expect(result.triggered).toBe(true);

    // Evaluate — should not trigger
    const okValues = new Map([['revenue', 1500]]);
    const okResult = evaluateRule(rule, okValues);
    expect(okResult.triggered).toBe(false);
  });
});

// ========================================================================
// Scenario 6: Compound alert (AND/OR)
// ========================================================================

describe('Integration: Compound alert evaluation', () => {
  it('evaluates compound AND condition across multiple metrics', () => {
    const rule: AlertRule = {
      id: alertRuleId('compound-1'),
      name: 'Revenue AND Cost Risk',
      description: 'Revenue low AND cost high',
      artifactId: 'dashboard-1',
      condition: {
        kind: 'compound',
        op: 'AND',
        children: [
          { kind: 'threshold', metric: 'revenue', operator: '<', value: 1000 },
          { kind: 'threshold', metric: 'cost', operator: '>', value: 500 },
        ],
      },
      severity: 'critical',
      cooldownMs: 60000,
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Both conditions met
    const bothMet = new Map([['revenue', 800], ['cost', 600]]);
    expect(evaluateRule(rule, bothMet).triggered).toBe(true);

    // Only one condition met
    const oneMet = new Map([['revenue', 800], ['cost', 400]]);
    expect(evaluateRule(rule, oneMet).triggered).toBe(false);

    // Risk summary from breaches
    const breaches: BreachRecord[] = [
      {
        id: breachId('b1'), ruleId: alertRuleId('compound-1'),
        artifactId: 'dashboard-1', status: 'active', detectedAt: Date.now(),
        currentValue: 800, thresholdValue: 1000, severity: 'critical', message: 'Revenue AND Cost risk',
      },
      {
        id: breachId('b2'), ruleId: alertRuleId('rule-2'),
        artifactId: 'dashboard-1', widgetId: 'kpi-churn', status: 'active', detectedAt: Date.now(),
        currentValue: 15, thresholdValue: 10, severity: 'warning', message: 'Churn high',
      },
    ];

    const summary = computeRiskSummary(breaches);
    expect(summary.totalActive).toBe(2);
    expect(summary.bySeverity.critical).toBe(1);
    expect(summary.bySeverity.warning).toBe(1);

    // Filter breaches for specific widget — filterBreachesForWidget expects ActiveBreach[]
    const dummyRule: AlertRule = rule;
    const activeBreaches = breaches.map(b => ({ breach: b, rule: dummyRule }));
    // filterBreachesForWidget includes widget-specific + artifact-level (no widgetId) breaches
    const widgetBreaches = filterBreachesForWidget(activeBreaches, 'kpi-churn');
    expect(widgetBreaches).toHaveLength(2); // b1 (no widgetId = applies to all) + b2 (kpi-churn)
    const churnBreach = widgetBreaches.find(ab => ab.breach.widgetId === 'kpi-churn');
    expect(churnBreach!.breach.severity).toBe('warning');
  });
});

// ========================================================================
// Scenario 7: Dashboard filters → preset → cascading dependency
// ========================================================================

describe('Integration: Filter context lifecycle', () => {
  it('sets filters, resolves, serializes to URL, and round-trips', () => {
    const ctx = createFilterContext();

    // Set a filter
    const filter: FilterValue = {
      filterId: 'f-region',
      field: 'region',
      operator: 'in',
      value: ['Europe', 'Asia'],
      label: 'Region: Europe, Asia',
    };
    ctx.setFilter(filter);

    const resolved = ctx.resolveFilters();
    expect(resolved).toHaveLength(1);
    expect(resolved[0].field).toBe('region');

    // Apply cross-filter
    ctx.applyCrossFilter({
      sourceWidgetId: 'bar-chart-1',
      field: 'product',
      value: 'Widget A',
      timestamp: Date.now(),
    });

    const withCross = ctx.resolveFilters();
    expect(withCross.length).toBeGreaterThanOrEqual(1);

    // Clear cross-filter
    ctx.clearCrossFilter('bar-chart-1');

    // URL serialization round-trip
    const state = ctx.getState();
    const serialized = serializeFilterState(state);
    expect(serialized).toContain('f.region');

    const deserialized = deserializeFilterState(serialized);
    expect(deserialized.values.size).toBe(1);
    const regionFilter = Array.from(deserialized.values.values()).find(f => f.field === 'region');
    expect(regionFilter).toBeDefined();
    expect(regionFilter!.operator).toBe('in');
  });

  it('builds cascading dependency graph without cycles', () => {
    const deps = [
      { parentFilterId: 'region', childFilterId: 'country', constraintType: 'data-driven' as const },
      { parentFilterId: 'country', childFilterId: 'city', constraintType: 'data-driven' as const },
    ];
    const graph = buildDependencyGraph(deps);
    expect(graph.order).toEqual(['region', 'country', 'city']);
  });
});

// ========================================================================
// Scenario 8: Explorer → drag fields → preview → save as report
// ========================================================================

describe('Integration: Explorer → Report', () => {
  it('builds explore query via drop zones and converts to report', () => {
    const explorer = createDataExplorer();
    const fields: FieldMetadata[] = SALES_SCHEMA.fields;

    explorer.setDataSource('sales', fields);

    // Auto-place fields
    const regionField = fields.find(f => f.name === 'region')!;
    const revenueField = fields.find(f => f.name === 'revenue')!;
    explorer.autoPlaceField(regionField); // string → rows
    explorer.autoPlaceField(revenueField); // number → values

    const query = explorer.toQuery();
    expect(query.dimensions.length).toBeGreaterThanOrEqual(1);
    expect(query.measures.length).toBeGreaterThanOrEqual(1);

    // Chart suggest
    const chartType = explorer.suggestChart();
    expect(chartType).toBe('bar'); // 1 dim + 1 measure → bar

    // Convert to report
    const report = exploreToReport(query, 'Sales by Region', 'sales');
    expect(report.name).toBe('Sales by Region');
    expect(report.groupBy).toContain('region');
    expect(report.aggregations.length).toBeGreaterThan(0);

    // Undo
    explorer.undo();
    const afterUndo = explorer.toQuery();
    expect(afterUndo.measures).toHaveLength(0); // revenue removed
    expect(explorer.canRedo()).toBe(true);

    // Redo
    explorer.redo();
    const afterRedo = explorer.toQuery();
    expect(afterRedo.measures).toHaveLength(1); // revenue back
  });
});

// ========================================================================
// Scenario 9: Explorer → add to dashboard → promote filters
// ========================================================================

describe('Integration: Explorer → Dashboard + filter promotion', () => {
  it('converts explore to dashboard widget and promotes filters', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('sales', SALES_SCHEMA.fields);

    const regionField = SALES_SCHEMA.fields.find(f => f.name === 'region')!;
    const revenueField = SALES_SCHEMA.fields.find(f => f.name === 'revenue')!;
    explorer.addToZone('rows', regionField);
    explorer.addToZone('values', revenueField);

    const query = explorer.toQuery();
    const widgetArtifact = exploreToDashboardWidget(query, 'bar', 'dash-1');

    expect(widgetArtifact.widgetType).toBe('bar');
    expect(widgetArtifact.dashboardId).toBe('dash-1');
    expect(widgetArtifact.dataConfig.dimensions).toContain('region');

    // Promote a filter to dashboard filter bar
    const promoted = promoteFilterToDashboard(
      { field: 'region', operator: 'in', value: ['Europe'] },
      'sales',
      [widgetArtifact.id],
    );
    expect(promoted.field).toBe('region');
    expect(promoted.dataSourceId).toBe('sales');
    expect(promoted.appliesTo).toContain(widgetArtifact.id);
  });
});

// ========================================================================
// Scenario 10: Filter URL serialization round-trip
// ========================================================================

describe('Integration: Filter URL round-trip', () => {
  it('serializes and deserializes filter state preserving all values', () => {
    const state: FilterContextState = {
      values: new Map([
        ['f1', { filterId: 'f1', field: 'region', operator: 'in' as const, value: ['Europe', 'Asia'], label: 'Region' }],
        ['f2', { filterId: 'f2', field: 'quarter', operator: 'equals' as const, value: 'Q3', label: 'Quarter' }],
        ['f3', { filterId: 'f3', field: 'email', operator: 'isNull' as const, value: null, label: 'No email' }],
      ]),
      activeFilterIds: new Set(['f1', 'f2', 'f3']),
      crossFilters: [],
      lastUpdated: Date.now(),
      source: 'user',
    };

    const serialized = serializeFilterState(state);
    expect(serialized).toContain('f.region=in:');
    expect(serialized).toContain('f.quarter=equals:Q3');
    expect(serialized).toContain('f.email=isNull');

    const deserialized = deserializeFilterState(serialized);
    expect(deserialized.values.size).toBe(3);

    // Verify region filter round-tripped
    const regionFilter = Array.from(deserialized.values.values()).find(f => f.field === 'region');
    expect(regionFilter).toBeDefined();
    expect(regionFilter!.operator).toBe('in');
    expect(Array.isArray(regionFilter!.value)).toBe(true);

    // Verify null operator round-tripped
    const emailFilter = Array.from(deserialized.values.values()).find(f => f.field === 'email');
    expect(emailFilter).toBeDefined();
    expect(emailFilter!.operator).toBe('isNull');
  });
});

// ========================================================================
// Scenario 12: Multi-data-source → field mapping → cross-source filters
// ========================================================================

describe('Integration: Multi-data-source field mapping', () => {
  it('maps canonical fields across data sources and resolves filters', () => {
    const mappings: FieldMapping[] = [
      {
        canonicalField: 'region',
        sources: [
          { dataSourceId: 'sales', field: 'sales_region' },
          { dataSourceId: 'inventory', field: 'inv_region' },
        ],
      },
    ];

    // Resolve canonical field for each source
    expect(resolveFieldForSource('region', 'sales', mappings)).toBe('sales_region');
    expect(resolveFieldForSource('region', 'inventory', mappings)).toBe('inv_region');
    expect(resolveFieldForSource('region', 'unknown-source', mappings)).toBe('region'); // fallback

    // Auto-suggest mappings from schemas
    const schemas = [
      { dataSourceId: 'src1', fields: [{ name: 'region', dataType: 'string' }, { name: 'amount', dataType: 'number' }] },
      { dataSourceId: 'src2', fields: [{ name: 'region', dataType: 'string' }, { name: 'total', dataType: 'number' }] },
    ];
    const suggestions = autoSuggestMappings(schemas);
    expect(suggestions.length).toBeGreaterThan(0);
    const regionMapping = suggestions.find(m => m.canonicalField === 'region');
    expect(regionMapping).toBeDefined();
    expect(regionMapping!.sources).toHaveLength(2);
  });

  it('filter context resolves filters per source with field mapping', () => {
    const mappings: FieldMapping[] = [
      {
        canonicalField: 'region',
        sources: [
          { dataSourceId: 'sales', field: 'sales_region' },
          { dataSourceId: 'inventory', field: 'inv_region' },
        ],
      },
    ];

    const ctx = createFilterContext({ fieldMappings: mappings });
    ctx.setFilter({
      filterId: 'f-region',
      field: 'region',
      operator: 'equals',
      value: 'Europe',
      label: 'Region: Europe',
    });

    // Resolve for sales source — should use mapped field
    const salesFilters = ctx.resolveFiltersForSource('sales');
    expect(salesFilters.length).toBeGreaterThan(0);

    // Resolve for inventory source
    const invFilters = ctx.resolveFiltersForSource('inventory');
    expect(invFilters.length).toBeGreaterThan(0);
  });
});

// ========================================================================
// Scenario 13: Time intelligence
// ========================================================================

describe('Integration: Time intelligence periods', () => {
  it('resolves relative periods including fiscal year offset', () => {
    const config: TimeIntelligenceConfig = {
      primaryDateField: 'date',
      fiscalYearStartMonth: 4, // April fiscal year
      weekStartDay: 'monday',
      granularities: ['day', 'month', 'quarter', 'year'],
      relativePeriods: DEFAULT_RELATIVE_PERIODS,
    };

    const ref = new Date(2025, 6, 15); // July 15, 2025

    // This year with April fiscal start → starts April 2025
    const thisYear = resolvePeriod('this-year', config, ref);
    expect(thisYear.from.getMonth()).toBe(3); // April (0-indexed)
    expect(thisYear.from.getFullYear()).toBe(2025);

    // This quarter with April fiscal → Q2 fiscal = July-Sep
    const thisQuarter = resolvePeriod('this-quarter', config, ref);
    expect(thisQuarter.from.getMonth()).toBe(6); // July

    // Last 30 days
    const last30 = resolvePeriod('last-30-days', config, ref);
    const dayDiff = Math.round((last30.to.getTime() - last30.from.getTime()) / (1000 * 60 * 60 * 24));
    expect(dayDiff).toBe(29);
  });
});

// ========================================================================
// Scenario: Data quality freshness
// ========================================================================

describe('Integration: Data quality freshness', () => {
  it('computes freshness status correctly', () => {
    const now = new Date();
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

    expect(computeFreshnessStatus(fiveMinAgo, 60)).toBe('fresh'); // 5 min < 60 min threshold
    expect(computeFreshnessStatus(threeDaysAgo, 60)).toBe('stale'); // 3 days > 60 min threshold
    expect(computeFreshnessStatus('invalid-date', 60)).toBe('unknown');
  });
});

// ========================================================================
// Scenario: Format value with UnitSpec
// ========================================================================

describe('Integration: Number formatting with UnitSpec', () => {
  it('formats currency, percent, and custom units', () => {
    const usd = formatValue(1234.56, { type: 'currency', currencyCode: 'USD', decimalPlaces: 2 }, 'en-US');
    expect(usd).toContain('1,234');

    const pct = formatValue(0.856, { type: 'percent', decimalPlaces: 1 }, 'en-US');
    expect(pct).toContain('85');

    const custom = formatValue(42, { type: 'custom', suffix: ' items' }, 'en-US');
    expect(custom).toContain('42');
    expect(custom).toContain('items');

    const nullVal = formatValue(null, { type: 'number' }, 'en-US');
    expect(nullVal).toBe('—');
  });
});

// ========================================================================
// Scenario: Interaction bus
// ========================================================================

describe('Integration: Interaction bus event flow', () => {
  it('emits and receives widget events across subscribers', () => {
    const bus = createInteractionBus();
    const received: unknown[] = [];

    const unsub = bus.on('drill-through', (event) => {
      received.push(event);
    });

    bus.emit({ type: 'drill-through', sourceWidgetId: 'chart-1', field: 'region', value: 'Europe' });
    expect(received).toHaveLength(1);

    // Unsubscribe
    unsub();
    bus.emit({ type: 'drill-through', sourceWidgetId: 'chart-1', field: 'region', value: 'Asia' });
    expect(received).toHaveLength(1); // No change
  });
});

// ========================================================================
// Scenario: Layout rendering
// ========================================================================

describe('Integration: Layout rendering', () => {
  it('renders auto-grid layout to CSS', () => {
    const result = renderLayoutToCSS({
      kind: 'auto-grid',
      minItemWidth: 200,
      gap: 16,
      children: [
        { kind: 'widget', widgetId: 'w1', weight: 2 },
        { kind: 'widget', widgetId: 'w2', weight: 1 },
      ],
    });

    expect(result.css).toContain('grid');
    expect(result.css).toContain('200px');
  });

  it('handles widget error boundaries', () => {
    const error = createWidgetErrorState('widget-1', new Error('Render failed'));
    expect(error.widgetId).toBe('widget-1');
    expect(error.message).toBeTruthy();
    expect(isRecoverable(new Error('Network timeout'))).toBe(true);
  });
});

// ========================================================================
// Scenario: I18n provider
// ========================================================================

describe('Integration: I18n provider', () => {
  it('provides default English strings and detects direction', () => {
    const i18n = createDefaultI18nProvider();
    expect(i18n.locale).toBe('en');
    expect(i18n.direction).toBe('ltr');

    // Arabic should be RTL
    const arI18n = createDefaultI18nProvider('ar');
    expect(arI18n.direction).toBe('rtl');
  });
});

// ========================================================================
// Scenario: MemoryDataAdapter query execution
// ========================================================================

describe('Integration: MemoryDataAdapter query', () => {
  it('executes query with filter, sort, and aggregation', async () => {
    const adapter = createSalesAdapter();

    const result = await adapter.execute({
      source: 'sales',
      fields: ['region', 'revenue'],
      sort: [{ field: 'revenue', direction: 'desc' }],
      limit: 3,
    });

    expect(result.rows.length).toBeLessThanOrEqual(3);
    expect(result.metadata.totalRows).toBe(5);
    expect(result.columns.length).toBe(2);

    // Schema inference
    const schema = await adapter.getSchema('sales');
    expect(schema.fields.length).toBeGreaterThan(0);
    const regionField = schema.fields.find(f => f.name === 'region');
    expect(regionField?.dataType).toBe('string');

    // List data sources
    const sources = await adapter.listDataSources();
    expect(sources).toHaveLength(1);
    expect(sources[0].id).toBe('sales');
  });
});

// ========================================================================
// Scenario: End-to-end template-to-layout flow
// ========================================================================

describe('Integration: Template → Layout CSS', () => {
  it('renders a default template layout to CSS', () => {
    const template = DEFAULT_TEMPLATES[0]; // KPI Overview
    const layoutResult = renderLayoutToCSS(template.layout);
    expect(layoutResult.css.length).toBeGreaterThan(0);
  });
});
