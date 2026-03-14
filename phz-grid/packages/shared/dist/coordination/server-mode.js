/**
 * @phozart/shared — Server-Side Grid Mode (A-2.07)
 *
 * Configuration for server-side data operations (sort, filter, group, page).
 * When enabled, the grid delegates these operations to the DataAdapter
 * instead of performing them in-browser.
 *
 * Pure types and functions only — no side effects.
 */
// ========================================================================
// createDefaultServerGridConfig
// ========================================================================
/**
 * Creates a default server grid configuration with server-side operations
 * disabled. Consumers opt in by setting `enabled: true` and toggling
 * individual server-side capabilities.
 */
export function createDefaultServerGridConfig(overrides) {
    return {
        enabled: false,
        pageSize: 50,
        serverSort: false,
        serverFilter: false,
        serverGroupBy: false,
        prefetchPages: 1,
        ...overrides,
    };
}
// ========================================================================
// isServerMode
// ========================================================================
/**
 * Returns `true` when the given config enables server-side grid mode.
 * Returns `false` for `undefined` or `null` configs.
 */
export function isServerMode(config) {
    return config?.enabled === true;
}
// ========================================================================
// hasServerCapability
// ========================================================================
/**
 * Checks whether a specific server-side capability is enabled.
 */
export function hasServerCapability(config, capability) {
    if (!config?.enabled)
        return false;
    switch (capability) {
        case 'sort':
            return config.serverSort;
        case 'filter':
            return config.serverFilter;
        case 'groupBy':
            return config.serverGroupBy;
    }
}
//# sourceMappingURL=server-mode.js.map