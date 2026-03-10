/**
 * Expression compiler AST depth limit test
 *
 * Verifies that deeply nested expressions are rejected to prevent
 * stack exhaustion attacks.
 */
import { describe, it, expect } from 'vitest';
import { compileRowExpression, compileMetricExpression } from '../expression-compiler.js';
import type { ExpressionNode } from '../expression-types.js';

function buildDeeplyNested(depth: number): ExpressionNode {
  let node: ExpressionNode = { kind: 'literal', value: 1 };
  for (let i = 0; i < depth; i++) {
    node = {
      kind: 'unary_op',
      operator: 'negate',
      operand: node,
    };
  }
  return node;
}

function buildDeepBinaryTree(depth: number): ExpressionNode {
  let node: ExpressionNode = { kind: 'literal', value: 1 };
  for (let i = 0; i < depth; i++) {
    node = {
      kind: 'binary_op',
      operator: '+',
      left: node,
      right: { kind: 'literal', value: 1 },
    };
  }
  return node;
}

describe('expression compiler depth limit', () => {
  it('compiles expressions within depth limit', () => {
    const shallow = buildDeeplyNested(50);
    expect(() => compileRowExpression(shallow)).not.toThrow();
  });

  it('rejects row expressions exceeding depth limit', () => {
    const deep = buildDeeplyNested(110);
    expect(() => compileRowExpression(deep)).toThrow('exceeds maximum depth');
  });

  it('rejects metric expressions exceeding depth limit', () => {
    const deep = buildDeeplyNested(110);
    expect(() => compileMetricExpression(deep)).toThrow('exceeds maximum depth');
  });

  it('rejects deeply nested binary trees', () => {
    const deep = buildDeepBinaryTree(110);
    expect(() => compileRowExpression(deep)).toThrow('exceeds maximum depth');
  });

  it('accepts binary trees within limit', () => {
    const ok = buildDeepBinaryTree(50);
    expect(() => compileRowExpression(ok)).not.toThrow();
  });

  it('compiled shallow expression still evaluates correctly', () => {
    const node: ExpressionNode = {
      kind: 'binary_op',
      operator: '+',
      left: { kind: 'literal', value: 3 },
      right: { kind: 'literal', value: 4 },
    };
    const fn = compileRowExpression(node);
    expect(fn({ row: {}, params: {}, calculatedValues: {} })).toBe(7);
  });
});
