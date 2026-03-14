import { describe, it, expect } from 'vitest';
import { PhzConfigError, PhzExpressionError } from '../errors.js';
import { PhzError } from '@phozart/shared';

describe('PhzConfigError', () => {
  it('constructs with required properties', () => {
    const err = new PhzConfigError('Invalid metric formula', {
      configType: 'metric',
    });
    expect(err.name).toBe('PhzConfigError');
    expect(err.message).toBe('Invalid metric formula');
    expect(err.configType).toBe('metric');
    expect(err.configId).toBeUndefined();
    expect(err.code).toBe('ENGINE_CONFIG');
    expect(err.scenario).toBe('query-error');
    expect(err.retryable).toBe(false);
  });

  it('accepts configId', () => {
    const err = new PhzConfigError('Widget not found', {
      configType: 'widget',
      configId: 'widget-kpi-001',
    });
    expect(err.configType).toBe('widget');
    expect(err.configId).toBe('widget-kpi-001');
  });

  it('accepts custom code', () => {
    const err = new PhzConfigError('Bad config', {
      configType: 'dashboard',
      code: 'DASH_INVALID',
    });
    expect(err.code).toBe('DASH_INVALID');
  });

  it('wraps a cause error', () => {
    const cause = new Error('JSON parse failed');
    const err = new PhzConfigError('Config parse error', {
      configType: 'report',
      cause,
    });
    expect(err.cause).toBe(cause);
  });

  it('is an instance of PhzError and Error', () => {
    const err = new PhzConfigError('test', { configType: 'x' });
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(PhzError);
    expect(err).toBeInstanceOf(PhzConfigError);
  });

  it('produces correct ErrorDetails', () => {
    const err = new PhzConfigError('Bad metric', { configType: 'metric', configId: 'met-1' });
    const details = err.toErrorDetails();
    expect(details.scenario).toBe('query-error');
    expect(details.message).toBe('Bad metric');
    expect(details.code).toBe('ENGINE_CONFIG');
    expect(details.retryable).toBe(false);
  });
});

describe('PhzExpressionError', () => {
  it('constructs with required properties', () => {
    const err = new PhzExpressionError('Unexpected token', {
      expression: 'ABS( + )',
    });
    expect(err.name).toBe('PhzExpressionError');
    expect(err.message).toBe('Unexpected token');
    expect(err.expression).toBe('ABS( + )');
    expect(err.position).toBeUndefined();
    expect(err.code).toBe('ENGINE_EXPRESSION');
    expect(err.scenario).toBe('query-error');
    expect(err.retryable).toBe(false);
  });

  it('accepts position', () => {
    const err = new PhzExpressionError('Bad char', {
      expression: '[field] + @',
      position: 10,
    });
    expect(err.position).toBe(10);
  });

  it('truncates long expressions', () => {
    const longExpr = 'CONCAT(' + 'a'.repeat(300) + ')';
    const err = new PhzExpressionError('Too complex', {
      expression: longExpr,
    });
    expect(err.expression.length).toBeLessThanOrEqual(203); // 200 + '...'
    expect(err.expression.endsWith('...')).toBe(true);
  });

  it('does not truncate short expressions', () => {
    const shortExpr = 'ABS([x]) + 1';
    const err = new PhzExpressionError('Error', {
      expression: shortExpr,
    });
    expect(err.expression).toBe(shortExpr);
  });

  it('accepts custom code', () => {
    const err = new PhzExpressionError('Parse fail', {
      expression: 'bad',
      code: 'EXPR_PARSE',
    });
    expect(err.code).toBe('EXPR_PARSE');
  });

  it('is an instance of PhzError and Error', () => {
    const err = new PhzExpressionError('test', { expression: 'x' });
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(PhzError);
    expect(err).toBeInstanceOf(PhzExpressionError);
  });

  it('produces correct ErrorDetails', () => {
    const err = new PhzExpressionError('Syntax error', { expression: 'IF(x, ,)' });
    const details = err.toErrorDetails();
    expect(details.scenario).toBe('query-error');
    expect(details.message).toBe('Syntax error');
    expect(details.code).toBe('ENGINE_EXPRESSION');
    expect(details.retryable).toBe(false);
  });

  it('is recognized by PhzError.fromError as a PhzError', () => {
    const err = new PhzExpressionError('test', { expression: 'x' });
    const result = PhzError.fromError(err);
    expect(result).toBe(err);
  });
});
