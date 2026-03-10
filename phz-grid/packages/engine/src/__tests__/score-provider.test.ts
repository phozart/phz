import { describe, it, expect } from 'vitest';
import { createDefaultScoreProvider } from '../score-provider.js';
import { kpiId } from '../types.js';
import type { KPIDefinition } from '../kpi.js';

const attendanceKPI: KPIDefinition = {
  id: kpiId('attendance'),
  name: 'Attendance',
  target: 95,
  unit: 'percent',
  direction: 'higher_is_better',
  thresholds: { ok: 90, warn: 80 },
  deltaComparison: 'previous_period',
  dimensions: ['region'],
  breakdownDimensions: ['region'],
  breakdowns: [
    { id: 'north', label: 'North' },
    { id: 'south', label: 'South' },
    { id: 'east', label: 'East' },
  ],
  dataSource: { scoreEndpoint: '/api/kpi/attendance' },
};

const simpleKPI: KPIDefinition = {
  id: kpiId('quality'),
  name: 'Quality',
  target: 90,
  unit: 'percent',
  direction: 'higher_is_better',
  thresholds: { ok: 85, warn: 75 },
  deltaComparison: 'previous_period',
  dimensions: [],
  dataSource: { scoreEndpoint: '/api/kpi/quality' },
};

const testData = [
  { name: 'Alice', attendance: 95, quality: 88, region: 'North' },
  { name: 'Bob', attendance: 85, quality: 92, region: 'South' },
  { name: 'Carol', attendance: 90, quality: 80, region: 'North' },
  { name: 'Dave', attendance: 92, quality: 85, region: 'East' },
];

describe('createDefaultScoreProvider', () => {
  const provider = createDefaultScoreProvider();

  it('computes average value across all rows', () => {
    const result = provider(kpiId('attendance'), testData, attendanceKPI);
    expect(result.value).toBeCloseTo(90.5); // (95+85+90+92)/4
  });

  it('computes previousValue as 95% of current', () => {
    const result = provider(kpiId('attendance'), testData, attendanceKPI);
    expect(result.previousValue).toBeCloseTo(90.5 * 0.95);
  });

  it('generates 12-point trend data', () => {
    const result = provider(kpiId('attendance'), testData, attendanceKPI);
    expect(result.trendData).toHaveLength(12);
    // Last point should approximate the current value
    const last = result.trendData![11];
    expect(last).toBeCloseTo(result.value, 0);
  });

  it('computes regional breakdowns when KPI has breakdownDimensions', () => {
    const result = provider(kpiId('attendance'), testData, attendanceKPI);
    expect(result.breakdowns).toBeDefined();
    expect(result.breakdowns).toHaveLength(3);

    const north = result.breakdowns!.find(b => b.breakdownId === 'north');
    expect(north).toBeDefined();
    expect(north!.value).toBeCloseTo(92.5); // (95+90)/2

    const south = result.breakdowns!.find(b => b.breakdownId === 'south');
    expect(south!.value).toBeCloseTo(85); // single row

    const east = result.breakdowns!.find(b => b.breakdownId === 'east');
    expect(east!.value).toBeCloseTo(92); // single row
  });

  it('returns no breakdowns for KPI without breakdown config', () => {
    const result = provider(kpiId('quality'), testData, simpleKPI);
    expect(result.breakdowns).toBeUndefined();
  });

  it('handles empty data', () => {
    const result = provider(kpiId('attendance'), [], attendanceKPI);
    expect(result.value).toBe(0);
    expect(result.trendData).toHaveLength(12);
  });
});

describe('createDefaultScoreProvider — with historical data', () => {
  it('computes previousValue from real previous-period data', () => {
    const provider = createDefaultScoreProvider({
      previousPeriodData: [
        { attendance: 88, region: 'North' },
        { attendance: 82, region: 'South' },
        { attendance: 86, region: 'North' },
        { attendance: 90, region: 'East' },
      ],
    });
    const result = provider(kpiId('attendance'), testData, attendanceKPI);
    expect(result.value).toBeCloseTo(90.5); // current data average
    expect(result.previousValue).toBeCloseTo(86.5); // (88+82+86+90)/4, real previous data
  });

  it('computes trend from real data points', () => {
    const trendPeriods = [
      [{ attendance: 80 }, { attendance: 82 }],
      [{ attendance: 84 }, { attendance: 86 }],
      [{ attendance: 88 }, { attendance: 90 }],
    ];
    const provider = createDefaultScoreProvider({ trendPeriods });
    const result = provider(kpiId('attendance'), testData, attendanceKPI);
    expect(result.trendData).toHaveLength(3);
    expect(result.trendData![0]).toBeCloseTo(81); // avg of [80,82]
    expect(result.trendData![1]).toBeCloseTo(85); // avg of [84,86]
    expect(result.trendData![2]).toBeCloseTo(89); // avg of [88,90]
  });

  it('computes real breakdown previousValues when previous data provided', () => {
    const provider = createDefaultScoreProvider({
      previousPeriodData: [
        { attendance: 88, region: 'North' },
        { attendance: 82, region: 'South' },
        { attendance: 86, region: 'North' },
        { attendance: 90, region: 'East' },
      ],
    });
    const result = provider(kpiId('attendance'), testData, attendanceKPI);
    expect(result.breakdowns).toBeDefined();
    const north = result.breakdowns!.find(b => b.breakdownId === 'north');
    expect(north!.previousValue).toBeCloseTo(87); // (88+86)/2
  });

  it('marks result as estimated when no historical data available', () => {
    const provider = createDefaultScoreProvider();
    const result = provider(kpiId('attendance'), testData, attendanceKPI);
    // Without historical data, previousValue should be flagged as estimated
    expect(result.estimated).toBe(true);
  });

  it('marks result as not estimated when real data provided', () => {
    const provider = createDefaultScoreProvider({
      previousPeriodData: [{ attendance: 85 }],
    });
    const result = provider(kpiId('attendance'), testData, attendanceKPI);
    expect(result.estimated).toBe(false);
  });
});
