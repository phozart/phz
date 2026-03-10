/**
 * Error State Configuration
 *
 * Types and helpers for rendering user-friendly error states across the grid,
 * dashboard widgets, and workspace shell. Each ErrorScenario maps to a
 * pre-configured title, description, icon, and optional recovery action.
 */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'fatal';
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
export type ErrorScenario = 'network-error' | 'auth-expired' | 'forbidden' | 'not-found' | 'server-error' | 'query-error' | 'parse-error' | 'quota-exceeded' | 'timeout' | 'unknown';
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
export interface ErrorState {
    code: string;
    message: string;
    severity: ErrorSeverity;
    details?: string;
    retryable: boolean;
    timestamp: number;
}
export interface ErrorRecoveryAction {
    label: string;
    action: 'retry' | 'reload' | 'navigate' | 'dismiss';
    target?: string;
}
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
export declare function createErrorState(code: string, message: string, severity?: ErrorSeverity, retryable?: boolean): ErrorState;
export declare function isRetryableError(error: ErrorState): boolean;
/**
 * Create a default ErrorStateConfig for a given scenario.
 * Returns a fresh copy so callers can safely mutate it.
 *
 * @param scenario - The error scenario (defaults to 'unknown')
 * @returns A new ErrorStateConfig object
 */
export declare function createDefaultErrorStateConfig(scenario?: ErrorScenario): ErrorStateConfig;
/**
 * Pick a random alternate message for a given scenario, or return the default
 * description if no alternates are configured.
 *
 * @param scenario - The error scenario
 * @returns A message string
 */
export declare function pickRandomMessage(scenario: ErrorScenario): string;
/**
 * Format an ErrorDetails object into a plain-text string suitable for copying
 * to the clipboard or including in a support ticket.
 *
 * @param details - The error details to format
 * @returns A multi-line plain-text summary
 */
export declare function formatErrorForClipboard(details: ErrorDetails): string;
//# sourceMappingURL=error-states.d.ts.map