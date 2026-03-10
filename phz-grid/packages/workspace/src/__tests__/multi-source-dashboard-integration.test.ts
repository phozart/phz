/**
 * Multi-source dashboard — integration tests
 *
 * End-to-end verification that multi-source features wire together:
 * - Dashboard creation with multiple sources
 * - Relationship definition and auto-detect
 * - Widget-to-source binding
 * - Filter propagation respecting join semantics
 * - Pipeline routing widgets to correct source data
 * - Migration from single-source dashboard
 * - Capability gating
 */
import { describe, it, expect, beforeEach } from 'vitest';

// Dashboard editor state
import {
  initialDashboardEditorState,
  addWidget,
  addDashboardSource,
  removeDashboardSource,
  updateDashboardSource,
  setWidgetSource,
  resolveEffectiveSources,
  getWidgetSourceSlot,
  _resetWidgetCounter,
  type DashboardSourceEntry,
} from '../authoring/dashboard-editor-state.js';

// Source relationships
import {
  initialSourceRelationshipState,
  addSourceRelationship,
  autoDetectRelationships,
  validateRelationships,
  _resetRelationshipCounter,
} from '../authoring/source-relationship-state.js';

// Filter context (join-aware)
import { createFilterContext } from '../filters/filter-context.js';
import type { FieldMapping } from '../types.js';
import type { SourceRelationship } from '@phozart/phz-shared/types';

// Creation flow
import {
  initialCreationFlow,
  selectType,
  selectMultipleDataSources,
  selectDataSource,
  canProceed,
  finishCreation,
  setName,
  nextStep,
} from '../authoring/creation-flow.js';

// Data config panel
import {
  initialDataConfigPanelState,
  addDataSource as addConfigSource,
  _resetSourceCounter,
} from '../authoring/data-config-panel-state.js';

// Report editor
import {
  initialReportEditorState,
  addReportSource,
  removeReportSource,
  _resetReportSourceCounter,
} from '../authoring/report-editor-state.js';

// Wiring
import {
  getSelectedWidgetSource,
  createWidgetFromPalette,
} from '../authoring/dashboard-editor-wiring.js';

beforeEach(() => {
  _resetWidgetCounter();
  _resetRelationshipCounter();
  _resetSourceCounter();
  _resetReportSourceCounter();
});

// ========================================================================
// 1. Multi-source dashboard creation
// ========================================================================

describe('Multi-source dashboard creation', () => {
  it('creates a dashboard with one primary source', () => {
    const state = initialDashboardEditorState('Sales Dashboard', 'sales-db');
    expect(state.dataSources).toHaveLength(1);
    expect(state.dataSources[0].slotId).toBe('primary');
    expect(state.dataSources[0].dataSourceId).toBe('sales-db');
    expect(state.dataSourceId).toBe('sales-db');
    expect(state.sourceRelationships).toEqual([]);
  });

  it('adds a second data source', () => {
    let state = initialDashboardEditorState('Multi', 'sales-db');
    const ordersEntry: DashboardSourceEntry = {
      slotId: 'orders', dataSourceId: 'orders-db', alias: 'Orders', color: '#3B82F6',
    };
    state = addDashboardSource(state, ordersEntry);
    expect(state.dataSources).toHaveLength(2);
    expect(state.dataSources[1].slotId).toBe('orders');
    expect(state.dataSources[1].color).toBe('#3B82F6');
  });

  it('adds a third data source (3-source dashboard)', () => {
    let state = initialDashboardEditorState('Multi', 'sales-db');
    state = addDashboardSource(state, { slotId: 'orders', dataSourceId: 'orders-db', alias: 'Orders' });
    state = addDashboardSource(state, { slotId: 'inventory', dataSourceId: 'inv-db', alias: 'Inventory' });
    expect(state.dataSources).toHaveLength(3);
  });

  it('prevents duplicate slotId', () => {
    let state = initialDashboardEditorState('Multi', 'sales-db');
    state = addDashboardSource(state, { slotId: 'primary', dataSourceId: 'other-db', alias: 'Other' });
    expect(state.dataSources).toHaveLength(1); // Unchanged
  });
});

// ========================================================================
// 2. Relationship definition
// ========================================================================

describe('Source relationships in dashboard', () => {
  it('defines inner join between sales and orders', () => {
    let state = initialDashboardEditorState('Multi', 'sales-db');
    state = addDashboardSource(state, { slotId: 'orders', dataSourceId: 'orders-db', alias: 'Orders' });

    const rel: SourceRelationship = {
      id: 'r1',
      leftSourceId: 'primary',
      rightSourceId: 'orders',
      joinType: 'inner',
      joinKeys: [{ leftField: 'customer_id', rightField: 'cust_id' }],
    };
    state = { ...state, sourceRelationships: [rel] };
    expect(state.sourceRelationships).toHaveLength(1);
    expect(state.sourceRelationships[0].joinType).toBe('inner');
  });

  it('auto-detects relationships from schemas', () => {
    const schemas = [
      { sourceId: 'sales', fields: [{ name: 'region', dataType: 'string' }, { name: 'amount', dataType: 'number' }] },
      { sourceId: 'orders', fields: [{ name: 'region', dataType: 'string' }, { name: 'quantity', dataType: 'number' }] },
    ];
    const detected = autoDetectRelationships(schemas);
    expect(detected).toHaveLength(1);
    expect(detected[0].joinKeys).toEqual([{ leftField: 'region', rightField: 'region' }]);
  });

  it('validates relationships against available slots', () => {
    const relationships: SourceRelationship[] = [{
      id: 'r1', leftSourceId: 'primary', rightSourceId: 'orders',
      joinType: 'inner', joinKeys: [{ leftField: 'id', rightField: 'cust_id' }],
    }];
    const result = validateRelationships(relationships, ['primary', 'orders']);
    expect(result.valid).toBe(true);
  });

  it('validation fails for missing source', () => {
    const relationships: SourceRelationship[] = [{
      id: 'r1', leftSourceId: 'primary', rightSourceId: 'missing',
      joinType: 'inner', joinKeys: [{ leftField: 'id', rightField: 'cust_id' }],
    }];
    const result = validateRelationships(relationships, ['primary']);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('missing'))).toBe(true);
  });
});

// ========================================================================
// 3. Widget-to-source binding
// ========================================================================

describe('Widget source binding', () => {
  it('widget defaults to primary source', () => {
    let state = initialDashboardEditorState('Multi', 'sales-db');
    state = addWidget(state, 'bar-chart');
    const slotId = getWidgetSourceSlot(state, state.widgets[0].id);
    expect(slotId).toBe('primary');
  });

  it('widget can be bound to a specific source', () => {
    let state = initialDashboardEditorState('Multi', 'sales-db');
    state = addDashboardSource(state, { slotId: 'orders', dataSourceId: 'orders-db', alias: 'Orders' });
    state = addWidget(state, 'kpi-card', undefined, 'orders');
    expect(state.widgets[0].sourceSlotId).toBe('orders');
    expect(getWidgetSourceSlot(state, state.widgets[0].id)).toBe('orders');
  });

  it('setWidgetSource rebinds a widget', () => {
    let state = initialDashboardEditorState('Multi', 'sales-db');
    state = addDashboardSource(state, { slotId: 'orders', dataSourceId: 'orders-db', alias: 'Orders' });
    state = addWidget(state, 'bar-chart');
    state = setWidgetSource(state, state.widgets[0].id, 'orders');
    expect(state.widgets[0].sourceSlotId).toBe('orders');
  });

  it('prevents removing source with bound widgets', () => {
    let state = initialDashboardEditorState('Multi', 'sales-db');
    state = addDashboardSource(state, { slotId: 'orders', dataSourceId: 'orders-db', alias: 'Orders' });
    state = addWidget(state, 'bar-chart', undefined, 'orders');
    const before = state.dataSources.length;
    state = removeDashboardSource(state, 'orders');
    expect(state.dataSources).toHaveLength(before); // Unchanged — orphan protection
  });

  it('allows removing source with no bound widgets', () => {
    let state = initialDashboardEditorState('Multi', 'sales-db');
    state = addDashboardSource(state, { slotId: 'orders', dataSourceId: 'orders-db', alias: 'Orders' });
    state = removeDashboardSource(state, 'orders');
    expect(state.dataSources).toHaveLength(1);
  });

  it('removing source also removes its relationships', () => {
    let state = initialDashboardEditorState('Multi', 'sales-db');
    state = addDashboardSource(state, { slotId: 'orders', dataSourceId: 'orders-db', alias: 'Orders' });
    state = { ...state, sourceRelationships: [{
      id: 'r1', leftSourceId: 'primary', rightSourceId: 'orders',
      joinType: 'inner', joinKeys: [{ leftField: 'id', rightField: 'cust_id' }],
    }] };
    state = removeDashboardSource(state, 'orders');
    expect(state.sourceRelationships).toHaveLength(0);
  });
});

// ========================================================================
// 4. Filter propagation per join type
// ========================================================================

describe('Filter propagation respects join types', () => {
  const mappings: FieldMapping[] = [{
    canonicalField: 'region',
    sources: [
      { dataSourceId: 'primary', field: 'sales_region' },
      { dataSourceId: 'orders', field: 'order_region' },
      { dataSourceId: 'inventory', field: 'inv_region' },
    ],
  }];

  const relationships: SourceRelationship[] = [
    { id: 'r1', leftSourceId: 'primary', rightSourceId: 'orders', joinType: 'inner', joinKeys: [{ leftField: 'sales_region', rightField: 'order_region' }] },
    { id: 'r2', leftSourceId: 'primary', rightSourceId: 'inventory', joinType: 'left', joinKeys: [{ leftField: 'sales_region', rightField: 'inv_region' }] },
  ];

  it('inner: filter from primary propagates to orders', () => {
    const ctx = createFilterContext({ fieldMappings: mappings, sourceRelationships: relationships });
    ctx.setFilter({ filterId: 'f1', field: 'region', operator: 'equals', value: 'US', label: 'Region: US' });
    const result = ctx.resolveFiltersForSourceWithJoins('orders', 'primary');
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe('order_region');
  });

  it('left: filter from primary propagates to inventory', () => {
    const ctx = createFilterContext({ fieldMappings: mappings, sourceRelationships: relationships });
    ctx.setFilter({ filterId: 'f1', field: 'region', operator: 'equals', value: 'US', label: 'Region: US' });
    const result = ctx.resolveFiltersForSourceWithJoins('inventory', 'primary');
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe('inv_region');
  });

  it('left: filter from inventory does NOT propagate to primary', () => {
    const ctx = createFilterContext({ fieldMappings: mappings, sourceRelationships: relationships });
    ctx.setFilter({ filterId: 'f1', field: 'region', operator: 'equals', value: 'US', label: 'Region: US' });
    const result = ctx.resolveFiltersForSourceWithJoins('primary', 'inventory');
    expect(result).toHaveLength(0);
  });
});

// ========================================================================
// 5. Migration from single-source
// ========================================================================

describe('Single-source backward compatibility', () => {
  it('resolveEffectiveSources creates entry from legacy dataSourceId', () => {
    // Simulate a legacy state without dataSources populated
    const state = initialDashboardEditorState('Legacy', 'old-source');
    // Even though initialDashboardEditorState now populates dataSources,
    // resolveEffectiveSources handles both cases
    const sources = resolveEffectiveSources(state);
    expect(sources).toHaveLength(1);
    expect(sources[0].dataSourceId).toBe('old-source');
  });

  it('works with empty dataSources array (migration path)', () => {
    const state = initialDashboardEditorState('Legacy', 'old-source');
    // Simulate a legacy state that was deserialized without dataSources
    const legacyState = { ...state, dataSources: [] as any[] };
    const sources = resolveEffectiveSources(legacyState);
    expect(sources).toHaveLength(1);
    expect(sources[0].slotId).toBe('primary');
    expect(sources[0].dataSourceId).toBe('old-source');
  });
});

// ========================================================================
// 6. Capability gating
// ========================================================================

describe('Capability gating', () => {
  it('addDataSource blocked when at maxDataSources', () => {
    let panel = initialDataConfigPanelState();
    panel = addConfigSource(panel, 'src-1', 'Source 1', 1);
    expect(panel.sources).toHaveLength(1);
    // Try to add a second — blocked by cap
    panel = addConfigSource(panel, 'src-2', 'Source 2', 1);
    expect(panel.sources).toHaveLength(1);
  });

  it('addDataSource allowed when under maxDataSources', () => {
    let panel = initialDataConfigPanelState();
    panel = addConfigSource(panel, 'src-1', 'Source 1', 5);
    panel = addConfigSource(panel, 'src-2', 'Source 2', 5);
    panel = addConfigSource(panel, 'src-3', 'Source 3', 5);
    expect(panel.sources).toHaveLength(3);
  });

  it('addDataSource has no cap when maxDataSources is undefined', () => {
    let panel = initialDataConfigPanelState();
    panel = addConfigSource(panel, 'src-1', 'Source 1');
    panel = addConfigSource(panel, 'src-2', 'Source 2');
    expect(panel.sources).toHaveLength(2);
  });
});

// ========================================================================
// 7. Creation flow with multi-source
// ========================================================================

describe('Creation flow multi-source', () => {
  it('canProceed with dataSourceIds', () => {
    let flow = initialCreationFlow();
    flow = selectType(flow, 'dashboard');
    flow = nextStep(flow);
    expect(flow.step).toBe('choose-source');
    flow = selectMultipleDataSources(flow, ['sales-db', 'orders-db']);
    expect(canProceed(flow)).toBe(true);
  });

  it('canProceed with legacy single dataSourceId', () => {
    let flow = initialCreationFlow();
    flow = selectType(flow, 'dashboard');
    flow = nextStep(flow);
    flow = selectDataSource(flow, 'sales-db');
    expect(canProceed(flow)).toBe(true);
  });

  it('finishCreation returns dataSourceIds', () => {
    let flow = initialCreationFlow();
    flow = selectType(flow, 'dashboard');
    flow = nextStep(flow);
    flow = selectMultipleDataSources(flow, ['sales-db', 'orders-db']);
    flow = nextStep(flow);
    flow = { ...flow, templateId: 'blank' };
    flow = nextStep(flow);
    flow = setName(flow, 'Multi Dashboard');
    const result = finishCreation(flow);
    expect(result).not.toBeNull();
    expect(result!.dataSourceId).toBe('sales-db');
    expect(result!.dataSourceIds).toEqual(['sales-db', 'orders-db']);
  });
});

// ========================================================================
// 8. Report multi-source
// ========================================================================

describe('Report multi-source integration', () => {
  it('report starts with primary source, adds additional', () => {
    let state = initialReportEditorState('Sales Report', 'sales-db');
    expect(state.additionalSources).toEqual([]);
    state = addReportSource(state, 'orders-db', 'Orders', [{ localField: 'customer_id', remoteField: 'id' }]);
    expect(state.additionalSources).toHaveLength(1);
    expect(state.additionalSources[0].dataSourceId).toBe('orders-db');
  });

  it('removes additional source', () => {
    let state = initialReportEditorState('Sales Report', 'sales-db');
    state = addReportSource(state, 'orders-db', 'Orders', [{ localField: 'id', remoteField: 'cust_id' }]);
    const slotId = state.additionalSources[0].slotId;
    state = removeReportSource(state, slotId);
    expect(state.additionalSources).toHaveLength(0);
  });
});

// ========================================================================
// 9. Wiring: source-aware field palette
// ========================================================================

describe('Source-aware wiring', () => {
  it('getSelectedWidgetSource returns primary when no widget selected', () => {
    const state = initialDashboardEditorState('Test', 'sales-db');
    const source = getSelectedWidgetSource(state);
    expect(source?.slotId).toBe('primary');
    expect(source?.dataSourceId).toBe('sales-db');
  });

  it('getSelectedWidgetSource returns widget-bound source', () => {
    let state = initialDashboardEditorState('Test', 'sales-db');
    state = addDashboardSource(state, { slotId: 'orders', dataSourceId: 'orders-db', alias: 'Orders' });
    state = addWidget(state, 'bar-chart', undefined, 'orders');
    state = { ...state, selectedWidgetId: state.widgets[0].id };
    const source = getSelectedWidgetSource(state);
    expect(source?.slotId).toBe('orders');
  });

  it('createWidgetFromPalette passes sourceSlotId', () => {
    let state = initialDashboardEditorState('Test', 'sales-db');
    state = addDashboardSource(state, { slotId: 'orders', dataSourceId: 'orders-db', alias: 'Orders' });
    state = createWidgetFromPalette(state, 'kpi-card', { row: 0, col: 0 }, undefined, 'orders');
    expect(state.widgets[0].sourceSlotId).toBe('orders');
  });

  it('updateDashboardSource changes alias', () => {
    let state = initialDashboardEditorState('Test', 'sales-db');
    state = addDashboardSource(state, { slotId: 'orders', dataSourceId: 'orders-db', alias: 'Orders' });
    state = updateDashboardSource(state, 'orders', { alias: 'Order Data', color: '#FF0000' });
    expect(state.dataSources.find(s => s.slotId === 'orders')?.alias).toBe('Order Data');
    expect(state.dataSources.find(s => s.slotId === 'orders')?.color).toBe('#FF0000');
  });
});
