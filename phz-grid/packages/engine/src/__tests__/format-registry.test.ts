import { describe, it, expect } from 'vitest';
import { FormatRegistry } from '../format-registry.js';

describe('FormatRegistry', () => {
  describe('built-in: currency', () => {
    it('formats a number as USD currency', () => {
      const reg = new FormatRegistry('en-US');
      const result = reg.format(1234.5, 'currency');
      expect(result).toContain('1,234');
    });

    it('returns empty string for null', () => {
      const reg = new FormatRegistry();
      expect(reg.format(null, 'currency')).toBe('');
    });
  });

  describe('built-in: percentage', () => {
    it('formats decimal as percentage', () => {
      const reg = new FormatRegistry();
      expect(reg.format(0.753, 'percentage')).toBe('75.3%');
    });

    it('returns empty for non-number', () => {
      const reg = new FormatRegistry();
      expect(reg.format('abc', 'percentage')).toBe('');
    });
  });

  describe('built-in: date-short', () => {
    it('formats a Date object', () => {
      const reg = new FormatRegistry();
      expect(reg.format(new Date('2025-03-14'), 'date-short')).toBe('14 Mar 2025');
    });

    it('formats an ISO string', () => {
      const reg = new FormatRegistry();
      expect(reg.format('2025-03-14', 'date-short')).toBe('14 Mar 2025');
    });
  });

  describe('built-in: date-long', () => {
    it('includes weekday and full month', () => {
      const reg = new FormatRegistry('en-US');
      const result = reg.format(new Date('2025-03-14'), 'date-long');
      expect(result).toContain('March');
      expect(result).toContain('2025');
    });
  });

  describe('built-in: compact', () => {
    it('formats thousands', () => {
      const reg = new FormatRegistry();
      expect(reg.format(1500, 'compact')).toBe('1.5K');
    });

    it('formats millions', () => {
      const reg = new FormatRegistry();
      expect(reg.format(2500000, 'compact')).toBe('2.5M');
    });

    it('formats billions', () => {
      const reg = new FormatRegistry();
      expect(reg.format(3000000000, 'compact')).toBe('3B');
    });

    it('leaves small numbers unchanged', () => {
      const reg = new FormatRegistry();
      expect(reg.format(42, 'compact')).toBe('42');
    });
  });

  describe('built-in: badge', () => {
    it('passes through value as string', () => {
      const reg = new FormatRegistry();
      expect(reg.format('Active', 'badge')).toBe('Active');
    });
  });

  describe('built-in: weight', () => {
    it('appends kg', () => {
      const reg = new FormatRegistry();
      expect(reg.format(75.5, 'weight')).toBe('75.5 kg');
    });
  });

  describe('built-in: duration', () => {
    it('formats minutes to hours and minutes', () => {
      const reg = new FormatRegistry();
      expect(reg.format(135, 'duration')).toBe('2h 15m');
    });

    it('formats exact hours', () => {
      const reg = new FormatRegistry();
      expect(reg.format(120, 'duration')).toBe('2h');
    });

    it('formats minutes only', () => {
      const reg = new FormatRegistry();
      expect(reg.format(45, 'duration')).toBe('45m');
    });
  });

  describe('custom registration', () => {
    it('registers and uses a custom formatter', () => {
      const reg = new FormatRegistry();
      reg.register('yell', (v) => String(v).toUpperCase() + '!');
      expect(reg.format('hello', 'yell')).toBe('HELLO!');
    });

    it('overwrites an existing formatter', () => {
      const reg = new FormatRegistry();
      reg.register('badge', (v) => `[${v}]`);
      expect(reg.format('ok', 'badge')).toBe('[ok]');
    });
  });

  describe('instance isolation', () => {
    it('custom formatters on one instance do not affect another', () => {
      const a = new FormatRegistry();
      const b = new FormatRegistry();
      a.register('custom', () => 'from-a');
      expect(a.has('custom')).toBe(true);
      expect(b.has('custom')).toBe(false);
    });
  });

  describe('has / get', () => {
    it('has returns true for built-ins', () => {
      const reg = new FormatRegistry();
      expect(reg.has('currency')).toBe(true);
      expect(reg.has('nonexistent')).toBe(false);
    });

    it('get returns the function', () => {
      const reg = new FormatRegistry();
      const fn = reg.get('compact');
      expect(typeof fn).toBe('function');
    });

    it('format returns empty for unknown name', () => {
      const reg = new FormatRegistry();
      expect(reg.format(42, 'unknown')).toBe('');
    });
  });
});
