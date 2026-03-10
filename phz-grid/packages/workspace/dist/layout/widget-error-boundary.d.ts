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
export declare function createWidgetErrorState(widgetId: string, error: unknown, previous?: WidgetErrorState): WidgetErrorState;
export declare function isRecoverable(error: unknown): boolean;
export declare function formatErrorForUser(error: unknown): string;
//# sourceMappingURL=widget-error-boundary.d.ts.map