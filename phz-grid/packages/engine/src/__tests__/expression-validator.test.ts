import { describe, it, expect } from 'vitest';
import { validateExpression } from '../expression-validator.js';
import type { ExpressionNode } from '../expression-types.js';
import type { ExpressionValidationContext } from '../expression-validator.js';

const ctx: ExpressionValidationContext = {
  fields: ['salary', 'rating', 'name'],
  parameters: ['target'],
  calculatedFields: ['score'],
  metrics: ['avg_salary', 'headcount'],
};

describe('validateExpression', () => {
  it('valid field reference', () => {
    const errors = validateExpression({ kind: 'field_ref', fieldName: 'salary' }, ctx, 'row');
    expect(errors).toEqual([]);
  });

  it('unknown field reference', () => {
    const errors = validateExpression({ kind: 'field_ref', fieldName: 'unknown' }, ctx, 'row');
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('Unknown field');
  });

  it('field reference not allowed at metric level', () => {
    const errors = validateExpression({ kind: 'field_ref', fieldName: 'salary' }, ctx, 'metric');
    expect(errors.some(e => e.message.includes('not allowed in metric-level'))).toBe(true);
  });

  it('valid param reference', () => {
    const errors = validateExpression({ kind: 'param_ref', parameterId: 'target' }, ctx, 'row');
    expect(errors).toEqual([]);
  });

  it('unknown param reference', () => {
    const errors = validateExpression({ kind: 'param_ref', parameterId: 'missing' }, ctx, 'row');
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('Unknown parameter');
  });

  it('valid metric reference at metric level', () => {
    const errors = validateExpression({ kind: 'metric_ref', metricId: 'avg_salary' }, ctx, 'metric');
    expect(errors).toEqual([]);
  });

  it('unknown metric reference', () => {
    const errors = validateExpression({ kind: 'metric_ref', metricId: 'missing' }, ctx, 'metric');
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('Unknown metric');
  });

  it('metric reference not allowed at row level', () => {
    const errors = validateExpression({ kind: 'metric_ref', metricId: 'avg_salary' }, ctx, 'row');
    expect(errors.some(e => e.message.includes('not allowed in row-level'))).toBe(true);
  });

  it('valid calc ref at row level', () => {
    const errors = validateExpression({ kind: 'calc_ref', calculatedFieldId: 'score' }, ctx, 'row');
    expect(errors).toEqual([]);
  });

  it('unknown calc ref', () => {
    const errors = validateExpression({ kind: 'calc_ref', calculatedFieldId: 'missing' }, ctx, 'row');
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('Unknown calculated field');
  });

  it('calc ref not allowed at metric level', () => {
    const errors = validateExpression({ kind: 'calc_ref', calculatedFieldId: 'score' }, ctx, 'metric');
    expect(errors.some(e => e.message.includes('not allowed in metric-level'))).toBe(true);
  });

  it('validates function arity — too few args', () => {
    const expr: ExpressionNode = {
      kind: 'function_call', functionName: 'IF',
      args: [{ kind: 'literal', value: true }],
    };
    const errors = validateExpression(expr, ctx, 'row');
    expect(errors.some(e => e.message.includes('at least 3'))).toBe(true);
  });

  it('validates function arity — too many args', () => {
    const expr: ExpressionNode = {
      kind: 'function_call', functionName: 'ABS',
      args: [{ kind: 'literal', value: 1 }, { kind: 'literal', value: 2 }],
    };
    const errors = validateExpression(expr, ctx, 'row');
    expect(errors.some(e => e.message.includes('at most 1'))).toBe(true);
  });

  it('validates nested expressions', () => {
    const expr: ExpressionNode = {
      kind: 'binary_op', operator: '+',
      left: { kind: 'field_ref', fieldName: 'unknown1' },
      right: { kind: 'field_ref', fieldName: 'unknown2' },
    };
    const errors = validateExpression(expr, ctx, 'row');
    expect(errors).toHaveLength(2);
  });

  it('validates conditional branches', () => {
    const expr: ExpressionNode = {
      kind: 'conditional',
      condition: { kind: 'field_ref', fieldName: 'bad_cond' },
      thenBranch: { kind: 'field_ref', fieldName: 'salary' },
      elseBranch: { kind: 'field_ref', fieldName: 'bad_else' },
    };
    const errors = validateExpression(expr, ctx, 'row');
    expect(errors).toHaveLength(2);
  });

  it('validates null check operand', () => {
    const expr: ExpressionNode = {
      kind: 'null_check',
      operand: { kind: 'field_ref', fieldName: 'missing' },
      isNull: true,
    };
    const errors = validateExpression(expr, ctx, 'row');
    expect(errors).toHaveLength(1);
  });

  it('literals pass validation', () => {
    const errors = validateExpression({ kind: 'literal', value: 42 }, ctx, 'row');
    expect(errors).toEqual([]);
  });

  it('COALESCE accepts many args', () => {
    const expr: ExpressionNode = {
      kind: 'function_call', functionName: 'COALESCE',
      args: [
        { kind: 'literal', value: null },
        { kind: 'literal', value: null },
        { kind: 'literal', value: 'ok' },
      ],
    };
    const errors = validateExpression(expr, ctx, 'row');
    expect(errors).toEqual([]);
  });
});
