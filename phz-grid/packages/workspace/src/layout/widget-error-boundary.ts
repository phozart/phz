/**
 * @phozart/phz-workspace — Widget Error Boundary (K.4)
 *
 * Per-widget error isolation. Pure functions that create error state,
 * classify errors, and format user-friendly messages.
 */

export interface WidgetErrorState {
  widgetId: string;
  message: string;
  timestamp: number;
  retryCount: number;
  recoverable?: boolean;
}

export function createWidgetErrorState(
  widgetId: string,
  error: unknown,
  previous?: WidgetErrorState,
): WidgetErrorState {
  let message: string;
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else {
    message = 'Unknown error';
  }

  return {
    widgetId,
    message,
    timestamp: Date.now(),
    retryCount: previous ? previous.retryCount + 1 : 0,
    recoverable: isRecoverable(error),
  };
}

const UNRECOVERABLE_TYPES = [TypeError, ReferenceError, SyntaxError, RangeError];

export function isRecoverable(error: unknown): boolean {
  if (UNRECOVERABLE_TYPES.some(T => error instanceof T)) {
    return false;
  }
  return true;
}

const NETWORK_PATTERNS = /network|fetch|timeout|abort|econnrefused|enotfound/i;

export function formatErrorForUser(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);

  if (NETWORK_PATTERNS.test(raw)) {
    return 'Unable to load data. Please check your connection and try again.';
  }

  if (raw.toLowerCase().includes('permission') || raw.toLowerCase().includes('forbidden')) {
    return 'You do not have permission to view this data.';
  }

  return 'Something went wrong while loading this widget. Please try again.';
}
