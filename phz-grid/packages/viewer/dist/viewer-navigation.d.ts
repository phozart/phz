/**
 * @phozart/phz-viewer — Route/Screen Management
 *
 * URL-based routing helpers for the viewer shell. Converts between
 * ViewerScreen/artifactId pairs and URL fragments. Supports both
 * hash-based and history-based routing patterns.
 */
import type { ViewerScreen, NavigationEntry } from './viewer-state.js';
export interface ViewerRoute {
    screen: ViewerScreen;
    artifactId?: string;
    artifactType?: string;
    params?: Record<string, string>;
}
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
export declare function parseRoute(path: string): ViewerRoute | null;
/**
 * Build a URL path fragment from a ViewerRoute.
 */
export declare function buildRoutePath(route: ViewerRoute): string;
/**
 * Convert a NavigationEntry to a ViewerRoute.
 */
export declare function entryToRoute(entry: NavigationEntry): ViewerRoute;
/**
 * Convert a ViewerRoute to a NavigationEntry.
 */
export declare function routeToEntry(route: ViewerRoute): NavigationEntry;
/**
 * Check if two routes point to the same screen and artifact.
 */
export declare function routesEqual(a: ViewerRoute, b: ViewerRoute): boolean;
/**
 * Determine which screen should be active for a given artifact type.
 * Used when opening an artifact from the catalog.
 */
export declare function screenForArtifactType(artifactType: string): ViewerScreen;
//# sourceMappingURL=viewer-navigation.d.ts.map