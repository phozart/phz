/**
 * @phozart/phz-viewer — Route/Screen Management
 *
 * URL-based routing helpers for the viewer shell. Converts between
 * ViewerScreen/artifactId pairs and URL fragments. Supports both
 * hash-based and history-based routing patterns.
 */
// ========================================================================
// Route patterns
// ========================================================================
const ROUTE_PATTERNS = {
    catalog: '/catalog',
    dashboard: '/dashboard',
    report: '/report',
    explorer: '/explorer',
};
// ========================================================================
// Route parsing
// ========================================================================
/**
 * Parse a URL path fragment into a ViewerRoute.
 * Returns null if the path does not match any known route.
 *
 * Supported patterns:
 *   /catalog
 *   /dashboard/:id
 *   /report/:id
 *   /explorer
 *   /explorer/:dataSourceId
 */
export function parseRoute(path) {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    const segments = normalized.split('/').filter(Boolean);
    if (segments.length === 0) {
        return { screen: 'catalog' };
    }
    const screen = segments[0];
    if (!ROUTE_PATTERNS[screen]) {
        return null;
    }
    const artifactId = segments.length > 1 ? segments[1] : undefined;
    return {
        screen,
        artifactId,
    };
}
/**
 * Build a URL path fragment from a ViewerRoute.
 */
export function buildRoutePath(route) {
    const base = ROUTE_PATTERNS[route.screen] ?? '/catalog';
    if (route.artifactId) {
        return `${base}/${encodeURIComponent(route.artifactId)}`;
    }
    return base;
}
/**
 * Convert a NavigationEntry to a ViewerRoute.
 */
export function entryToRoute(entry) {
    return {
        screen: entry.screen,
        artifactId: entry.artifactId ?? undefined,
        artifactType: entry.artifactType ?? undefined,
    };
}
/**
 * Convert a ViewerRoute to a NavigationEntry.
 */
export function routeToEntry(route) {
    return {
        screen: route.screen,
        artifactId: route.artifactId ?? null,
        artifactType: route.artifactType ?? null,
    };
}
// ========================================================================
// Route matching utilities
// ========================================================================
/**
 * Check if two routes point to the same screen and artifact.
 */
export function routesEqual(a, b) {
    return a.screen === b.screen && (a.artifactId ?? null) === (b.artifactId ?? null);
}
/**
 * Determine which screen should be active for a given artifact type.
 * Used when opening an artifact from the catalog.
 */
export function screenForArtifactType(artifactType) {
    switch (artifactType) {
        case 'dashboard':
            return 'dashboard';
        case 'report':
        case 'grid-definition':
            return 'report';
        default:
            return 'catalog';
    }
}
//# sourceMappingURL=viewer-navigation.js.map