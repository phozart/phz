import { describe, it, expect } from 'vitest';
import { createKPIRegistry } from '../kpi.js';
import type { KPIDefinition } from '../kpi.js';
import { kpiId } from '../types.js';

function makeKPI(id: string, overrides: Partial<KPIDefinition> = {}): KPIDefinition {
  return {
    id: kpiId(id),
    name: `KPI ${id}`,
    target: 95,
    unit: 'percent',
    direction: 'higher_is_better',
    thresholds: { ok: 90, warn: 75 },
    deltaComparison: 'previous_period',
    dimensions: ['region'],
    dataSource: { scoreEndpoint: `/api/kpi/${id}` },
    ...overrides,
  };
}

describe('KPIRegistry', () => {
  it('registers and retrieves a KPI', () => {
    const registry = createKPIRegistry();
    const kpi = makeKPI('attendance');
    registry.register(kpi);
    expect(registry.get(kpiId('attendance'))).toEqual(kpi);
  });

  it('lists all KPIs in order', () => {
    const registry = createKPIRegistry();
    registry.register(makeKPI('a'));
    registry.register(makeKPI('b'));
    registry.register(makeKPI('c'));
    const list = registry.list();
    expect(list.map(k => k.id)).toEqual([kpiId('a'), kpiId('b'), kpiId('c')]);
  });

  it('lists by category', () => {
    const registry = createKPIRegistry();
    registry.register(makeKPI('a', { category: 'performance' }));
    registry.register(makeKPI('b', { category: 'quality' }));
    registry.register(makeKPI('c', { category: 'performance' }));
    expect(registry.listByCategory('performance')).toHaveLength(2);
    expect(registry.listByCategory('quality')).toHaveLength(1);
  });

  it('removes a KPI', () => {
    const registry = createKPIRegistry();
    registry.register(makeKPI('a'));
    registry.remove(kpiId('a'));
    expect(registry.get(kpiId('a'))).toBeUndefined();
    expect(registry.list()).toHaveLength(0);
  });

  it('reorders KPIs', () => {
    const registry = createKPIRegistry();
    registry.register(makeKPI('a'));
    registry.register(makeKPI('b'));
    registry.register(makeKPI('c'));
    registry.reorder([kpiId('c'), kpiId('a'), kpiId('b')]);
    expect(registry.list().map(k => k.id)).toEqual([kpiId('c'), kpiId('a'), kpiId('b')]);
  });

  it('validates — missing required fields', () => {
    const registry = createKPIRegistry();
    const result = registry.validate({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(5);
  });

  it('validates — complete KPI passes', () => {
    const registry = createKPIRegistry();
    const result = registry.validate(makeKPI('valid'));
    expect(result.valid).toBe(true);
  });
});
