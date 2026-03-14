import { describe, it, expect } from 'vitest';
import { PhzConnectionError, PhzQueryError } from '../errors.js';
import { PhzError } from '@phozart/shared';
import type { ConnectionPhase } from '../errors.js';

describe('PhzConnectionError', () => {
  it('constructs with required properties', () => {
    const err = new PhzConnectionError('Connection refused', {
      phase: 'connect',
    });
    expect(err.name).toBe('PhzConnectionError');
    expect(err.message).toBe('Connection refused');
    expect(err.phase).toBe('connect');
    expect(err.code).toBe('DUCKDB_CONNECTION');
    expect(err.scenario).toBe('network-error');
    expect(err.retryable).toBe(true); // default for connection errors
  });

  it('accepts all phases', () => {
    const phases: ConnectionPhase[] = ['init', 'connect', 'load', 'query', 'close'];
    for (const phase of phases) {
      const err = new PhzConnectionError(`Failed at ${phase}`, { phase });
      expect(err.phase).toBe(phase);
    }
  });

  it('accepts custom code and retryable flag', () => {
    const err = new PhzConnectionError('Fatal init', {
      phase: 'init',
      code: 'DUCKDB_INIT_FATAL',
      retryable: false,
    });
    expect(err.code).toBe('DUCKDB_INIT_FATAL');
    expect(err.retryable).toBe(false);
  });

  it('passes through correlationId', () => {
    const err = new PhzConnectionError('timeout', {
      phase: 'load',
      correlationId: 'load-req-789',
    });
    expect(err.correlationId).toBe('load-req-789');
  });

  it('wraps a cause error', () => {
    const cause = new Error('ECONNREFUSED');
    const err = new PhzConnectionError('Connection failed', {
      phase: 'connect',
      cause,
    });
    expect(err.cause).toBe(cause);
  });

  it('is an instance of PhzError and Error', () => {
    const err = new PhzConnectionError('test', { phase: 'init' });
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(PhzError);
    expect(err).toBeInstanceOf(PhzConnectionError);
  });

  it('produces correct ErrorDetails via toErrorDetails()', () => {
    const cause = new Error('underlying issue');
    const err = new PhzConnectionError('DB unavailable', {
      phase: 'connect',
      correlationId: 'corr-001',
      cause,
    });
    const details = err.toErrorDetails();
    expect(details.scenario).toBe('network-error');
    expect(details.message).toBe('DB unavailable');
    expect(details.code).toBe('DUCKDB_CONNECTION');
    expect(details.retryable).toBe(true);
    expect(details.correlationId).toBe('corr-001');
    expect(details.technicalDetail).toBe('underlying issue');
    expect(typeof details.timestamp).toBe('string');
  });
});

describe('PhzQueryError', () => {
  it('constructs with required properties', () => {
    const err = new PhzQueryError('Syntax error near "SELCT"', {
      sql: 'SELCT * FROM data',
    });
    expect(err.name).toBe('PhzQueryError');
    expect(err.message).toBe('Syntax error near "SELCT"');
    expect(err.sql).toBe('SELCT * FROM data');
    expect(err.code).toBe('DUCKDB_QUERY');
    expect(err.scenario).toBe('query-error');
    expect(err.retryable).toBe(false); // default for query errors
  });

  it('truncates SQL over 500 characters', () => {
    const longSql = 'SELECT ' + 'a'.repeat(600) + ' FROM data';
    const err = new PhzQueryError('Query failed', { sql: longSql });
    expect(err.sql.length).toBeLessThanOrEqual(503); // 500 + '...'
    expect(err.sql.endsWith('...')).toBe(true);
  });

  it('does not truncate short SQL', () => {
    const shortSql = 'SELECT * FROM data';
    const err = new PhzQueryError('Query failed', { sql: shortSql });
    expect(err.sql).toBe(shortSql);
  });

  it('accepts custom code and retryable', () => {
    const err = new PhzQueryError('Timeout', {
      sql: 'SELECT * FROM big_table',
      code: 'DUCKDB_TIMEOUT',
      retryable: true,
    });
    expect(err.code).toBe('DUCKDB_TIMEOUT');
    expect(err.retryable).toBe(true);
  });

  it('is an instance of PhzError and Error', () => {
    const err = new PhzQueryError('test', { sql: 'SELECT 1' });
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(PhzError);
    expect(err).toBeInstanceOf(PhzQueryError);
  });

  it('produces correct ErrorDetails', () => {
    const err = new PhzQueryError('Division by zero', {
      sql: 'SELECT 1/0',
      correlationId: 'q-123',
    });
    const details = err.toErrorDetails();
    expect(details.scenario).toBe('query-error');
    expect(details.message).toBe('Division by zero');
    expect(details.code).toBe('DUCKDB_QUERY');
    expect(details.retryable).toBe(false);
    expect(details.correlationId).toBe('q-123');
  });

  it('is recognized by PhzError.fromError as a PhzError', () => {
    const err = new PhzQueryError('test', { sql: 'SELECT 1' });
    const result = PhzError.fromError(err);
    expect(result).toBe(err);
  });
});
