import { describe, it, expect } from 'vitest';

/**
 * Funnel Chart — pure logic tests (no DOM).
 * Tests stage computation, conversion rates, width scaling, and accessible descriptions.
 */

// --- Types ---

interface FunnelDatum {
  stage: string;
  value: number;
  color?: string;
}

interface FunnelStage {
  stage: string;
  value: number;
  percentage: number;
  conversionRate: number | null;
  widthPercent: number;
  color: string;
}

// --- Pure functions under test ---

const FUNNEL_PALETTE = [
  '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE',
  '#2563EB', '#1D4ED8', '#1E40AF', '#1E3A8A', '#172554',
];

function computeFunnelStages(
  data: FunnelDatum[],
  palette: string[] = FUNNEL_PALETTE,
): FunnelStage[] {
  if (data.length === 0) return [];
  const maxValue = data[0].value || 1;

  return data.map((d, i) => ({
    stage: d.stage,
    value: d.value,
    percentage: Math.round((d.value / maxValue) * 10000) / 100,
    conversionRate: i === 0 ? null : data[i - 1].value > 0
      ? Math.round((d.value / data[i - 1].value) * 10000) / 100
      : 0,
    widthPercent: Math.max(5, (d.value / maxValue) * 100),
    color: d.color ?? palette[i % palette.length],
  }));
}

function computeOverallConversion(data: FunnelDatum[]): number {
  if (data.length < 2 || data[0].value === 0) return 0;
  return Math.round((data[data.length - 1].value / data[0].value) * 10000) / 100;
}

function buildFunnelAccessibleDescription(stages: FunnelStage[]): string {
  return stages.map((s, i) => {
    const conv = s.conversionRate !== null ? `, ${s.conversionRate}% from previous` : '';
    return `Stage ${i + 1} ${s.stage}: ${s.value.toLocaleString()} (${s.percentage}%)${conv}`;
  }).join('; ');
}


// ============ TESTS ============

describe('Funnel Chart — computeFunnelStages', () => {
  it('computes percentages relative to first stage', () => {
    const stages = computeFunnelStages([
      { stage: 'Visitors', value: 1000 },
      { stage: 'Leads', value: 500 },
      { stage: 'Customers', value: 100 },
    ]);
    expect(stages[0].percentage).toBe(100);
    expect(stages[1].percentage).toBe(50);
    expect(stages[2].percentage).toBe(10);
  });

  it('computes conversion rates between stages', () => {
    const stages = computeFunnelStages([
      { stage: 'Visitors', value: 1000 },
      { stage: 'Leads', value: 500 },
      { stage: 'Customers', value: 100 },
    ]);
    expect(stages[0].conversionRate).toBeNull(); // first stage has no previous
    expect(stages[1].conversionRate).toBe(50);
    expect(stages[2].conversionRate).toBe(20);
  });

  it('computes width percentages with minimum 5%', () => {
    const stages = computeFunnelStages([
      { stage: 'A', value: 10000 },
      { stage: 'B', value: 10 },
    ]);
    expect(stages[0].widthPercent).toBe(100);
    expect(stages[1].widthPercent).toBe(5); // clamped to minimum
  });

  it('uses custom colors from data', () => {
    const stages = computeFunnelStages([
      { stage: 'A', value: 100, color: '#FF0000' },
      { stage: 'B', value: 50 },
    ]);
    expect(stages[0].color).toBe('#FF0000');
    expect(stages[1].color).toBe(FUNNEL_PALETTE[1]);
  });

  it('handles empty data', () => {
    expect(computeFunnelStages([])).toEqual([]);
  });

  it('handles single stage', () => {
    const stages = computeFunnelStages([
      { stage: 'Only', value: 100 },
    ]);
    expect(stages).toHaveLength(1);
    expect(stages[0].percentage).toBe(100);
    expect(stages[0].conversionRate).toBeNull();
    expect(stages[0].widthPercent).toBe(100);
  });

  it('handles zero first value', () => {
    const stages = computeFunnelStages([
      { stage: 'A', value: 0 },
      { stage: 'B', value: 0 },
    ]);
    // maxValue fallback to 1
    expect(stages[0].percentage).toBe(0);
    expect(stages[1].conversionRate).toBe(0);
  });

  it('cycles palette for many stages', () => {
    const data = Array.from({ length: 12 }, (_, i) => ({
      stage: `S${i}`,
      value: 100 - i * 5,
    }));
    const stages = computeFunnelStages(data);
    expect(stages[10].color).toBe(FUNNEL_PALETTE[0]); // wraps around
  });
});

describe('Funnel Chart — computeOverallConversion', () => {
  it('computes first-to-last conversion rate', () => {
    const rate = computeOverallConversion([
      { stage: 'A', value: 1000 },
      { stage: 'B', value: 500 },
      { stage: 'C', value: 100 },
    ]);
    expect(rate).toBe(10);
  });

  it('returns 0 for single stage', () => {
    expect(computeOverallConversion([{ stage: 'A', value: 100 }])).toBe(0);
  });

  it('returns 0 for empty data', () => {
    expect(computeOverallConversion([])).toBe(0);
  });

  it('returns 0 when first value is zero', () => {
    expect(computeOverallConversion([
      { stage: 'A', value: 0 },
      { stage: 'B', value: 50 },
    ])).toBe(0);
  });

  it('handles 100% conversion', () => {
    expect(computeOverallConversion([
      { stage: 'A', value: 200 },
      { stage: 'B', value: 200 },
    ])).toBe(100);
  });
});

describe('Funnel Chart — buildFunnelAccessibleDescription', () => {
  it('describes all stages with percentages and conversions', () => {
    const stages = computeFunnelStages([
      { stage: 'Visitors', value: 1000 },
      { stage: 'Leads', value: 500 },
    ]);
    const desc = buildFunnelAccessibleDescription(stages);
    expect(desc).toContain('Stage 1 Visitors');
    expect(desc).toContain('100%');
    expect(desc).toContain('Stage 2 Leads');
    expect(desc).toContain('50% from previous');
  });

  it('handles empty', () => {
    expect(buildFunnelAccessibleDescription([])).toBe('');
  });
});
