/**
 * S.3 — Container Query Widget Adaptations tests
 */

import { describe, it, expect } from 'vitest';

describe('Container Queries (S.3)', () => {
  describe('getKPICardClass()', () => {
    it('returns "kpi--full" for width > 280', async () => {
      const { getKPICardClass } = await import('../styles/container-queries.js');
      expect(getKPICardClass(300)).toBe('kpi--full');
    });

    it('returns "kpi--compact" for width 200-280', async () => {
      const { getKPICardClass } = await import('../styles/container-queries.js');
      expect(getKPICardClass(240)).toBe('kpi--compact');
      expect(getKPICardClass(200)).toBe('kpi--compact');
    });

    it('returns "kpi--minimal" for width < 200', async () => {
      const { getKPICardClass } = await import('../styles/container-queries.js');
      expect(getKPICardClass(199)).toBe('kpi--minimal');
      expect(getKPICardClass(100)).toBe('kpi--minimal');
    });
  });

  describe('getChartClass()', () => {
    it('returns "chart--full" for width > 400', async () => {
      const { getChartClass } = await import('../styles/container-queries.js');
      expect(getChartClass(500)).toBe('chart--full');
    });

    it('returns "chart--no-legend" for width 280-400', async () => {
      const { getChartClass } = await import('../styles/container-queries.js');
      expect(getChartClass(350)).toBe('chart--no-legend');
      expect(getChartClass(280)).toBe('chart--no-legend');
    });

    it('returns "chart--no-labels" for width 160-279', async () => {
      const { getChartClass } = await import('../styles/container-queries.js');
      expect(getChartClass(200)).toBe('chart--no-labels');
      expect(getChartClass(160)).toBe('chart--no-labels');
    });

    it('returns "chart--single-value" for width < 160', async () => {
      const { getChartClass } = await import('../styles/container-queries.js');
      expect(getChartClass(159)).toBe('chart--single-value');
    });
  });

  describe('getTableClass()', () => {
    it('returns "table--all" for width > 600', async () => {
      const { getTableClass } = await import('../styles/container-queries.js');
      expect(getTableClass(700)).toBe('table--all');
    });

    it('returns "table--hide-low" for width 400-600', async () => {
      const { getTableClass } = await import('../styles/container-queries.js');
      expect(getTableClass(500)).toBe('table--hide-low');
      expect(getTableClass(400)).toBe('table--hide-low');
    });

    it('returns "table--hide-medium" for width 300-399', async () => {
      const { getTableClass } = await import('../styles/container-queries.js');
      expect(getTableClass(350)).toBe('table--hide-medium');
      expect(getTableClass(300)).toBe('table--hide-medium');
    });

    it('returns "table--card" for width < 300', async () => {
      const { getTableClass } = await import('../styles/container-queries.js');
      expect(getTableClass(299)).toBe('table--card');
    });
  });

  describe('getFilterBarClass()', () => {
    it('returns "filter-bar--row" for width > 600', async () => {
      const { getFilterBarClass } = await import('../styles/container-queries.js');
      expect(getFilterBarClass(700)).toBe('filter-bar--row');
    });

    it('returns "filter-bar--two-col" for width 400-600', async () => {
      const { getFilterBarClass } = await import('../styles/container-queries.js');
      expect(getFilterBarClass(500)).toBe('filter-bar--two-col');
      expect(getFilterBarClass(400)).toBe('filter-bar--two-col');
    });

    it('returns "filter-bar--vertical" for width < 400', async () => {
      const { getFilterBarClass } = await import('../styles/container-queries.js');
      expect(getFilterBarClass(399)).toBe('filter-bar--vertical');
    });
  });

  describe('getVisibleColumns()', () => {
    it('returns all columns above 600px', async () => {
      const { getVisibleColumns } = await import('../styles/container-queries.js');
      const cols = [
        { name: 'id', priority: 'high' as const },
        { name: 'status', priority: 'medium' as const },
        { name: 'notes', priority: 'low' as const },
      ];
      expect(getVisibleColumns(cols, 700)).toEqual(['id', 'status', 'notes']);
    });

    it('hides low-priority columns at 400-600px', async () => {
      const { getVisibleColumns } = await import('../styles/container-queries.js');
      const cols = [
        { name: 'id', priority: 'high' as const },
        { name: 'status', priority: 'medium' as const },
        { name: 'notes', priority: 'low' as const },
      ];
      expect(getVisibleColumns(cols, 500)).toEqual(['id', 'status']);
    });

    it('hides medium+low columns at 300-399px', async () => {
      const { getVisibleColumns } = await import('../styles/container-queries.js');
      const cols = [
        { name: 'id', priority: 'high' as const },
        { name: 'status', priority: 'medium' as const },
        { name: 'notes', priority: 'low' as const },
      ];
      expect(getVisibleColumns(cols, 350)).toEqual(['id']);
    });
  });
});
