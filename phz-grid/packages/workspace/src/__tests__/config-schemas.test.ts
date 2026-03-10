import { describe, it, expect } from 'vitest';
import {
  validateChartConfig,
  validateKPIConfig,
  validateTableConfig,
  ChartConfigDefaults,
  KPIConfigDefaults,
  TableConfigDefaults,
} from '../registry/config-schemas.js';

describe('Config Schemas', () => {
  describe('validateChartConfig', () => {
    it('returns valid for a correct chart config', () => {
      const result = validateChartConfig({
        ...ChartConfigDefaults,
        valueField: 'revenue',
        categoryField: 'region',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('returns errors for missing required fields', () => {
      const result = validateChartConfig({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('valueField'))).toBe(true);
      expect(result.errors.some(e => e.includes('categoryField'))).toBe(true);
    });

    it('returns errors for wrong types', () => {
      const result = validateChartConfig({
        valueField: 123,
        categoryField: 'region',
        showLegend: 'yes',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('valueField'))).toBe(true);
    });

    it('accepts optional fields', () => {
      const result = validateChartConfig({
        valueField: 'revenue',
        categoryField: 'region',
        showLegend: true,
        showDataLabels: true,
        colorPalette: ['#ff0000', '#00ff00'],
        stacked: true,
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('validateKPIConfig', () => {
    it('returns valid for a correct KPI config', () => {
      const result = validateKPIConfig({
        ...KPIConfigDefaults,
        metricField: 'revenue',
      });
      expect(result.valid).toBe(true);
    });

    it('returns errors for missing metricField', () => {
      const result = validateKPIConfig({});
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('metricField'))).toBe(true);
    });

    it('accepts optional trend and comparison fields', () => {
      const result = validateKPIConfig({
        metricField: 'revenue',
        trendField: 'date',
        comparisonField: 'prev_revenue',
        showTrend: true,
        showComparison: true,
        format: 'currency',
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('validateTableConfig', () => {
    it('returns valid for a correct table config', () => {
      const result = validateTableConfig({
        ...TableConfigDefaults,
        columns: ['name', 'revenue', 'region'],
      });
      expect(result.valid).toBe(true);
    });

    it('returns errors for missing columns', () => {
      const result = validateTableConfig({});
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('columns'))).toBe(true);
    });

    it('returns errors when columns is not an array', () => {
      const result = validateTableConfig({ columns: 'name' });
      expect(result.valid).toBe(false);
    });

    it('accepts optional settings', () => {
      const result = validateTableConfig({
        columns: ['name'],
        sortable: true,
        filterable: true,
        pageSize: 25,
        showRowNumbers: true,
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('defaults', () => {
    it('ChartConfigDefaults has expected shape', () => {
      expect(ChartConfigDefaults.showLegend).toBe(true);
      expect(ChartConfigDefaults.showDataLabels).toBe(false);
    });

    it('KPIConfigDefaults has expected shape', () => {
      expect(KPIConfigDefaults.showTrend).toBe(true);
      expect(KPIConfigDefaults.format).toBe('number');
    });

    it('TableConfigDefaults has expected shape', () => {
      expect(TableConfigDefaults.sortable).toBe(true);
      expect(TableConfigDefaults.pageSize).toBe(50);
    });
  });
});
