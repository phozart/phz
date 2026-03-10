/**
 * Validation Feedback (L.14 cont.) — Tests
 */
import { describe, it, expect } from 'vitest';
import {
  validateFields,
  getFieldStatus,
  computePanelStatus,
  diffConfigs,
  type ValidationRule,
  type FieldValidationResult,
  type PanelStatus,
} from '../shell/validation-feedback.js';

describe('Validation Feedback', () => {
  describe('validateFields', () => {
    const rules: ValidationRule[] = [
      { field: 'name', required: true, message: 'Name is required' },
      { field: 'email', pattern: /^.+@.+\..+$/, message: 'Invalid email' },
      { field: 'age', min: 0, max: 150, message: 'Age out of range' },
    ];

    it('returns no errors for valid data', () => {
      const data = { name: 'Alice', email: 'alice@test.com', age: 30 };
      const results = validateFields(data, rules);
      expect(results.every(r => r.valid)).toBe(true);
    });

    it('flags missing required field', () => {
      const data = { name: '', email: 'a@b.c', age: 25 };
      const results = validateFields(data, rules);
      const nameResult = results.find(r => r.field === 'name');
      expect(nameResult?.valid).toBe(false);
      expect(nameResult?.message).toBe('Name is required');
    });

    it('flags invalid pattern', () => {
      const data = { name: 'Bob', email: 'not-an-email', age: 25 };
      const results = validateFields(data, rules);
      const emailResult = results.find(r => r.field === 'email');
      expect(emailResult?.valid).toBe(false);
    });

    it('flags out of range number', () => {
      const data = { name: 'Charlie', email: 'c@d.e', age: -5 };
      const results = validateFields(data, rules);
      const ageResult = results.find(r => r.field === 'age');
      expect(ageResult?.valid).toBe(false);
    });

    it('handles undefined field values', () => {
      const data: Record<string, unknown> = { email: 'a@b.c', age: 25 };
      const results = validateFields(data, rules);
      const nameResult = results.find(r => r.field === 'name');
      expect(nameResult?.valid).toBe(false);
    });

    it('returns all fields even if valid', () => {
      const data = { name: 'Alice', email: 'alice@test.com', age: 30 };
      const results = validateFields(data, rules);
      expect(results).toHaveLength(3);
    });
  });

  describe('getFieldStatus', () => {
    it('returns "error" for invalid required field', () => {
      const result: FieldValidationResult = { field: 'name', valid: false, message: 'Required', severity: 'error' };
      expect(getFieldStatus(result)).toBe('error');
    });

    it('returns "warning" for warning severity', () => {
      const result: FieldValidationResult = { field: 'name', valid: false, message: 'Recommend', severity: 'warning' };
      expect(getFieldStatus(result)).toBe('warning');
    });

    it('returns "valid" for valid field', () => {
      const result: FieldValidationResult = { field: 'name', valid: true };
      expect(getFieldStatus(result)).toBe('valid');
    });
  });

  describe('computePanelStatus', () => {
    it('returns "valid" when all fields pass', () => {
      const results: FieldValidationResult[] = [
        { field: 'a', valid: true },
        { field: 'b', valid: true },
      ];
      expect(computePanelStatus(results)).toBe('valid');
    });

    it('returns "error" when any field has error', () => {
      const results: FieldValidationResult[] = [
        { field: 'a', valid: true },
        { field: 'b', valid: false, severity: 'error', message: 'bad' },
      ];
      expect(computePanelStatus(results)).toBe('error');
    });

    it('returns "warning" when worst is warning', () => {
      const results: FieldValidationResult[] = [
        { field: 'a', valid: true },
        { field: 'b', valid: false, severity: 'warning', message: 'meh' },
      ];
      expect(computePanelStatus(results)).toBe('warning');
    });

    it('returns "valid" for empty results', () => {
      expect(computePanelStatus([])).toBe('valid');
    });
  });

  describe('diffConfigs', () => {
    it('returns empty array for identical configs', () => {
      const a = { name: 'X', value: 1 };
      expect(diffConfigs(a, a)).toEqual([]);
    });

    it('detects changed fields', () => {
      const a = { name: 'X', value: 1 };
      const b = { name: 'Y', value: 1 };
      const diffs = diffConfigs(a, b);
      expect(diffs).toHaveLength(1);
      expect(diffs[0].field).toBe('name');
      expect(diffs[0].oldValue).toBe('X');
      expect(diffs[0].newValue).toBe('Y');
    });

    it('detects added fields', () => {
      const a = { name: 'X' };
      const b = { name: 'X', extra: true };
      const diffs = diffConfigs(a, b);
      expect(diffs).toHaveLength(1);
      expect(diffs[0].field).toBe('extra');
      expect(diffs[0].changeType).toBe('added');
    });

    it('detects removed fields', () => {
      const a = { name: 'X', extra: true };
      const b = { name: 'X' };
      const diffs = diffConfigs(a, b);
      expect(diffs).toHaveLength(1);
      expect(diffs[0].field).toBe('extra');
      expect(diffs[0].changeType).toBe('removed');
    });
  });
});
