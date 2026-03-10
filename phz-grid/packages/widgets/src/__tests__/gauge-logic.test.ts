/**
 * @phozart/phz-widgets — Gauge Pure Logic Tests
 */
import { describe, it, expect } from 'vitest';
import {
  valueToAngle,
  detectThresholdZone,
  describeArc,
  needleEndpoint,
  type GaugeThreshold,
} from '../components/phz-gauge.js';

describe('valueToAngle', () => {
  it('maps min value to start angle', () => {
    expect(valueToAngle(0, 0, 100)).toBe(-225);
  });

  it('maps max value to end angle', () => {
    expect(valueToAngle(100, 0, 100)).toBe(45);
  });

  it('maps midpoint to middle angle', () => {
    const angle = valueToAngle(50, 0, 100);
    expect(angle).toBeCloseTo(-90, 0);
  });

  it('clamps below-min values to start angle', () => {
    expect(valueToAngle(-10, 0, 100)).toBe(-225);
  });

  it('clamps above-max values to end angle', () => {
    expect(valueToAngle(150, 0, 100)).toBe(45);
  });

  it('handles zero range (min === max)', () => {
    // range=0 → uses fallback of 1
    const angle = valueToAngle(50, 50, 50);
    expect(Number.isFinite(angle)).toBe(true);
  });

  it('accepts custom start/end angles', () => {
    const angle = valueToAngle(50, 0, 100, 0, 180);
    expect(angle).toBe(90);
  });
});

describe('detectThresholdZone', () => {
  const thresholds: GaugeThreshold[] = [
    { value: 0, color: '#EF4444', label: 'Low' },
    { value: 50, color: '#F59E0B', label: 'Medium' },
    { value: 80, color: '#22C55E', label: 'High' },
  ];

  it('returns correct zone for high value', () => {
    const zone = detectThresholdZone(90, thresholds, 0);
    expect(zone.color).toBe('#22C55E');
    expect(zone.label).toBe('High');
  });

  it('returns correct zone for medium value', () => {
    const zone = detectThresholdZone(60, thresholds, 0);
    expect(zone.color).toBe('#F59E0B');
    expect(zone.label).toBe('Medium');
  });

  it('returns correct zone for low value', () => {
    const zone = detectThresholdZone(30, thresholds, 0);
    expect(zone.color).toBe('#EF4444');
    expect(zone.label).toBe('Low');
  });

  it('returns first zone for value below all thresholds', () => {
    const zone = detectThresholdZone(-10, thresholds, 0);
    expect(zone.color).toBe('#EF4444');
  });

  it('returns fallback for empty thresholds', () => {
    const zone = detectThresholdZone(50, [], 0);
    expect(zone.label).toBe('Unknown');
    expect(zone.color).toBe('#A8A29E');
  });
});

describe('describeArc', () => {
  it('returns valid SVG arc path', () => {
    const path = describeArc(100, 100, 80, -225, 45);
    expect(path).toContain('M');
    expect(path).toContain('A');
    expect(path).toContain('80 80 0');
  });
});

describe('needleEndpoint', () => {
  it('computes endpoint from center, length, and angle', () => {
    const { x, y } = needleEndpoint(100, 100, 70, 0);
    // At angle 0 (right), x should be cx + length, y should be cy
    expect(x).toBeCloseTo(170, 1);
    expect(y).toBeCloseTo(100, 1);
  });

  it('computes correct endpoint at 90 degrees', () => {
    const { x, y } = needleEndpoint(100, 100, 70, 90);
    expect(x).toBeCloseTo(100, 1);
    expect(y).toBeCloseTo(170, 1);
  });
});
