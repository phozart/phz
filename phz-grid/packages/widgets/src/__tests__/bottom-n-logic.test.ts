/**
 * @phozart/phz-widgets -- Bottom-N Pure Logic Tests
 *
 * Tests for PhzBottomN rankedData getter (sorting and slicing logic).
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
vi.mock('@phozart/phz-engine', () => ({
  computeStatus: () => ({ level: 'ok', color: '#16A34A', label: 'On track' }),
  STATUS_COLORS: { ok: '#16A34A', warn: '#D97706', crit: '#DC2626', unknown: '#A8A29E' },
}));

import { PhzBottomN } from '../components/phz-bottom-n.js';

function makeBottomN(overrides: Partial<PhzBottomN> = {}): PhzBottomN {
  const b = new PhzBottomN();
  Object.assign(b, overrides);
  return b;
}

const SAMPLE_DATA = [
  { name: 'Alice', score: 90 },
  { name: 'Bob', score: 50 },
  { name: 'Charlie', score: 75 },
  { name: 'Diana', score: 30 },
  { name: 'Eve', score: 60 },
];

describe('PhzBottomN — rankedData', () => {
  it('returns bottom N items sorted ascending', () => {
    const b = makeBottomN({
      data: SAMPLE_DATA,
      metricField: 'score',
      dimensionField: 'name',
      n: 3,
      direction: 'bottom',
    });
    const ranked = (b as any).rankedData;
    expect(ranked).toHaveLength(3);
    expect(ranked[0].name).toBe('Diana');   // 30
    expect(ranked[1].name).toBe('Bob');     // 50
    expect(ranked[2].name).toBe('Eve');     // 60
  });

  it('returns top N items sorted descending', () => {
    const b = makeBottomN({
      data: SAMPLE_DATA,
      metricField: 'score',
      dimensionField: 'name',
      n: 3,
      direction: 'top',
    });
    const ranked = (b as any).rankedData;
    expect(ranked).toHaveLength(3);
    expect(ranked[0].name).toBe('Alice');   // 90
    expect(ranked[1].name).toBe('Charlie'); // 75
    expect(ranked[2].name).toBe('Eve');     // 60
  });

  it('returns all items when n exceeds data length', () => {
    const b = makeBottomN({
      data: SAMPLE_DATA,
      metricField: 'score',
      dimensionField: 'name',
      n: 20,
      direction: 'bottom',
    });
    const ranked = (b as any).rankedData;
    expect(ranked).toHaveLength(5);
  });

  it('handles missing metric values (defaults to 0)', () => {
    const data = [
      { name: 'A', score: 10 },
      { name: 'B' },           // no score
      { name: 'C', score: 5 },
    ];
    const b = makeBottomN({
      data,
      metricField: 'score',
      dimensionField: 'name',
      n: 3,
      direction: 'bottom',
    });
    const ranked = (b as any).rankedData;
    // B has no score, defaults to 0, so it should be first
    expect(ranked[0].name).toBe('B');
    expect(ranked[1].name).toBe('C');
    expect(ranked[2].name).toBe('A');
  });

  it('returns empty array when data is empty', () => {
    const b = makeBottomN({
      data: [],
      metricField: 'score',
      dimensionField: 'name',
      n: 5,
    });
    const ranked = (b as any).rankedData;
    expect(ranked).toEqual([]);
  });

  it('does not mutate original data array', () => {
    const original = [...SAMPLE_DATA];
    const b = makeBottomN({
      data: SAMPLE_DATA,
      metricField: 'score',
      dimensionField: 'name',
      n: 3,
      direction: 'bottom',
    });
    void (b as any).rankedData;
    expect(SAMPLE_DATA.map(d => d.name)).toEqual(original.map(d => d.name));
  });
});

describe('PhzBottomN — default properties', () => {
  it('has correct defaults', () => {
    const b = new PhzBottomN();
    expect(b.data).toEqual([]);
    expect(b.metricField).toBe('');
    expect(b.dimensionField).toBe('');
    expect(b.n).toBe(5);
    expect(b.direction).toBe('bottom');
    expect(b.loading).toBe(false);
    expect(b.error).toBeNull();
  });
});
