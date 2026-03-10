import { describe, it, expect } from 'vitest';
import { createFilterContext } from '../filters/filter-context.js';
import type { FilterValue, FieldMapping } from '../types.js';
import type { SourceRelationship } from '@phozart/phz-shared/types';

describe('Multi-source filter resolution (O.1a)', () => {
  const mappings: FieldMapping[] = [
    {
      canonicalField: 'region',
      sources: [
        { dataSourceId: 'sales', field: 'sales_region' },
        { dataSourceId: 'orders', field: 'order_region' },
      ],
    },
    {
      canonicalField: 'product',
      sources: [
        { dataSourceId: 'sales', field: 'product_name' },
        { dataSourceId: 'orders', field: 'item_name' },
      ],
    },
  ];

  it('resolves canonical field to source-specific field', () => {
    const ctx = createFilterContext({ fieldMappings: mappings });
    ctx.setFilter({
      filterId: 'f1',
      field: 'region',
      operator: 'equals',
      value: 'US',
      label: 'Region: US',
    });

    // Resolve for sales data source
    const salesFilters = ctx.resolveFiltersForSource('sales');
    expect(salesFilters[0].field).toBe('sales_region');
    expect(salesFilters[0].value).toBe('US');

    // Resolve for orders data source
    const orderFilters = ctx.resolveFiltersForSource('orders');
    expect(orderFilters[0].field).toBe('order_region');
  });

  it('uses canonical field when no mapping exists', () => {
    const ctx = createFilterContext({ fieldMappings: mappings });
    ctx.setFilter({
      filterId: 'f1',
      field: 'status',
      operator: 'equals',
      value: 'active',
      label: 'Status: active',
    });

    const resolved = ctx.resolveFiltersForSource('sales');
    expect(resolved[0].field).toBe('status');
  });

  it('resolves cross-filters across sources', () => {
    const ctx = createFilterContext({ fieldMappings: mappings });
    ctx.applyCrossFilter({
      sourceWidgetId: 'chart-1',
      field: 'region',
      value: 'EU',
      timestamp: Date.now(),
    });

    const salesFilters = ctx.resolveFiltersForSource('sales', 'chart-2');
    expect(salesFilters.some(f => f.field === 'sales_region' && f.value === 'EU')).toBe(true);
  });

  it('works without field mappings configured', () => {
    const ctx = createFilterContext();
    ctx.setFilter({
      filterId: 'f1',
      field: 'region',
      operator: 'equals',
      value: 'US',
      label: 'Region: US',
    });

    const resolved = ctx.resolveFiltersForSource('any-source');
    expect(resolved[0].field).toBe('region');
  });
});

describe('Join-aware filter propagation', () => {
  const mappings: FieldMapping[] = [
    {
      canonicalField: 'region',
      sources: [
        { dataSourceId: 'sales', field: 'sales_region' },
        { dataSourceId: 'orders', field: 'order_region' },
        { dataSourceId: 'inventory', field: 'inv_region' },
      ],
    },
  ];

  const relationships: SourceRelationship[] = [
    {
      id: 'r1',
      leftSourceId: 'sales',
      rightSourceId: 'orders',
      joinType: 'inner',
      joinKeys: [{ leftField: 'sales_region', rightField: 'order_region' }],
    },
    {
      id: 'r2',
      leftSourceId: 'sales',
      rightSourceId: 'inventory',
      joinType: 'left',
      joinKeys: [{ leftField: 'sales_region', rightField: 'inv_region' }],
    },
    {
      id: 'r3',
      leftSourceId: 'orders',
      rightSourceId: 'inventory',
      joinType: 'none',
      joinKeys: [],
    },
  ];

  // Test: inner join allows bidirectional propagation
  it('inner join: propagates sales→orders', () => {
    const ctx = createFilterContext({ fieldMappings: mappings, sourceRelationships: relationships });
    ctx.setFilter({ filterId: 'f1', field: 'region', operator: 'equals', value: 'US', label: 'Region: US' });
    const result = ctx.resolveFiltersForSourceWithJoins('orders', 'sales');
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe('order_region');
  });

  it('inner join: propagates orders→sales (reverse)', () => {
    const ctx = createFilterContext({ fieldMappings: mappings, sourceRelationships: relationships });
    ctx.setFilter({ filterId: 'f1', field: 'region', operator: 'equals', value: 'US', label: 'Region: US' });
    const result = ctx.resolveFiltersForSourceWithJoins('sales', 'orders');
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe('sales_region');
  });

  // Test: left join allows forward only
  it('left join: propagates sales→inventory (forward)', () => {
    const ctx = createFilterContext({ fieldMappings: mappings, sourceRelationships: relationships });
    ctx.setFilter({ filterId: 'f1', field: 'region', operator: 'equals', value: 'US', label: 'Region: US' });
    const result = ctx.resolveFiltersForSourceWithJoins('inventory', 'sales');
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe('inv_region');
  });

  it('left join: blocks inventory→sales (reverse)', () => {
    const ctx = createFilterContext({ fieldMappings: mappings, sourceRelationships: relationships });
    ctx.setFilter({ filterId: 'f1', field: 'region', operator: 'equals', value: 'US', label: 'Region: US' });
    const result = ctx.resolveFiltersForSourceWithJoins('sales', 'inventory');
    expect(result).toHaveLength(0);
  });

  // Test: none blocks all propagation
  it('none join: blocks orders→inventory', () => {
    const ctx = createFilterContext({ fieldMappings: mappings, sourceRelationships: relationships });
    ctx.setFilter({ filterId: 'f1', field: 'region', operator: 'equals', value: 'US', label: 'Region: US' });
    const result = ctx.resolveFiltersForSourceWithJoins('inventory', 'orders');
    expect(result).toHaveLength(0);
  });

  it('none join: blocks inventory→orders', () => {
    const ctx = createFilterContext({ fieldMappings: mappings, sourceRelationships: relationships });
    ctx.setFilter({ filterId: 'f1', field: 'region', operator: 'equals', value: 'US', label: 'Region: US' });
    const result = ctx.resolveFiltersForSourceWithJoins('orders', 'inventory');
    expect(result).toHaveLength(0);
  });

  // Test: same source always gets filters
  it('same source always passes through', () => {
    const ctx = createFilterContext({ fieldMappings: mappings, sourceRelationships: relationships });
    ctx.setFilter({ filterId: 'f1', field: 'region', operator: 'equals', value: 'US', label: 'Region: US' });
    const result = ctx.resolveFiltersForSourceWithJoins('sales', 'sales');
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe('sales_region');
  });

  // Test: no origin source falls back to standard resolution
  it('no origin source falls back to resolveFiltersForSource', () => {
    const ctx = createFilterContext({ fieldMappings: mappings, sourceRelationships: relationships });
    ctx.setFilter({ filterId: 'f1', field: 'region', operator: 'equals', value: 'US', label: 'Region: US' });
    const result = ctx.resolveFiltersForSourceWithJoins('orders');
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe('order_region');
  });

  // Test: no relationships falls back
  it('no relationships falls back to standard resolution', () => {
    const ctx = createFilterContext({ fieldMappings: mappings });
    ctx.setFilter({ filterId: 'f1', field: 'region', operator: 'equals', value: 'US', label: 'Region: US' });
    const result = ctx.resolveFiltersForSourceWithJoins('orders', 'sales');
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe('order_region');
  });

  // Test: full join allows both directions
  it('full join allows both directions', () => {
    const fullRels: SourceRelationship[] = [{
      id: 'r_full',
      leftSourceId: 'sales',
      rightSourceId: 'orders',
      joinType: 'full',
      joinKeys: [{ leftField: 'sales_region', rightField: 'order_region' }],
    }];
    const ctx = createFilterContext({ fieldMappings: mappings, sourceRelationships: fullRels });
    ctx.setFilter({ filterId: 'f1', field: 'region', operator: 'equals', value: 'US', label: 'Region: US' });

    const fwd = ctx.resolveFiltersForSourceWithJoins('orders', 'sales');
    expect(fwd).toHaveLength(1);
    const rev = ctx.resolveFiltersForSourceWithJoins('sales', 'orders');
    expect(rev).toHaveLength(1);
  });

  // Test: right join reverse direction
  it('right join: allows reverse propagation only', () => {
    const rightRels: SourceRelationship[] = [{
      id: 'r_right',
      leftSourceId: 'sales',
      rightSourceId: 'orders',
      joinType: 'right',
      joinKeys: [{ leftField: 'sales_region', rightField: 'order_region' }],
    }];
    const ctx = createFilterContext({ fieldMappings: mappings, sourceRelationships: rightRels });
    ctx.setFilter({ filterId: 'f1', field: 'region', operator: 'equals', value: 'US', label: 'Region: US' });

    // Forward blocked
    const fwd = ctx.resolveFiltersForSourceWithJoins('orders', 'sales');
    expect(fwd).toHaveLength(0);
    // Reverse allowed
    const rev = ctx.resolveFiltersForSourceWithJoins('sales', 'orders');
    expect(rev).toHaveLength(1);
  });

  // Test: cross-filters respect join direction
  it('cross-filters respect join direction', () => {
    const ctx = createFilterContext({ fieldMappings: mappings, sourceRelationships: relationships });
    ctx.applyCrossFilter({ sourceWidgetId: 'w1', field: 'region', value: 'EU', timestamp: Date.now() });
    const result = ctx.resolveFiltersForSourceWithJoins('orders', 'sales', 'w2');
    expect(result.some(f => f.field === 'order_region')).toBe(true);
  });

  // Test: widget exclusion
  it('excludes cross-filters from requesting widget', () => {
    const ctx = createFilterContext({ fieldMappings: mappings, sourceRelationships: relationships });
    ctx.applyCrossFilter({ sourceWidgetId: 'w1', field: 'region', value: 'EU', timestamp: Date.now() });
    // w1 requesting its own source filters — cross-filter from w1 excluded
    const result = ctx.resolveFiltersForSourceWithJoins('sales', 'sales', 'w1');
    expect(result).toHaveLength(0);
  });
});
