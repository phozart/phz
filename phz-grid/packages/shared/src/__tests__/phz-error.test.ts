import { describe, it, expect } from 'vitest';
import { PhzError } from '../errors/phz-error.js';
import { PhzValidationError } from '../errors/validation-error.js';
import type { ValidationFieldError } from '../errors/validation-error.js';
import type { ErrorScenario } from '../types/error-states.js';

describe('PhzError', () => {
  it('constructs with required properties', () => {
    const err = new PhzError('Something went wrong', {
      code: 'PHZ_TEST',
      scenario: 'unknown',
    });
    expect(err.message).toBe('Something went wrong');
    expect(err.code).toBe('PHZ_TEST');
    expect(err.scenario).toBe('unknown');
    expect(err.retryable).toBe(false);
    expect(err.correlationId).toBeUndefined();
    expect(err.name).toBe('PhzError');
  });

  it('constructs with all optional properties', () => {
    const cause = new Error('root cause');
    const err = new PhzError('Network failed', {
      code: 'NET_001',
      scenario: 'network-error',
      retryable: true,
      correlationId: 'req-abc-123',
      cause,
    });
    expect(err.retryable).toBe(true);
    expect(err.correlationId).toBe('req-abc-123');
    expect(err.cause).toBe(cause);
  });

  it('is an instance of Error', () => {
    const err = new PhzError('test', { code: 'X', scenario: 'unknown' });
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(PhzError);
  });

  describe('toErrorDetails()', () => {
    it('produces correct ErrorDetails', () => {
      const cause = new Error('db timeout');
      const err = new PhzError('Query timed out', {
        code: 'QUERY_TIMEOUT',
        scenario: 'timeout',
        retryable: true,
        correlationId: 'corr-456',
        cause,
      });

      const details = err.toErrorDetails();
      expect(details.scenario).toBe('timeout');
      expect(details.message).toBe('Query timed out');
      expect(details.code).toBe('QUERY_TIMEOUT');
      expect(details.retryable).toBe(true);
      expect(details.correlationId).toBe('corr-456');
      expect(details.technicalDetail).toBe('db timeout');
      expect(typeof details.timestamp).toBe('string');
      // Verify ISO 8601 format
      expect(new Date(details.timestamp).toISOString()).toBe(details.timestamp);
    });

    it('omits technicalDetail when cause is not an Error', () => {
      const err = new PhzError('Something broke', {
        code: 'X',
        scenario: 'unknown',
      });
      const details = err.toErrorDetails();
      expect(details.technicalDetail).toBeUndefined();
    });
  });

  describe('fromError()', () => {
    it('passes through PhzError unchanged', () => {
      const original = new PhzError('original', { code: 'X', scenario: 'server-error' });
      const result = PhzError.fromError(original);
      expect(result).toBe(original);
    });

    it('wraps a plain Error', () => {
      const plain = new Error('plain error');
      const wrapped = PhzError.fromError(plain);
      expect(wrapped).toBeInstanceOf(PhzError);
      expect(wrapped.message).toBe('plain error');
      expect(wrapped.code).toBe('PHZ_UNKNOWN');
      expect(wrapped.scenario).toBe('unknown');
      expect(wrapped.cause).toBe(plain);
    });

    it('wraps a plain Error with specified scenario', () => {
      const plain = new Error('network issue');
      const wrapped = PhzError.fromError(plain, 'network-error');
      expect(wrapped.scenario).toBe('network-error');
    });

    it('wraps a string', () => {
      const wrapped = PhzError.fromError('oops');
      expect(wrapped.message).toBe('oops');
      expect(wrapped.code).toBe('PHZ_UNKNOWN');
      expect(wrapped.cause).toBeUndefined();
    });

    it('wraps null/undefined', () => {
      const wrapped = PhzError.fromError(null);
      expect(wrapped.message).toBe('null');

      const wrapped2 = PhzError.fromError(undefined);
      expect(wrapped2.message).toBe('undefined');
    });
  });
});

describe('PhzValidationError', () => {
  it('constructs with default code and scenario', () => {
    const err = new PhzValidationError('Invalid field', {
      path: 'config.columns[0].name',
    });
    expect(err.name).toBe('PhzValidationError');
    expect(err.code).toBe('PHZ_VALIDATION');
    expect(err.scenario).toBe('query-error');
    expect(err.retryable).toBe(false);
    expect(err.path).toBe('config.columns[0].name');
    expect(err.fieldErrors).toEqual([{ path: 'config.columns[0].name', message: 'Invalid field' }]);
  });

  it('accepts explicit fieldErrors', () => {
    const fieldErrors: ValidationFieldError[] = [
      { path: 'name', message: 'Name is required' },
      { path: 'type', message: 'Type must be string or number' },
    ];
    const err = new PhzValidationError('Validation failed', {
      path: 'config',
      fieldErrors,
    });
    expect(err.fieldErrors).toEqual(fieldErrors);
  });

  it('accepts custom code and scenario', () => {
    const err = new PhzValidationError('Bad expression', {
      path: 'expression',
      code: 'EXPR_SYNTAX',
      scenario: 'parse-error',
    });
    expect(err.code).toBe('EXPR_SYNTAX');
    expect(err.scenario).toBe('parse-error');
  });

  it('is an instance of PhzError and Error', () => {
    const err = new PhzValidationError('test', { path: 'x' });
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(PhzError);
    expect(err).toBeInstanceOf(PhzValidationError);
  });

  it('produces ErrorDetails via toErrorDetails()', () => {
    const err = new PhzValidationError('Bad input', { path: 'field' });
    const details = err.toErrorDetails();
    expect(details.scenario).toBe('query-error');
    expect(details.message).toBe('Bad input');
    expect(details.retryable).toBe(false);
  });

  it('is recognized by PhzError.fromError as a PhzError', () => {
    const err = new PhzValidationError('test', { path: 'x' });
    const result = PhzError.fromError(err);
    expect(result).toBe(err);
  });
});
