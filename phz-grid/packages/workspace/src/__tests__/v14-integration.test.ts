/**
 * Sprint X.4 — v14 Integration Tests
 *
 * Comprehensive tests exercising multiple modules together:
 * coordination, filters, navigation, local persistence, visibility.
 */

import { describe, it, expect, vi } from 'vitest';

// Coordination
import { createDashboardDataPipeline } from '../coordination/dashboard-data-pipeline.js';
import { createDetailSourceLoader } from '../coordination/detail-source-loader.js';

// Filters
import { createFilterDefinition } from '../filters/filter-definition.js';
import { resolveFilterContract } from '../filters/filter-contract-resolver.js';
import { evaluateFilterRules } from '../filters/filter-rule-engine.js';
import { resolveFiltersFromContract } from '../filters/filter-ownership.js';
import { createFilterContext } from '../filters/filter-context.js';

// Navigation
import { resolveNavigationFilters, createNavigationLink } from '../navigation/navigation-link.js';
import { createGridArtifact, isGridArtifact, gridArtifactToMeta } from '../navigation/grid-artifact.js';
import { createDefaultPresentation, mergePresentation } from '../navigation/default-presentation.js';
import { isVisibleToViewer, groupByVisibility } from '../navigation/artifact-visibility.js';

// Local / session
import { createExportBundle, validateExportBundle, convertBundleForImport } from '../local/session-compat.js';

// Types
import type { DashboardDataConfig, ArtifactFilterContract, ViewerContext } from '../types.js';
import type { DataAdapter, DataResult, DataQuery, DataSourceSchema } from '../data-adapter.js';
import type { FilterRule } from '../filters/filter-rule-engine.js';
import type { FilterDefinition } from '../filters/filter-definition.js';
import type { VisibilityMeta } from '../navigation/artifact-visibility.js';
import type { DefaultPresentation } from '../navigation/default-presentation.js';

// ========================================================================
// Helpers
// ========================================================================

function mockDataResult(rows: unknown[][] = [[1, 'a']]): DataResult {
  return {
    columns: [{ name: 'id', dataType: 'number' }, { name: 'name', dataType: 'string' }],
    rows,
    metadata: { totalRows: rows.length, truncated: false, queryTimeMs: 5 },
  };
}

function mockDataAdapter(overrides?: Partial<DataAdapter>): DataAdapter {
  return {
    execute: vi.fn<[DataQuery], Promise<DataResult>>().mockResolvedValue(mockDataResult()),
    getSchema: vi.fn<[string?], Promise<DataSourceSchema>>().mockResolvedValue({
      id: 'ds1', name: 'Test', fields: [],
    }),
    listDataSources: vi.fn().mockResolvedValue([]),
    getDistinctValues: vi.fn().mockResolvedValue({ values: [], totalCount: 0, truncated: false }),
    getFieldStats: vi.fn().mockResolvedValue({
      distinctCount: 0, nullCount: 0, totalCount: 0,
    }),
    ...overrides,
  };
}

// ========================================================================
// 1. DashboardDataConfig flow
// ========================================================================

describe('Integration: DashboardDataConfig pipeline', () => {
  it('transitions through loading phases and delivers widget data', async () => {
    const preloadData = mockDataResult([[1, 'preload']]);
    const fullData = mockDataResult([[1, 'full'], [2, 'complete']]);

    let callCount = 0;
    const adapter = mockDataAdapter({
      execute: vi.fn<[DataQuery], Promise<DataResult>>().mockImplementation(async () => {
        callCount++;
        return callCount === 1 ? preloadData : fullData;
      }),
    });

    const config: DashboardDataConfig = {
      preload: { query: { source: 'ds1', fields: ['id'] } },
      fullLoad: { query: { source: 'ds1', fields: ['id', 'name'] }, maxRows: 1000 },
    };

    const filterContext = createFilterContext();
    const pipeline = createDashboardDataPipeline(config, adapter, filterContext);

    const phases: string[] = [];
    pipeline.onStateChange(s => phases.push(s.phase));

    expect(pipeline.state.phase).toBe('idle');

    await pipeline.start();

    expect(phases).toContain('preloading');
    expect(phases).toContain('preload-complete');
    expect(phases).toContain('full-complete');

    const preloadResult = pipeline.getWidgetData('w1', 'preload');
    expect(preloadResult?.rows[0][1]).toBe('preload');

    const fullResult = pipeline.getWidgetData('w1', 'full');
    expect(fullResult?.rows).toHaveLength(2);

    // 'both' prefers full when available
    const bothResult = pipeline.getWidgetData('w1', 'both');
    expect(bothResult?.rows).toHaveLength(2);

    pipeline.destroy();
  });
});

// ========================================================================
// 2. FilterDefinition -> contract resolution
// ========================================================================

describe('Integration: FilterDefinition + contract resolution', () => {
  it('resolves contract with correct labels, types, and defaults', () => {
    const regionDef = createFilterDefinition({
      label: 'Region',
      filterType: 'select',
      valueSource: { type: 'data-source', dataSourceId: 'sales', field: 'region' },
      bindings: [{ dataSourceId: 'sales', targetField: 'region' }],
      defaultValue: { type: 'static', value: 'US' },
    });

    const statusDef = createFilterDefinition({
      label: 'Status',
      filterType: 'multi-select',
      valueSource: { type: 'static', values: ['active', 'inactive', 'pending'] },
      bindings: [{ dataSourceId: 'sales', targetField: 'status' }],
    });

    const contract: ArtifactFilterContract = {
      acceptedFilters: [
        { filterDefinitionId: regionDef.id, overrides: { label: 'Sales Region' } },
        { filterDefinitionId: statusDef.id, queryLayer: 'server' },
      ],
    };

    const result = resolveFilterContract(contract, [regionDef, statusDef]);

    expect(result.warnings).toHaveLength(0);
    expect(result.filters).toHaveLength(2);

    // Region: overridden label, default resolved
    expect(result.filters[0].overrides?.label).toBe('Sales Region');
    expect(result.filters[0].resolvedDefault).toBe('US');
    expect(result.filters[0].definition.filterType).toBe('select');

    // Status: server query layer, no default
    expect(result.filters[1].queryLayer).toBe('server');
    expect(result.filters[1].resolvedDefault).toBeUndefined();
    expect(result.filters[1].definition.filterType).toBe('multi-select');
  });
});

// ========================================================================
// 3. FilterRule conditions with priority ordering
// ========================================================================

describe('Integration: FilterRule evaluation with priority', () => {
  it('evaluates multiple rules with restrict/hide/disable/force actions', () => {
    const rules: FilterRule[] = [
      {
        id: 'rule-restrict',
        name: 'Restrict states for US',
        priority: 1,
        enabled: true,
        conditionLogic: 'and',
        conditions: [
          { type: 'field-value', filterDefinitionId: 'fd-region', operator: 'eq', value: 'US' },
        ],
        actions: [
          { type: 'restrict', filterDefinitionId: 'fd-state', allowedValues: ['CA', 'NY', 'TX'] },
        ],
      },
      {
        id: 'rule-hide',
        name: 'Hide currency for domestic',
        priority: 10,
        enabled: true,
        conditions: [
          { type: 'field-value', filterDefinitionId: 'fd-region', operator: 'eq', value: 'US' },
        ],
        actions: [
          { type: 'hide', filterDefinitionId: 'fd-currency' },
        ],
      },
      {
        id: 'rule-force-readonly',
        name: 'Force status for viewers',
        priority: 5,
        enabled: true,
        conditions: [
          { type: 'viewer-attribute', attribute: 'role', operator: 'eq', value: 'viewer' },
        ],
        actions: [
          { type: 'disable', filterDefinitionId: 'fd-status', message: 'Read-only for viewers' },
          { type: 'force', filterDefinitionId: 'fd-date-range', value: 'last-30-days' },
        ],
      },
    ];

    const viewer: ViewerContext = { userId: 'u1', attributes: { role: 'viewer' } };
    const filterState = { 'fd-region': 'US' };

    const results = evaluateFilterRules(rules, viewer, filterState);

    // Results ordered by priority: 1, 5, 10
    expect(results[0].ruleId).toBe('rule-restrict');
    expect(results[0].matched).toBe(true);
    expect(results[0].actions[0].type).toBe('restrict');

    expect(results[1].ruleId).toBe('rule-force-readonly');
    expect(results[1].matched).toBe(true);
    expect(results[1].actions).toHaveLength(2);

    expect(results[2].ruleId).toBe('rule-hide');
    expect(results[2].matched).toBe(true);
    expect(results[2].actions[0].type).toBe('hide');
  });
});

// ========================================================================
// 4. NavigationLink drill-through with filter mapping
// ========================================================================

describe('Integration: NavigationLink drill-through', () => {
  it('resolves filter values from click context through navigation link', () => {
    const link = createNavigationLink({
      sourceArtifactId: 'dashboard-sales',
      targetArtifactId: 'report-detail',
      targetArtifactType: 'report',
      label: 'View Details',
      filterMappings: [
        { sourceField: 'region', targetFilterDefinitionId: 'fd-region', transform: 'passthrough' },
        { sourceField: 'product_category', targetFilterDefinitionId: 'fd-category', transform: 'passthrough' },
        { sourceField: 'quarter', targetFilterDefinitionId: 'fd-quarter', transform: 'passthrough' },
      ],
    });

    // Simulate a click context: user clicked a bar chart segment for US/Electronics/Q1
    const clickContext = {
      region: 'US',
      product_category: 'Electronics',
      quarter: 'Q1-2026',
      revenue: 1_500_000, // extra field not mapped
    };

    const resolved = resolveNavigationFilters(link.filterMappings, clickContext);

    expect(resolved).toEqual({
      'fd-region': 'US',
      'fd-category': 'Electronics',
      'fd-quarter': 'Q1-2026',
    });
    // revenue is NOT in the resolved filters (no mapping for it)
    expect(resolved).not.toHaveProperty('revenue');
  });
});

// ========================================================================
// 5. Detail source loading with filter mapping
// ========================================================================

describe('Integration: Detail source loading', () => {
  it('applies filter mapping to detail query', async () => {
    const adapter = mockDataAdapter();

    const loader = createDetailSourceLoader([
      {
        id: 'detail-orders',
        name: 'Order Details',
        dataSourceId: 'ds-orders',
        filterMapping: [
          { sourceField: 'region', targetField: 'order_region' },
          { sourceField: 'customer_id', targetField: 'cust_id' },
        ],
        baseQuery: { source: 'ds-orders', fields: ['order_id', 'amount', 'order_region'] },
        trigger: 'user-action',
      },
    ], adapter);

    const result = await loader.loadDetail('detail-orders', {
      currentFilters: { region: 'EU' },
      clickedRow: { customer_id: 'C-42' },
    });

    expect(result).toBeDefined();
    expect(adapter.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: { order_region: 'EU', cust_id: 'C-42' },
      }),
    );
  });
});

// ========================================================================
// 6. Session export/import round-trip
// ========================================================================

describe('Integration: Session export/import round-trip', () => {
  it('exports, validates, and imports preserving all fields', () => {
    const tables = [
      { tableName: 'sales', rowCount: 1000, sourceFile: 'sales.csv' },
      { tableName: 'products', rowCount: 50, sourceFile: 'products.xlsx' },
    ];

    // Export
    const bundle = createExportBundle({
      sessionName: 'Q1 Analysis',
      tables,
      source: 'browser',
    });

    expect(bundle.version).toBe(1);
    expect(bundle.sessionName).toBe('Q1 Analysis');
    expect(bundle.tables).toHaveLength(2);
    expect(bundle.exportedAt).toBeGreaterThan(0);
    expect(bundle.source).toBe('browser');

    // Validate
    const validation = validateExportBundle(bundle);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);

    // Import
    const imported = convertBundleForImport(bundle);
    expect(imported.sessionName).toBe('Q1 Analysis');
    expect(imported.tables).toHaveLength(2);
    expect(imported.tables[0].tableName).toBe('sales');
    expect(imported.tables[1].rowCount).toBe(50);
    expect(imported.version).toBe(bundle.version);
    expect(imported.exportedAt).toBe(bundle.exportedAt);
  });
});

// ========================================================================
// 7. Grid definition as artifact
// ========================================================================

describe('Integration: Grid definition as artifact', () => {
  it('creates grid artifact, validates type guard, and converts to catalog meta', () => {
    const grid = createGridArtifact({
      name: 'Sales Performance Grid',
      description: 'Regional sales analysis',
      dataSourceId: 'ds-sales',
      columns: [
        { field: 'region', header: 'Region', sortable: true, filterable: true },
        { field: 'amount', header: 'Amount', width: 120 },
        { field: 'date', header: 'Date' },
      ],
      defaultSort: [{ field: 'amount', direction: 'desc' }],
      density: 'comfortable',
      enableGrouping: true,
    });

    // Type guard
    expect(isGridArtifact(grid)).toBe(true);
    expect(grid.type).toBe('grid-definition');

    // Convert to catalog meta
    const meta = gridArtifactToMeta(grid);
    expect(meta.id).toBe(grid.id);
    expect(meta.type).toBe('grid-definition');
    expect(meta.name).toBe('Sales Performance Grid');
    expect(meta.description).toBe('Regional sales analysis');

    // Type guard negative cases
    expect(isGridArtifact(null)).toBe(false);
    expect(isGridArtifact({ type: 'report' })).toBe(false);
  });
});

// ========================================================================
// 8. DefaultPresentation merge precedence
// ========================================================================

describe('Integration: DefaultPresentation merge precedence', () => {
  it('applies session > preset > admin precedence', () => {
    // Admin defaults (lowest priority)
    const admin: DefaultPresentation = createDefaultPresentation({
      density: 'comfortable',
      theme: 'light',
      columnOrder: ['id', 'name', 'email', 'role'],
      frozenColumns: 1,
    });

    // Preset overrides (middle priority)
    const presetOverrides: Partial<DefaultPresentation> = {
      theme: 'dark',
      hiddenColumns: ['role'],
      frozenColumns: 2,
    };
    const afterPreset = mergePresentation(admin, presetOverrides);

    expect(afterPreset.density).toBe('comfortable'); // admin
    expect(afterPreset.theme).toBe('dark'); // preset wins
    expect(afterPreset.hiddenColumns).toEqual(['role']); // preset wins
    expect(afterPreset.frozenColumns).toBe(2); // preset wins

    // Session changes (highest priority)
    const sessionOverrides: Partial<DefaultPresentation> = {
      density: 'compact',
      columnWidths: { name: 200 },
    };
    const final = mergePresentation(afterPreset, sessionOverrides);

    expect(final.density).toBe('compact'); // session wins
    expect(final.theme).toBe('dark'); // preset preserved
    expect(final.hiddenColumns).toEqual(['role']); // preset preserved
    expect(final.frozenColumns).toBe(2); // preset preserved
    expect(final.columnWidths).toEqual({ name: 200 }); // session wins
    expect(final.columnOrder).toEqual(['id', 'name', 'email', 'role']); // admin preserved
  });
});

// ========================================================================
// 9. Visibility lifecycle
// ========================================================================

describe('Integration: Visibility lifecycle', () => {
  it('groups and filters artifacts by visibility and viewer context', () => {
    const artifacts: VisibilityMeta[] = [
      { id: 'a1', type: 'report', name: 'My Report', visibility: 'personal', ownerId: 'alice' },
      { id: 'a2', type: 'dashboard', name: 'Team Dashboard', visibility: 'shared', ownerId: 'alice', sharedWith: ['analysts'] },
      { id: 'a3', type: 'kpi', name: 'Revenue KPI', visibility: 'published', ownerId: 'admin' },
      { id: 'a4', type: 'report', name: 'Bob Draft', visibility: 'personal', ownerId: 'bob' },
      { id: 'a5', type: 'dashboard', name: 'Exec Board', visibility: 'shared', ownerId: 'admin', sharedWith: ['executives'] },
    ];

    // Group
    const groups = groupByVisibility(artifacts);
    expect(groups.personal).toHaveLength(2);
    expect(groups.shared).toHaveLength(2);
    expect(groups.published).toHaveLength(1);

    // Alice (analyst role) — sees: her personal, analyst-shared, published
    const alice: ViewerContext = { userId: 'alice', roles: ['analysts'] };
    const aliceVisible = artifacts.filter(a => isVisibleToViewer(a, alice));
    expect(aliceVisible.map(a => a.id).sort()).toEqual(['a1', 'a2', 'a3']);

    // Bob (no roles) — sees: his personal, published only
    const bob: ViewerContext = { userId: 'bob', roles: [] };
    const bobVisible = artifacts.filter(a => isVisibleToViewer(a, bob));
    expect(bobVisible.map(a => a.id).sort()).toEqual(['a3', 'a4']);

    // Exec (executive role) — sees: published + exec-shared
    const exec: ViewerContext = { userId: 'ceo', roles: ['executives'] };
    const execVisible = artifacts.filter(a => isVisibleToViewer(a, exec));
    expect(execVisible.map(a => a.id).sort()).toEqual(['a3', 'a5']);

    // Anonymous (no viewer) — sees only published
    const anonVisible = artifacts.filter(a => isVisibleToViewer(a, undefined));
    expect(anonVisible.map(a => a.id)).toEqual(['a3']);
  });
});

// ========================================================================
// 10. Filter ownership end-to-end
// ========================================================================

describe('Integration: Filter ownership end-to-end', () => {
  it('wires FilterDefinitions + contract + security + rules together', () => {
    // Admin creates filter definitions
    const regionDef = createFilterDefinition({
      id: 'fd-region',
      label: 'Region',
      filterType: 'select',
      valueSource: { type: 'static', values: ['US', 'EU', 'APAC', 'LATAM'] },
      bindings: [{ dataSourceId: 'sales', targetField: 'region' }],
      securityBinding: {
        viewerAttribute: 'allowed_regions',
        restrictionType: 'include-only',
      },
      defaultValue: { type: 'viewer-attribute', attribute: 'home_region' },
    });

    const statusDef = createFilterDefinition({
      id: 'fd-status',
      label: 'Deal Status',
      filterType: 'multi-select',
      valueSource: { type: 'static', values: ['open', 'closed', 'pending'] },
      bindings: [{ dataSourceId: 'sales', targetField: 'deal_status' }],
    });

    const definitions: FilterDefinition[] = [regionDef, statusDef];

    // Dashboard binds via contract
    const contract: ArtifactFilterContract = {
      acceptedFilters: [
        { filterDefinitionId: 'fd-region' },
        { filterDefinitionId: 'fd-status' },
      ],
    };

    // Viewer context: APAC sales rep
    const viewer: ViewerContext = {
      userId: 'user-42',
      roles: ['sales-rep'],
      attributes: {
        home_region: 'APAC',
        allowed_regions: ['APAC', 'LATAM'],
        role: 'sales-rep',
      },
    };

    // 1. Resolve contract with viewer
    const resolution = resolveFiltersFromContract(contract, definitions, viewer);
    expect(resolution.filters).toHaveLength(2);
    // Default region resolved from viewer attribute
    expect(resolution.defaults['fd-region']).toBe('APAC');
    expect(resolution.effectiveValues['fd-region']).toBe('APAC');

    // 2. Filter rules
    const rules: FilterRule[] = [
      {
        id: 'rule-rep-restriction',
        name: 'Sales reps cannot see closed deals',
        priority: 1,
        enabled: true,
        conditions: [
          { type: 'viewer-attribute', attribute: 'role', operator: 'eq', value: 'sales-rep' },
        ],
        actions: [
          { type: 'restrict', filterDefinitionId: 'fd-status', allowedValues: ['open', 'pending'] },
        ],
      },
    ];

    const ruleResults = evaluateFilterRules(rules, viewer, resolution.effectiveValues);
    expect(ruleResults[0].matched).toBe(true);
    expect(ruleResults[0].actions[0].type).toBe('restrict');

    // Verify the restrict action limits status to open+pending (no 'closed')
    const restrictAction = ruleResults[0].actions[0];
    expect(restrictAction.type).toBe('restrict');
    if (restrictAction.type === 'restrict') {
      expect(restrictAction.allowedValues).toEqual(['open', 'pending']);
      expect(restrictAction.allowedValues).not.toContain('closed');
    }
  });
});
