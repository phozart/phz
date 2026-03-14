/**
 * Tests for FilterValueMatchRule — evaluateMatchRule and applyExpression.
 *
 * This is one of the most critical modules; we test ALL operators and
 * ALL expression functions.
 */
import {
  evaluateMatchRule,
  applyExpression,
} from '@phozart/shared/types';
import type { FilterValueMatchRule } from '@phozart/shared/types';

// ========================================================================
// applyExpression
// ========================================================================

describe('applyExpression', () => {
  // --- Simple functions ---

  it('UPPER — converts string to uppercase', () => {
    expect(applyExpression('hello', 'UPPER')).toBe('HELLO');
  });

  it('LOWER — converts string to lowercase', () => {
    expect(applyExpression('HELLO', 'LOWER')).toBe('hello');
  });

  it('TRIM — removes leading and trailing whitespace', () => {
    expect(applyExpression('  hello  ', 'TRIM')).toBe('hello');
  });

  // --- Functions with arguments ---

  it('LEFT(n) — takes first n characters', () => {
    expect(applyExpression('abcdef', 'LEFT(3)')).toBe('abc');
  });

  it('LEFT(n) — returns full string when n >= length', () => {
    expect(applyExpression('ab', 'LEFT(10)')).toBe('ab');
  });

  it('LEFT(n) — returns original when n is negative', () => {
    expect(applyExpression('abc', 'LEFT(-1)')).toBe('abc');
  });

  it('LEFT(n) — returns original when n is NaN', () => {
    expect(applyExpression('abc', 'LEFT(xyz)')).toBe('abc');
  });

  it('RIGHT(n) — takes last n characters', () => {
    expect(applyExpression('abcdef', 'RIGHT(3)')).toBe('def');
  });

  it('RIGHT(n) — returns full string when n >= length', () => {
    expect(applyExpression('ab', 'RIGHT(10)')).toBe('ab');
  });

  it('RIGHT(n) — returns original when n is negative', () => {
    expect(applyExpression('abc', 'RIGHT(-1)')).toBe('abc');
  });

  it('SUBSTRING(start, length) — extracts substring', () => {
    expect(applyExpression('abcdef', 'SUBSTRING(1, 3)')).toBe('bcd');
  });

  it('SUBSTRING — returns original with insufficient args', () => {
    expect(applyExpression('abcdef', 'SUBSTRING(1)')).toBe('abcdef');
  });

  it('SUBSTRING — returns original with negative start', () => {
    expect(applyExpression('abcdef', 'SUBSTRING(-1, 3)')).toBe('abcdef');
  });

  it('SUBSTRING — returns original with NaN args', () => {
    expect(applyExpression('abcdef', 'SUBSTRING(a, b)')).toBe('abcdef');
  });

  it('REPLACE(search, replacement) — replaces all occurrences', () => {
    expect(applyExpression('hello world', "REPLACE('world', 'earth')")).toBe('hello earth');
  });

  it('REPLACE — replaces multiple occurrences', () => {
    expect(applyExpression('aabaa', "REPLACE('a', 'x')")).toBe('xxbxx');
  });

  it('REPLACE — works with double quotes', () => {
    expect(applyExpression('foo-bar', 'REPLACE("-", "_")')).toBe('foo_bar');
  });

  it('REPLACE — returns original with insufficient args', () => {
    expect(applyExpression('hello', "REPLACE('o')")).toBe('hello');
  });

  // --- Edge cases ---

  it('returns non-string values unchanged', () => {
    expect(applyExpression(42, 'UPPER')).toBe(42);
    expect(applyExpression(null, 'LOWER')).toBeNull();
    expect(applyExpression(undefined, 'TRIM')).toBeUndefined();
    expect(applyExpression(true, 'UPPER')).toBe(true);
  });

  it('returns original string for empty expression', () => {
    expect(applyExpression('hello', '')).toBe('hello');
  });

  it('returns original string for unknown function', () => {
    expect(applyExpression('hello', 'UNKNOWN_FUNC')).toBe('hello');
  });

  it('returns original string for unknown function with args', () => {
    expect(applyExpression('hello', 'UNKNOWN(1, 2)')).toBe('hello');
  });

  it('handles whitespace around expression', () => {
    expect(applyExpression('hello', '  UPPER  ')).toBe('HELLO');
  });
});

// ========================================================================
// evaluateMatchRule — ALL operators
// ========================================================================

describe('evaluateMatchRule', () => {
  // --- equals ---

  describe('equals operator', () => {
    it('matches equal string values (case-insensitive by default)', () => {
      const rule: FilterValueMatchRule = { field: 'name', operator: 'equals', value: 'Alice' };
      expect(evaluateMatchRule(rule, 'alice')).toBe(true);
      expect(evaluateMatchRule(rule, 'ALICE')).toBe(true);
    });

    it('matches case-sensitive when specified', () => {
      const rule: FilterValueMatchRule = { field: 'name', operator: 'equals', value: 'Alice', caseSensitive: true };
      expect(evaluateMatchRule(rule, 'Alice')).toBe(true);
      expect(evaluateMatchRule(rule, 'alice')).toBe(false);
    });

    it('matches numeric values', () => {
      const rule: FilterValueMatchRule = { field: 'age', operator: 'equals', value: 25 };
      expect(evaluateMatchRule(rule, 25)).toBe(true);
      expect(evaluateMatchRule(rule, 26)).toBe(false);
    });

    it('does not match null', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'equals', value: 'a' };
      expect(evaluateMatchRule(rule, null)).toBe(false);
    });
  });

  // --- notEquals ---

  describe('notEquals operator', () => {
    it('returns true for different values', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'notEquals', value: 'a' };
      expect(evaluateMatchRule(rule, 'b')).toBe(true);
    });

    it('returns false for matching values', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'notEquals', value: 'a' };
      expect(evaluateMatchRule(rule, 'a')).toBe(false);
    });
  });

  // --- isNull ---

  describe('isNull operator', () => {
    it('returns true for null', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'isNull', value: null };
      expect(evaluateMatchRule(rule, null)).toBe(true);
    });

    it('returns true for undefined', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'isNull', value: null };
      expect(evaluateMatchRule(rule, undefined)).toBe(true);
    });

    it('returns false for non-null', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'isNull', value: null };
      expect(evaluateMatchRule(rule, 'hello')).toBe(false);
      expect(evaluateMatchRule(rule, 0)).toBe(false);
      expect(evaluateMatchRule(rule, '')).toBe(false);
    });
  });

  // --- isNotNull ---

  describe('isNotNull operator', () => {
    it('returns true for non-null values', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'isNotNull', value: null };
      expect(evaluateMatchRule(rule, 'hello')).toBe(true);
      expect(evaluateMatchRule(rule, 0)).toBe(true);
      expect(evaluateMatchRule(rule, '')).toBe(true);
    });

    it('returns false for null and undefined', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'isNotNull', value: null };
      expect(evaluateMatchRule(rule, null)).toBe(false);
      expect(evaluateMatchRule(rule, undefined)).toBe(false);
    });
  });

  // --- in ---

  describe('in operator', () => {
    it('returns true when value is in array', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'in', value: ['a', 'b', 'c'] };
      expect(evaluateMatchRule(rule, 'b')).toBe(true);
    });

    it('case-insensitive by default', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'in', value: ['Apple', 'Banana'] };
      expect(evaluateMatchRule(rule, 'apple')).toBe(true);
    });

    it('returns false when value is not in array', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'in', value: ['a', 'b'] };
      expect(evaluateMatchRule(rule, 'd')).toBe(false);
    });

    it('returns false when rule value is not an array', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'in', value: 'not-array' };
      expect(evaluateMatchRule(rule, 'x')).toBe(false);
    });
  });

  // --- notIn ---

  describe('notIn operator', () => {
    it('returns true when value is not in array', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'notIn', value: ['a', 'b'] };
      expect(evaluateMatchRule(rule, 'c')).toBe(true);
    });

    it('returns false when value is in array', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'notIn', value: ['a', 'b'] };
      expect(evaluateMatchRule(rule, 'a')).toBe(false);
    });

    it('returns true when rule value is not an array', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'notIn', value: 'not-array' };
      expect(evaluateMatchRule(rule, 'x')).toBe(true);
    });
  });

  // --- contains ---

  describe('contains operator', () => {
    it('returns true when string contains substring', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'contains', value: 'ell' };
      expect(evaluateMatchRule(rule, 'hello')).toBe(true);
    });

    it('case-insensitive by default', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'contains', value: 'ELL' };
      expect(evaluateMatchRule(rule, 'hello')).toBe(true);
    });

    it('returns false when string does not contain substring', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'contains', value: 'xyz' };
      expect(evaluateMatchRule(rule, 'hello')).toBe(false);
    });

    it('returns false for non-string values', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'contains', value: '5' };
      expect(evaluateMatchRule(rule, 50)).toBe(false);
    });
  });

  // --- startsWith ---

  describe('startsWith operator', () => {
    it('returns true when string starts with prefix', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'startsWith', value: 'hel' };
      expect(evaluateMatchRule(rule, 'hello')).toBe(true);
    });

    it('case-insensitive by default', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'startsWith', value: 'HEL' };
      expect(evaluateMatchRule(rule, 'hello')).toBe(true);
    });

    it('returns false when string does not start with prefix', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'startsWith', value: 'xyz' };
      expect(evaluateMatchRule(rule, 'hello')).toBe(false);
    });

    it('returns false for non-string values', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'startsWith', value: '1' };
      expect(evaluateMatchRule(rule, 123)).toBe(false);
    });
  });

  // --- endsWith ---

  describe('endsWith operator', () => {
    it('returns true when string ends with suffix', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'endsWith', value: 'llo' };
      expect(evaluateMatchRule(rule, 'hello')).toBe(true);
    });

    it('case-insensitive by default', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'endsWith', value: 'LLO' };
      expect(evaluateMatchRule(rule, 'hello')).toBe(true);
    });

    it('returns false when string does not end with suffix', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'endsWith', value: 'xyz' };
      expect(evaluateMatchRule(rule, 'hello')).toBe(false);
    });
  });

  // --- greaterThan ---

  describe('greaterThan operator', () => {
    it('returns true when actual > rule value', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'greaterThan', value: 10 };
      expect(evaluateMatchRule(rule, 15)).toBe(true);
    });

    it('returns false when actual <= rule value', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'greaterThan', value: 10 };
      expect(evaluateMatchRule(rule, 10)).toBe(false);
      expect(evaluateMatchRule(rule, 5)).toBe(false);
    });

    it('returns false for non-numeric values', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'greaterThan', value: 10 };
      expect(evaluateMatchRule(rule, 'hello')).toBe(false);
    });

    it('returns false when rule value is non-numeric', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'greaterThan', value: 'abc' };
      expect(evaluateMatchRule(rule, 15)).toBe(false);
    });
  });

  // --- lessThan ---

  describe('lessThan operator', () => {
    it('returns true when actual < rule value', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'lessThan', value: 10 };
      expect(evaluateMatchRule(rule, 5)).toBe(true);
    });

    it('returns false when actual >= rule value', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'lessThan', value: 10 };
      expect(evaluateMatchRule(rule, 10)).toBe(false);
      expect(evaluateMatchRule(rule, 15)).toBe(false);
    });

    it('returns false for non-numeric values', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'lessThan', value: 10 };
      expect(evaluateMatchRule(rule, 'hello')).toBe(false);
    });
  });

  // --- between ---

  describe('between operator', () => {
    it('returns true when actual is within range (inclusive)', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'between', value: [10, 20] };
      expect(evaluateMatchRule(rule, 10)).toBe(true);
      expect(evaluateMatchRule(rule, 15)).toBe(true);
      expect(evaluateMatchRule(rule, 20)).toBe(true);
    });

    it('returns false when actual is outside range', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'between', value: [10, 20] };
      expect(evaluateMatchRule(rule, 9)).toBe(false);
      expect(evaluateMatchRule(rule, 21)).toBe(false);
    });

    it('returns false when actual is non-numeric', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'between', value: [10, 20] };
      expect(evaluateMatchRule(rule, 'hello')).toBe(false);
    });

    it('returns false when rule value is not an array', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'between', value: 10 };
      expect(evaluateMatchRule(rule, 15)).toBe(false);
    });

    it('returns false when rule value has less than 2 elements', () => {
      const rule: FilterValueMatchRule = { field: 'x', operator: 'between', value: [10] };
      expect(evaluateMatchRule(rule, 10)).toBe(false);
    });
  });

  // --- Expression integration ---

  describe('expression integration', () => {
    it('applies expression before matching', () => {
      const rule: FilterValueMatchRule = {
        field: 'name',
        operator: 'equals',
        value: 'hello',
        expression: 'LOWER',
        caseSensitive: true,
      };
      expect(evaluateMatchRule(rule, 'HELLO')).toBe(true);
    });

    it('applies TRIM expression before matching', () => {
      const rule: FilterValueMatchRule = {
        field: 'code',
        operator: 'equals',
        value: 'ABC',
        expression: 'TRIM',
      };
      expect(evaluateMatchRule(rule, '  ABC  ')).toBe(true);
    });

    it('applies LEFT expression before matching', () => {
      const rule: FilterValueMatchRule = {
        field: 'code',
        operator: 'equals',
        value: 'ab',
        expression: 'LEFT(2)',
      };
      expect(evaluateMatchRule(rule, 'abcdef')).toBe(true);
    });
  });

  // --- Default / unknown operator ---

  describe('unknown operator', () => {
    it('returns false for unknown operator', () => {
      const rule = { field: 'x', operator: 'unknownOp' as any, value: 'a' };
      expect(evaluateMatchRule(rule, 'a')).toBe(false);
    });
  });
});
