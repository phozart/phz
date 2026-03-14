/**
 * @phozart/duckdb — DuckDB Error Classes
 *
 * Custom error types for DuckDB connection and query failures.
 * Extends PhzError to integrate with the grid error rendering system.
 */

import { PhzError } from '@phozart/shared';
import type { ErrorScenario } from '@phozart/shared';

export type ConnectionPhase = 'init' | 'connect' | 'load' | 'query' | 'close';

export class PhzConnectionError extends PhzError {
  readonly phase: ConnectionPhase;

  constructor(message: string, options: {
    phase: ConnectionPhase;
    code?: string;
    retryable?: boolean;
    correlationId?: string;
    cause?: Error;
  }) {
    super(message, {
      code: options.code ?? 'DUCKDB_CONNECTION',
      scenario: 'network-error' as ErrorScenario,
      retryable: options.retryable ?? true,
      correlationId: options.correlationId,
      cause: options.cause,
    });
    this.name = 'PhzConnectionError';
    this.phase = options.phase;
  }
}

export class PhzQueryError extends PhzError {
  readonly sql: string;

  constructor(message: string, options: {
    sql: string;
    code?: string;
    retryable?: boolean;
    correlationId?: string;
    cause?: Error;
  }) {
    // Sanitize SQL — truncate overly long queries to avoid leaking data
    const sanitizedSql = options.sql.length > 500
      ? options.sql.substring(0, 500) + '...'
      : options.sql;

    super(message, {
      code: options.code ?? 'DUCKDB_QUERY',
      scenario: 'query-error' as ErrorScenario,
      retryable: options.retryable ?? false,
      correlationId: options.correlationId,
      cause: options.cause,
    });
    this.name = 'PhzQueryError';
    this.sql = sanitizedSql;
  }
}
