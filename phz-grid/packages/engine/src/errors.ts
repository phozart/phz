/**
 * @phozart/engine — Engine Error Classes
 *
 * Custom error types for configuration and expression evaluation failures.
 * Extends PhzError to integrate with the grid error rendering system.
 */

import { PhzError } from '@phozart/shared';
import type { ErrorScenario } from '@phozart/shared';

export class PhzConfigError extends PhzError {
  readonly configType: string;
  readonly configId?: string;

  constructor(message: string, options: {
    configType: string;
    configId?: string;
    code?: string;
    cause?: Error;
  }) {
    super(message, {
      code: options.code ?? 'ENGINE_CONFIG',
      scenario: 'query-error' as ErrorScenario,
      retryable: false,
      cause: options.cause,
    });
    this.name = 'PhzConfigError';
    this.configType = options.configType;
    this.configId = options.configId;
  }
}

export class PhzExpressionError extends PhzError {
  readonly expression: string;
  readonly position?: number;

  constructor(message: string, options: {
    expression: string;
    position?: number;
    code?: string;
    cause?: Error;
  }) {
    super(message, {
      code: options.code ?? 'ENGINE_EXPRESSION',
      scenario: 'query-error' as ErrorScenario,
      retryable: false,
      cause: options.cause,
    });
    this.name = 'PhzExpressionError';
    this.expression = options.expression.length > 200
      ? options.expression.substring(0, 200) + '...'
      : options.expression;
    this.position = options.position;
  }
}
