/**
 * Error State Configuration
 *
 * Types and helpers for rendering user-friendly error states across the grid,
 * dashboard widgets, and workspace shell. Each ErrorScenario maps to a
 * pre-configured title, description, icon, and optional recovery action.
 */

// ========================================================================
// Error Severity (kept from original for backward compatibility)
// ========================================================================

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'fatal';

// ========================================================================
// Error Scenarios
// ========================================================================

/**
 * Union of all recognized error scenarios.
 *
 * - `network-error`: fetch/XHR failed (timeout, DNS, CORS, offline)
 * - `auth-expired`: session/token expired, re-auth needed
 * - `forbidden`: user lacks permission for the requested resource
 * - `not-found`: resource (dashboard, report, data source) does not exist
 * - `server-error`: upstream 5xx response
 * - `query-error`: SQL / query execution failed
 * - `parse-error`: response could not be parsed (bad JSON, corrupt Arrow IPC)
 * - `quota-exceeded`: storage or API rate limit hit
 * - `timeout`: request exceeded configured timeout
 * - `unknown`: catch-all for unclassified errors
 */
export type ErrorScenario =
  | 'network-error'
  | 'auth-expired'
  | 'forbidden'
  | 'not-found'
  | 'server-error'
  | 'query-error'
  | 'parse-error'
  | 'quota-exceeded'
  | 'timeout'
  | 'unknown';

// ========================================================================
// Error Details
// ========================================================================

/**
 * Structured details about an error occurrence.
 * Passed to ErrorStateConfig renderers so they can show contextual info
 * without leaking raw stack traces to end users.
 */
export interface ErrorDetails {
  /** The error scenario classification */
  scenario: ErrorScenario;
  /** Human-readable error message */
  message: string;
  /** Original error code (HTTP status, DuckDB error code, etc.) */
  code?: string | number;
  /** Timestamp when the error occurred (ISO 8601) */
  timestamp: string;
  /** Correlation/request ID for support tickets */
  correlationId?: string;
  /** Technical details (hidden from users by default, shown on expand) */
  technicalDetail?: string;
  /** Whether the error is retryable */
  retryable: boolean;
}

// ========================================================================
// ErrorState (original interface, retained for compatibility)
// ========================================================================

export interface ErrorState {
  code: string;
  message: string;
  severity: ErrorSeverity;
  details?: string;
  retryable: boolean;
  timestamp: number;
}

// ========================================================================
// Error Recovery Action
// ========================================================================

export interface ErrorRecoveryAction {
  label: string;
  action: 'retry' | 'reload' | 'navigate' | 'dismiss';
  target?: string;
}

// ========================================================================
// Error State Config
// ========================================================================

export interface ErrorStateConfig {
  /** The scenario this config applies to */
  scenario: ErrorScenario;
  /** Icon name (from the shared icon system) or Unicode fallback */
  icon: string;
  /** Short title shown in the error banner */
  title: string;
  /** Longer description with guidance */
  description: string;
  /** Label for the primary recovery action button (if any) */
  actionLabel?: string;
  /** Action identifier dispatched when the user clicks the action button */
  actionId?: string;
  /** Alternative humorous/friendly messages (picked randomly for personality) */
  alternateMessages?: string[];
}

// ========================================================================
// Factory Functions
// ========================================================================

export function createErrorState(
  code: string,
  message: string,
  severity: ErrorSeverity = 'error',
  retryable = false,
): ErrorState {
  return { code, message, severity, retryable, timestamp: Date.now() };
}

export function isRetryableError(error: ErrorState): boolean {
  return error.retryable && error.severity !== 'fatal';
}

// ========================================================================
// Default Error State Configs
// ========================================================================

const DEFAULT_ERROR_CONFIGS: Record<ErrorScenario, ErrorStateConfig> = {
  'network-error': {
    scenario: 'network-error',
    icon: 'error',
    title: 'Connection lost',
    description: 'Unable to reach the server. Check your internet connection and try again.',
    actionLabel: 'Retry',
    actionId: 'retry',
    alternateMessages: [
      'The internet gremlins struck again.',
      'Looks like the network took a coffee break.',
      'Houston, we have a connectivity problem.',
    ],
  },
  'auth-expired': {
    scenario: 'auth-expired',
    icon: 'lock',
    title: 'Session expired',
    description: 'Your session has timed out. Please sign in again to continue.',
    actionLabel: 'Sign In',
    actionId: 'sign-in',
    alternateMessages: [
      'Your session wandered off. Time to sign in again.',
    ],
  },
  'forbidden': {
    scenario: 'forbidden',
    icon: 'lock',
    title: 'Access denied',
    description: 'You do not have permission to view this resource. Contact your administrator if you believe this is an error.',
    alternateMessages: [
      'This area is off-limits. Talk to your admin for a hall pass.',
    ],
  },
  'not-found': {
    scenario: 'not-found',
    icon: 'search',
    title: 'Not found',
    description: 'The requested resource could not be found. It may have been moved or deleted.',
    actionLabel: 'Go Home',
    actionId: 'navigate-home',
    alternateMessages: [
      'We looked everywhere, but this one is gone.',
      'This page has left the building.',
    ],
  },
  'server-error': {
    scenario: 'server-error',
    icon: 'error',
    title: 'Server error',
    description: 'Something went wrong on our end. Our team has been notified. Please try again shortly.',
    actionLabel: 'Retry',
    actionId: 'retry',
    alternateMessages: [
      'The server had a bad day. We are looking into it.',
      'Oops. The backend stumbled. Retrying might help.',
    ],
  },
  'query-error': {
    scenario: 'query-error',
    icon: 'warning',
    title: 'Query failed',
    description: 'The data query could not be executed. Check your filters or expressions and try again.',
    actionLabel: 'Edit Query',
    actionId: 'edit-query',
    alternateMessages: [
      'That query did not compute. Double-check the syntax.',
    ],
  },
  'parse-error': {
    scenario: 'parse-error',
    icon: 'warning',
    title: 'Data format error',
    description: 'The server response could not be parsed. The data may be corrupted or in an unexpected format.',
    actionLabel: 'Retry',
    actionId: 'retry',
  },
  'quota-exceeded': {
    scenario: 'quota-exceeded',
    icon: 'warning',
    title: 'Limit reached',
    description: 'You have exceeded a usage limit (storage, API calls, or row count). Upgrade your plan or reduce usage.',
    actionLabel: 'View Limits',
    actionId: 'view-limits',
    alternateMessages: [
      'You have hit the ceiling. Time to tidy up or upgrade.',
    ],
  },
  'timeout': {
    scenario: 'timeout',
    icon: 'error',
    title: 'Request timed out',
    description: 'The operation took too long to complete. Try narrowing your filters or reducing the data scope.',
    actionLabel: 'Retry',
    actionId: 'retry',
    alternateMessages: [
      'That took forever (literally). Try a smaller dataset.',
    ],
  },
  'unknown': {
    scenario: 'unknown',
    icon: 'error',
    title: 'Something went wrong',
    description: 'An unexpected error occurred. If the problem persists, contact support.',
    actionLabel: 'Retry',
    actionId: 'retry',
    alternateMessages: [
      'Well, that was unexpected.',
      'An error of mysterious origin has appeared.',
    ],
  },
};

/**
 * Create a default ErrorStateConfig for a given scenario.
 * Returns a fresh copy so callers can safely mutate it.
 *
 * @param scenario - The error scenario (defaults to 'unknown')
 * @returns A new ErrorStateConfig object
 */
export function createDefaultErrorStateConfig(
  scenario: ErrorScenario = 'unknown',
): ErrorStateConfig {
  const config = DEFAULT_ERROR_CONFIGS[scenario] ?? DEFAULT_ERROR_CONFIGS['unknown'];
  return { ...config, alternateMessages: config.alternateMessages ? [...config.alternateMessages] : undefined };
}

// ========================================================================
// Utility Functions
// ========================================================================

/**
 * Pick a random alternate message for a given scenario, or return the default
 * description if no alternates are configured.
 *
 * @param scenario - The error scenario
 * @returns A message string
 */
export function pickRandomMessage(scenario: ErrorScenario): string {
  const config = DEFAULT_ERROR_CONFIGS[scenario] ?? DEFAULT_ERROR_CONFIGS['unknown'];
  const alts = config.alternateMessages;
  if (!alts || alts.length === 0) {
    return config.description;
  }
  const index = Math.floor(Math.random() * alts.length);
  return alts[index];
}

/**
 * Format an ErrorDetails object into a plain-text string suitable for copying
 * to the clipboard or including in a support ticket.
 *
 * @param details - The error details to format
 * @returns A multi-line plain-text summary
 */
export function formatErrorForClipboard(details: ErrorDetails): string {
  const lines: string[] = [
    `Error: ${details.message}`,
    `Scenario: ${details.scenario}`,
    `Time: ${details.timestamp}`,
    `Retryable: ${details.retryable ? 'yes' : 'no'}`,
  ];

  if (details.code !== undefined) {
    lines.push(`Code: ${details.code}`);
  }
  if (details.correlationId) {
    lines.push(`Correlation ID: ${details.correlationId}`);
  }
  if (details.technicalDetail) {
    lines.push(`Detail: ${details.technicalDetail}`);
  }

  return lines.join('\n');
}
