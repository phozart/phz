/**
 * @phozart/shared — Validation Error
 *
 * PhzValidationError is thrown when input validation fails (e.g., expression
 * syntax errors, invalid config, malformed filters). Carries structured
 * field-level errors for form/UI rendering.
 */

import { PhzError } from './phz-error.js';
import type { ErrorScenario } from '../types/error-states.js';

export interface ValidationFieldError {
  path: string;
  message: string;
}

export class PhzValidationError extends PhzError {
  readonly path: string;
  readonly fieldErrors: ValidationFieldError[];

  constructor(message: string, options: {
    path: string;
    fieldErrors?: ValidationFieldError[];
    code?: string;
    scenario?: ErrorScenario;
    cause?: Error;
  }) {
    super(message, {
      code: options.code ?? 'PHZ_VALIDATION',
      scenario: options.scenario ?? 'query-error',
      retryable: false,
      cause: options.cause,
    });
    this.name = 'PhzValidationError';
    this.path = options.path;
    this.fieldErrors = options.fieldErrors ?? [{ path: options.path, message }];
  }
}
