import { describe, it, expect } from 'vitest';
import { parseFormula, formatFormula } from '../formula-parser.js';
import { compileRowExpression } from '../expression-compiler.js';
import type { ExpressionNode } from '../expression-types.js';
import type { RowExpressionContext } from '../expression-evaluator.js';

const ctx: RowExpressionContext = {
  row: { x: 16, name: 'Hello World', date: '2025-06-15' },
  params: {},
  calculatedValues: {},
};

function parseOk(text: string): ExpressionNode {
  const result = parseFormula(text);
  expect(result.errors).toHaveLength(0);
  expect(result.node).not.toBeNull();
  return result.node!;
}

describe('formula parser — new function names', () => {
  // --- Math ---

  it('parses SQRT(16)', () => {
    const node = parseOk('SQRT(16)');
    expect(node.kind).toBe('function_call');
    if (node.kind === 'function_call') {
      expect(node.functionName).toBe('SQRT');
      expect(node.args).toHaveLength(1);
    }
  });

  it('parses POWER(2, 10)', () => {
    const node = parseOk('POWER(2, 10)');
    expect(node.kind).toBe('function_call');
    if (node.kind === 'function_call') {
      expect(node.functionName).toBe('POWER');
      expect(node.args).toHaveLength(2);
    }
  });

  it('parses MOD(10, 3)', () => {
    const node = parseOk('MOD(10, 3)');
    expect(node.kind).toBe('function_call');
    if (node.kind === 'function_call') {
      expect(node.functionName).toBe('MOD');
      expect(node.args).toHaveLength(2);
    }
  });

  it('parses LOG(100)', () => {
    const node = parseOk('LOG(100)');
    expect(node.kind).toBe('function_call');
    if (node.kind === 'function_call') {
      expect(node.functionName).toBe('LOG');
      expect(node.args).toHaveLength(1);
    }
  });

  it('parses LOG(10, 100)', () => {
    const node = parseOk('LOG(10, 100)');
    expect(node.kind).toBe('function_call');
    if (node.kind === 'function_call') {
      expect(node.functionName).toBe('LOG');
      expect(node.args).toHaveLength(2);
    }
  });

  it('parses EXP(1)', () => {
    const node = parseOk('EXP(1)');
    expect(node.kind).toBe('function_call');
    if (node.kind === 'function_call') {
      expect(node.functionName).toBe('EXP');
      expect(node.args).toHaveLength(1);
    }
  });

  // --- String ---

  it('parses LEFT("hello", 3)', () => {
    const node = parseOk('LEFT("hello", 3)');
    expect(node.kind).toBe('function_call');
    if (node.kind === 'function_call') {
      expect(node.functionName).toBe('LEFT');
      expect(node.args).toHaveLength(2);
    }
  });

  it('parses RIGHT("hello", 2)', () => {
    const node = parseOk('RIGHT("hello", 2)');
    expect(node.kind).toBe('function_call');
    if (node.kind === 'function_call') {
      expect(node.functionName).toBe('RIGHT');
      expect(node.args).toHaveLength(2);
    }
  });

  it('parses REPLACE("hello world", "world", "there")', () => {
    const node = parseOk('REPLACE("hello world", "world", "there")');
    expect(node.kind).toBe('function_call');
    if (node.kind === 'function_call') {
      expect(node.functionName).toBe('REPLACE');
      expect(node.args).toHaveLength(3);
    }
  });

  it('parses REPEAT("ab", 3)', () => {
    const node = parseOk('REPEAT("ab", 3)');
    expect(node.kind).toBe('function_call');
    if (node.kind === 'function_call') {
      expect(node.functionName).toBe('REPEAT');
      expect(node.args).toHaveLength(2);
    }
  });

  // --- Date ---

  it('parses DATE_DIFF("day", [start], [end])', () => {
    const node = parseOk('DATE_DIFF("day", [start], [end])');
    expect(node.kind).toBe('function_call');
    if (node.kind === 'function_call') {
      expect(node.functionName).toBe('DATE_DIFF');
      expect(node.args).toHaveLength(3);
    }
  });

  it('parses DATE_ADD("month", 1, [date])', () => {
    const node = parseOk('DATE_ADD("month", 1, [date])');
    expect(node.kind).toBe('function_call');
    if (node.kind === 'function_call') {
      expect(node.functionName).toBe('DATE_ADD');
      expect(node.args).toHaveLength(3);
    }
  });

  it('parses FORMAT_DATE("YYYY-MM-DD", [date])', () => {
    const node = parseOk('FORMAT_DATE("YYYY-MM-DD", [date])');
    expect(node.kind).toBe('function_call');
    if (node.kind === 'function_call') {
      expect(node.functionName).toBe('FORMAT_DATE');
      expect(node.args).toHaveLength(2);
    }
  });

  // --- Statistical ---

  it('parses STDDEV([x])', () => {
    const node = parseOk('STDDEV([x])');
    expect(node.kind).toBe('function_call');
    if (node.kind === 'function_call') {
      expect(node.functionName).toBe('STDDEV');
    }
  });

  it('parses VARIANCE([x])', () => {
    const node = parseOk('VARIANCE([x])');
    expect(node.kind).toBe('function_call');
    if (node.kind === 'function_call') {
      expect(node.functionName).toBe('VARIANCE');
    }
  });

  it('parses PERCENTILE(0.5, [x])', () => {
    const node = parseOk('PERCENTILE(0.5, [x])');
    expect(node.kind).toBe('function_call');
    if (node.kind === 'function_call') {
      expect(node.functionName).toBe('PERCENTILE');
      expect(node.args).toHaveLength(2);
    }
  });

  // --- Window ---

  it('parses RANK([x], 1, 2, 3)', () => {
    const node = parseOk('RANK([x], 1, 2, 3)');
    expect(node.kind).toBe('function_call');
    if (node.kind === 'function_call') {
      expect(node.functionName).toBe('RANK');
      expect(node.args).toHaveLength(4);
    }
  });

  it('parses DENSE_RANK([x], 1, 2)', () => {
    const node = parseOk('DENSE_RANK([x], 1, 2)');
    expect(node.kind).toBe('function_call');
    if (node.kind === 'function_call') {
      expect(node.functionName).toBe('DENSE_RANK');
      expect(node.args).toHaveLength(3);
    }
  });

  it('parses LAG([x], 1)', () => {
    const node = parseOk('LAG([x], 1)');
    expect(node.kind).toBe('function_call');
    if (node.kind === 'function_call') {
      expect(node.functionName).toBe('LAG');
      expect(node.args).toHaveLength(2);
    }
  });

  it('parses LEAD([x], 1, 0)', () => {
    const node = parseOk('LEAD([x], 1, 0)');
    expect(node.kind).toBe('function_call');
    if (node.kind === 'function_call') {
      expect(node.functionName).toBe('LEAD');
      expect(node.args).toHaveLength(3);
    }
  });

  it('parses RUNNING_SUM(1, 2, 3)', () => {
    const node = parseOk('RUNNING_SUM(1, 2, 3)');
    expect(node.kind).toBe('function_call');
    if (node.kind === 'function_call') {
      expect(node.functionName).toBe('RUNNING_SUM');
      expect(node.args).toHaveLength(3);
    }
  });

  it('parses NTILE(4, [x])', () => {
    const node = parseOk('NTILE(4, [x])');
    expect(node.kind).toBe('function_call');
    if (node.kind === 'function_call') {
      expect(node.functionName).toBe('NTILE');
      expect(node.args).toHaveLength(2);
    }
  });

  // --- Case-insensitive parsing ---

  it('parses lowercase function names', () => {
    const node = parseOk('sqrt(16)');
    expect(node.kind).toBe('function_call');
    if (node.kind === 'function_call') {
      expect(node.functionName).toBe('SQRT');
    }
  });

  it('parses mixed-case function names', () => {
    const node = parseOk('Power(2, 3)');
    expect(node.kind).toBe('function_call');
    if (node.kind === 'function_call') {
      expect(node.functionName).toBe('POWER');
    }
  });
});

describe('formula parser — round-trip: parse → compile → evaluate', () => {
  it('SQRT(16) = 4', () => {
    const node = parseOk('SQRT([x])');
    const fn = compileRowExpression(node);
    expect(fn(ctx)).toBe(4);
  });

  it('POWER(2, 10) = 1024', () => {
    const node = parseOk('POWER(2, 10)');
    const fn = compileRowExpression(node);
    expect(fn({ ...ctx, row: {} })).toBe(1024);
  });

  it('MOD(10, 3) = 1', () => {
    const node = parseOk('MOD(10, 3)');
    const fn = compileRowExpression(node);
    expect(fn({ ...ctx, row: {} })).toBe(1);
  });

  it('EXP(0) = 1', () => {
    const node = parseOk('EXP(0)');
    const fn = compileRowExpression(node);
    expect(fn({ ...ctx, row: {} })).toBe(1);
  });

  it('LEFT("Hello World", 5) = "Hello"', () => {
    const node = parseOk('LEFT("Hello World", 5)');
    const fn = compileRowExpression(node);
    expect(fn({ ...ctx, row: {} })).toBe('Hello');
  });

  it('RIGHT("Hello World", 5) = "World"', () => {
    const node = parseOk('RIGHT("Hello World", 5)');
    const fn = compileRowExpression(node);
    expect(fn({ ...ctx, row: {} })).toBe('World');
  });

  it('REPLACE("hello world", "world", "there") = "hello there"', () => {
    const node = parseOk('REPLACE("hello world", "world", "there")');
    const fn = compileRowExpression(node);
    expect(fn({ ...ctx, row: {} })).toBe('hello there');
  });

  it('REPEAT("ab", 3) = "ababab"', () => {
    const node = parseOk('REPEAT("ab", 3)');
    const fn = compileRowExpression(node);
    expect(fn({ ...ctx, row: {} })).toBe('ababab');
  });

  it('RUNNING_SUM(1, 2, 3) = 6', () => {
    const node = parseOk('RUNNING_SUM(1, 2, 3)');
    const fn = compileRowExpression(node);
    expect(fn({ ...ctx, row: {} })).toBe(6);
  });
});

describe('formula parser — formatFormula round-trip', () => {
  it('formats SQRT', () => {
    const node = parseOk('SQRT(16)');
    expect(formatFormula(node)).toBe('SQRT(16)');
  });

  it('formats POWER', () => {
    const node = parseOk('POWER(2, 10)');
    expect(formatFormula(node)).toBe('POWER(2, 10)');
  });

  it('formats DATE_DIFF', () => {
    const node = parseOk('DATE_DIFF("day", [start], [end])');
    expect(formatFormula(node)).toBe('DATE_DIFF("day", [start], [end])');
  });

  it('formats RUNNING_SUM', () => {
    const node = parseOk('RUNNING_SUM(1, 2, 3)');
    expect(formatFormula(node)).toBe('RUNNING_SUM(1, 2, 3)');
  });
});
