/**
 * Tests for error state types and helpers.
 */
import {
  createDefaultErrorStateConfig,
  pickRandomMessage,
  formatErrorForClipboard,
  createErrorState,
  isRetryableError,
} from '@phozart/phz-shared/types';
import type { ErrorScenario, ErrorDetails, ErrorState } from '@phozart/phz-shared/types';

// ========================================================================
// createDefaultErrorStateConfig
// ========================================================================

describe('createDefaultErrorStateConfig', () => {
  const ALL_SCENARIOS: ErrorScenario[] = [
    'network-error', 'auth-expired', 'forbidden', 'not-found',
    'server-error', 'query-error', 'parse-error', 'quota-exceeded',
    'timeout', 'unknown',
  ];

  it.each(ALL_SCENARIOS)('creates config for scenario "%s"', (scenario) => {
    const config = createDefaultErrorStateConfig(scenario);
    expect(config.scenario).toBe(scenario);
    expect(typeof config.icon).toBe('string');
    expect(typeof config.title).toBe('string');
    expect(typeof config.description).toBe('string');
  });

  it('defaults to "unknown" when no scenario is given', () => {
    const config = createDefaultErrorStateConfig();
    expect(config.scenario).toBe('unknown');
  });

  it('returns a fresh copy each time', () => {
    const a = createDefaultErrorStateConfig('network-error');
    const b = createDefaultErrorStateConfig('network-error');
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
    if (a.alternateMessages && b.alternateMessages) {
      expect(a.alternateMessages).not.toBe(b.alternateMessages);
    }
  });

  it('network-error config has retry action', () => {
    const config = createDefaultErrorStateConfig('network-error');
    expect(config.actionLabel).toBe('Retry');
    expect(config.actionId).toBe('retry');
  });

  it('auth-expired config has sign-in action', () => {
    const config = createDefaultErrorStateConfig('auth-expired');
    expect(config.actionLabel).toBe('Sign In');
    expect(config.actionId).toBe('sign-in');
  });

  it('forbidden config has no action', () => {
    const config = createDefaultErrorStateConfig('forbidden');
    expect(config.actionLabel).toBeUndefined();
    expect(config.actionId).toBeUndefined();
  });

  it('parse-error config has no alternate messages', () => {
    const config = createDefaultErrorStateConfig('parse-error');
    expect(config.alternateMessages).toBeUndefined();
  });
});

// ========================================================================
// pickRandomMessage
// ========================================================================

describe('pickRandomMessage', () => {
  it('returns a string for scenarios with alternate messages', () => {
    const message = pickRandomMessage('network-error');
    expect(typeof message).toBe('string');
    expect(message.length).toBeGreaterThan(0);
  });

  it('returns description for parse-error (no alternates)', () => {
    const message = pickRandomMessage('parse-error');
    expect(message).toContain('could not be parsed');
  });

  it('returns a message for unknown scenario', () => {
    const message = pickRandomMessage('unknown');
    expect(typeof message).toBe('string');
    expect(message.length).toBeGreaterThan(0);
  });
});

// ========================================================================
// formatErrorForClipboard
// ========================================================================

describe('formatErrorForClipboard', () => {
  it('formats basic error details', () => {
    const details: ErrorDetails = {
      scenario: 'server-error',
      message: 'Internal Server Error',
      timestamp: '2026-03-08T12:00:00Z',
      retryable: true,
    };
    const result = formatErrorForClipboard(details);
    expect(result).toContain('Error: Internal Server Error');
    expect(result).toContain('Scenario: server-error');
    expect(result).toContain('Time: 2026-03-08T12:00:00Z');
    expect(result).toContain('Retryable: yes');
  });

  it('includes code when present', () => {
    const details: ErrorDetails = {
      scenario: 'server-error',
      message: 'Error',
      timestamp: '2026-03-08T12:00:00Z',
      retryable: false,
      code: 500,
    };
    const result = formatErrorForClipboard(details);
    expect(result).toContain('Code: 500');
    expect(result).toContain('Retryable: no');
  });

  it('includes string code', () => {
    const details: ErrorDetails = {
      scenario: 'query-error',
      message: 'Error',
      timestamp: 'now',
      retryable: false,
      code: 'SQL_SYNTAX',
    };
    const result = formatErrorForClipboard(details);
    expect(result).toContain('Code: SQL_SYNTAX');
  });

  it('includes correlationId when present', () => {
    const details: ErrorDetails = {
      scenario: 'unknown',
      message: 'Error',
      timestamp: 'now',
      retryable: false,
      correlationId: 'abc-123',
    };
    const result = formatErrorForClipboard(details);
    expect(result).toContain('Correlation ID: abc-123');
  });

  it('includes technicalDetail when present', () => {
    const details: ErrorDetails = {
      scenario: 'unknown',
      message: 'Error',
      timestamp: 'now',
      retryable: false,
      technicalDetail: 'Stack trace here',
    };
    const result = formatErrorForClipboard(details);
    expect(result).toContain('Detail: Stack trace here');
  });

  it('omits optional fields when not present', () => {
    const details: ErrorDetails = {
      scenario: 'timeout',
      message: 'Timeout',
      timestamp: 'now',
      retryable: true,
    };
    const result = formatErrorForClipboard(details);
    expect(result).not.toContain('Code:');
    expect(result).not.toContain('Correlation ID:');
    expect(result).not.toContain('Detail:');
  });
});

// ========================================================================
// createErrorState
// ========================================================================

describe('createErrorState', () => {
  it('creates an error state with defaults', () => {
    const state = createErrorState('E001', 'Something went wrong');
    expect(state.code).toBe('E001');
    expect(state.message).toBe('Something went wrong');
    expect(state.severity).toBe('error');
    expect(state.retryable).toBe(false);
    expect(typeof state.timestamp).toBe('number');
  });

  it('accepts custom severity and retryable', () => {
    const state = createErrorState('E002', 'Warning', 'warning', true);
    expect(state.severity).toBe('warning');
    expect(state.retryable).toBe(true);
  });

  it('accepts info severity', () => {
    const state = createErrorState('I001', 'Info', 'info');
    expect(state.severity).toBe('info');
  });

  it('accepts fatal severity', () => {
    const state = createErrorState('F001', 'Fatal', 'fatal', true);
    expect(state.severity).toBe('fatal');
  });
});

// ========================================================================
// isRetryableError
// ========================================================================

describe('isRetryableError', () => {
  it('returns true for retryable non-fatal error', () => {
    const error: ErrorState = {
      code: 'E001',
      message: 'Error',
      severity: 'error',
      retryable: true,
      timestamp: Date.now(),
    };
    expect(isRetryableError(error)).toBe(true);
  });

  it('returns true for retryable warning', () => {
    const error: ErrorState = {
      code: 'W001',
      message: 'Warning',
      severity: 'warning',
      retryable: true,
      timestamp: Date.now(),
    };
    expect(isRetryableError(error)).toBe(true);
  });

  it('returns false for non-retryable error', () => {
    const error: ErrorState = {
      code: 'E001',
      message: 'Error',
      severity: 'error',
      retryable: false,
      timestamp: Date.now(),
    };
    expect(isRetryableError(error)).toBe(false);
  });

  it('returns false for fatal error even if retryable flag is true', () => {
    const error: ErrorState = {
      code: 'F001',
      message: 'Fatal',
      severity: 'fatal',
      retryable: true,
      timestamp: Date.now(),
    };
    expect(isRetryableError(error)).toBe(false);
  });
});
