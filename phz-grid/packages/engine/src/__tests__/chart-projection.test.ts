import { describe, it, expect } from 'vitest';
import { projectChartData, projectAggregatedChartData, projectPieData } from '../chart-projection.js';
import type { ChartConfig } from '@phozart/core';

const timeSeriesData = [
  { month: 'Jan', sales: 100, costs: 80 },
  { month: 'Feb', sales: 150, costs: 90 },
  { month: 'Mar', sales: 200, costs: 100 },
];

const categoryData = [
  { region: 'North', sales: 100 },
  { region: 'North', sales: 150 },
  { region: 'South', sales: 200 },
  { region: 'South', sales: 250 },
  { region: 'East', sales: 180 },
];

describe('projectChartData', () => {
  it('projects time series data', () => {
    const config: ChartConfig = {
      id: 'c1',
      type: 'line',
      options: {
        xAxis: { field: 'month' },
        series: [{ field: 'sales', label: 'Sales' }],
      },
    };
    const result = projectChartData(timeSeriesData, config);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('Sales');
    expect(result[0].data).toHaveLength(3);
    expect(result[0].data[0]).toEqual({ x: 'Jan', y: 100 });
  });

  it('projects multiple series', () => {
    const config: ChartConfig = {
      id: 'c1',
      type: 'line',
      options: {
        xAxis: { field: 'month' },
        series: [
          { field: 'sales', label: 'Sales' },
          { field: 'costs', label: 'Costs' },
        ],
      },
    };
    const result = projectChartData(timeSeriesData, config);
    expect(result).toHaveLength(2);
    expect(result[1].label).toBe('Costs');
  });

  it('returns empty for empty rows', () => {
    const config: ChartConfig = {
      id: 'c1',
      type: 'line',
      options: {
        xAxis: { field: 'month' },
        series: [{ field: 'sales' }],
      },
    };
    expect(projectChartData([], config)).toHaveLength(0);
  });

  it('returns empty when no x-axis configured', () => {
    const config: ChartConfig = {
      id: 'c1',
      type: 'line',
      options: { series: [{ field: 'sales' }] },
    };
    expect(projectChartData(timeSeriesData, config)).toHaveLength(0);
  });
});

describe('projectAggregatedChartData', () => {
  it('aggregates by group field', () => {
    const config: ChartConfig = {
      id: 'c1',
      type: 'bar',
      options: {
        series: [{ field: 'sales', label: 'Total Sales' }],
      },
    };
    const result = projectAggregatedChartData(categoryData, config, 'region');
    expect(result).toHaveLength(1);
    expect(result[0].data).toHaveLength(3); // East, North, South (sorted)

    const northPoint = result[0].data.find(d => d.x === 'North');
    expect(northPoint?.y).toBe(250); // 100 + 150
  });
});

describe('projectPieData', () => {
  it('projects pie slices with percentages', () => {
    const result = projectPieData(categoryData, 'region', 'sales');
    expect(result).toHaveLength(3);

    // Sorted by value descending
    expect(result[0].category).toBe('South');
    expect(result[0].value).toBe(450);

    // Percentages should sum to ~100
    const totalPct = result.reduce((sum, s) => sum + s.percentage, 0);
    expect(totalPct).toBeCloseTo(100);
  });

  it('returns empty for empty rows', () => {
    expect(projectPieData([], 'region', 'sales')).toHaveLength(0);
  });
});
