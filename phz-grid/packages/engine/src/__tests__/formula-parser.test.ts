import { describe, it, expect } from 'vitest';
import { parseFormula, formatFormula } from '../formula-parser.js';

describe('parseFormula', () => {
  it('parses number literal', () => {
    const { node, errors } = parseFormula('42');
    expect(errors).toEqual([]);
    expect(node?.kind).toBe('literal');
    expect((node as any).value).toBe(42);
  });

  it('parses decimal number', () => {
    const { node } = parseFormula('3.14');
    expect((node as any).value).toBe(3.14);
  });

  it('parses string literal', () => {
    const { node, errors } = parseFormula('"hello"');
    expect(errors).toEqual([]);
    expect(node?.kind).toBe('literal');
    expect((node as any).value).toBe('hello');
  });

  it('parses boolean true', () => {
    const { node } = parseFormula('true');
    expect(node?.kind).toBe('literal');
    expect((node as any).value).toBe(true);
  });

  it('parses boolean false', () => {
    const { node } = parseFormula('false');
    expect((node as any).value).toBe(false);
  });

  it('parses null', () => {
    const { node } = parseFormula('null');
    expect((node as any).value).toBe(null);
  });

  it('parses field reference', () => {
    const { node, errors } = parseFormula('[salary]');
    expect(errors).toEqual([]);
    expect(node?.kind).toBe('field_ref');
    expect((node as any).fieldName).toBe('salary');
  });

  it('parses param reference', () => {
    const { node, errors } = parseFormula('$target');
    expect(errors).toEqual([]);
    expect(node?.kind).toBe('param_ref');
    expect((node as any).parameterId).toBe('target');
  });

  it('parses metric reference', () => {
    const { node, errors } = parseFormula('@avg_salary');
    expect(errors).toEqual([]);
    expect(node?.kind).toBe('metric_ref');
    expect((node as any).metricId).toBe('avg_salary');
  });

  it('parses calc field reference', () => {
    const { node, errors } = parseFormula('~score');
    expect(errors).toEqual([]);
    expect(node?.kind).toBe('calc_ref');
    expect((node as any).calculatedFieldId).toBe('score');
  });

  it('parses addition', () => {
    const { node, errors } = parseFormula('[a] + [b]');
    expect(errors).toEqual([]);
    expect(node?.kind).toBe('binary_op');
    expect((node as any).operator).toBe('+');
  });

  it('parses multiplication with higher precedence', () => {
    const { node } = parseFormula('[a] + [b] * [c]');
    expect(node?.kind).toBe('binary_op');
    expect((node as any).operator).toBe('+');
    expect((node as any).right.kind).toBe('binary_op');
    expect((node as any).right.operator).toBe('*');
  });

  it('parses parenthesized expressions', () => {
    const { node } = parseFormula('([a] + [b]) * [c]');
    expect(node?.kind).toBe('binary_op');
    expect((node as any).operator).toBe('*');
    expect((node as any).left.kind).toBe('binary_op');
    expect((node as any).left.operator).toBe('+');
  });

  it('parses comparison operators', () => {
    const { node } = parseFormula('[a] > 10');
    expect(node?.kind).toBe('binary_op');
    expect((node as any).operator).toBe('gt');
  });

  it('parses equality', () => {
    const { node } = parseFormula('[a] == 5');
    expect((node as any).operator).toBe('eq');
  });

  it('parses inequality', () => {
    const { node } = parseFormula('[a] != 0');
    expect((node as any).operator).toBe('neq');
  });

  it('parses >= and <=', () => {
    const { node: n1 } = parseFormula('[a] >= 10');
    expect((n1 as any).operator).toBe('gte');
    const { node: n2 } = parseFormula('[a] <= 10');
    expect((n2 as any).operator).toBe('lte');
  });

  it('parses unary minus', () => {
    const { node } = parseFormula('-5');
    expect(node?.kind).toBe('unary_op');
    expect((node as any).operator).toBe('negate');
  });

  it('parses NOT', () => {
    const { node } = parseFormula('NOT true');
    expect(node?.kind).toBe('unary_op');
    expect((node as any).operator).toBe('not');
  });

  it('parses AND/OR', () => {
    const { node } = parseFormula('true AND false OR true');
    // OR has lower precedence, so the tree is: (true AND false) OR true
    expect(node?.kind).toBe('binary_op');
    expect((node as any).operator).toBe('or');
    expect((node as any).left.operator).toBe('and');
  });

  it('parses power operator', () => {
    const { node } = parseFormula('2 ^ 3');
    expect(node?.kind).toBe('binary_op');
    expect((node as any).operator).toBe('^');
  });

  it('parses IS NULL', () => {
    const { node, errors } = parseFormula('[email] IS NULL');
    expect(errors).toEqual([]);
    expect(node?.kind).toBe('null_check');
    expect((node as any).isNull).toBe(true);
  });

  it('parses IS NOT NULL', () => {
    const { node, errors } = parseFormula('[email] IS NOT NULL');
    expect(errors).toEqual([]);
    expect(node?.kind).toBe('null_check');
    expect((node as any).isNull).toBe(false);
  });

  it('parses function call', () => {
    const { node, errors } = parseFormula('ABS(-5)');
    expect(errors).toEqual([]);
    expect(node?.kind).toBe('function_call');
    expect((node as any).functionName).toBe('ABS');
    expect((node as any).args).toHaveLength(1);
  });

  it('parses function call with multiple args', () => {
    const { node } = parseFormula('ROUND(3.14, 1)');
    expect((node as any).args).toHaveLength(2);
  });

  it('parses IF as function', () => {
    const { node, errors } = parseFormula('IF([a] > 0, "pos", "neg")');
    expect(errors).toEqual([]);
    expect(node?.kind).toBe('function_call');
    expect((node as any).functionName).toBe('IF');
    expect((node as any).args).toHaveLength(3);
  });

  it('parses COALESCE', () => {
    const { node } = parseFormula('COALESCE([a], [b], 0)');
    expect((node as any).args).toHaveLength(3);
  });

  it('includes source positions', () => {
    const { node } = parseFormula('[salary]');
    expect(node?.pos).toBeDefined();
    expect(node!.pos!.start).toBe(0);
  });

  it('handles complex nested expression', () => {
    const { node, errors } = parseFormula('[rating] / [max_rating] * 100');
    expect(errors).toEqual([]);
    // Should parse as (rating / max_rating) * 100
    expect(node?.kind).toBe('binary_op');
    expect((node as any).operator).toBe('*');
  });

  it('reports error for unterminated field ref', () => {
    const { errors } = parseFormula('[salary');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('reports error for unexpected tokens', () => {
    const { errors } = parseFormula('??? bad');
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('formatFormula', () => {
  it('formats literal number', () => {
    expect(formatFormula({ kind: 'literal', value: 42 })).toBe('42');
  });

  it('formats literal string', () => {
    expect(formatFormula({ kind: 'literal', value: 'hello' })).toBe('"hello"');
  });

  it('formats literal null', () => {
    expect(formatFormula({ kind: 'literal', value: null })).toBe('null');
  });

  it('formats literal boolean', () => {
    expect(formatFormula({ kind: 'literal', value: true })).toBe('true');
  });

  it('formats field ref', () => {
    expect(formatFormula({ kind: 'field_ref', fieldName: 'salary' })).toBe('[salary]');
  });

  it('formats param ref', () => {
    expect(formatFormula({ kind: 'param_ref', parameterId: 'target' })).toBe('$target');
  });

  it('formats metric ref', () => {
    expect(formatFormula({ kind: 'metric_ref', metricId: 'avg' })).toBe('@avg');
  });

  it('formats calc ref', () => {
    expect(formatFormula({ kind: 'calc_ref', calculatedFieldId: 'score' })).toBe('~score');
  });

  it('formats binary op', () => {
    const result = formatFormula({
      kind: 'binary_op', operator: '+',
      left: { kind: 'field_ref', fieldName: 'a' },
      right: { kind: 'literal', value: 1 },
    });
    expect(result).toBe('[a] + 1');
  });

  it('formats function call', () => {
    const result = formatFormula({
      kind: 'function_call', functionName: 'ROUND',
      args: [{ kind: 'literal', value: 3.14 }, { kind: 'literal', value: 1 }],
    });
    expect(result).toBe('ROUND(3.14, 1)');
  });

  it('formats null check', () => {
    expect(formatFormula({
      kind: 'null_check',
      operand: { kind: 'field_ref', fieldName: 'x' },
      isNull: true,
    })).toBe('[x] IS NULL');
  });

  it('roundtrips: parse then format', () => {
    const original = '[a] + [b] * 100';
    const { node } = parseFormula(original);
    const formatted = formatFormula(node!);
    // Re-parse to verify equivalence
    const { node: reparsed, errors } = parseFormula(formatted);
    expect(errors).toEqual([]);
    expect(reparsed?.kind).toBe(node?.kind);
  });
});
