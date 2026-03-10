import { describe, it, expect } from 'vitest';
import { formatValue, validateAggregation } from '../format/format-value.js';
import type { AggregationWarning } from '../format/format-value.js';
import type { UnitSpec, FieldMetadata } from '../data-adapter.js';

describe('formatValue', () => {
  describe('currency formatting', () => {
    it('formats USD currency', () => {
      const unit: UnitSpec = { type: 'currency', currencyCode: 'USD', decimalPlaces: 2 };
      const result = formatValue(1234.56, unit, 'en-US');
      expect(result).toContain('1,234.56');
      expect(result).toContain('$');
    });

    it('formats EUR currency', () => {
      const unit: UnitSpec = { type: 'currency', currencyCode: 'EUR', decimalPlaces: 2 };
      const result = formatValue(1234.56, unit, 'de-DE');
      expect(result).toContain('1.234,56');
    });

    it('abbreviates large currency values', () => {
      const unit: UnitSpec = { type: 'currency', currencyCode: 'USD', abbreviate: true };
      const result = formatValue(1500000, unit, 'en-US');
      // Should produce something like "$1.5M" or "$1,500K"
      expect(result.length).toBeLessThan(15);
    });
  });

  describe('percent formatting', () => {
    it('formats a percentage', () => {
      const unit: UnitSpec = { type: 'percent', decimalPlaces: 1 };
      const result = formatValue(0.856, unit, 'en-US');
      expect(result).toContain('85.6');
      expect(result).toContain('%');
    });

    it('formats zero percent', () => {
      const unit: UnitSpec = { type: 'percent', decimalPlaces: 0 };
      const result = formatValue(0, unit, 'en-US');
      expect(result).toContain('0');
      expect(result).toContain('%');
    });
  });

  describe('number formatting', () => {
    it('formats a plain number', () => {
      const unit: UnitSpec = { type: 'number', decimalPlaces: 0 };
      const result = formatValue(42000, unit, 'en-US');
      expect(result).toBe('42,000');
    });

    it('formats with decimal places', () => {
      const unit: UnitSpec = { type: 'number', decimalPlaces: 3 };
      const result = formatValue(3.14159, unit, 'en-US');
      expect(result).toBe('3.142');
    });

    it('shows sign when requested', () => {
      const unit: UnitSpec = { type: 'number', showSign: true };
      const positive = formatValue(42, unit, 'en-US');
      const negative = formatValue(-42, unit, 'en-US');
      expect(positive).toContain('+');
      expect(negative).toContain('-');
    });

    it('abbreviates large numbers', () => {
      const unit: UnitSpec = { type: 'number', abbreviate: true };
      const result = formatValue(1234567, unit, 'en-US');
      expect(result).toMatch(/[KMB]/i);
    });
  });

  describe('duration formatting', () => {
    it('formats seconds', () => {
      const unit: UnitSpec = { type: 'duration', durationUnit: 'seconds' };
      const result = formatValue(90, unit, 'en-US');
      expect(result).toContain('90');
      expect(result).toContain('s');
    });

    it('formats hours', () => {
      const unit: UnitSpec = { type: 'duration', durationUnit: 'hours' };
      const result = formatValue(2.5, unit, 'en-US');
      expect(result).toContain('2.5');
      expect(result).toContain('h');
    });

    it('formats days', () => {
      const unit: UnitSpec = { type: 'duration', durationUnit: 'days' };
      const result = formatValue(7, unit, 'en-US');
      expect(result).toContain('7');
      expect(result).toContain('d');
    });

    it('formats minutes', () => {
      const unit: UnitSpec = { type: 'duration', durationUnit: 'minutes' };
      const result = formatValue(45, unit, 'en-US');
      expect(result).toContain('45');
      expect(result).toContain('m');
    });
  });

  describe('custom formatting', () => {
    it('appends custom suffix', () => {
      const unit: UnitSpec = { type: 'custom', suffix: ' kg' };
      const result = formatValue(75.5, unit, 'en-US');
      expect(result).toContain('75.5');
      expect(result).toContain('kg');
    });
  });

  describe('null and undefined handling', () => {
    it('returns dash for null value', () => {
      const result = formatValue(null, { type: 'number' }, 'en-US');
      expect(result).toBe('\u2014'); // em-dash
    });

    it('returns plain number string when unit is undefined', () => {
      const result = formatValue(42, undefined, 'en-US');
      expect(result).toBe('42');
    });
  });

  describe('locale variants', () => {
    it('formats with nl-NL locale', () => {
      const unit: UnitSpec = { type: 'number', decimalPlaces: 2 };
      const result = formatValue(1234.56, unit, 'nl-NL');
      expect(result).toContain('1.234,56');
    });

    it('formats currency with en-GB locale', () => {
      const unit: UnitSpec = { type: 'currency', currencyCode: 'GBP', decimalPlaces: 2 };
      const result = formatValue(999.99, unit, 'en-GB');
      expect(result).toContain('999.99');
    });
  });

  describe('compact mode', () => {
    it('uses compact notation', () => {
      const unit: UnitSpec = { type: 'number' };
      const result = formatValue(1500000, unit, 'en-US', { compact: true });
      expect(result.length).toBeLessThan(10);
    });
  });
});

describe('validateAggregation', () => {
  it('returns null for valid numeric aggregation', () => {
    const field: FieldMetadata = { name: 'revenue', dataType: 'number', nullable: false };
    const result = validateAggregation(field, 'sum');
    expect(result).toBeNull();
  });

  it('warns when applying sum to a string field', () => {
    const field: FieldMetadata = { name: 'name', dataType: 'string', nullable: false };
    const result = validateAggregation(field, 'sum');
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('error');
    expect(result!.message).toBeTruthy();
  });

  it('warns when applying avg to a boolean field', () => {
    const field: FieldMetadata = { name: 'active', dataType: 'boolean', nullable: false };
    const result = validateAggregation(field, 'avg');
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('error');
  });

  it('allows count on any field type', () => {
    const field: FieldMetadata = { name: 'name', dataType: 'string', nullable: false };
    expect(validateAggregation(field, 'count')).toBeNull();
  });

  it('allows countDistinct on any field type', () => {
    const field: FieldMetadata = { name: 'name', dataType: 'string', nullable: false };
    expect(validateAggregation(field, 'countDistinct')).toBeNull();
  });

  it('allows min/max on date fields', () => {
    const field: FieldMetadata = { name: 'created', dataType: 'date', nullable: false };
    expect(validateAggregation(field, 'min')).toBeNull();
    expect(validateAggregation(field, 'max')).toBeNull();
  });

  it('warns when applying median to a date field', () => {
    const field: FieldMetadata = { name: 'created', dataType: 'date', nullable: false };
    const result = validateAggregation(field, 'median');
    expect(result).not.toBeNull();
  });

  it('allows min/max on string fields (lexicographic)', () => {
    const field: FieldMetadata = { name: 'name', dataType: 'string', nullable: false };
    expect(validateAggregation(field, 'min')).toBeNull();
    expect(validateAggregation(field, 'max')).toBeNull();
  });

  it('warns about nullable field with suggestion', () => {
    const field: FieldMetadata = { name: 'score', dataType: 'number', nullable: true };
    const result = validateAggregation(field, 'sum');
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('warning');
    expect(result!.message).toContain('null');
  });

  it('returns proper AggregationWarning shape', () => {
    const field: FieldMetadata = { name: 'x', dataType: 'string', nullable: false };
    const result = validateAggregation(field, 'sum');
    expect(result).toMatchObject({
      severity: expect.any(String),
      message: expect.any(String),
      field: 'x',
      aggregation: 'sum',
    });
  });
});
