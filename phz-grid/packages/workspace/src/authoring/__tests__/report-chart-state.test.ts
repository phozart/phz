import { describe, it, expect } from 'vitest';
import {
  type ReportChartState,
  type ChartEncoding,
  type ReportChartType,
  initialReportChartState,
  setPreviewMode,
  overrideChartType,
  getEffectiveChartType,
  setEncoding,
  removeEncoding,
  autoMapColumnsToEncoding,
  getChartTypeAvailability,
} from '../report-chart-state.js';
import type { FieldMetadata } from '@phozart/shared';

function makeField(name: string, dataType: FieldMetadata['dataType'], hint?: FieldMetadata['semanticHint']): FieldMetadata {
  return { name, dataType, nullable: false, semanticHint: hint };
}

describe('ReportChartState', () => {
  describe('initialReportChartState', () => {
    it('defaults to table preview mode', () => {
      const s = initialReportChartState();
      expect(s.previewMode).toBe('table');
    });

    it('defaults chartType to bar-chart', () => {
      const s = initialReportChartState();
      expect(s.chartType).toBe('bar-chart');
    });

    it('has no chartOverride initially', () => {
      const s = initialReportChartState();
      expect(s.chartOverride).toBeUndefined();
    });

    it('has empty encoding values', () => {
      const s = initialReportChartState();
      expect(s.encoding.value).toEqual([]);
      expect(s.encoding.tooltip).toEqual([]);
      expect(s.encoding.category).toBeUndefined();
    });
  });

  describe('setPreviewMode', () => {
    it('switches from table to chart', () => {
      const s = setPreviewMode(initialReportChartState(), 'chart');
      expect(s.previewMode).toBe('chart');
    });

    it('switches from chart to table', () => {
      const s = setPreviewMode(initialReportChartState(), 'chart');
      const s2 = setPreviewMode(s, 'table');
      expect(s2.previewMode).toBe('table');
    });

    it('returns new reference', () => {
      const s = initialReportChartState();
      const s2 = setPreviewMode(s, 'chart');
      expect(s2).not.toBe(s);
    });
  });

  describe('overrideChartType', () => {
    it('sets chartOverride', () => {
      const s = overrideChartType(initialReportChartState(), 'pie');
      expect(s.chartOverride).toBe('pie');
    });

    it('clears chartOverride with undefined', () => {
      const s = overrideChartType(initialReportChartState(), 'pie');
      const s2 = overrideChartType(s, undefined);
      expect(s2.chartOverride).toBeUndefined();
    });
  });

  describe('getEffectiveChartType', () => {
    it('returns override when set', () => {
      const s = overrideChartType(initialReportChartState(), 'line');
      expect(getEffectiveChartType(s)).toBe('line');
    });

    it('returns auto-suggested chartType when no override', () => {
      const s: ReportChartState = { ...initialReportChartState(), chartType: 'area' };
      expect(getEffectiveChartType(s)).toBe('area');
    });

    it('falls back to bar-chart for default state', () => {
      expect(getEffectiveChartType(initialReportChartState())).toBe('bar-chart');
    });
  });

  describe('setEncoding', () => {
    it('sets category channel', () => {
      const s = setEncoding(initialReportChartState(), 'category', 'region');
      expect(s.encoding.category).toBe('region');
    });

    it('appends to value channel', () => {
      let s = setEncoding(initialReportChartState(), 'value', 'revenue');
      s = setEncoding(s, 'value', 'profit');
      expect(s.encoding.value).toEqual(['revenue', 'profit']);
    });

    it('does not duplicate value channel entries', () => {
      let s = setEncoding(initialReportChartState(), 'value', 'revenue');
      s = setEncoding(s, 'value', 'revenue');
      expect(s.encoding.value).toEqual(['revenue']);
    });

    it('sets color channel', () => {
      const s = setEncoding(initialReportChartState(), 'color', 'category');
      expect(s.encoding.color).toBe('category');
    });

    it('sets size channel', () => {
      const s = setEncoding(initialReportChartState(), 'size', 'amount');
      expect(s.encoding.size).toBe('amount');
    });

    it('sets detail channel', () => {
      const s = setEncoding(initialReportChartState(), 'detail', 'item');
      expect(s.encoding.detail).toBe('item');
    });

    it('appends to tooltip channel', () => {
      let s = setEncoding(initialReportChartState(), 'tooltip', 'name');
      s = setEncoding(s, 'tooltip', 'desc');
      expect(s.encoding.tooltip).toEqual(['name', 'desc']);
    });

    it('does not duplicate tooltip channel entries', () => {
      let s = setEncoding(initialReportChartState(), 'tooltip', 'name');
      s = setEncoding(s, 'tooltip', 'name');
      expect(s.encoding.tooltip).toEqual(['name']);
    });
  });

  describe('removeEncoding', () => {
    it('clears category', () => {
      const s = setEncoding(initialReportChartState(), 'category', 'region');
      const s2 = removeEncoding(s, 'category', 'region');
      expect(s2.encoding.category).toBeUndefined();
    });

    it('removes a specific value', () => {
      let s = setEncoding(initialReportChartState(), 'value', 'revenue');
      s = setEncoding(s, 'value', 'profit');
      s = removeEncoding(s, 'value', 'revenue');
      expect(s.encoding.value).toEqual(['profit']);
    });

    it('clears color', () => {
      const s = setEncoding(initialReportChartState(), 'color', 'cat');
      const s2 = removeEncoding(s, 'color', 'cat');
      expect(s2.encoding.color).toBeUndefined();
    });

    it('removes a specific tooltip', () => {
      let s = setEncoding(initialReportChartState(), 'tooltip', 'a');
      s = setEncoding(s, 'tooltip', 'b');
      s = removeEncoding(s, 'tooltip', 'a');
      expect(s.encoding.tooltip).toEqual(['b']);
    });

    it('does nothing if field not present', () => {
      const s = initialReportChartState();
      const s2 = removeEncoding(s, 'value', 'nonexistent');
      expect(s2.encoding.value).toEqual([]);
    });
  });

  describe('autoMapColumnsToEncoding', () => {
    it('maps first dimension to category, measures to values', () => {
      const fields: FieldMetadata[] = [
        makeField('region', 'string', 'dimension'),
        makeField('revenue', 'number', 'measure'),
        makeField('profit', 'number', 'measure'),
      ];
      const s = autoMapColumnsToEncoding(initialReportChartState(), fields);
      expect(s.encoding.category).toBe('region');
      expect(s.encoding.value).toEqual(['revenue', 'profit']);
    });

    it('puts second dimension into color channel', () => {
      const fields: FieldMetadata[] = [
        makeField('region', 'string', 'dimension'),
        makeField('category', 'string', 'category'),
        makeField('revenue', 'number', 'measure'),
      ];
      const s = autoMapColumnsToEncoding(initialReportChartState(), fields);
      expect(s.encoding.category).toBe('region');
      expect(s.encoding.color).toBe('category');
    });

    it('puts third+ dimensions into detail channel', () => {
      const fields: FieldMetadata[] = [
        makeField('region', 'string', 'dimension'),
        makeField('category', 'string', 'category'),
        makeField('subcategory', 'string', 'dimension'),
        makeField('revenue', 'number', 'measure'),
      ];
      const s = autoMapColumnsToEncoding(initialReportChartState(), fields);
      expect(s.encoding.detail).toBe('subcategory');
    });

    it('handles no dimensions — leaves category undefined', () => {
      const fields: FieldMetadata[] = [
        makeField('revenue', 'number', 'measure'),
      ];
      const s = autoMapColumnsToEncoding(initialReportChartState(), fields);
      expect(s.encoding.category).toBeUndefined();
      expect(s.encoding.value).toEqual(['revenue']);
    });

    it('handles no measures — leaves value empty', () => {
      const fields: FieldMetadata[] = [
        makeField('region', 'string', 'dimension'),
      ];
      const s = autoMapColumnsToEncoding(initialReportChartState(), fields);
      expect(s.encoding.category).toBe('region');
      expect(s.encoding.value).toEqual([]);
    });

    it('handles empty fields array', () => {
      const s = autoMapColumnsToEncoding(initialReportChartState(), []);
      expect(s.encoding.category).toBeUndefined();
      expect(s.encoding.value).toEqual([]);
    });

    it('uses heuristic for fields without semantic hints (number → measure, string → dimension)', () => {
      const fields: FieldMetadata[] = [
        makeField('name', 'string'),
        makeField('amount', 'number'),
      ];
      const s = autoMapColumnsToEncoding(initialReportChartState(), fields);
      expect(s.encoding.category).toBe('name');
      expect(s.encoding.value).toEqual(['amount']);
    });

    it('classifies date fields as dimensions (time → category)', () => {
      const fields: FieldMetadata[] = [
        makeField('order_date', 'date', 'timestamp'),
        makeField('total', 'number', 'measure'),
      ];
      const s = autoMapColumnsToEncoding(initialReportChartState(), fields);
      expect(s.encoding.category).toBe('order_date');
      expect(s.encoding.value).toEqual(['total']);
    });
  });

  describe('getChartTypeAvailability', () => {
    it('returns all chart types', () => {
      const avail = getChartTypeAvailability(initialReportChartState().encoding);
      const types: ReportChartType[] = ['bar-chart', 'line', 'area', 'pie', 'scatter', 'gauge', 'kpi-card', 'trend-line'];
      for (const t of types) {
        expect(avail).toHaveProperty(t);
      }
    });

    it('disables pie when no category', () => {
      const encoding: ChartEncoding = { value: ['revenue'], tooltip: [] };
      const avail = getChartTypeAvailability(encoding);
      expect(avail.pie).toBe(false);
    });

    it('enables bar-chart with category and values', () => {
      const encoding: ChartEncoding = { category: 'region', value: ['revenue'], tooltip: [] };
      const avail = getChartTypeAvailability(encoding);
      expect(avail['bar-chart']).toBe(true);
    });

    it('disables bar-chart with no values', () => {
      const encoding: ChartEncoding = { category: 'region', value: [], tooltip: [] };
      const avail = getChartTypeAvailability(encoding);
      expect(avail['bar-chart']).toBe(false);
    });

    it('enables kpi-card with value but no category', () => {
      const encoding: ChartEncoding = { value: ['revenue'], tooltip: [] };
      const avail = getChartTypeAvailability(encoding);
      expect(avail['kpi-card']).toBe(true);
    });

    it('enables gauge with a single value', () => {
      const encoding: ChartEncoding = { value: ['score'], tooltip: [] };
      const avail = getChartTypeAvailability(encoding);
      expect(avail.gauge).toBe(true);
    });

    it('enables scatter with category and value', () => {
      const encoding: ChartEncoding = { category: 'x', value: ['y'], tooltip: [] };
      const avail = getChartTypeAvailability(encoding);
      expect(avail.scatter).toBe(true);
    });

    it('disables all value-dependent types when no values exist', () => {
      const encoding: ChartEncoding = { category: 'region', value: [], tooltip: [] };
      const avail = getChartTypeAvailability(encoding);
      expect(avail['bar-chart']).toBe(false);
      expect(avail.line).toBe(false);
      expect(avail.area).toBe(false);
      expect(avail.scatter).toBe(false);
      expect(avail.gauge).toBe(false);
      expect(avail['kpi-card']).toBe(false);
      expect(avail['trend-line']).toBe(false);
    });
  });

  describe('immutability', () => {
    it('setPreviewMode does not mutate original', () => {
      const s = initialReportChartState();
      setPreviewMode(s, 'chart');
      expect(s.previewMode).toBe('table');
    });

    it('setEncoding does not mutate original', () => {
      const s = initialReportChartState();
      setEncoding(s, 'value', 'revenue');
      expect(s.encoding.value).toEqual([]);
    });

    it('removeEncoding does not mutate original', () => {
      const s = setEncoding(initialReportChartState(), 'value', 'revenue');
      removeEncoding(s, 'value', 'revenue');
      expect(s.encoding.value).toEqual(['revenue']);
    });
  });
});
