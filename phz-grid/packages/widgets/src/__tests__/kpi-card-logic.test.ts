/**
 * @phozart/widgets -- KPI Card Pure Logic Tests
 *
 * Tests for the internal logic methods of PhzKPICard:
 * - formatValue
 * - valueTooltip
 * - status and delta getters
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('lit', () => ({
  LitElement: class {},
  html: () => '',
  css: () => '',
  nothing: Symbol('nothing'),
}));
vi.mock('lit/decorators.js', () => ({
  customElement: () => (c: any) => c,
  property: () => () => {},
  state: () => () => {},
}));

import { PhzKPICard } from '../components/phz-kpi-card.js';

function makeCard(overrides: Partial<PhzKPICard> = {}): PhzKPICard {
  const card = new PhzKPICard();
  Object.assign(card, overrides);
  return card;
}

describe('PhzKPICard — formatValue', () => {
  it('returns plain string when no kpiDefinition', () => {
    const card = makeCard({ value: 42 });
    const result = (card as any).formatValue(42);
    expect(result).toBe('42');
  });

  it('formats percent unit', () => {
    const card = makeCard({
      kpiDefinition: { id: 'kpi-1', name: 'Test', unit: 'percent', thresholds: { target: 90, warning: 80, critical: 70 } } as any,
    });
    const result = (card as any).formatValue(92.567);
    expect(result).toBe('92.6%');
  });

  it('formats currency unit', () => {
    const card = makeCard({
      kpiDefinition: { id: 'kpi-1', name: 'Revenue', unit: 'currency', thresholds: { target: 1000, warning: 800, critical: 500 } } as any,
    });
    const result = (card as any).formatValue(50000);
    expect(result).toContain('$');
    expect(result).toContain('50');
  });

  it('formats duration unit', () => {
    const card = makeCard({
      kpiDefinition: { id: 'kpi-1', name: 'Time', unit: 'duration', thresholds: { target: 8, warning: 10, critical: 12 } } as any,
    });
    const result = (card as any).formatValue(24);
    expect(result).toBe('24h');
  });

  it('formats count unit', () => {
    const card = makeCard({
      kpiDefinition: { id: 'kpi-1', name: 'Users', unit: 'count', thresholds: { target: 100, warning: 80, critical: 50 } } as any,
    });
    const result = (card as any).formatValue(1500);
    expect(result).toContain('1');
    // toLocaleString adds commas or dots depending on locale
    expect(typeof result).toBe('string');
  });

  it('uses unitLabel for custom/unknown unit', () => {
    const card = makeCard({
      kpiDefinition: { id: 'kpi-1', name: 'Score', unit: 'custom', unitLabel: 'pts', thresholds: { target: 100 } } as any,
    });
    const result = (card as any).formatValue(85);
    expect(result).toBe('85 pts');
  });

  it('returns string for unknown unit without label', () => {
    const card = makeCard({
      kpiDefinition: { id: 'kpi-1', name: 'Score', unit: 'unknown', thresholds: { target: 100 } } as any,
    });
    const result = (card as any).formatValue(85);
    expect(result).toBe('85');
  });
});

describe('PhzKPICard — status getter', () => {
  it('returns null when no kpiDefinition', () => {
    const card = makeCard({ value: 50 });
    const status = (card as any).status;
    expect(status).toBeNull();
  });
});

describe('PhzKPICard — delta getter', () => {
  it('returns null when no kpiDefinition', () => {
    const card = makeCard({ value: 100, previousValue: 80 });
    const delta = (card as any).delta;
    expect(delta).toBeNull();
  });

  it('returns null when previousValue is undefined', () => {
    const card = makeCard({
      value: 100,
      kpiDefinition: { id: 'kpi-1', name: 'Test', unit: 'percent', thresholds: { target: 90 } } as any,
    });
    const delta = (card as any).delta;
    expect(delta).toBeNull();
  });
});

describe('PhzKPICard — valueTooltip', () => {
  it('builds tooltip with KPI name and formatted value', () => {
    const card = makeCard({
      value: 92,
      kpiDefinition: { id: 'kpi-1', name: 'Compliance', unit: 'percent', thresholds: { target: 95 }, target: 95 } as any,
    });
    const tooltip = (card as any).valueTooltip;
    expect(tooltip).toContain('Compliance');
    expect(tooltip).toContain('92');
  });

  it('includes target in tooltip when available', () => {
    const card = makeCard({
      value: 80,
      kpiDefinition: { id: 'kpi-1', name: 'Score', unit: 'count', thresholds: { target: 100 }, target: 100 } as any,
    });
    const tooltip = (card as any).valueTooltip;
    expect(tooltip).toContain('Target');
  });

  it('falls back to "KPI" when no definition', () => {
    const card = makeCard({ value: 50 });
    const tooltip = (card as any).valueTooltip;
    expect(tooltip).toContain('KPI');
    expect(tooltip).toContain('50');
  });
});

describe('PhzKPICard — default properties', () => {
  it('has correct default values', () => {
    const card = new PhzKPICard();
    expect(card.value).toBe(0);
    expect(card.cardStyle).toBe('compact');
    expect(card.loading).toBe(false);
    expect(card.error).toBeNull();
  });
});
