/**
 * @phozart/phz-duckdb — sanitizeExpression Tests
 *
 * Verifies that the expression sanitizer allows safe SQL expressions
 * and rejects dangerous ones (SQL injection attempts).
 */

import { describe, it, expect } from 'vitest';
import { sanitizeExpression } from '../duckdb-compute-backend.js';

describe('sanitizeExpression', () => {
  describe('valid expressions', () => {
    it('should allow simple arithmetic: price * quantity', () => {
      expect(sanitizeExpression('price * quantity')).toBe('price * quantity');
    });

    it('should allow function calls: ROUND(amount, 2)', () => {
      expect(sanitizeExpression('ROUND(amount, 2)')).toBe('ROUND(amount, 2)');
    });

    it('should allow combined expressions: COALESCE(a, 0) + b', () => {
      expect(sanitizeExpression('COALESCE(a, 0) + b')).toBe('COALESCE(a, 0) + b');
    });

    it('should allow numeric literals with decimals', () => {
      expect(sanitizeExpression('price * 1.15')).toBe('price * 1.15');
    });

    it('should allow nested function calls', () => {
      expect(sanitizeExpression('ABS(ROUND(val, 2))')).toBe('ABS(ROUND(val, 2))');
    });

    it('should trim whitespace', () => {
      expect(sanitizeExpression('  a + b  ')).toBe('a + b');
    });

    it('should allow all whitelisted functions', () => {
      const fns = [
        'ABS(x)', 'ROUND(x, 2)', 'CEIL(x)', 'FLOOR(x)',
        'COALESCE(x, 0)', 'NULLIF(x, 0)', 'CAST(x)',
        'UPPER(name)', 'LOWER(name)', 'LENGTH(name)',
        'TRIM(name)', 'SUBSTRING(name, 1, 3)',
      ];
      for (const expr of fns) {
        expect(() => sanitizeExpression(expr)).not.toThrow();
      }
    });
  });

  describe('dangerous expressions', () => {
    it('should reject SQL injection with DROP TABLE', () => {
      expect(() => sanitizeExpression('1); DROP TABLE x; --')).toThrow('Unsafe SQL expression');
    });

    it('should reject subqueries', () => {
      expect(() => sanitizeExpression('(SELECT * FROM secrets)')).toThrow('Unsafe SQL expression');
    });

    it('should reject semicolons', () => {
      expect(() => sanitizeExpression('a; DELETE FROM t')).toThrow('Unsafe SQL expression');
    });

    it('should reject line comments (--)', () => {
      expect(() => sanitizeExpression('a -- comment')).toThrow('Unsafe SQL expression');
    });

    it('should reject block comments (/* */)', () => {
      expect(() => sanitizeExpression('a /* comment */')).toThrow('Unsafe SQL expression');
    });

    it('should reject string literals', () => {
      expect(() => sanitizeExpression("'malicious'")).toThrow('Unsafe SQL expression');
    });

    it('should reject empty expressions', () => {
      expect(() => sanitizeExpression('')).toThrow('Expression must not be empty');
      expect(() => sanitizeExpression('   ')).toThrow('Expression must not be empty');
    });

    it('should reject UNION-based injection', () => {
      expect(() => sanitizeExpression('1 UNION SELECT password FROM users')).toThrow('Unsafe SQL expression');
    });
  });
});
