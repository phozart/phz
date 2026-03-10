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

export function resolveWidgetState(config: WidgetStateConfig): WidgetStateResult {
  if (config.loading) {
    return {
      state: 'loading',
      message: config.loadingMessage ?? 'Loading...',
      ariaLive: 'polite',
      ariaBusy: true,
    };
  }

  if (config.error) {
    return {
      state: 'error',
      message: config.error,
      role: 'alert',
    };
  }

  if (!config.data || config.data.length === 0) {
    return {
      state: 'empty',
      message: config.emptyMessage ?? 'No data available',
    };
  }

  return {
    state: 'ready',
    message: '',
  };
}
