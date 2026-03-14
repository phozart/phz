/**
 * @phozart/shared — Base Error Class
 *
 * PhzError is the root of the custom error hierarchy for all phz-grid packages.
 * It bridges to the ErrorDetails type for rendering user-friendly error states.
 */

import type { ErrorScenario, ErrorDetails } from '../types/error-states.js';

export class PhzError extends Error {
  readonly code: string;
  readonly scenario: ErrorScenario;
  readonly retryable: boolean;
  readonly correlationId?: string;

  constructor(message: string, options: {
    code: string;
    scenario: ErrorScenario;
    retryable?: boolean;
    correlationId?: string;
    cause?: Error;
  }) {
    super(message, { cause: options.cause });
    this.name = 'PhzError';
    this.code = options.code;
    this.scenario = options.scenario;
    this.retryable = options.retryable ?? false;
    this.correlationId = options.correlationId;
  }

  toErrorDetails(): ErrorDetails {
    return {
      scenario: this.scenario,
      message: this.message,
      code: this.code,
      timestamp: new Date().toISOString(),
      correlationId: this.correlationId,
      technicalDetail: this.cause instanceof Error ? this.cause.message : undefined,
      retryable: this.retryable,
    };
  }

  static fromError(err: unknown, scenario: ErrorScenario = 'unknown'): PhzError {
    if (err instanceof PhzError) return err;
    const message = err instanceof Error ? err.message : String(err);
    const cause = err instanceof Error ? err : undefined;
    return new PhzError(message, { code: 'PHZ_UNKNOWN', scenario, cause });
  }
}
