import { describe, it, expect } from 'vitest';
import { computeStatus } from '@phozart/phz-engine';
import { kpiId } from '@phozart/phz-engine';
import type { KPIDefinition } from '@phozart/phz-engine';

describe('Status Table logic', () => {
  const kpi: KPIDefinition = {
    id: kpiId('attendance'),
    name: 'Attendance',
    target: 95,
    unit: 'percent',
    direction: 'higher_is_better',
    thresholds: { ok: 90, warn: 75 },
    deltaComparison: 'previous_period',
    dimensions: [],
    dataSource: { scoreEndpoint: '/api' },
  };

  it('counts critical alerts per entity row', () => {
    const rows = [
      { entity: 'School A', attendance: 92 },
      { entity: 'School B', attendance: 60 },
    ];

    const getAlerts = (row: Record<string, unknown>) => {
      const val = row.attendance as number;
      return computeStatus(val, kpi).level === 'crit' ? 1 : 0;
    };

    expect(getAlerts(rows[0])).toBe(0);
    expect(getAlerts(rows[1])).toBe(1);
  });
});
