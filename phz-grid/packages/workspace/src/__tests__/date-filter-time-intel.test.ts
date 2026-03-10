import { describe, it, expect } from 'vitest';
import { buildDateFilterOptions } from '../filters/phz-filter-bar.js';
import { DEFAULT_RELATIVE_PERIODS } from '../data-adapter.js';
import type { TimeIntelligenceConfig } from '../data-adapter.js';

function makeConfig(overrides?: Partial<TimeIntelligenceConfig>): TimeIntelligenceConfig {
  return {
    primaryDateField: 'order_date',
    fiscalYearStartMonth: 1,
    weekStartDay: 'monday',
    granularities: ['day', 'week', 'month', 'quarter', 'year'],
    relativePeriods: DEFAULT_RELATIVE_PERIODS,
    ...overrides,
  };
}

describe('Date Filter Time Intelligence (O.5a)', () => {
  describe('buildDateFilterOptions', () => {
    it('returns relative period labels from config', () => {
      const config = makeConfig();
      const options = buildDateFilterOptions(config);
      expect(options.length).toBeGreaterThan(0);
      expect(options.some(o => o.id === 'today')).toBe(true);
      expect(options.some(o => o.id === 'this-quarter')).toBe(true);
    });

    it('includes fiscal-aware labels when fiscal year is offset', () => {
      const config = makeConfig({ fiscalYearStartMonth: 7 });
      const options = buildDateFilterOptions(config);
      // Should still have quarter/year options
      expect(options.some(o => o.id === 'this-quarter')).toBe(true);
      expect(options.some(o => o.id === 'this-year')).toBe(true);
    });

    it('filters by available granularities', () => {
      const config = makeConfig({ granularities: ['day', 'month'] });
      const options = buildDateFilterOptions(config);
      // week-based options should be excluded
      expect(options.some(o => o.id === 'this-week')).toBe(false);
      expect(options.some(o => o.id === 'last-week')).toBe(false);
      // day and month options should be present
      expect(options.some(o => o.id === 'today')).toBe(true);
      expect(options.some(o => o.id === 'this-month')).toBe(true);
    });

    it('includes last-N-days options that match day granularity', () => {
      const config = makeConfig({ granularities: ['day'] });
      const options = buildDateFilterOptions(config);
      expect(options.some(o => o.id === 'last-7-days')).toBe(true);
      expect(options.some(o => o.id === 'last-30-days')).toBe(true);
    });

    it('returns each option with id and label', () => {
      const config = makeConfig();
      const options = buildDateFilterOptions(config);
      for (const opt of options) {
        expect(typeof opt.id).toBe('string');
        expect(typeof opt.label).toBe('string');
        expect(opt.id.length).toBeGreaterThan(0);
        expect(opt.label.length).toBeGreaterThan(0);
      }
    });

    it('includes comparison periods', () => {
      const config = makeConfig();
      const options = buildDateFilterOptions(config);
      expect(options.some(o => o.id === 'last-quarter')).toBe(true);
      expect(options.some(o => o.id === 'last-year')).toBe(true);
    });
  });
});
