import { describe, it, expect } from 'vitest';
import {
  DEFAULT_RELATIVE_PERIODS,
  resolvePeriod,
} from '../data-adapter.js';
import type {
  TimeGranularity,
  RelativePeriod,
  TimeIntelligenceConfig,
} from '../data-adapter.js';

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

describe('TimeIntelligence', () => {
  describe('TimeGranularity', () => {
    it('covers all granularity values', () => {
      const granularities: TimeGranularity[] = ['day', 'week', 'month', 'quarter', 'year'];
      expect(granularities).toHaveLength(5);
    });
  });

  describe('DEFAULT_RELATIVE_PERIODS', () => {
    it('has 14 predefined periods', () => {
      expect(DEFAULT_RELATIVE_PERIODS).toHaveLength(14);
    });

    it('each period has an id, label, and calculate function', () => {
      for (const period of DEFAULT_RELATIVE_PERIODS) {
        expect(typeof period.id).toBe('string');
        expect(typeof period.label).toBe('string');
        expect(typeof period.calculate).toBe('function');
      }
    });

    it('includes expected period IDs', () => {
      const ids = DEFAULT_RELATIVE_PERIODS.map(p => p.id);
      expect(ids).toContain('today');
      expect(ids).toContain('yesterday');
      expect(ids).toContain('this-week');
      expect(ids).toContain('last-week');
      expect(ids).toContain('this-month');
      expect(ids).toContain('last-month');
      expect(ids).toContain('this-quarter');
      expect(ids).toContain('last-quarter');
      expect(ids).toContain('this-year');
      expect(ids).toContain('last-year');
      expect(ids).toContain('last-7-days');
      expect(ids).toContain('last-30-days');
      expect(ids).toContain('last-90-days');
      expect(ids).toContain('last-365-days');
    });
  });

  describe('resolvePeriod', () => {
    const ref = new Date('2026-03-15T12:00:00Z');
    const config = makeConfig();

    it('resolves "today"', () => {
      const { from, to } = resolvePeriod('today', config, ref);
      expect(from.getFullYear()).toBe(2026);
      expect(from.getMonth()).toBe(2); // March
      expect(from.getDate()).toBe(15);
      expect(to.getDate()).toBe(15);
    });

    it('resolves "yesterday"', () => {
      const { from, to } = resolvePeriod('yesterday', config, ref);
      expect(from.getDate()).toBe(14);
      expect(to.getDate()).toBe(14);
    });

    it('resolves "this-week" (Monday start)', () => {
      const { from, to } = resolvePeriod('this-week', config, ref);
      // March 15, 2026 is a Sunday, so Monday start = March 9
      expect(from.getDay()).toBe(1); // Monday
      expect(to.getDate()).toBe(15);
    });

    it('resolves "this-week" (Sunday start)', () => {
      const sundayConfig = makeConfig({ weekStartDay: 'sunday' });
      const { from, to } = resolvePeriod('this-week', sundayConfig, ref);
      expect(from.getDay()).toBe(0); // Sunday
      expect(to.getDate()).toBe(15);
    });

    it('resolves "last-week"', () => {
      const { from, to } = resolvePeriod('last-week', config, ref);
      // from should be Monday of last week, to should be Sunday of last week
      expect(from.getDay()).toBe(1); // Monday
      // 7-day span
      const days = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
      expect(days).toBe(6);
    });

    it('resolves "this-month"', () => {
      const { from, to } = resolvePeriod('this-month', config, ref);
      expect(from.getMonth()).toBe(2); // March
      expect(from.getDate()).toBe(1);
      expect(to.getDate()).toBe(15);
    });

    it('resolves "last-month"', () => {
      const { from, to } = resolvePeriod('last-month', config, ref);
      expect(from.getMonth()).toBe(1); // February
      expect(from.getDate()).toBe(1);
      expect(to.getMonth()).toBe(1);
      expect(to.getDate()).toBe(28); // 2026 is not a leap year
    });

    it('resolves "this-quarter" with calendar year', () => {
      const { from, to } = resolvePeriod('this-quarter', config, ref);
      // Q1: Jan-Mar for fiscal start month 1
      expect(from.getMonth()).toBe(0); // January
      expect(from.getDate()).toBe(1);
      expect(to.getDate()).toBe(15);
    });

    it('resolves "this-quarter" with fiscal offset', () => {
      const fiscalConfig = makeConfig({ fiscalYearStartMonth: 4 }); // April fiscal year
      const { from } = resolvePeriod('this-quarter', fiscalConfig, ref);
      // With fiscal year starting in April, March is in fiscal Q4 (Jan-Mar)
      expect(from.getMonth()).toBe(0); // January
      expect(from.getDate()).toBe(1);
    });

    it('resolves "last-quarter"', () => {
      const { from, to } = resolvePeriod('last-quarter', config, ref);
      // Last quarter from Q1 2026 = Q4 2025 (Oct-Dec)
      expect(from.getMonth()).toBe(9); // October
      expect(from.getFullYear()).toBe(2025);
      expect(to.getMonth()).toBe(11); // December
      expect(to.getDate()).toBe(31);
    });

    it('resolves "this-year"', () => {
      const { from, to } = resolvePeriod('this-year', config, ref);
      expect(from.getMonth()).toBe(0);
      expect(from.getDate()).toBe(1);
      expect(from.getFullYear()).toBe(2026);
      expect(to.getDate()).toBe(15);
    });

    it('resolves "last-year"', () => {
      const { from, to } = resolvePeriod('last-year', config, ref);
      expect(from.getFullYear()).toBe(2025);
      expect(from.getMonth()).toBe(0);
      expect(from.getDate()).toBe(1);
      expect(to.getFullYear()).toBe(2025);
      expect(to.getMonth()).toBe(11);
      expect(to.getDate()).toBe(31);
    });

    it('resolves "last-7-days"', () => {
      const { from, to } = resolvePeriod('last-7-days', config, ref);
      const days = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
      expect(days).toBe(6); // inclusive: 7 days total
      expect(to.getDate()).toBe(15);
    });

    it('resolves "last-30-days"', () => {
      const { from, to } = resolvePeriod('last-30-days', config, ref);
      const days = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
      expect(days).toBe(29);
    });

    it('resolves "last-90-days"', () => {
      const { from, to } = resolvePeriod('last-90-days', config, ref);
      const days = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
      expect(days).toBe(89);
    });

    it('resolves "last-365-days"', () => {
      const { from, to } = resolvePeriod('last-365-days', config, ref);
      const days = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
      expect(days).toBe(364);
    });

    it('throws for unknown period ID', () => {
      expect(() => resolvePeriod('nonexistent', config, ref)).toThrow();
    });

    it('uses current date when referenceDate is not provided', () => {
      const { to } = resolvePeriod('today', config);
      const now = new Date();
      expect(to.getFullYear()).toBe(now.getFullYear());
      expect(to.getMonth()).toBe(now.getMonth());
      expect(to.getDate()).toBe(now.getDate());
    });
  });

  describe('TimeIntelligenceConfig', () => {
    it('creates a config with fiscal year offset', () => {
      const config: TimeIntelligenceConfig = {
        primaryDateField: 'order_date',
        fiscalYearStartMonth: 7, // July
        weekStartDay: 'sunday',
        granularities: ['month', 'quarter', 'year'],
        relativePeriods: DEFAULT_RELATIVE_PERIODS,
      };
      expect(config.fiscalYearStartMonth).toBe(7);
      expect(config.weekStartDay).toBe('sunday');
    });
  });
});
