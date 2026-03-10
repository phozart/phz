/**
 * @phozart/phz-widgets — Widget State Utilities
 *
 * Pure functions for resolving widget display states (loading, error, empty, ready).
 * Used by all widget components to render consistent state UI with proper accessibility.
 */
export function resolveWidgetState(config) {
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
//# sourceMappingURL=widget-states.js.map