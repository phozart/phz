import { describe, it, expect } from 'vitest';
import {
  formatTooltipContent,
  computeTooltipPosition,
  type TooltipData,
  type TooltipPosition,
} from '../tooltip.js';

describe('Tooltip content formatting', () => {
  it('formats basic label + value', () => {
    const data: TooltipData = { label: 'Sales', value: 1500 };
    const result = formatTooltipContent(data);
    expect(result).toBe('Sales: 1,500');
  });

  it('formats with percentage', () => {
    const data: TooltipData = { label: 'North', value: 250, percentage: 45.3 };
    const result = formatTooltipContent(data);
    expect(result).toBe('North: 250 (45.3%)');
  });

  it('formats with custom unit', () => {
    const data: TooltipData = { label: 'Revenue', value: 50000, unit: 'currency' };
    const result = formatTooltipContent(data);
    expect(result).toBe('Revenue: $50,000');
  });

  it('formats percent unit', () => {
    const data: TooltipData = { label: 'Attendance', value: 92.5, unit: 'percent' };
    const result = formatTooltipContent(data);
    expect(result).toBe('Attendance: 92.5%');
  });

  it('handles zero value', () => {
    const data: TooltipData = { label: 'Empty', value: 0 };
    const result = formatTooltipContent(data);
    expect(result).toBe('Empty: 0');
  });

  it('formats with secondary value', () => {
    const data: TooltipData = { label: 'KPI', value: 92, secondaryLabel: 'Target', secondaryValue: 95 };
    const result = formatTooltipContent(data);
    expect(result).toContain('KPI: 92');
    expect(result).toContain('Target: 95');
  });
});

describe('Tooltip positioning', () => {
  const viewportWidth = 800;
  const viewportHeight = 600;
  const tooltipWidth = 150;
  const tooltipHeight = 40;

  it('positions tooltip above the target by default', () => {
    const pos = computeTooltipPosition(
      { x: 400, y: 300 },
      { tooltipWidth, tooltipHeight, viewportWidth, viewportHeight },
    );
    expect(pos.top).toBeLessThan(300);
    expect(pos.left).toBeGreaterThanOrEqual(0);
  });

  it('flips below when near top edge', () => {
    const pos = computeTooltipPosition(
      { x: 400, y: 20 },
      { tooltipWidth, tooltipHeight, viewportWidth, viewportHeight },
    );
    // When target is near top, tooltip should appear below
    expect(pos.top).toBeGreaterThan(20);
  });

  it('avoids overflow on right edge', () => {
    const pos = computeTooltipPosition(
      { x: 780, y: 300 },
      { tooltipWidth, tooltipHeight, viewportWidth, viewportHeight },
    );
    expect(pos.left + tooltipWidth).toBeLessThanOrEqual(viewportWidth);
  });

  it('avoids overflow on left edge', () => {
    const pos = computeTooltipPosition(
      { x: 10, y: 300 },
      { tooltipWidth, tooltipHeight, viewportWidth, viewportHeight },
    );
    expect(pos.left).toBeGreaterThanOrEqual(0);
  });

  it('centers tooltip horizontally on target', () => {
    const pos = computeTooltipPosition(
      { x: 400, y: 300 },
      { tooltipWidth, tooltipHeight, viewportWidth, viewportHeight },
    );
    // Center = x - tooltipWidth/2, so left should be around 325
    expect(pos.left).toBeCloseTo(400 - tooltipWidth / 2, 0);
  });
});
