/**
 * @phozart/widgets -- KPI Scorecard Pure Logic Tests
 *
 * Tests for the classifiedScores, breakdownLabels, statusSummary, and toggleExpand
 * methods on PhzKPIScorecard.
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
vi.mock('@phozart/engine', () => ({
  classifyKPIScore: (score: any, kpi: any) => ({
    kpiId: score.kpiId,
    value: score.value,
    status: {
      level: score.value >= kpi.thresholds.target ? 'ok' : score.value >= (kpi.thresholds.warning ?? 0) ? 'warn' : 'crit',
      color: score.value >= kpi.thresholds.target ? '#16A34A' : '#DC2626',
      label: 'test',
    },
    breakdowns: score.breakdowns ?? [],
  }),
  STATUS_COLORS: { ok: '#16A34A', warn: '#D97706', crit: '#DC2626', unknown: '#A8A29E' },
}));

import { PhzKPIScorecard } from '../components/phz-kpi-scorecard.js';

function makeScorecard(overrides: Partial<PhzKPIScorecard> = {}): PhzKPIScorecard {
  const sc = new PhzKPIScorecard();
  Object.assign(sc, overrides);
  return sc;
}

const KPI_DEFS = [
  {
    id: 'kpi-1',
    name: 'Revenue',
    unit: 'currency',
    thresholds: { target: 100, warning: 80, critical: 50 },
    breakdowns: [
      { id: 'region-east', label: 'East' },
      { id: 'region-west', label: 'West' },
    ],
  },
  {
    id: 'kpi-2',
    name: 'Growth Rate',
    unit: 'percent',
    thresholds: { target: 10, warning: 5, critical: 0 },
    breakdowns: [
      { id: 'region-east', label: 'East' },
    ],
  },
] as any;

const SCORES = [
  { kpiId: 'kpi-1', value: 120, previousValue: 110 },
  { kpiId: 'kpi-2', value: 3, previousValue: 8 },
] as any;

describe('PhzKPIScorecard — classifiedScores', () => {
  it('returns Map of classified scores', () => {
    const sc = makeScorecard({
      kpiDefinitions: KPI_DEFS,
      scores: SCORES,
    });
    const classified = (sc as any).classifiedScores;
    expect(classified).toBeInstanceOf(Map);
    expect(classified.size).toBe(2);
  });

  it('classifies scores matching their KPI definition', () => {
    const sc = makeScorecard({
      kpiDefinitions: KPI_DEFS,
      scores: SCORES,
    });
    const classified = (sc as any).classifiedScores;
    const revenue = classified.get('kpi-1');
    expect(revenue).toBeDefined();
    expect(revenue.value).toBe(120);
    expect(revenue.status.level).toBe('ok'); // 120 >= target 100
  });

  it('classifies below-target score as crit', () => {
    const sc = makeScorecard({
      kpiDefinitions: KPI_DEFS,
      scores: SCORES,
    });
    const classified = (sc as any).classifiedScores;
    const growth = classified.get('kpi-2');
    expect(growth.status.level).toBe('crit'); // 3 < warning 5
  });

  it('skips scores without matching KPI definition', () => {
    const sc = makeScorecard({
      kpiDefinitions: KPI_DEFS,
      scores: [{ kpiId: 'unknown', value: 50 }] as any,
    });
    const classified = (sc as any).classifiedScores;
    expect(classified.size).toBe(0);
  });

  it('returns empty map when no scores', () => {
    const sc = makeScorecard({
      kpiDefinitions: KPI_DEFS,
      scores: [],
    });
    const classified = (sc as any).classifiedScores;
    expect(classified.size).toBe(0);
  });
});

describe('PhzKPIScorecard — breakdownLabels', () => {
  it('returns unique breakdown labels', () => {
    const sc = makeScorecard({ kpiDefinitions: KPI_DEFS });
    const labels = (sc as any).breakdownLabels;
    expect(labels).toContain('East');
    expect(labels).toContain('West');
    expect(labels).toHaveLength(2); // 'East' appears twice but should be unique
  });

  it('returns empty array when no breakdowns', () => {
    const kpis = [{ id: 'k1', name: 'Test', thresholds: { target: 1 } }] as any;
    const sc = makeScorecard({ kpiDefinitions: kpis });
    const labels = (sc as any).breakdownLabels;
    expect(labels).toEqual([]);
  });
});

describe('PhzKPIScorecard — statusSummary', () => {
  it('counts ok and crit statuses', () => {
    const sc = makeScorecard({
      kpiDefinitions: KPI_DEFS,
      scores: SCORES,
    });
    const summary = (sc as any).statusSummary;
    expect(summary.ok).toBe(1);   // kpi-1 is ok
    expect(summary.crit).toBe(1); // kpi-2 is crit
    expect(summary.warn).toBe(0);
    expect(summary.unknown).toBe(0);
  });
});

describe('PhzKPIScorecard — toggleExpand', () => {
  it('adds kpi to expanded set', () => {
    const sc = makeScorecard();
    (sc as any).expandedKPIs = new Set();
    (sc as any).toggleExpand('kpi-1');
    expect((sc as any).expandedKPIs.has('kpi-1')).toBe(true);
  });

  it('removes kpi from expanded set when toggled again', () => {
    const sc = makeScorecard();
    (sc as any).expandedKPIs = new Set(['kpi-1']);
    (sc as any).toggleExpand('kpi-1');
    expect((sc as any).expandedKPIs.has('kpi-1')).toBe(false);
  });
});

describe('PhzKPIScorecard — default properties', () => {
  it('has correct defaults', () => {
    const sc = new PhzKPIScorecard();
    expect(sc.kpiDefinitions).toEqual([]);
    expect(sc.scores).toEqual([]);
    expect(sc.expandable).toBe(false);
    expect(sc.loading).toBe(false);
    expect(sc.error).toBeNull();
  });
});
