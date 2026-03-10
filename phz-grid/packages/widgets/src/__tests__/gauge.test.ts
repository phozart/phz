import { describe, it, expect } from 'vitest';
import {
  valueToAngle,
  detectThresholdZone,
  describeArc,
  needleEndpoint,
} from '../components/phz-gauge.js';
import type { GaugeThreshold } from '../components/phz-gauge.js';

describe('Gauge — Angle computation', () => {
  const startAngle = -225;
  const endAngle = 45;

  it('computes angle for minimum value', () => {
    expect(valueToAngle(0, 0, 100, startAngle, endAngle)).toBe(-225);
  });

  it('computes angle for maximum value', () => {
    expect(valueToAngle(100, 0, 100, startAngle, endAngle)).toBe(45);
  });

  it('computes angle for midpoint', () => {
    expect(valueToAngle(50, 0, 100, startAngle, endAngle)).toBe(-90);
  });

  it('clamps value below min', () => {
    expect(valueToAngle(-10, 0, 100, startAngle, endAngle)).toBe(-225);
  });

  it('clamps value above max', () => {
    expect(valueToAngle(150, 0, 100, startAngle, endAngle)).toBe(45);
  });

  it('handles semicircle (180 degrees)', () => {
    expect(valueToAngle(50, 0, 100, -180, 0)).toBe(-90);
  });
});

describe('Gauge — Threshold zone detection', () => {
  const thresholds: GaugeThreshold[] = [
    { value: 0, color: '#16A34A', label: 'Good' },
    { value: 60, color: '#D97706', label: 'Warning' },
    { value: 80, color: '#DC2626', label: 'Critical' },
  ];

  it('detects first zone', () => {
    expect(detectThresholdZone(30, thresholds, 0)).toEqual({ color: '#16A34A', label: 'Good' });
  });

  it('detects second zone', () => {
    expect(detectThresholdZone(65, thresholds, 0)).toEqual({ color: '#D97706', label: 'Warning' });
  });

  it('detects third zone', () => {
    expect(detectThresholdZone(90, thresholds, 0)).toEqual({ color: '#DC2626', label: 'Critical' });
  });

  it('detects zone at exact boundary', () => {
    expect(detectThresholdZone(60, thresholds, 0)).toEqual({ color: '#D97706', label: 'Warning' });
  });

  it('falls back to first zone for value below all thresholds', () => {
    const highThresholds: GaugeThreshold[] = [
      { value: 50, color: '#D97706', label: 'Warning' },
    ];
    expect(detectThresholdZone(10, highThresholds, 0)).toEqual({ color: '#D97706', label: 'Warning' });
  });

  it('returns default when no thresholds', () => {
    expect(detectThresholdZone(50, [], 0)).toEqual({ color: '#A8A29E', label: 'Unknown' });
  });
});

describe('Gauge — Arc path generation', () => {
  it('generates valid SVG arc path', () => {
    const path = describeArc(100, 100, 80, -180, 0);
    expect(path).toContain('M');
    expect(path).toContain('A');
    expect(path).toContain('80 80');
  });

  it('uses large arc flag for arcs > 180 degrees', () => {
    const path = describeArc(100, 100, 80, -225, 45);
    expect(path).toContain('1 1');
  });

  it('does not use large arc flag for arcs <= 180 degrees', () => {
    const path = describeArc(100, 100, 80, -180, 0);
    expect(path).toContain('0 1');
  });
});

describe('Gauge — Needle endpoint', () => {
  it('computes needle endpoint at 0 degrees (right)', () => {
    const end = needleEndpoint(100, 100, 70, 0);
    expect(end.x).toBeCloseTo(170, 5);
    expect(end.y).toBeCloseTo(100, 5);
  });

  it('computes needle endpoint at -90 degrees (top)', () => {
    const end = needleEndpoint(100, 100, 70, -90);
    expect(end.x).toBeCloseTo(100, 5);
    expect(end.y).toBeCloseTo(30, 5);
  });

  it('computes needle endpoint at -180 degrees (left)', () => {
    const end = needleEndpoint(100, 100, 70, -180);
    expect(end.x).toBeCloseTo(30, 5);
    expect(end.y).toBeCloseTo(100, 5);
  });
});
