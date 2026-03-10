import { describe, it, expect, beforeAll } from 'vitest';
import { compileRowExpression, compileMetricExpression } from '../expression-compiler.js';
import { evaluateRowExpression, evaluateMetricExpression } from '../expression-evaluator.js';
import type { ExpressionNode } from '../expression-types.js';
import type { RowExpressionContext, MetricExpressionContext } from '../expression-evaluator.js';

const baseRowCtx: RowExpressionContext = {
  row: { salary: 50000, rating: 4, max_rating: 5, name: 'Alice', active: true },
  params: { target: 90 },
  calculatedValues: { score: 80 },
};

// Helper: compile and evaluate, then compare with tree-walk
function expectCompiledMatchesTreeWalk(expr: ExpressionNode, ctx: RowExpressionContext) {
  const compiled = compileRowExpression(expr);
  const compiledResult = compiled(ctx);
  const treeWalkResult = evaluateRowExpression(expr, ctx);
  expect(compiledResult).toEqual(treeWalkResult);
  return compiledResult;
}

describe('compileRowExpression', () => {
  it('compiles literal', () => {
    const result = expectCompiledMatchesTreeWalk({ kind: 'literal', value: 42 }, baseRowCtx);
    expect(result).toBe(42);
  });

  it('compiles null literal', () => {
    const result = expectCompiledMatchesTreeWalk({ kind: 'literal', value: null }, baseRowCtx);
    expect(result).toBeNull();
  });

  it('compiles string literal', () => {
    const result = expectCompiledMatchesTreeWalk({ kind: 'literal', value: 'hello' }, baseRowCtx);
    expect(result).toBe('hello');
  });

  it('compiles boolean literal', () => {
    const result = expectCompiledMatchesTreeWalk({ kind: 'literal', value: true }, baseRowCtx);
    expect(result).toBe(true);
  });

  it('compiles field reference', () => {
    const result = expectCompiledMatchesTreeWalk({ kind: 'field_ref', fieldName: 'salary' }, baseRowCtx);
    expect(result).toBe(50000);
  });

  it('compiles missing field reference as null', () => {
    const result = expectCompiledMatchesTreeWalk({ kind: 'field_ref', fieldName: 'missing' }, baseRowCtx);
    expect(result).toBeNull();
  });

  it('compiles param reference', () => {
    const result = expectCompiledMatchesTreeWalk({ kind: 'param_ref', parameterId: 'target' }, baseRowCtx);
    expect(result).toBe(90);
  });

  it('compiles calc reference', () => {
    const result = expectCompiledMatchesTreeWalk({ kind: 'calc_ref', calculatedFieldId: 'score' }, baseRowCtx);
    expect(result).toBe(80);
  });

  // Arithmetic binary ops
  it('compiles addition', () => {
    const expr: ExpressionNode = {
      kind: 'binary_op', operator: '+',
      left: { kind: 'field_ref', fieldName: 'salary' },
      right: { kind: 'literal', value: 1000 },
    };
    const result = expectCompiledMatchesTreeWalk(expr, baseRowCtx);
    expect(result).toBe(51000);
  });

  it('compiles subtraction', () => {
    const expr: ExpressionNode = {
      kind: 'binary_op', operator: '-',
      left: { kind: 'literal', value: 100 },
      right: { kind: 'literal', value: 30 },
    };
    const result = expectCompiledMatchesTreeWalk(expr, baseRowCtx);
    expect(result).toBe(70);
  });

  it('compiles multiplication', () => {
    const expr: ExpressionNode = {
      kind: 'binary_op', operator: '*',
      left: { kind: 'field_ref', fieldName: 'rating' },
      right: { kind: 'literal', value: 25 },
    };
    const result = expectCompiledMatchesTreeWalk(expr, baseRowCtx);
    expect(result).toBe(100);
  });

  it('compiles division', () => {
    const expr: ExpressionNode = {
      kind: 'binary_op', operator: '/',
      left: { kind: 'field_ref', fieldName: 'rating' },
      right: { kind: 'field_ref', fieldName: 'max_rating' },
    };
    const result = expectCompiledMatchesTreeWalk(expr, baseRowCtx);
    expect(result).toBe(0.8);
  });

  it('compiles division by zero as null', () => {
    const expr: ExpressionNode = {
      kind: 'binary_op', operator: '/',
      left: { kind: 'literal', value: 10 },
      right: { kind: 'literal', value: 0 },
    };
    const result = expectCompiledMatchesTreeWalk(expr, baseRowCtx);
    expect(result).toBeNull();
  });

  it('compiles modulo', () => {
    const expr: ExpressionNode = {
      kind: 'binary_op', operator: '%',
      left: { kind: 'literal', value: 10 },
      right: { kind: 'literal', value: 3 },
    };
    const result = expectCompiledMatchesTreeWalk(expr, baseRowCtx);
    expect(result).toBe(1);
  });

  it('compiles modulo by zero as null', () => {
    const expr: ExpressionNode = {
      kind: 'binary_op', operator: '%',
      left: { kind: 'literal', value: 10 },
      right: { kind: 'literal', value: 0 },
    };
    const result = expectCompiledMatchesTreeWalk(expr, baseRowCtx);
    expect(result).toBeNull();
  });

  it('compiles power', () => {
    const expr: ExpressionNode = {
      kind: 'binary_op', operator: '^',
      left: { kind: 'literal', value: 2 },
      right: { kind: 'literal', value: 3 },
    };
    const result = expectCompiledMatchesTreeWalk(expr, baseRowCtx);
    expect(result).toBe(8);
  });

  // Comparison operators
  it('compiles eq', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'binary_op', operator: 'eq',
      left: { kind: 'literal', value: 42 },
      right: { kind: 'literal', value: 42 },
    }, baseRowCtx);
    expect(result).toBe(true);
  });

  it('compiles neq', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'binary_op', operator: 'neq',
      left: { kind: 'literal', value: 42 },
      right: { kind: 'literal', value: 43 },
    }, baseRowCtx);
    expect(result).toBe(true);
  });

  it('compiles gt', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'binary_op', operator: 'gt',
      left: { kind: 'literal', value: 10 },
      right: { kind: 'literal', value: 5 },
    }, baseRowCtx);
    expect(result).toBe(true);
  });

  it('compiles gte', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'binary_op', operator: 'gte',
      left: { kind: 'literal', value: 5 },
      right: { kind: 'literal', value: 5 },
    }, baseRowCtx);
    expect(result).toBe(true);
  });

  it('compiles lt', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'binary_op', operator: 'lt',
      left: { kind: 'literal', value: 3 },
      right: { kind: 'literal', value: 5 },
    }, baseRowCtx);
    expect(result).toBe(true);
  });

  it('compiles lte', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'binary_op', operator: 'lte',
      left: { kind: 'literal', value: 5 },
      right: { kind: 'literal', value: 5 },
    }, baseRowCtx);
    expect(result).toBe(true);
  });

  // Null propagation
  it('null propagation in arithmetic', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'binary_op', operator: '+',
      left: { kind: 'literal', value: null },
      right: { kind: 'literal', value: 5 },
    }, baseRowCtx);
    expect(result).toBeNull();
  });

  it('null eq null returns true', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'binary_op', operator: 'eq',
      left: { kind: 'literal', value: null },
      right: { kind: 'literal', value: null },
    }, baseRowCtx);
    expect(result).toBe(true);
  });

  it('null neq non-null returns true', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'binary_op', operator: 'neq',
      left: { kind: 'literal', value: null },
      right: { kind: 'literal', value: 5 },
    }, baseRowCtx);
    expect(result).toBe(true);
  });

  it('null gt returns null', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'binary_op', operator: 'gt',
      left: { kind: 'literal', value: null },
      right: { kind: 'literal', value: 5 },
    }, baseRowCtx);
    expect(result).toBeNull();
  });

  // String concat
  it('compiles string concat', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'binary_op', operator: 'concat',
      left: { kind: 'literal', value: 'Hello' },
      right: { kind: 'literal', value: ' World' },
    }, baseRowCtx);
    expect(result).toBe('Hello World');
  });

  // Logic operators
  it('compiles short-circuit AND (false)', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'binary_op', operator: 'and',
      left: { kind: 'literal', value: false },
      right: { kind: 'literal', value: true },
    }, baseRowCtx);
    expect(result).toBe(false);
  });

  it('compiles short-circuit AND (true)', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'binary_op', operator: 'and',
      left: { kind: 'literal', value: true },
      right: { kind: 'literal', value: true },
    }, baseRowCtx);
    expect(result).toBe(true);
  });

  it('compiles short-circuit OR (true)', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'binary_op', operator: 'or',
      left: { kind: 'literal', value: true },
      right: { kind: 'literal', value: false },
    }, baseRowCtx);
    expect(result).toBe(true);
  });

  it('compiles short-circuit OR (false)', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'binary_op', operator: 'or',
      left: { kind: 'literal', value: false },
      right: { kind: 'literal', value: false },
    }, baseRowCtx);
    expect(result).toBe(false);
  });

  // Unary operators
  it('compiles unary negate', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'unary_op', operator: 'negate',
      operand: { kind: 'literal', value: 5 },
    }, baseRowCtx);
    expect(result).toBe(-5);
  });

  it('compiles unary negate null', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'unary_op', operator: 'negate',
      operand: { kind: 'literal', value: null },
    }, baseRowCtx);
    expect(result).toBeNull();
  });

  it('compiles unary NOT', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'unary_op', operator: 'not',
      operand: { kind: 'literal', value: true },
    }, baseRowCtx);
    expect(result).toBe(false);
  });

  // Conditional
  it('compiles conditional (then branch)', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'conditional',
      condition: { kind: 'field_ref', fieldName: 'active' },
      thenBranch: { kind: 'literal', value: 'yes' },
      elseBranch: { kind: 'literal', value: 'no' },
    }, baseRowCtx);
    expect(result).toBe('yes');
  });

  it('compiles conditional (else branch)', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'conditional',
      condition: { kind: 'literal', value: false },
      thenBranch: { kind: 'literal', value: 'yes' },
      elseBranch: { kind: 'literal', value: 'no' },
    }, baseRowCtx);
    expect(result).toBe('no');
  });

  // Null check
  it('compiles IS NULL (true)', () => {
    const ctx: RowExpressionContext = { row: { x: null }, params: {}, calculatedValues: {} };
    const result = expectCompiledMatchesTreeWalk({
      kind: 'null_check', operand: { kind: 'field_ref', fieldName: 'x' }, isNull: true,
    }, ctx);
    expect(result).toBe(true);
  });

  it('compiles IS NULL (false)', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'null_check', operand: { kind: 'field_ref', fieldName: 'salary' }, isNull: true,
    }, baseRowCtx);
    expect(result).toBe(false);
  });

  it('compiles IS NOT NULL', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'null_check', operand: { kind: 'field_ref', fieldName: 'salary' }, isNull: false,
    }, baseRowCtx);
    expect(result).toBe(true);
  });

  // Built-in functions
  it('compiles ABS', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'function_call', functionName: 'ABS', args: [{ kind: 'literal', value: -42 }],
    }, baseRowCtx);
    expect(result).toBe(42);
  });

  it('compiles ABS null', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'function_call', functionName: 'ABS', args: [{ kind: 'literal', value: null }],
    }, baseRowCtx);
    expect(result).toBeNull();
  });

  it('compiles ROUND', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'function_call', functionName: 'ROUND',
      args: [{ kind: 'literal', value: 3.456 }, { kind: 'literal', value: 2 }],
    }, baseRowCtx);
    expect(result).toBe(3.46);
  });

  it('compiles ROUND with default decimals', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'function_call', functionName: 'ROUND',
      args: [{ kind: 'literal', value: 3.6 }],
    }, baseRowCtx);
    expect(result).toBe(4);
  });

  it('compiles FLOOR', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'function_call', functionName: 'FLOOR',
      args: [{ kind: 'literal', value: 3.7 }],
    }, baseRowCtx);
    expect(result).toBe(3);
  });

  it('compiles CEIL', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'function_call', functionName: 'CEIL',
      args: [{ kind: 'literal', value: 3.2 }],
    }, baseRowCtx);
    expect(result).toBe(4);
  });

  it('compiles UPPER', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'function_call', functionName: 'UPPER',
      args: [{ kind: 'field_ref', fieldName: 'name' }],
    }, baseRowCtx);
    expect(result).toBe('ALICE');
  });

  it('compiles LOWER', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'function_call', functionName: 'LOWER',
      args: [{ kind: 'field_ref', fieldName: 'name' }],
    }, baseRowCtx);
    expect(result).toBe('alice');
  });

  it('compiles TRIM', () => {
    const ctx: RowExpressionContext = { row: { s: '  hello  ' }, params: {}, calculatedValues: {} };
    const result = expectCompiledMatchesTreeWalk({
      kind: 'function_call', functionName: 'TRIM',
      args: [{ kind: 'field_ref', fieldName: 's' }],
    }, ctx);
    expect(result).toBe('hello');
  });

  it('compiles LEN', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'function_call', functionName: 'LEN',
      args: [{ kind: 'field_ref', fieldName: 'name' }],
    }, baseRowCtx);
    expect(result).toBe(5);
  });

  it('compiles SUBSTR', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'function_call', functionName: 'SUBSTR',
      args: [
        { kind: 'field_ref', fieldName: 'name' },
        { kind: 'literal', value: 0 },
        { kind: 'literal', value: 3 },
      ],
    }, baseRowCtx);
    expect(result).toBe('Ali');
  });

  it('compiles SUBSTR without length', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'function_call', functionName: 'SUBSTR',
      args: [
        { kind: 'field_ref', fieldName: 'name' },
        { kind: 'literal', value: 2 },
      ],
    }, baseRowCtx);
    expect(result).toBe('ice');
  });

  it('compiles CONCAT', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'function_call', functionName: 'CONCAT',
      args: [
        { kind: 'literal', value: 'Hello' },
        { kind: 'literal', value: ' ' },
        { kind: 'literal', value: 'World' },
      ],
    }, baseRowCtx);
    expect(result).toBe('Hello World');
  });

  it('compiles YEAR', () => {
    const ctx: RowExpressionContext = { row: { d: '2025-06-15' }, params: {}, calculatedValues: {} };
    const result = expectCompiledMatchesTreeWalk({
      kind: 'function_call', functionName: 'YEAR',
      args: [{ kind: 'field_ref', fieldName: 'd' }],
    }, ctx);
    expect(result).toBe(2025);
  });

  it('compiles MONTH', () => {
    const ctx: RowExpressionContext = { row: { d: '2025-06-15' }, params: {}, calculatedValues: {} };
    const result = expectCompiledMatchesTreeWalk({
      kind: 'function_call', functionName: 'MONTH',
      args: [{ kind: 'field_ref', fieldName: 'd' }],
    }, ctx);
    expect(result).toBe(6);
  });

  it('compiles DAY', () => {
    const ctx: RowExpressionContext = { row: { d: '2025-06-15' }, params: {}, calculatedValues: {} };
    const result = expectCompiledMatchesTreeWalk({
      kind: 'function_call', functionName: 'DAY',
      args: [{ kind: 'field_ref', fieldName: 'd' }],
    }, ctx);
    expect(result).toBe(15);
  });

  it('compiles COALESCE', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'function_call', functionName: 'COALESCE',
      args: [{ kind: 'literal', value: null }, { kind: 'literal', value: 'fallback' }],
    }, baseRowCtx);
    expect(result).toBe('fallback');
  });

  it('compiles COALESCE returns first non-null', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'function_call', functionName: 'COALESCE',
      args: [
        { kind: 'literal', value: null },
        { kind: 'literal', value: null },
        { kind: 'literal', value: 42 },
      ],
    }, baseRowCtx);
    expect(result).toBe(42);
  });

  it('compiles IF', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'function_call', functionName: 'IF',
      args: [
        { kind: 'literal', value: true },
        { kind: 'literal', value: 'yes' },
        { kind: 'literal', value: 'no' },
      ],
    }, baseRowCtx);
    expect(result).toBe('yes');
  });

  it('compiles IF (false)', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'function_call', functionName: 'IF',
      args: [
        { kind: 'literal', value: false },
        { kind: 'literal', value: 'yes' },
        { kind: 'literal', value: 'no' },
      ],
    }, baseRowCtx);
    expect(result).toBe('no');
  });

  it('compiles CLAMP', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'function_call', functionName: 'CLAMP',
      args: [
        { kind: 'literal', value: 150 },
        { kind: 'literal', value: 0 },
        { kind: 'literal', value: 100 },
      ],
    }, baseRowCtx);
    expect(result).toBe(100);
  });

  it('compiles CLAMP null returns null', () => {
    const result = expectCompiledMatchesTreeWalk({
      kind: 'function_call', functionName: 'CLAMP',
      args: [
        { kind: 'literal', value: null },
        { kind: 'literal', value: 0 },
        { kind: 'literal', value: 100 },
      ],
    }, baseRowCtx);
    expect(result).toBeNull();
  });

  // Complex nested expressions
  it('compiles complex nested: (rating / max_rating) * 100', () => {
    const expr: ExpressionNode = {
      kind: 'binary_op', operator: '*',
      left: {
        kind: 'binary_op', operator: '/',
        left: { kind: 'field_ref', fieldName: 'rating' },
        right: { kind: 'field_ref', fieldName: 'max_rating' },
      },
      right: { kind: 'literal', value: 100 },
    };
    const result = expectCompiledMatchesTreeWalk(expr, baseRowCtx);
    expect(result).toBe(80);
  });

  it('compiles deeply nested IF with arithmetic', () => {
    // IF(salary > 40000, ROUND(salary / 1000, 1), 0)
    const expr: ExpressionNode = {
      kind: 'function_call', functionName: 'IF',
      args: [
        { kind: 'binary_op', operator: 'gt', left: { kind: 'field_ref', fieldName: 'salary' }, right: { kind: 'literal', value: 40000 } },
        { kind: 'function_call', functionName: 'ROUND', args: [
          { kind: 'binary_op', operator: '/', left: { kind: 'field_ref', fieldName: 'salary' }, right: { kind: 'literal', value: 1000 } },
          { kind: 'literal', value: 1 },
        ]},
        { kind: 'literal', value: 0 },
      ],
    };
    const result = expectCompiledMatchesTreeWalk(expr, baseRowCtx);
    expect(result).toBe(50);
  });

  // Type coercion
  it('compiles type coercion: string number + number', () => {
    const ctx: RowExpressionContext = { row: { val: '42' }, params: {}, calculatedValues: {} };
    const result = expectCompiledMatchesTreeWalk({
      kind: 'binary_op', operator: '+',
      left: { kind: 'field_ref', fieldName: 'val' },
      right: { kind: 'literal', value: 1 },
    }, ctx);
    expect(result).toBe(43);
  });

  // Returns a function that can be reused on multiple rows
  it('compiled function works across multiple rows', () => {
    const expr: ExpressionNode = {
      kind: 'binary_op', operator: '*',
      left: { kind: 'field_ref', fieldName: 'salary' },
      right: { kind: 'literal', value: 1.1 },
    };
    const fn = compileRowExpression(expr);

    const result1 = fn({ row: { salary: 50000 }, params: {}, calculatedValues: {} });
    expect(result1).toBeCloseTo(55000);

    const result2 = fn({ row: { salary: 60000 }, params: {}, calculatedValues: {} });
    expect(result2).toBeCloseTo(66000);

    const result3 = fn({ row: { salary: null }, params: {}, calculatedValues: {} });
    expect(result3).toBeNull();
  });
});

describe('compileMetricExpression', () => {
  const metricCtx: MetricExpressionContext = {
    metricValues: { avg_salary: 50000, headcount: 100, total_count: 500 },
    params: { target: 90 },
  };

  it('compiles metric reference', () => {
    const fn = compileMetricExpression({ kind: 'metric_ref', metricId: 'avg_salary' });
    const result = fn(metricCtx);
    expect(result).toBe(50000);
    expect(result).toBe(evaluateMetricExpression({ kind: 'metric_ref', metricId: 'avg_salary' }, metricCtx));
  });

  it('compiles composite expression: @avg * @headcount / @total', () => {
    const expr: ExpressionNode = {
      kind: 'binary_op', operator: '/',
      left: {
        kind: 'binary_op', operator: '*',
        left: { kind: 'metric_ref', metricId: 'avg_salary' },
        right: { kind: 'metric_ref', metricId: 'headcount' },
      },
      right: { kind: 'metric_ref', metricId: 'total_count' },
    };
    const fn = compileMetricExpression(expr);
    const result = fn(metricCtx);
    expect(result).toBe(10000);
    expect(result).toBe(evaluateMetricExpression(expr, metricCtx));
  });

  it('returns null for missing metric', () => {
    const fn = compileMetricExpression({ kind: 'metric_ref', metricId: 'missing' });
    const result = fn(metricCtx);
    expect(result).toBeNull();
  });

  it('evaluates param ref in metric context', () => {
    const fn = compileMetricExpression({ kind: 'param_ref', parameterId: 'target' });
    const result = fn(metricCtx);
    expect(result).toBe(90);
  });

  it('coerces string result to number', () => {
    const fn = compileMetricExpression({ kind: 'literal', value: '42' });
    expect(fn(metricCtx)).toBe(42);
  });

  it('returns null for non-numeric string result', () => {
    const fn = compileMetricExpression({ kind: 'literal', value: 'abc' });
    expect(fn(metricCtx)).toBeNull();
  });
});

describe('ExpressionCache', () => {
  // Import lazily to allow test to fail properly if not implemented
  let ExpressionCache: any;

  beforeAll(async () => {
    const mod = await import('../expression-cache.js');
    ExpressionCache = mod.ExpressionCache;
  });

  it('creates a cache with default capacity', () => {
    const cache = new ExpressionCache();
    expect(cache.size).toBe(0);
  });

  it('caches and retrieves compiled row expressions', () => {
    const cache = new ExpressionCache();
    const expr: ExpressionNode = { kind: 'literal', value: 42 };
    const key = 'literal:42';

    const fn1 = cache.getOrCompileRow(key, expr);
    const fn2 = cache.getOrCompileRow(key, expr);

    // Same function reference = cache hit
    expect(fn1).toBe(fn2);
    expect(cache.size).toBe(1);
    expect(cache.hits).toBe(1);
    expect(cache.misses).toBe(1);
  });

  it('caches and retrieves compiled metric expressions', () => {
    const cache = new ExpressionCache();
    const expr: ExpressionNode = { kind: 'metric_ref', metricId: 'revenue' };
    const key = 'metric:revenue';

    const fn1 = cache.getOrCompileMetric(key, expr);
    const fn2 = cache.getOrCompileMetric(key, expr);

    expect(fn1).toBe(fn2);
    expect(cache.size).toBe(1);
  });

  it('evicts LRU entry when capacity exceeded', () => {
    const cache = new ExpressionCache({ maxSize: 2 });

    cache.getOrCompileRow('a', { kind: 'literal', value: 1 });
    cache.getOrCompileRow('b', { kind: 'literal', value: 2 });
    cache.getOrCompileRow('c', { kind: 'literal', value: 3 });

    expect(cache.size).toBe(2);
    // 'a' should have been evicted
    expect(cache.has('a')).toBe(false);
    expect(cache.has('b')).toBe(true);
    expect(cache.has('c')).toBe(true);
  });

  it('LRU updates on access', () => {
    const cache = new ExpressionCache({ maxSize: 2 });

    cache.getOrCompileRow('a', { kind: 'literal', value: 1 });
    cache.getOrCompileRow('b', { kind: 'literal', value: 2 });
    // Access 'a' again to make it most recently used
    cache.getOrCompileRow('a', { kind: 'literal', value: 1 });
    // Now insert 'c' — 'b' should be evicted (LRU)
    cache.getOrCompileRow('c', { kind: 'literal', value: 3 });

    expect(cache.has('a')).toBe(true);
    expect(cache.has('b')).toBe(false);
    expect(cache.has('c')).toBe(true);
  });

  it('invalidate clears all entries', () => {
    const cache = new ExpressionCache();
    cache.getOrCompileRow('a', { kind: 'literal', value: 1 });
    cache.getOrCompileRow('b', { kind: 'literal', value: 2 });

    cache.invalidate();
    expect(cache.size).toBe(0);
    expect(cache.has('a')).toBe(false);
  });

  it('invalidateKey removes a specific entry', () => {
    const cache = new ExpressionCache();
    cache.getOrCompileRow('a', { kind: 'literal', value: 1 });
    cache.getOrCompileRow('b', { kind: 'literal', value: 2 });

    cache.invalidateKey('a');
    expect(cache.size).toBe(1);
    expect(cache.has('a')).toBe(false);
    expect(cache.has('b')).toBe(true);
  });

  it('reports stats correctly', () => {
    const cache = new ExpressionCache();
    cache.getOrCompileRow('a', { kind: 'literal', value: 1 }); // miss
    cache.getOrCompileRow('a', { kind: 'literal', value: 1 }); // hit
    cache.getOrCompileRow('b', { kind: 'literal', value: 2 }); // miss
    cache.getOrCompileRow('a', { kind: 'literal', value: 1 }); // hit

    const stats = cache.stats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(2);
    expect(stats.size).toBe(2);
    expect(stats.hitRate).toBeCloseTo(0.5);
  });
});
