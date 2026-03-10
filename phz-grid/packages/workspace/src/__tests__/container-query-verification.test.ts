/**
 * X.1 — Container Query Verification
 *
 * Exercises every widget container-query helper at critical breakpoints
 * (160, 280, 400, 600 px) plus boundary edges. Also verifies column
 * priority filtering via getVisibleColumns().
 */

import { describe, it, expect } from 'vitest';
import {
  getKPICardClass,
  getChartClass,
  getTableClass,
  getFilterBarClass,
  getVisibleColumns,
  type PriorityColumn,
} from '../styles/container-queries.js';

// ========================================================================
// KPI Card Breakpoints
// ========================================================================

describe('X.1 — KPI Card container queries', () => {
  it('returns kpi--minimal below 200px', () => {
    expect(getKPICardClass(160)).toBe('kpi--minimal');
    expect(getKPICardClass(100)).toBe('kpi--minimal');
    expect(getKPICardClass(199)).toBe('kpi--minimal');
  });

  it('returns kpi--compact at 200-280px', () => {
    expect(getKPICardClass(200)).toBe('kpi--compact');
    expect(getKPICardClass(250)).toBe('kpi--compact');
    expect(getKPICardClass(280)).toBe('kpi--compact');
  });

  it('returns kpi--full above 280px', () => {
    expect(getKPICardClass(281)).toBe('kpi--full');
    expect(getKPICardClass(400)).toBe('kpi--full');
    expect(getKPICardClass(600)).toBe('kpi--full');
  });
});

// ========================================================================
// Chart Breakpoints
// ========================================================================

describe('X.1 — Chart container queries', () => {
  it('returns chart--single-value below 160px', () => {
    expect(getChartClass(100)).toBe('chart--single-value');
    expect(getChartClass(159)).toBe('chart--single-value');
  });

  it('returns chart--no-labels at 160-279px', () => {
    expect(getChartClass(160)).toBe('chart--no-labels');
    expect(getChartClass(200)).toBe('chart--no-labels');
    expect(getChartClass(279)).toBe('chart--no-labels');
  });

  it('returns chart--no-legend at 280-400px', () => {
    expect(getChartClass(280)).toBe('chart--no-legend');
    expect(getChartClass(350)).toBe('chart--no-legend');
    expect(getChartClass(400)).toBe('chart--no-legend');
  });

  it('returns chart--full above 400px', () => {
    expect(getChartClass(401)).toBe('chart--full');
    expect(getChartClass(600)).toBe('chart--full');
    expect(getChartClass(1200)).toBe('chart--full');
  });
});

// ========================================================================
// Table Breakpoints
// ========================================================================

describe('X.1 — Table container queries', () => {
  it('returns table--card below 300px', () => {
    expect(getTableClass(160)).toBe('table--card');
    expect(getTableClass(299)).toBe('table--card');
  });

  it('returns table--hide-medium at 300-399px', () => {
    expect(getTableClass(300)).toBe('table--hide-medium');
    expect(getTableClass(350)).toBe('table--hide-medium');
    expect(getTableClass(399)).toBe('table--hide-medium');
  });

  it('returns table--hide-low at 400-600px', () => {
    expect(getTableClass(400)).toBe('table--hide-low');
    expect(getTableClass(500)).toBe('table--hide-low');
    expect(getTableClass(600)).toBe('table--hide-low');
  });

  it('returns table--all above 600px', () => {
    expect(getTableClass(601)).toBe('table--all');
    expect(getTableClass(1000)).toBe('table--all');
  });
});

// ========================================================================
// Filter Bar Breakpoints
// ========================================================================

describe('X.1 — Filter bar container queries', () => {
  it('returns filter-bar--vertical below 400px', () => {
    expect(getFilterBarClass(160)).toBe('filter-bar--vertical');
    expect(getFilterBarClass(280)).toBe('filter-bar--vertical');
    expect(getFilterBarClass(399)).toBe('filter-bar--vertical');
  });

  it('returns filter-bar--two-col at 400-600px', () => {
    expect(getFilterBarClass(400)).toBe('filter-bar--two-col');
    expect(getFilterBarClass(500)).toBe('filter-bar--two-col');
    expect(getFilterBarClass(600)).toBe('filter-bar--two-col');
  });

  it('returns filter-bar--row above 600px', () => {
    expect(getFilterBarClass(601)).toBe('filter-bar--row');
    expect(getFilterBarClass(1200)).toBe('filter-bar--row');
  });
});

// ========================================================================
// Column Priority Visibility
// ========================================================================

describe('X.1 — Column visibility by priority', () => {
  const columns: PriorityColumn[] = [
    { name: 'id', priority: 'high' },
    { name: 'name', priority: 'high' },
    { name: 'email', priority: 'medium' },
    { name: 'department', priority: 'medium' },
    { name: 'notes', priority: 'low' },
    { name: 'created', priority: 'low' },
  ];

  it('shows all columns above 600px', () => {
    const visible = getVisibleColumns(columns, 601);
    expect(visible).toEqual(['id', 'name', 'email', 'department', 'notes', 'created']);
  });

  it('hides low-priority columns at 400-600px', () => {
    const visible = getVisibleColumns(columns, 400);
    expect(visible).toEqual(['id', 'name', 'email', 'department']);
    expect(visible).not.toContain('notes');
    expect(visible).not.toContain('created');
  });

  it('shows only high-priority columns below 400px', () => {
    const visible = getVisibleColumns(columns, 300);
    expect(visible).toEqual(['id', 'name']);
  });

  it('preserves column order', () => {
    const reversed: PriorityColumn[] = [...columns].reverse();
    const visible = getVisibleColumns(reversed, 601);
    expect(visible).toEqual(['created', 'notes', 'department', 'email', 'name', 'id']);
  });

  it('handles empty column list', () => {
    expect(getVisibleColumns([], 600)).toEqual([]);
    expect(getVisibleColumns([], 300)).toEqual([]);
  });
});

// ========================================================================
// Cross-breakpoint Consistency
// ========================================================================

describe('X.1 — Cross-widget breakpoint consistency', () => {
  const WIDTHS = [100, 160, 200, 280, 300, 400, 500, 600, 800, 1200];

  it('every helper returns a non-empty string at every width', () => {
    for (const w of WIDTHS) {
      expect(getKPICardClass(w)).toBeTruthy();
      expect(getChartClass(w)).toBeTruthy();
      expect(getTableClass(w)).toBeTruthy();
      expect(getFilterBarClass(w)).toBeTruthy();
    }
  });

  it('wider widths never produce more restrictive classes than narrower widths', () => {
    // KPI ranking: minimal < compact < full
    const kpiRank: Record<string, number> = { 'kpi--minimal': 0, 'kpi--compact': 1, 'kpi--full': 2 };
    for (let i = 1; i < WIDTHS.length; i++) {
      const prev = kpiRank[getKPICardClass(WIDTHS[i - 1])];
      const curr = kpiRank[getKPICardClass(WIDTHS[i])];
      expect(curr).toBeGreaterThanOrEqual(prev);
    }

    // Chart ranking: single-value < no-labels < no-legend < full
    const chartRank: Record<string, number> = {
      'chart--single-value': 0, 'chart--no-labels': 1, 'chart--no-legend': 2, 'chart--full': 3,
    };
    for (let i = 1; i < WIDTHS.length; i++) {
      const prev = chartRank[getChartClass(WIDTHS[i - 1])];
      const curr = chartRank[getChartClass(WIDTHS[i])];
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });
});
