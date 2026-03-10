/**
 * @phozart/phz-grid — Date Formatter Tests
 */
import { describe, it, expect } from 'vitest';
import { formatDate, DEFAULT_DATE_FORMAT, DEFAULT_DATETIME_FORMAT, DATE_FORMAT_PRESETS } from '../formatters/date-formatter.js';

describe('formatDate', () => {
  // Use a fixed date: Wednesday, March 5, 2026 14:30:45
  const date = new Date(2026, 2, 5, 14, 30, 45);

  describe('day tokens', () => {
    it('dd — zero-padded day', () => {
      expect(formatDate(date, 'dd')).toBe('05');
    });

    it('d — day without padding', () => {
      expect(formatDate(date, 'd')).toBe('5');
    });

    it('dddd — full day name', () => {
      expect(formatDate(date, 'dddd')).toBe('Thursday');
    });

    it('ddd — short day name', () => {
      expect(formatDate(date, 'ddd')).toBe('Thu');
    });
  });

  describe('month tokens', () => {
    it('mm — zero-padded month', () => {
      expect(formatDate(date, 'mm')).toBe('03');
    });

    it('m — month without padding', () => {
      expect(formatDate(date, 'm')).toBe('3');
    });

    it('mmmm — full month name', () => {
      expect(formatDate(date, 'mmmm')).toBe('March');
    });

    it('mmm — short month name', () => {
      expect(formatDate(date, 'mmm')).toBe('Mar');
    });
  });

  describe('year tokens', () => {
    it('yyyy — 4-digit year', () => {
      expect(formatDate(date, 'yyyy')).toBe('2026');
    });

    it('yy — 2-digit year', () => {
      expect(formatDate(date, 'yy')).toBe('26');
    });
  });

  describe('time tokens', () => {
    it('hh24 — 24-hour format', () => {
      expect(formatDate(date, 'hh24')).toBe('14');
    });

    it('hh12 — 12-hour format', () => {
      expect(formatDate(date, 'hh12')).toBe('02');
    });

    it('hh — alias for 24-hour', () => {
      expect(formatDate(date, 'hh')).toBe('14');
    });

    it('mi — minutes', () => {
      expect(formatDate(date, 'mi')).toBe('30');
    });

    it('ss — seconds', () => {
      expect(formatDate(date, 'ss')).toBe('45');
    });

    it('AM/PM indicator (uppercase)', () => {
      expect(formatDate(date, 'AM')).toBe('PM');
      const morning = new Date(2026, 2, 5, 9, 0, 0);
      expect(formatDate(morning, 'AM')).toBe('AM');
    });

    it('am/pm indicator (lowercase)', () => {
      expect(formatDate(date, 'am')).toBe('pm');
    });

    it('hh12 shows 12 for midnight', () => {
      const midnight = new Date(2026, 0, 1, 0, 0, 0);
      expect(formatDate(midnight, 'hh12')).toBe('12');
    });

    it('hh12 shows 12 for noon', () => {
      const noon = new Date(2026, 0, 1, 12, 0, 0);
      expect(formatDate(noon, 'hh12')).toBe('12');
    });
  });

  describe('composite formats', () => {
    it('dd/mm/yyyy (default date)', () => {
      expect(formatDate(date, 'dd/mm/yyyy')).toBe('05/03/2026');
    });

    it('mm/dd/yyyy (US date)', () => {
      expect(formatDate(date, 'mm/dd/yyyy')).toBe('03/05/2026');
    });

    it('yyyy-mm-dd (ISO date)', () => {
      expect(formatDate(date, 'yyyy-mm-dd')).toBe('2026-03-05');
    });

    it('dd/mm/yyyy hh24:mi (datetime)', () => {
      expect(formatDate(date, 'dd/mm/yyyy hh24:mi')).toBe('05/03/2026 14:30');
    });

    it('hh12:mi AM (12h time)', () => {
      expect(formatDate(date, 'hh12:mi AM')).toBe('02:30 PM');
    });

    it('ddd dd/mmm/yyyy (verbose)', () => {
      expect(formatDate(date, 'ddd dd/mmm/yyyy')).toBe('Thu 05/Mar/2026');
    });
  });

  describe('literal passthrough', () => {
    it('passes through non-token characters', () => {
      expect(formatDate(date, 'yyyy-mm-dd @ hh24:mi')).toBe('2026-03-05 @ 14:30');
    });
  });

  describe('invalid dates', () => {
    it('returns string representation for invalid date', () => {
      const invalid = new Date('not-a-date');
      const result = formatDate(invalid, 'yyyy-mm-dd');
      expect(result).toBe('Invalid Date');
    });
  });

  describe('constants', () => {
    it('DEFAULT_DATE_FORMAT is dd/mm/yyyy', () => {
      expect(DEFAULT_DATE_FORMAT).toBe('dd/mm/yyyy');
    });

    it('DEFAULT_DATETIME_FORMAT includes time', () => {
      expect(DEFAULT_DATETIME_FORMAT).toBe('dd/mm/yyyy hh24:mi');
    });

    it('DATE_FORMAT_PRESETS has at least 5 entries', () => {
      expect(DATE_FORMAT_PRESETS.length).toBeGreaterThanOrEqual(5);
    });

    it('all presets have value and label', () => {
      for (const preset of DATE_FORMAT_PRESETS) {
        expect(preset.value).toBeDefined();
        expect(preset.label).toBeDefined();
      }
    });
  });
});
