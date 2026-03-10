/**
 * @phozart/phz-engine — Window Functions Tests (TDD: RED phase)
 */
import { describe, it, expect } from 'vitest';
import {
  runningSum,
  runningAvg,
  movingAverage,
  movingSum,
  rank,
  percentRank,
  lag,
  lead,
  rowNumber,
} from '../window-functions.js';

// --- Test Data ---

const sales = [
  { id: 1, region: 'east', amount: 100, date: '2025-01' },
  { id: 2, region: 'west', amount: 200, date: '2025-02' },
  { id: 3, region: 'east', amount: 150, date: '2025-03' },
  { id: 4, region: 'west', amount: 300, date: '2025-04' },
  { id: 5, region: 'east', amount: 120, date: '2025-05' },
];

const withNulls = [
  { id: 1, amount: 10 },
  { id: 2, amount: null },
  { id: 3, amount: 30 },
  { id: 4, amount: null },
  { id: 5, amount: 50 },
];

describe('runningSum', () => {
  it('computes cumulative sum', () => {
    const result = runningSum(sales, 'amount');
    expect(result.map(r => r._runningSum)).toEqual([100, 300, 450, 750, 870]);
  });

  it('handles ordering by a field', () => {
    const shuffled = [sales[2], sales[0], sales[4], sales[1], sales[3]];
    const result = runningSum(shuffled, 'amount', 'date');
    expect(result.map(r => r._runningSum)).toEqual([100, 300, 450, 750, 870]);
  });

  it('supports partitionBy', () => {
    const result = runningSum(sales, 'amount', undefined, 'region');
    const east = result.filter(r => r.region === 'east');
    const west = result.filter(r => r.region === 'west');
    expect(east.map(r => r._runningSum)).toEqual([100, 250, 370]);
    expect(west.map(r => r._runningSum)).toEqual([200, 500]);
  });

  it('returns empty array for empty input', () => {
    expect(runningSum([], 'amount')).toEqual([]);
  });

  it('skips nulls in computation', () => {
    const result = runningSum(withNulls, 'amount');
    expect(result.map(r => r._runningSum)).toEqual([10, 10, 40, 40, 90]);
  });
});

describe('runningAvg', () => {
  it('computes cumulative average', () => {
    const result = runningAvg(sales, 'amount');
    expect(result.map(r => r._runningAvg)).toEqual([100, 150, 150, 187.5, 174]);
  });

  it('supports partitionBy', () => {
    const result = runningAvg(sales, 'amount', undefined, 'region');
    const east = result.filter(r => r.region === 'east');
    expect(east.map(r => r._runningAvg)[0]).toBeCloseTo(100);
    expect(east.map(r => r._runningAvg)[1]).toBeCloseTo(125);
    expect(east.map(r => r._runningAvg)[2]).toBeCloseTo(370 / 3);
  });

  it('returns empty array for empty input', () => {
    expect(runningAvg([], 'amount')).toEqual([]);
  });
});

describe('movingAverage', () => {
  it('computes sliding window average', () => {
    const result = movingAverage(sales, 'amount', 3);
    const avgs = result.map(r => r._movingAvg);
    // Window of 3: first two have fewer elements
    expect(avgs[0]).toBeCloseTo(100);        // [100]
    expect(avgs[1]).toBeCloseTo(150);        // [100, 200]
    expect(avgs[2]).toBeCloseTo(150);        // [100, 200, 150]
    expect(avgs[3]).toBeCloseTo(216.667, 1); // [200, 150, 300]
    expect(avgs[4]).toBeCloseTo(190);        // [150, 300, 120]
  });

  it('supports partitionBy', () => {
    const result = movingAverage(sales, 'amount', 2, undefined, 'region');
    const east = result.filter(r => r.region === 'east');
    expect(east.map(r => r._movingAvg)[0]).toBeCloseTo(100);
    expect(east.map(r => r._movingAvg)[1]).toBeCloseTo(125);
    expect(east.map(r => r._movingAvg)[2]).toBeCloseTo(135);
  });

  it('returns empty array for empty input', () => {
    expect(movingAverage([], 'amount', 3)).toEqual([]);
  });

  it('handles windowSize larger than data', () => {
    const result = movingAverage(sales, 'amount', 100);
    // Each row uses all available data up to that point
    expect(result.map(r => r._movingAvg)[0]).toBeCloseTo(100);
  });
});

describe('movingSum', () => {
  it('computes sliding window sum', () => {
    const result = movingSum(sales, 'amount', 3);
    const sums = result.map(r => r._movingSum);
    expect(sums[0]).toBe(100);    // [100]
    expect(sums[1]).toBe(300);    // [100, 200]
    expect(sums[2]).toBe(450);    // [100, 200, 150]
    expect(sums[3]).toBe(650);    // [200, 150, 300]
    expect(sums[4]).toBe(570);    // [150, 300, 120]
  });

  it('returns empty array for empty input', () => {
    expect(movingSum([], 'amount', 3)).toEqual([]);
  });
});

describe('rank', () => {
  it('computes dense rank (descending by default)', () => {
    const data = [
      { name: 'a', score: 100 },
      { name: 'b', score: 200 },
      { name: 'c', score: 200 },
      { name: 'd', score: 50 },
    ];
    const result = rank(data, 'score');
    expect(result.map(r => r._rank)).toEqual([2, 1, 1, 3]);
  });

  it('computes dense rank ascending', () => {
    const data = [
      { name: 'a', score: 100 },
      { name: 'b', score: 200 },
      { name: 'c', score: 50 },
    ];
    const result = rank(data, 'score', 'asc');
    expect(result.map(r => r._rank)).toEqual([2, 3, 1]);
  });

  it('supports partitionBy', () => {
    const data = [
      { region: 'east', name: 'a', score: 100 },
      { region: 'east', name: 'b', score: 200 },
      { region: 'west', name: 'c', score: 50 },
      { region: 'west', name: 'd', score: 150 },
    ];
    const result = rank(data, 'score', 'desc', 'region');
    const east = result.filter(r => r.region === 'east');
    const west = result.filter(r => r.region === 'west');
    expect(east.map(r => r._rank)).toEqual([2, 1]);
    expect(west.map(r => r._rank)).toEqual([2, 1]);
  });

  it('returns empty array for empty input', () => {
    expect(rank([], 'score')).toEqual([]);
  });
});

describe('percentRank', () => {
  it('computes percentile rank (0-1)', () => {
    const data = [
      { name: 'a', score: 10 },
      { name: 'b', score: 20 },
      { name: 'c', score: 30 },
      { name: 'd', score: 40 },
    ];
    const result = percentRank(data, 'score');
    expect(result.map(r => r._percentRank)[0]).toBeCloseTo(0);
    expect(result.map(r => r._percentRank)[3]).toBeCloseTo(1);
  });

  it('handles ties', () => {
    const data = [
      { score: 10 },
      { score: 10 },
      { score: 20 },
    ];
    const result = percentRank(data, 'score');
    expect(result[0]._percentRank).toBe(result[1]._percentRank);
  });

  it('returns empty array for empty input', () => {
    expect(percentRank([], 'score')).toEqual([]);
  });

  it('handles single element (rank = 0)', () => {
    const result = percentRank([{ score: 10 }], 'score');
    expect(result[0]._percentRank).toBe(0);
  });
});

describe('lag', () => {
  it('returns previous row value (offset=1)', () => {
    const result = lag(sales, 'amount');
    expect(result.map(r => r._lag)).toEqual([undefined, 100, 200, 150, 300]);
  });

  it('supports custom offset', () => {
    const result = lag(sales, 'amount', 2);
    expect(result.map(r => r._lag)).toEqual([undefined, undefined, 100, 200, 150]);
  });

  it('supports default value', () => {
    const result = lag(sales, 'amount', 1, 0);
    expect(result.map(r => r._lag)).toEqual([0, 100, 200, 150, 300]);
  });

  it('supports partitionBy', () => {
    const result = lag(sales, 'amount', 1, undefined, 'region');
    const east = result.filter(r => r.region === 'east');
    expect(east.map(r => r._lag)).toEqual([undefined, 100, 150]);
  });

  it('returns empty array for empty input', () => {
    expect(lag([], 'amount')).toEqual([]);
  });
});

describe('lead', () => {
  it('returns next row value (offset=1)', () => {
    const result = lead(sales, 'amount');
    expect(result.map(r => r._lead)).toEqual([200, 150, 300, 120, undefined]);
  });

  it('supports custom offset', () => {
    const result = lead(sales, 'amount', 2);
    expect(result.map(r => r._lead)).toEqual([150, 300, 120, undefined, undefined]);
  });

  it('supports default value', () => {
    const result = lead(sales, 'amount', 1, 0);
    expect(result.map(r => r._lead)).toEqual([200, 150, 300, 120, 0]);
  });

  it('supports partitionBy', () => {
    const result = lead(sales, 'amount', 1, undefined, 'region');
    const west = result.filter(r => r.region === 'west');
    expect(west.map(r => r._lead)).toEqual([300, undefined]);
  });

  it('returns empty array for empty input', () => {
    expect(lead([], 'amount')).toEqual([]);
  });
});

describe('rowNumber', () => {
  it('assigns sequential row numbers', () => {
    const result = rowNumber(sales);
    expect(result.map(r => r._rowNumber)).toEqual([1, 2, 3, 4, 5]);
  });

  it('respects orderField', () => {
    const shuffled = [sales[2], sales[0], sales[4], sales[1], sales[3]];
    const result = rowNumber(shuffled, 'date');
    expect(result.map(r => r._rowNumber)).toEqual([1, 2, 3, 4, 5]);
    // Sorted by date, so first should be 2025-01
    expect(result[0].date).toBe('2025-01');
  });

  it('supports partitionBy', () => {
    const result = rowNumber(sales, undefined, 'region');
    const east = result.filter(r => r.region === 'east');
    const west = result.filter(r => r.region === 'west');
    expect(east.map(r => r._rowNumber)).toEqual([1, 2, 3]);
    expect(west.map(r => r._rowNumber)).toEqual([1, 2]);
  });

  it('returns empty array for empty input', () => {
    expect(rowNumber([])).toEqual([]);
  });
});
