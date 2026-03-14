import { describe, it, expect } from 'vitest';
import type { KPIDefinition, KPIScoreResponse } from '@phozart/engine';
import { kpiId, classifyKPIScore } from '@phozart/engine';

function makeKPIs(): KPIDefinition[] {
  return [
    {
      id: kpiId('attendance'),
      name: 'Attendance',
      target: 95,
      unit: 'percent',
      direction: 'higher_is_better',
      thresholds: { ok: 90, warn: 75 },
      deltaComparison: 'previous_period',
      dimensions: [],
      breakdowns: [
        { id: 'north', label: 'North' },
        { id: 'south', label: 'South' },
      ],
      dataSource: { scoreEndpoint: '/api/kpi/attendance' },
    },
    {
      id: kpiId('quality'),
      name: 'Quality',
      target: 98,
      unit: 'percent',
      direction: 'higher_is_better',
      thresholds: { ok: 95, warn: 85 },
      deltaComparison: 'previous_period',
      dimensions: [],
      breakdowns: [
        { id: 'north', label: 'North' },
        { id: 'south', label: 'South' },
      ],
      dataSource: { scoreEndpoint: '/api/kpi/quality' },
    },
  ];
}

describe('KPI Scorecard logic', () => {
  it('classifies multiple KPIs with breakdowns', () => {
    const kpis = makeKPIs();
    const scores: KPIScoreResponse[] = [
      { kpiId: kpiId('attendance'), value: 92, breakdowns: [
        { breakdownId: 'north', value: 95 },
        { breakdownId: 'south', value: 88 },
      ]},
      { kpiId: kpiId('quality'), value: 97, breakdowns: [
        { breakdownId: 'north', value: 99 },
        { breakdownId: 'south', value: 94 },
      ]},
    ];

    const classifiedMap = new Map();
    for (const score of scores) {
      const kpi = kpis.find(k => k.id === score.kpiId)!;
      classifiedMap.set(score.kpiId, classifyKPIScore(score, kpi));
    }

    const attendance = classifiedMap.get(kpiId('attendance'));
    expect(attendance.status.level).toBe('ok'); // 92 >= 90
    expect(attendance.breakdowns[0].status.level).toBe('ok'); // 95 >= 90
    expect(attendance.breakdowns[1].status.level).toBe('warn'); // 88 >= 75 but < 90

    const quality = classifiedMap.get(kpiId('quality'));
    expect(quality.status.level).toBe('ok'); // 97 >= 95
    expect(quality.breakdowns[1].status.level).toBe('warn'); // 94 >= 85 but < 95
  });

  it('computes status summary counts', () => {
    const kpis = makeKPIs();
    const scores: KPIScoreResponse[] = [
      { kpiId: kpiId('attendance'), value: 92 },
      { kpiId: kpiId('quality'), value: 80 },
    ];

    const counts = { ok: 0, warn: 0, crit: 0, unknown: 0 };
    for (const score of scores) {
      const kpi = kpis.find(k => k.id === score.kpiId)!;
      const classified = classifyKPIScore(score, kpi);
      counts[classified.status.level as keyof typeof counts]++;
    }

    expect(counts.ok).toBe(1); // attendance 92 >= 90
    expect(counts.crit).toBe(1); // quality 80: 80 < 85 → crit
  });
});
