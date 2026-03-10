import { describe, it, expect } from 'vitest';
import { evaluateRowExpression, evaluateMetricExpression } from '../expression-evaluator.js';
import type { ExpressionNode } from '../expression-types.js';
import type { RowExpressionContext, MetricExpressionContext } from '../expression-evaluator.js';

const baseRowCtx: RowExpressionContext = {
  row: { salary: 50000, rating: 4, max_rating: 5, name: 'Alice', active: true },
  params: { target: 90 },
  calculatedValues: { score: 80 },
};

describe('evaluateRowExpression', () => {
  it('evaluates literal', () => {
    expect(evaluateRowExpression({ kind: 'literal', value: 42 }, baseRowCtx)).toBe(42);
  });

  it('evaluates field reference', () => {
    expect(evaluateRowExpression({ kind: 'field_ref', fieldName: 'salary' }, baseRowCtx)).toBe(50000);
  });

  it('returns null for missing field', () => {
    expect(evaluateRowExpression({ kind: 'field_ref', fieldName: 'missing' }, baseRowCtx)).toBeNull();
  });

  it('evaluates param reference', () => {
    expect(evaluateRowExpression({ kind: 'param_ref', parameterId: 'target' }, baseRowCtx)).toBe(90);
  });

  it('evaluates calc reference', () => {
    expect(evaluateRowExpression({ kind: 'calc_ref', calculatedFieldId: 'score' }, baseRowCtx)).toBe(80);
  });

  it('evaluates addition', () => {
    const expr: ExpressionNode = {
      kind: 'binary_op', operator: '+',
      left: { kind: 'field_ref', fieldName: 'salary' },
      right: { kind: 'literal', value: 1000 },
    };
    expect(evaluateRowExpression(expr, baseRowCtx)).toBe(51000);
  });

  it('evaluates subtraction', () => {
    const expr: ExpressionNode = {
      kind: 'binary_op', operator: '-',
      left: { kind: 'literal', value: 100 },
      right: { kind: 'literal', value: 30 },
    };
    expect(evaluateRowExpression(expr, baseRowCtx)).toBe(70);
  });

  it('evaluates multiplication', () => {
    const expr: ExpressionNode = {
      kind: 'binary_op', operator: '*',
      left: { kind: 'field_ref', fieldName: 'rating' },
      right: { kind: 'literal', value: 25 },
    };
    expect(evaluateRowExpression(expr, baseRowCtx)).toBe(100);
  });

  it('evaluates division', () => {
    const expr: ExpressionNode = {
      kind: 'binary_op', operator: '/',
      left: { kind: 'field_ref', fieldName: 'rating' },
      right: { kind: 'field_ref', fieldName: 'max_rating' },
    };
    expect(evaluateRowExpression(expr, baseRowCtx)).toBe(0.8);
  });

  it('division by zero returns null', () => {
    const expr: ExpressionNode = {
      kind: 'binary_op', operator: '/',
      left: { kind: 'literal', value: 10 },
      right: { kind: 'literal', value: 0 },
    };
    expect(evaluateRowExpression(expr, baseRowCtx)).toBeNull();
  });

  it('evaluates power', () => {
    const expr: ExpressionNode = {
      kind: 'binary_op', operator: '^',
      left: { kind: 'literal', value: 2 },
      right: { kind: 'literal', value: 3 },
    };
    expect(evaluateRowExpression(expr, baseRowCtx)).toBe(8);
  });

  it('evaluates modulo', () => {
    const expr: ExpressionNode = {
      kind: 'binary_op', operator: '%',
      left: { kind: 'literal', value: 10 },
      right: { kind: 'literal', value: 3 },
    };
    expect(evaluateRowExpression(expr, baseRowCtx)).toBe(1);
  });

  it('evaluates comparison operators', () => {
    expect(evaluateRowExpression({
      kind: 'binary_op', operator: 'gt',
      left: { kind: 'literal', value: 10 },
      right: { kind: 'literal', value: 5 },
    }, baseRowCtx)).toBe(true);

    expect(evaluateRowExpression({
      kind: 'binary_op', operator: 'lte',
      left: { kind: 'literal', value: 5 },
      right: { kind: 'literal', value: 5 },
    }, baseRowCtx)).toBe(true);
  });

  it('evaluates equality', () => {
    expect(evaluateRowExpression({
      kind: 'binary_op', operator: 'eq',
      left: { kind: 'literal', value: 42 },
      right: { kind: 'literal', value: 42 },
    }, baseRowCtx)).toBe(true);
  });

  it('null propagation in arithmetic', () => {
    expect(evaluateRowExpression({
      kind: 'binary_op', operator: '+',
      left: { kind: 'literal', value: null },
      right: { kind: 'literal', value: 5 },
    }, baseRowCtx)).toBeNull();
  });

  it('short-circuit AND', () => {
    expect(evaluateRowExpression({
      kind: 'binary_op', operator: 'and',
      left: { kind: 'literal', value: false },
      right: { kind: 'literal', value: true },
    }, baseRowCtx)).toBe(false);
  });

  it('short-circuit OR', () => {
    expect(evaluateRowExpression({
      kind: 'binary_op', operator: 'or',
      left: { kind: 'literal', value: true },
      right: { kind: 'literal', value: false },
    }, baseRowCtx)).toBe(true);
  });

  it('evaluates unary negate', () => {
    expect(evaluateRowExpression({
      kind: 'unary_op', operator: 'negate',
      operand: { kind: 'literal', value: 5 },
    }, baseRowCtx)).toBe(-5);
  });

  it('evaluates unary NOT', () => {
    expect(evaluateRowExpression({
      kind: 'unary_op', operator: 'not',
      operand: { kind: 'literal', value: true },
    }, baseRowCtx)).toBe(false);
  });

  it('evaluates conditional', () => {
    expect(evaluateRowExpression({
      kind: 'conditional',
      condition: { kind: 'field_ref', fieldName: 'active' },
      thenBranch: { kind: 'literal', value: 'yes' },
      elseBranch: { kind: 'literal', value: 'no' },
    }, baseRowCtx)).toBe('yes');
  });

  it('evaluates null check IS NULL', () => {
    const ctx: RowExpressionContext = { row: { x: null }, params: {}, calculatedValues: {} };
    expect(evaluateRowExpression({
      kind: 'null_check', operand: { kind: 'field_ref', fieldName: 'x' }, isNull: true,
    }, ctx)).toBe(true);
  });

  it('evaluates null check IS NOT NULL', () => {
    expect(evaluateRowExpression({
      kind: 'null_check', operand: { kind: 'field_ref', fieldName: 'salary' }, isNull: false,
    }, baseRowCtx)).toBe(true);
  });

  it('evaluates ABS', () => {
    expect(evaluateRowExpression({
      kind: 'function_call', functionName: 'ABS', args: [{ kind: 'literal', value: -42 }],
    }, baseRowCtx)).toBe(42);
  });

  it('evaluates ROUND', () => {
    expect(evaluateRowExpression({
      kind: 'function_call', functionName: 'ROUND',
      args: [{ kind: 'literal', value: 3.456 }, { kind: 'literal', value: 2 }],
    }, baseRowCtx)).toBe(3.46);
  });

  it('evaluates UPPER', () => {
    expect(evaluateRowExpression({
      kind: 'function_call', functionName: 'UPPER',
      args: [{ kind: 'field_ref', fieldName: 'name' }],
    }, baseRowCtx)).toBe('ALICE');
  });

  it('evaluates COALESCE', () => {
    expect(evaluateRowExpression({
      kind: 'function_call', functionName: 'COALESCE',
      args: [{ kind: 'literal', value: null }, { kind: 'literal', value: 'fallback' }],
    }, baseRowCtx)).toBe('fallback');
  });

  it('evaluates IF', () => {
    expect(evaluateRowExpression({
      kind: 'function_call', functionName: 'IF',
      args: [
        { kind: 'literal', value: true },
        { kind: 'literal', value: 'yes' },
        { kind: 'literal', value: 'no' },
      ],
    }, baseRowCtx)).toBe('yes');
  });

  it('evaluates CLAMP', () => {
    expect(evaluateRowExpression({
      kind: 'function_call', functionName: 'CLAMP',
      args: [
        { kind: 'literal', value: 150 },
        { kind: 'literal', value: 0 },
        { kind: 'literal', value: 100 },
      ],
    }, baseRowCtx)).toBe(100);
  });

  it('evaluates CONCAT', () => {
    expect(evaluateRowExpression({
      kind: 'function_call', functionName: 'CONCAT',
      args: [
        { kind: 'literal', value: 'Hello' },
        { kind: 'literal', value: ' ' },
        { kind: 'literal', value: 'World' },
      ],
    }, baseRowCtx)).toBe('Hello World');
  });

  it('evaluates LEN', () => {
    expect(evaluateRowExpression({
      kind: 'function_call', functionName: 'LEN',
      args: [{ kind: 'field_ref', fieldName: 'name' }],
    }, baseRowCtx)).toBe(5);
  });

  it('evaluates complex nested expression', () => {
    // (rating / max_rating) * 100
    const expr: ExpressionNode = {
      kind: 'binary_op', operator: '*',
      left: {
        kind: 'binary_op', operator: '/',
        left: { kind: 'field_ref', fieldName: 'rating' },
        right: { kind: 'field_ref', fieldName: 'max_rating' },
      },
      right: { kind: 'literal', value: 100 },
    };
    expect(evaluateRowExpression(expr, baseRowCtx)).toBe(80);
  });

  it('type coercion: string number + number', () => {
    const ctx: RowExpressionContext = { row: { val: '42' }, params: {}, calculatedValues: {} };
    expect(evaluateRowExpression({
      kind: 'binary_op', operator: '+',
      left: { kind: 'field_ref', fieldName: 'val' },
      right: { kind: 'literal', value: 1 },
    }, ctx)).toBe(43);
  });
});

describe('evaluateMetricExpression', () => {
  const metricCtx: MetricExpressionContext = {
    metricValues: { avg_salary: 50000, headcount: 100, total_count: 500 },
    params: { target: 90 },
  };

  it('evaluates metric reference', () => {
    expect(evaluateMetricExpression(
      { kind: 'metric_ref', metricId: 'avg_salary' },
      metricCtx,
    )).toBe(50000);
  });

  it('evaluates composite expression: @avg * @headcount / @total', () => {
    const expr: ExpressionNode = {
      kind: 'binary_op', operator: '/',
      left: {
        kind: 'binary_op', operator: '*',
        left: { kind: 'metric_ref', metricId: 'avg_salary' },
        right: { kind: 'metric_ref', metricId: 'headcount' },
      },
      right: { kind: 'metric_ref', metricId: 'total_count' },
    };
    expect(evaluateMetricExpression(expr, metricCtx)).toBe(10000);
  });

  it('returns null for missing metric', () => {
    expect(evaluateMetricExpression(
      { kind: 'metric_ref', metricId: 'missing' },
      metricCtx,
    )).toBeNull();
  });

  it('evaluates param ref in metric context', () => {
    expect(evaluateMetricExpression(
      { kind: 'param_ref', parameterId: 'target' },
      metricCtx,
    )).toBe(90);
  });
});
