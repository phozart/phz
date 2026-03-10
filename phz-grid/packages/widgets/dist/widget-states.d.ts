/**
 * @phozart/phz-widgets — Widget State Utilities
 *
 * Pure functions for resolving widget display states (loading, error, empty, ready).
 * Used by all widget components to render consistent state UI with proper accessibility.
 */
export interface WidgetStateConfig {
    loading: boolean;
    error: string | null;
    data: unknown[] | null;
    loadingMessage?: string;
    emptyMessage?: string;
}
export interface WidgetStateResult {
    state: 'loading' | 'error' | 'empty' | 'ready';
    message: string;
    ariaLive?: 'polite' | 'assertive';
    ariaBusy?: boolean;
    role?: string;
}
export declare function resolveWidgetState(config: WidgetStateConfig): WidgetStateResult;
//# sourceMappingURL=widget-states.d.ts.map