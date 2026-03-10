import { describe, it, expect } from 'vitest';
import {
  resolveAutoTooltip,
  evaluateTooltipCondition,
  computeTooltipDelta,
} from '../chart-tooltip.js';
import type {
  ChartEncodingInput,
  TooltipCondition,
} from '../chart-tooltip.js';
import type { KPIDefinition } from '../kpi.js';

// --- Helpers ---

function makeEncoding(overrides: Partial<ChartEncodingInput> = {}): ChartEncodingInput {
  return {
    value: ['sales'],
    tooltip: [],
    ...overrides,
  };
}

function makeKPI(overrides: Partial<KPIDefinition> = {}): KPIDefinition {
  return {
    id: 'kpi-1' as KPIDefinition['id'],
    name: 'Revenue',
    target: 100,
    unit: 'currency',
    direction: 'higher_is_better',
    thresholds: { ok: 90, warn: 70 },
    deltaComparison: 'previous_period',
    dimensions: ['region'],
    dataSource: { scoreEndpoint: '/api/score' },
    ...overrides,
  };
}

// --- resolveAutoTooltip ---

describe('resolveAutoTooltip', () => {
  it('returns value fields when encoding has only values', () => {
    const fields = resolveAutoTooltip(makeEncoding({ value: ['sales', 'costs'] }));
    expect(fields).toHaveLength(2);
    expect(fields[0].field).toBe('sales');
    expect(fields[1].field).toBe('costs');
  });

  it('puts category first when present', () => {
    const fields = resolveAutoTooltip(makeEncoding({ category: 'region', value: ['sales'] }));
    expect(fields[0].field).toBe('region');
    expect(fields[1].field).toBe('sales');
  });

  it('orders: category → values → color → detail', () => {
    const fields = resolveAutoTooltip(
      makeEncoding({ category: 'region', value: ['sales'], color: 'segment', detail: 'product' }),
    );
    expect(fields.map(f => f.field)).toEqual(['region', 'sales', 'segment', 'product']);
  });

  it('assigns sequential order numbers', () => {
    const fields = resolveAutoTooltip(
      makeEncoding({ category: 'region', value: ['sales', 'costs'] }),
    );
    expect(fields.map(f => f.order)).toEqual([0, 1, 2]);
  });

  it('adds delta field when kpiDef has target and deltaComparison is not none', () => {
    const fields = resolveAutoTooltip(
      makeEncoding({ value: ['score'] }),
      makeKPI({ deltaComparison: 'previous_period' }),
    );
    const deltaField = fields.find(f => f.field === '_delta');
    expect(deltaField).toBeDefined();
    expect(deltaField!.label).toBe('Delta');
  });

  it('does NOT add delta field when kpiDef deltaComparison is none', () => {
    const fields = resolveAutoTooltip(
      makeEncoding({ value: ['score'] }),
      makeKPI({ deltaComparison: 'none' }),
    );
    const deltaField = fields.find(f => f.field === '_delta');
    expect(deltaField).toBeUndefined();
  });

  it('returns empty array for encoding with no values', () => {
    const fields = resolveAutoTooltip(makeEncoding({ value: [] }));
    expect(fields).toEqual([]);
  });

  it('skips undefined encoding channels', () => {
    const fields = resolveAutoTooltip(
      makeEncoding({ category: undefined, value: ['sales'], color: undefined }),
    );
    expect(fields).toHaveLength(1);
    expect(fields[0].field).toBe('sales');
  });
});

// --- evaluateTooltipCondition ---

describe('evaluateTooltipCondition', () => {
  it('evaluates gt correctly', () => {
    const cond: TooltipCondition = { field: 'sales', operator: 'gt', value: 100 };
    expect(evaluateTooltipCondition(cond, { sales: 150 })).toBe(true);
    expect(evaluateTooltipCondition(cond, { sales: 50 })).toBe(false);
    expect(evaluateTooltipCondition(cond, { sales: 100 })).toBe(false);
  });

  it('evaluates lt correctly', () => {
    const cond: TooltipCondition = { field: 'sales', operator: 'lt', value: 100 };
    expect(evaluateTooltipCondition(cond, { sales: 50 })).toBe(true);
    expect(evaluateTooltipCondition(cond, { sales: 150 })).toBe(false);
  });

  it('evaluates eq correctly', () => {
    const cond: TooltipCondition = { field: 'status', operator: 'eq', value: 'active' };
    expect(evaluateTooltipCondition(cond, { status: 'active' })).toBe(true);
    expect(evaluateTooltipCondition(cond, { status: 'inactive' })).toBe(false);
  });

  it('evaluates ne correctly', () => {
    const cond: TooltipCondition = { field: 'status', operator: 'ne', value: 'closed' };
    expect(evaluateTooltipCondition(cond, { status: 'open' })).toBe(true);
    expect(evaluateTooltipCondition(cond, { status: 'closed' })).toBe(false);
  });

  it('evaluates gte correctly', () => {
    const cond: TooltipCondition = { field: 'x', operator: 'gte', value: 10 };
    expect(evaluateTooltipCondition(cond, { x: 10 })).toBe(true);
    expect(evaluateTooltipCondition(cond, { x: 11 })).toBe(true);
    expect(evaluateTooltipCondition(cond, { x: 9 })).toBe(false);
  });

  it('evaluates lte correctly', () => {
    const cond: TooltipCondition = { field: 'x', operator: 'lte', value: 10 };
    expect(evaluateTooltipCondition(cond, { x: 10 })).toBe(true);
    expect(evaluateTooltipCondition(cond, { x: 9 })).toBe(true);
    expect(evaluateTooltipCondition(cond, { x: 11 })).toBe(false);
  });

  it('returns false when field is missing from rowData', () => {
    const cond: TooltipCondition = { field: 'missing', operator: 'gt', value: 0 };
    expect(evaluateTooltipCondition(cond, { other: 123 })).toBe(false);
  });

  it('returns false on type mismatch (comparing string to number)', () => {
    const cond: TooltipCondition = { field: 'x', operator: 'gt', value: 10 };
    expect(evaluateTooltipCondition(cond, { x: 'hello' })).toBe(false);
  });
});

// --- computeTooltipDelta ---

describe('computeTooltipDelta', () => {
  it('computes absolute delta', () => {
    const result = computeTooltipDelta(150, 100, 'absolute');
    expect(result.absolute).toBe(50);
    expect(result.percentage).toBeNull();
    expect(result.formatted).toBe('+50');
  });

  it('computes percentage delta', () => {
    const result = computeTooltipDelta(150, 100, 'percentage');
    expect(result.absolute).toBeNull();
    expect(result.percentage).toBe(50);
    expect(result.formatted).toBe('+50.0%');
  });

  it('computes both absolute and percentage', () => {
    const result = computeTooltipDelta(150, 100, 'both');
    expect(result.absolute).toBe(50);
    expect(result.percentage).toBe(50);
    expect(result.formatted).toBe('+50 (+50.0%)');
  });

  it('handles negative delta', () => {
    const result = computeTooltipDelta(80, 100, 'both');
    expect(result.absolute).toBe(-20);
    expect(result.percentage).toBe(-20);
    expect(result.formatted).toBe('-20 (-20.0%)');
  });

  it('handles zero delta', () => {
    const result = computeTooltipDelta(100, 100, 'both');
    expect(result.absolute).toBe(0);
    expect(result.percentage).toBe(0);
    expect(result.formatted).toBe('0 (0.0%)');
  });

  it('handles division by zero — percentage is null, absolute is kept', () => {
    const result = computeTooltipDelta(50, 0, 'percentage');
    expect(result.percentage).toBeNull();
    expect(result.formatted).toBe('N/A');
  });

  it('handles division by zero in both mode — percentage is null', () => {
    const result = computeTooltipDelta(50, 0, 'both');
    expect(result.absolute).toBe(50);
    expect(result.percentage).toBeNull();
    expect(result.formatted).toBe('+50 (N/A)');
  });
});
