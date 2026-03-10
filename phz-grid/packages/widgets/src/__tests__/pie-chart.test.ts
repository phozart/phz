import { describe, it, expect } from 'vitest';

/**
 * Pie Chart — pure logic tests (no DOM).
 * We extract the geometry helpers as pure functions so they can be tested standalone.
 */

// --- Arc path math (will be exported from the component) ---

/** Convert polar coords to cartesian for SVG arc commands. */
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** Build an SVG arc path for a pie slice. */
function describeArc(
  cx: number, cy: number, r: number,
  startAngle: number, endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

/** Build a donut arc (annular sector) — no line to center. */
function describeDonutArc(
  cx: number, cy: number,
  outerR: number, innerR: number,
  startAngle: number, endAngle: number,
): string {
  const outerStart = polarToCartesian(cx, cy, outerR, endAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, startAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${innerEnd.x} ${innerEnd.y}`,
    'Z',
  ].join(' ');
}

/** Compute slice percentages from raw values. */
function computeSlices(data: { label: string; value: number; color?: string }[]) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return [];
  let currentAngle = 0;
  return data.map((d) => {
    const percentage = (d.value / total) * 100;
    const sliceAngle = (d.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;
    return {
      label: d.label,
      value: d.value,
      percentage: Math.round(percentage * 100) / 100,
      startAngle,
      endAngle,
      color: d.color,
    };
  });
}

const DEFAULT_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

function assignColors(
  slices: { label: string; color?: string }[],
  palette: string[] = DEFAULT_COLORS,
): string[] {
  return slices.map((s, i) => s.color ?? palette[i % palette.length]);
}


// ============ TESTS ============

describe('Pie Chart — polarToCartesian', () => {
  it('computes top of circle at 0 degrees', () => {
    const p = polarToCartesian(100, 100, 80, 0);
    expect(p.x).toBeCloseTo(100);
    expect(p.y).toBeCloseTo(20);
  });

  it('computes right at 90 degrees', () => {
    const p = polarToCartesian(100, 100, 80, 90);
    expect(p.x).toBeCloseTo(180);
    expect(p.y).toBeCloseTo(100);
  });

  it('computes bottom at 180 degrees', () => {
    const p = polarToCartesian(100, 100, 80, 180);
    expect(p.x).toBeCloseTo(100);
    expect(p.y).toBeCloseTo(180);
  });

  it('computes left at 270 degrees', () => {
    const p = polarToCartesian(100, 100, 80, 270);
    expect(p.x).toBeCloseTo(20);
    expect(p.y).toBeCloseTo(100);
  });
});

describe('Pie Chart — computeSlices', () => {
  it('computes equal percentages for equal values', () => {
    const slices = computeSlices([
      { label: 'A', value: 25 },
      { label: 'B', value: 25 },
      { label: 'C', value: 25 },
      { label: 'D', value: 25 },
    ]);
    expect(slices).toHaveLength(4);
    for (const s of slices) {
      expect(s.percentage).toBe(25);
    }
    expect(slices[0].startAngle).toBe(0);
    expect(slices[0].endAngle).toBe(90);
    expect(slices[3].endAngle).toBe(360);
  });

  it('handles unequal values', () => {
    const slices = computeSlices([
      { label: 'Big', value: 75 },
      { label: 'Small', value: 25 },
    ]);
    expect(slices[0].percentage).toBe(75);
    expect(slices[1].percentage).toBe(25);
    expect(slices[0].endAngle).toBe(270);
    expect(slices[1].endAngle).toBe(360);
  });

  it('returns empty for all-zero values', () => {
    const slices = computeSlices([
      { label: 'A', value: 0 },
      { label: 'B', value: 0 },
    ]);
    expect(slices).toEqual([]);
  });

  it('returns empty for empty data', () => {
    expect(computeSlices([])).toEqual([]);
  });

  it('handles single slice (full circle)', () => {
    const slices = computeSlices([{ label: 'Only', value: 100 }]);
    expect(slices).toHaveLength(1);
    expect(slices[0].percentage).toBe(100);
    expect(slices[0].startAngle).toBe(0);
    expect(slices[0].endAngle).toBe(360);
  });

  it('preserves user-provided color', () => {
    const slices = computeSlices([
      { label: 'Custom', value: 50, color: '#FF0000' },
      { label: 'Default', value: 50 },
    ]);
    expect(slices[0].color).toBe('#FF0000');
    expect(slices[1].color).toBeUndefined();
  });
});

describe('Pie Chart — describeArc', () => {
  it('produces valid SVG path for a quarter circle', () => {
    const path = describeArc(100, 100, 80, 0, 90);
    expect(path).toContain('M 100 100'); // starts at center
    expect(path).toContain('A 80 80');   // arc with correct radius
    expect(path).toContain('Z');          // closed path
    expect(path).toContain('0 0 0');      // small arc flag
  });

  it('uses large arc flag for > 180 degrees', () => {
    const path = describeArc(100, 100, 80, 0, 270);
    expect(path).toContain('1 0'); // large arc flag = 1
  });
});

describe('Pie Chart — describeDonutArc', () => {
  it('produces path with two arcs (outer and inner)', () => {
    const path = describeDonutArc(100, 100, 80, 50, 0, 90);
    // Should have two 'A' commands
    const arcCount = (path.match(/A /g) || []).length;
    expect(arcCount).toBe(2);
    expect(path).toContain('A 80 80'); // outer arc
    expect(path).toContain('A 50 50'); // inner arc
    expect(path).toContain('Z');
  });

  it('does not include line to center (no M cx cy)', () => {
    const path = describeDonutArc(100, 100, 80, 50, 0, 90);
    expect(path).not.toContain('M 100 100');
  });
});

describe('Pie Chart — assignColors', () => {
  it('uses custom colors from data when provided', () => {
    const colors = assignColors([
      { label: 'A', color: '#FF0000' },
      { label: 'B' },
    ]);
    expect(colors[0]).toBe('#FF0000');
    expect(colors[1]).toBe(DEFAULT_COLORS[1]);
  });

  it('cycles through palette for more slices than colors', () => {
    const slices = Array.from({ length: 12 }, (_, i) => ({ label: `S${i}` }));
    const colors = assignColors(slices);
    expect(colors[10]).toBe(DEFAULT_COLORS[0]); // wraps around
    expect(colors[11]).toBe(DEFAULT_COLORS[1]);
  });

  it('uses provided palette', () => {
    const custom = ['#AAA', '#BBB'];
    const colors = assignColors(
      [{ label: 'A' }, { label: 'B' }, { label: 'C' }],
      custom,
    );
    expect(colors).toEqual(['#AAA', '#BBB', '#AAA']);
  });
});
