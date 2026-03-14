/**
 * @phozart/core — Server Capabilities
 *
 * Resolves and queries server capabilities for feature toggling.
 */
export const DEFAULT_SERVER_CAPABILITIES = {
    sort: false,
    filter: false,
    grouping: false,
    pivot: false,
    fullTextSearch: false,
    cursorPagination: false,
    exactTotalCount: false,
    realTimeUpdates: false,
};
export function resolveCapabilities(caps) {
    if (!caps)
        return { ...DEFAULT_SERVER_CAPABILITIES };
    return { ...DEFAULT_SERVER_CAPABILITIES, ...caps };
}
export function isFeatureEnabled(caps, feature, format) {
    if (feature === 'export') {
        if (!caps.exportFormats || caps.exportFormats.length === 0)
            return false;
        if (format)
            return caps.exportFormats.includes(format);
        return true;
    }
    return caps[feature] === true;
}
//# sourceMappingURL=server-capabilities.js.map